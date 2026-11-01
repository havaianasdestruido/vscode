#!/usr/bin/env node
/**
 * Phase 2/3 — Build the detailed-review shortlist and fetch full per-PR details.
 * Selection: top overall + top per category (union, dedup), excluding automation
 * accounts, drafts, deleted head repos, and non-main base branches (recorded, not silent).
 * Fetches per PR: main record, files (with patches), reviews, issue comments, commits.
 * Saves: upstream-audit/data/shortlist.json + upstream-audit/data/prs/<n>.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';

const BASE = new URL('../', import.meta.url).pathname;
const screening = JSON.parse(readFileSync(BASE + 'screening.json', 'utf8'));
const prs = screening.prs;
const DIR = BASE + 'data/prs/';
mkdirSync(DIR, { recursive: true });

const BOT_LOGINS = new Set(['copilot-swe-agent', 'vscodebot-pr', 'msftbot', 'dependabot', 'azure-pipelines']);
const isBot = p => p.authorType === 'Bot' || BOT_LOGINS.has(p.author);

const eligible = p => !isBot(p) && !p.isDraft && p.base === 'main' && !!p.headRepo;
const excluded = {
  automation: prs.filter(p => isBot(p)).map(p => p.number),
  drafts: prs.filter(p => p.isDraft).map(p => p.number),
  nonMainBase: prs.filter(p => p.base !== 'main').map(p => p.number),
};

// --- Selection pools ---
const pools = {};
const pool = (name, list) => { pools[name] = [...list].sort((a, b) => b.screeningScore - a.screeningScore).slice(0, name === 'top-overall' ? 40 : 8).map(p => p.number); };
pool('top-overall', prs.filter(eligible));
const CATS = ['accessibility', 'performance', 'security', 'git-scm', 'extension-api', 'language-support', 'testing', 'ui-ux', 'bugfix', 'feature-or-other', 'infrastructure', 'documentation', 'developer-experience'];
for (const c of CATS) pool('cat-' + c, prs.filter(eligible).filter(p => p.categories.includes(c)));

const shortlistNums = [...new Set(Object.values(pools).flat())].sort((a, b) => a - b);
console.log('shortlist size:', shortlistNums.length);
console.log('excluded from consideration: automation=', excluded.automation.length, 'drafts=', excluded.drafts.length, 'nonMainBase=', excluded.nonMainBase.length);

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function gh(path, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      return execFileSync('gh', ['api', path], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 120000 });
    } catch (e) {
      const err = (e.stderr || e.message || '').toString();
      if (/rate limit/i.test(err)) { console.error('  rate limited, waiting 60s'); await sleep(60000); continue; }
      if (i === tries - 1) throw new Error(`gh api ${path} failed: ${err.slice(0, 200)}`);
      await sleep(2000 * (i + 1));
    }
  }
}
const getJSON = async p => JSON.parse(await gh(p));async function paginate(path) {
  let page = 1, out = [];
  while (true) {
    const arr = await getJSON(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    out = out.concat(arr);
    if (arr.length < 100) break;
    page++;
  }
  return out;
}

(async () => {
  let ok = 0, failed = [];
  for (const n of shortlistNums) {
    const f = DIR + n + '.json';
    if (existsSync(f)) { ok++; continue; }
    try {
      const [pr, files, reviews, comments, commits] = await Promise.all([
        getJSON(`repos/microsoft/vscode/pulls/${n}`),
        paginate(`repos/microsoft/vscode/pulls/${n}/files`),
        paginate(`repos/microsoft/vscode/pulls/${n}/reviews`),
        paginate(`repos/microsoft/vscode/issues/${n}/comments`),
        paginate(`repos/microsoft/vscode/pulls/${n}/commits`),
      ]);
      writeFileSync(f, JSON.stringify({
        fetchedAt: new Date().toISOString(),
        pr: {
          number: pr.number, title: pr.title, state: pr.state, draft: pr.draft, merged: pr.merged,
          created_at: pr.created_at, updated_at: pr.updated_at,
          user: pr.user?.login, author_association: pr.author_association,
          additions: pr.additions, deletions: pr.deletions, changed_files: pr.changed_files,
          mergeable: pr.mergeable, mergeable_state: pr.mergeable_state, merged_by: pr.merged_by,
          comments: pr.comments, review_comments: pr.review_comments, commits_count: pr.commits,
          labels: pr.labels.map(l => l.name), milestone: pr.milestone?.title || null,
          requested_reviewers: pr.requested_reviewers.map(r => r.login),
          head: { ref: pr.head.ref, sha: pr.head.sha, repo: pr.head.repo?.full_name, label: pr.head.label },
          base: { ref: pr.base.ref, sha: pr.base.sha },
          body: (pr.body || '').slice(0, 20000),
          rebaseable: pr.rebaseable,
        },
        files, reviews, comments, commits,
      }, null, 1));
      ok++;
      if (ok % 10 === 0) console.log(`fetched ${ok}/${shortlistNums.length}`);
    } catch (e) {
      failed.push(n);
      console.error(`PR #${n} FAILED: ${e.message}`);
    }
    await sleep(150);
  }
  console.log(`DONE: ${ok} fetched, ${failed.length} failed:`, failed);
  writeFileSync(BASE + 'data/shortlist.json', JSON.stringify({
    generatedAt: new Date().toISOString(),
    selection: { 'top-overall': 40, 'per-category': 8, categories: CATS },
    pools, shortlist: shortlistNums, excludedCounts: {
      automation: excluded.automation.length, drafts: excluded.drafts.length, nonMainBase: excluded.nonMainBase.length,
    },
    fetchFailures: failed,
  }, null, 1));
})();
