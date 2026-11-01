#!/usr/bin/env node
/**
 * Phase 2 — Metadata screening of every open upstream PR.
 * Classifies all PRs in pr-inventory.json into audit categories and computes a
 * screening score (0-100) used ONLY to prioritize which PRs get a detailed
 * source-code review. This is metadata screening, NOT detailed patch review.
 *
 * Outputs: upstream-audit/screening.json (+ console summary).
 */
import { readFileSync, writeFileSync } from 'fs';

const inv = JSON.parse(readFileSync(new URL('../pr-inventory.json', import.meta.url), 'utf8'));
const prs = inv.prs;
const now = Date.parse(inv.generatedAt);

// --- Known automation accounts (verified below via __typename / naming patterns) ---
const BOT_LOGINS = new Set(['copilot-swe-agent', 'vscodebot-pr', 'msftbot', 'dependabot[bot]', 'github-actions[bot]']);
const MS_ORG_BOTISH = new Set(['vs-code-engineering']); // org automation account, mostly auto-driven error-fix PRs

function isBot(p) {
  if (p.author?.__typename === 'Bot') return true;
  if (BOT_LOGINS.has(p.author?.login)) return true;
  return false;
}

const title = p => (p.title || '').toLowerCase();

// --- Category heuristics (label-driven first, then title keywords) ---
function categorize(p) {
  const t = title(p);
  const labels = (p.labels?.nodes || []).map(l => l.name);
  const has = (...xs) => xs.some(x => labels.includes(x) || t.includes(x));
  const cats = [];
  if (labels.includes('accessibility') || has('accessib', 'screen reader', 'aria ')) cats.push('accessibility');
  if (labels.includes('perf') || has('perf', 'speed up', 'faster', 'memory leak', 'reduce memory', 'optimi')) cats.push('performance');
  if (has('security', 'cve', 'vulnerab', 'sanitize', 'escape html')) cats.push('security');
  if (has('git ', 'scm', 'source control')) cats.push('git-scm');
  if (has('api', 'proposed api')) cats.push('extension-api');
  if (has('a11y')) cats.push('accessibility');
  if (labels.includes('bug') || /\bfix(es|ed)?\b|\bbug\b|crash|regression|incorrect|wrong|broken/.test(t)) cats.push('bugfix');
  if (has('test', 'flaky', 'coverage')) cats.push('testing');
  if (has('doc', 'readme', 'documentation')) cats.push('documentation');
  if (has('language', 'grammar', 'syntax highlight', 'snippet', 'l10n', 'localiz')) cats.push('language-support');
  if (has('refactor', 'architecture', 'moderniz', 'cleanup', 'clean up', 'migrate')) cats.push('infrastructure');
  if (has('ux', 'ui', 'theme', 'icon', 'layout', 'polish', 'styling', 'hover', 'menu', 'dialog')) cats.push('ui-ux');
  if (has('dx', 'developer experience', 'dev experience')) cats.push('developer-experience');
  if (p.isDraft) cats.push('draft');
  if (isBot(p)) cats.push('automation');
  if (!cats.length) cats.push('feature-or-other');
  return cats;
}

