#!/usr/bin/env node
/**
 * Review helper — print a PR's description, reviews, and full patch (truncated)
 * from the locally saved detailed data. Usage: node show-pr.mjs <number> [maxPatchLines]
 */
import { readFileSync } from 'fs';
const n = process.argv[2];
const maxLines = Number(process.argv[3] || 250);
const d = JSON.parse(readFileSync(new URL(`../data/prs/${n}.json`, import.meta.url), 'utf8'));
const p = d.pr;
console.log('='.repeat(100));
console.log(`PR #${p.number}: ${p.title}`);
console.log(`Author: ${p.user} (${p.author_association}) | created ${p.created_at} | updated ${p.updated_at}`);
console.log(`Head: ${p.head.repo}@${p.head.sha.slice(0, 10)} (${p.head.ref}) -> base ${p.base.ref}`);
console.log(`+${p.additions}/-${p.deletions} across ${p.changed_files} files, ${p.commits_count} commits | mergeable=${p.mergeable} state=${p.mergeable_state}`);
console.log(`Labels: ${p.labels.join(', ') || '(none)'} | reactions implied by comments: ${p.comments}`);
console.log('-'.repeat(100));
console.log('BODY:', (p.body || '(no body)').slice(0, 1800));
console.log('-'.repeat(100));
if (d.reviews.length) {
  console.log('REVIEWS:');
  for (const r of d.reviews) {
    console.log(`  [${r.state}] ${r.user.login} @ ${r.submitted_at}: ${(r.body || '').slice(0, 400)}`);
  }
} else console.log('REVIEWS: (none)');
if (d.comments.length) {
  console.log('LAST COMMENTS:');
  for (const c of d.comments.slice(-6)) {
    console.log(`  ${c.user.login} @ ${c.created_at}: ${(c.body || '').replace(/\r/g, '').slice(0, 350)}`);
  }
}
console.log('-'.repeat(100));
let printed = 0;
for (const f of d.files) {
  const patch = f.patch || '(no patch / binary / too large)';
  const lines = patch.split('\n');
  const cap = Math.min(lines.length, Math.max(40, maxLines - printed > 40 ? maxLines - printed : 40));
  console.log(`--- FILE: ${f.filename} (+${f.additions}/-${f.deletions}, ${f.status}) ---`);
  console.log(lines.slice(0, cap).join('\n'));
  printed += cap;
  if (printed >= maxLines) { console.log('... [patch truncated for review length]'); break; }
}
