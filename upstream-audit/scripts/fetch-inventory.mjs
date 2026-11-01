#!/usr/bin/env node
/**
 * Fetch the complete list of OPEN pull requests from microsoft/vscode via GitHub GraphQL.
 * Transport: the `gh` CLI (direct Node fetch is blocked in this sandbox).
 * - Paginates through every page (100 per page, ordered by createdAt ASC so new PRs
 *   append at the end and never shift earlier pages).
 * - Resumable: saves each raw page to upstream-audit/data/pages/page-NNN.json.
 * - Reconciles the collected set against the REST listing (numbers only) to catch any
 *   PR closed/opened mid-pagination, and backfills missing PRs individually.
 * - Consolidates everything into upstream-audit/pr-inventory.json.
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';

const DATA = new URL('.', import.meta.url).pathname;
const PAGES = DATA + '../data/pages/';
mkdirSync(PAGES, { recursive: true });

const PR_FIELDS = `
  number title url state createdAt updatedAt isDraft mergeable authorAssociation
  author { login __typename }
  labels(first: 15) { nodes { name } }
  milestone { title }
  baseRefName headRefName headRefOid baseRefOid
  headRepository { nameWithOwner }
  additions deletions changedFiles
  commits { totalCount }
  comments { totalCount }
  reviews { totalCount }
  reactions { totalCount }
`;

const LIST_QUERY = `query($cursor: String) {
  repository(owner: "microsoft", name: "vscode") {
    pullRequests(first: 50, states: OPEN, orderBy: {field: CREATED_AT, direction: ASC}, after: $cursor) {
      totalCount
      pageInfo { endCursor hasNextPage }
      nodes { ${PR_FIELDS} }
    }
  }
}`;

const ONE_QUERY = `query($num: Int!) {
  repository(owner: "microsoft", name: "vscode") {
    pullRequest(number: $num) { ${PR_FIELDS} }
  }
}`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function gh(args, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 180000 });
    } catch (e) {
      const err = (e.stderr || e.message || '').toString();
      if (/rate limit/i.test(err)) { console.error(`  rate limited, waiting 60s (try ${i + 1})`); await sleep(60000); continue; }
      if (i === tries - 1) throw new Error(`gh failed: ${err.slice(0, 400)}`);
      await sleep(3000 * (i + 1));
    }
  }
  throw new Error('unreachable');
}

async function gql(query, variables) {
  const args = ['api', 'graphql', '-f', `query=${query}`];
  for (const [k, v] of Object.entries(variables || {})) {
    if (v === null || v === undefined) args.push('-F', `${k}=null`);
    else args.push('-f', `${k}=${v}`);
  }
  const out = await gh(args);
  const json = JSON.parse(out);
  if (json.errors) throw new Error('GraphQL errors: ' + JSON.stringify(json.errors).slice(0, 600));
  return json.data;
}

async function main() {
  // --- Phase A: paginated list with resume ---
  let cursor = null, hasNext = true, pageIdx = 1, errors = 0;
  while (hasNext) {
    const f = `${PAGES}page-${String(pageIdx).padStart(3, '0')}.json`;
    if (existsSync(f)) {
      const p = JSON.parse(readFileSync(f, 'utf8'));
      cursor = p.endCursor; hasNext = p.hasNextPage; pageIdx++;
      continue;
    }
    try {
      const data = await gql(LIST_QUERY, { cursor });
      const prs = data.repository.pullRequests;
      writeFileSync(f, JSON.stringify({
        page: pageIdx, cursorUsed: cursor, endCursor: prs.pageInfo.endCursor,
        hasNextPage: prs.pageInfo.hasNextPage, totalCountAtFetch: prs.totalCount,
        fetchedAt: new Date().toISOString(), nodes: prs.nodes,
      }));
      cursor = prs.pageInfo.endCursor; hasNext = prs.pageInfo.hasNextPage;
      console.log(`page ${pageIdx}: +${prs.nodes.length} (totalCount reported: ${prs.totalCount})`);
      pageIdx++;
    } catch (e) {
      errors++;
      console.error(`page ${pageIdx} FAILED: ${e.message}`);
      if (errors > 8) throw e;
      await sleep(10000);
    }
  }
  console.log('=== pagination complete ===');

  // --- Phase B: consolidate ---
  const byNumber = new Map();
  for (const f of readdirSync(PAGES).sort()) {
    if (!f.startsWith('page-')) continue;
    for (const n of JSON.parse(readFileSync(PAGES + f, 'utf8')).nodes) byNumber.set(n.number, n);
  }
  console.log(`consolidated: ${byNumber.size} unique open PRs from pages`);

  // --- Phase C: reconcile against REST listing (numbers only) ---
  const restNumbers = new Set();
  for (let pg = 1; pg <= 60; pg++) {
    try {
      const out = gh(['api', `repos/microsoft/vscode/pulls?state=open&sort=created&direction=asc&per_page=100&page=${pg}`]);
      const arr = JSON.parse(out);
      for (const p of arr) restNumbers.add(p.number);
      if (arr.length < 100) break;
    } catch (e) {
      console.error(`REST page ${pg} failed: ${e.message}`);
    }
    await sleep(200);
  }
  console.log(`REST reconciliation set: ${restNumbers.size} open PR numbers`);

  const missing = [...restNumbers].filter(n => !byNumber.has(n));
  const extra = [...byNumber.keys()].filter(n => !restNumbers.has(n));
  console.log(`missing from GraphQL pass: ${missing.length}; stale (closed during audit): ${extra.length}`);

  for (const num of missing) {
    try {
      const d = await gql(ONE_QUERY, { num });
      const pr = d.repository.pullRequest;
      if (pr && pr.state === 'OPEN') { byNumber.set(num, pr); console.log(`backfilled PR #${num}`); }
      else console.log(`backfill #${num}: state=${pr ? pr.state : 'null'}, skipped`);
    } catch (e) { console.error(`backfill #${num} failed: ${e.message}`); }
    await sleep(300);
  }
  for (const n of extra) {
    // Never blindly drop: confirm per-PR state via GraphQL before removing.
    try {
      const d = await gql(ONE_QUERY, { num: n });
      const pr = d.repository.pullRequest;
      if (pr && pr.state === 'OPEN') { console.log(`kept #${n} (still OPEN, REST listing missed it)`); }
      else { byNumber.delete(n); console.log(`dropped #${n} (confirmed state=${pr ? pr.state : 'null'})`); }
    } catch (e) { console.error(`state check #${n} failed, keeping it: ${e.message}`); }
    await sleep(200);
  }

  // --- Phase D: write inventory ---
  const prs = [...byNumber.values()].sort((a, b) => a.number - b.number);
  const inventory = {
    generatedAt: new Date().toISOString(),
    upstream: 'microsoft/vscode',
    state: 'OPEN',
    totalOpenPRsDiscovered: prs.length,
    restReconciliationCount: restNumbers.size,
    collectionMethod: 'GraphQL pagination (100/page, createdAt ASC) via gh CLI + REST reconciliation + individual backfill',
    prs,
  };
  writeFileSync(DATA + '../pr-inventory.json', JSON.stringify(inventory, null, 1));
  console.log(`WROTE pr-inventory.json with ${prs.length} open PRs`);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