// --- Screening score: proxies only; detailed review happens later ---
function screenScore(p) {
  const notes = [];
  let s = 0; // out of 100

  // Technical quality proxies (25)
  let q = 12;
  const cf = p.changedFiles || 0, lines = (p.additions || 0) + (p.deletions || 0);
  if (cf >= 1 && cf <= 5 && lines >= 3 && lines <= 800) { q += 8; notes.push('compact focused change'); }
  else if (cf <= 20 && lines <= 3000) { q += 4; notes.push('moderate size'); }
  else { q -= 4; notes.push('large change'); }
  if (p.authorAssociation === 'MEMBER' || p.authorAssociation === 'COLLABORATOR') q += 3;
  else if (p.authorAssociation === 'CONTRIBUTOR') q += 2;
  if ((p.commits?.totalCount || 0) > 30) { q -= 4; notes.push('many commits'); }
  if (isBot(p)) { q -= 15; notes.push('automation account'); }
  s += Math.max(0, Math.min(25, q));

  // Practical usefulness proxies (20)
  let u = 6;
  const ageDays = (now - Date.parse(p.createdAt)) / 86400000;
  const updDays = (now - Date.parse(p.updatedAt)) / 86400000;
  if (p.reactions?.totalCount >= 5) { u += 6; notes.push(`${p.reactions.totalCount} reactions`); }
  else if (p.reactions?.totalCount >= 1) u += 2;
  if (p.comments?.totalCount >= 3) { u += 3; notes.push(`${p.comments.totalCount} comments`); }
  if (p.reviews?.totalCount >= 1) u += 2;
  if (updDays < 30) { u += 3; notes.push('recently active'); }
  if (ageDays > 730 && updDays > 365) { u -= 4; notes.push('stale'); }
  s += Math.max(0, Math.min(20, u));

  // Stability & correctness proxies (20)
  let st = 8;
  if (p.isDraft) { st -= 6; notes.push('draft'); }
  if (p.mergeable === 'CONFLICTING') { st -= 8; notes.push('conflicting per GitHub'); }
  if (p.mergeable === 'MERGEABLE') { st += 6; notes.push('mergeable per GitHub'); }
  if (lines <= 200) st += 3;
  if (cf === 1 && lines <= 100) st += 3;
  s += Math.max(0, Math.min(20, st));

  // Test/verification proxies (15) — neutral at screening, verified in detailed review
  s += 7; notes.push('tests: TBD in detailed review');

  // Architectural compatibility proxies (10)
  let a = 5;
  if (p.baseRefName === 'main') a += 4; else notes.push(`base=${p.baseRefName}`);
  if (p.headRepository?.nameWithOwner && p.headRepository.nameWithOwner !== 'microsoft/vscode') a += 1;
  else if (!p.headRepository) { a -= 4; notes.push('head repo deleted'); }
  if (cf <= 20) a += 1;
  s += Math.max(0, Math.min(10, a));

  // Maintenance cost proxies (10)
  let m = 4;
  if (p.authorAssociation === 'NONE' && p.reactions?.totalCount === 0 && p.comments?.totalCount === 0 && ageDays > 90) { m -= 3; notes.push('drive-by, no engagement'); }
  if (p.reactions?.totalCount >= 10) m += 3;
  if (MS_ORG_BOTISH.has(p.author?.login)) { m -= 3; notes.push('org automation account, verify manually'); }
  s += Math.max(0, Math.min(10, m));

  return { score: Math.round(s), notes };
}

const out = [];
const catCount = {};
for (const p of prs) {
  const cats = categorize(p);
  const { score, notes } = screenScore(p);
  for (const c of cats) catCount[c] = (catCount[c] || 0) + 1;
  out.push({
    number: p.number, title: p.title, url: p.url,
    author: p.author?.login || '(ghost)', authorType: p.author?.__typename, authorAssociation: p.authorAssociation,
    createdAt: p.createdAt, updatedAt: p.updatedAt, ageDays: Math.round((now - Date.parse(p.createdAt)) / 86400000),
    isDraft: p.isDraft, mergeable: p.mergeable,
    labels: (p.labels?.nodes || []).map(l => l.name),
    milestone: p.milestone?.title || null,
    base: p.baseRefName, headRepo: p.headRepository?.nameWithOwner || null, headOid: p.headRefOid,
    changedFiles: p.changedFiles, additions: p.additions, deletions: p.deletions,
    commits: p.commits?.totalCount, comments: p.comments?.totalCount, reviews: p.reviews?.totalCount, reactions: p.reactions?.totalCount,
    categories: cats, screeningScore: score, screeningNotes: notes,
  });
}

writeFileSync(new URL('../screening.json', import.meta.url), JSON.stringify({
  generatedAt: inv.generatedAt, total: out.length, categories: catCount, prs: out,
}, null, 1));

console.log('TOTAL SCREENED:', out.length);
console.log('\n--- categories (a PR may have several) ---');
for (const [k, v] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) console.log(k.padEnd(20), v);
const top = [...out].sort((a, b) => b.screeningScore - a.screeningScore);
console.log('\n--- TOP 40 by screening score ---');
for (const p of top.slice(0, 40)) console.log(String(p.screeningScore).padStart(3), `#${p.number}`, `[${p.categories.join(',')}]`, `${p.author} ${p.ageDays}d cf=${p.changedFiles} +${p.additions}/-${p.deletions} r=${p.reactions} c=${p.comments}`, p.title.slice(0, 80));
