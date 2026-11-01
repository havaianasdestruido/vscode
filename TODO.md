# TODO — upstream PR integration state (branch `arena/3ef2aa27-vscode`)

## What this branch is

An integration branch that carries **22 reviewed, community/MS-authored upstream
VS Code pull requests** on top of the fork's `main` (`6253548aac3`), plus **3 small
fork-adaptation commits** where a PR needed adjusting to compile/behave against
current upstream code. Audit trail lives in [`upstream-audit/`](upstream-audit/):

- [`INVENTORY.md`](upstream-audit/INVENTORY.md) — how the 3,061 open upstream PRs were inventoried and filtered
- [`SHORTLIST.md`](upstream-audit/SHORTLIST.md) — scored reviews of the best candidates
- [`INTEGRATED.md`](upstream-audit/INTEGRATED.md) — the 22 merged PRs, merge hashes, adaptations, full verification evidence
- [`REJECTED.md`](upstream-audit/REJECTED.md) / [`DEFERRED.md`](upstream-audit/DEFERRED.md) — what was excluded and why
- [`DEPENDENCIES.md`](upstream-audit/DEPENDENCIES.md) — runtime dependencies, supersession watchlist

## Status: integration complete, verification complete

- 22/22 merges clean (`--no-ff`, original authors preserved) — see [`INTEGRATED.md`](upstream-audit/INTEGRATED.md) for the table with merge hashes.
- Targeted node unit tests: **6,726 → 6,753 passing (+27 new), 0 regressions** (baseline vs merged, same runner and list).
- Full node suite on the merged tree: 15,139 passing; the 2,576 failures are the known
  sandbox-environment signature (unbuilt native modules under `--ignore-scripts`),
  matching the pristine baseline.
- Extension compiles (tsgo): git, markdown-language-features, html-language-features
  client+server — **0 errors**.
- Typecheck: full-program `src/tsconfig.json` does not fit in this sandbox's memory;
  a baseline-delta method was used instead — every merge-changed `.ts` file typechecks
  with **zero delta vs pristine base** (details in [`INTEGRATED.md`](upstream-audit/INTEGRATED.md) §Verification).
- Monarch circular-embedding fix (#338014) functionally verified with a browser-free harness.

## Remaining manual steps (outside this branch's scope)

1. **Fast-forward `main`** to this branch when satisfied:
   `git checkout main && git merge --ff-only arena/3ef2aa27-vscode && git push origin main`
   (Do not rebase — the branch intentionally preserves per-PR merge topology.)
2. **Full verification on real hardware/CI** (things this sandbox could not do):
   - `npm run typecheck-client` (full-program tsgo — needs >3.8 GB RAM)
   - browser unit suite (`monarch.test.js`, `actionList.test.js` are browser-gated)
   - `gulp compile` (full build incl. extensions), plus smoke/launch of the desktop app
   - interactive checks: workbench font settings (#319151), git ignore-menu gating
     (#243245 adaptation), terminal redraw on visibility (#328542), markdown preview
     reopen scenarios (#333712/#332081/#316756)
3. **Next upstream sync**: re-check the supersession watchlist
   ([`DEPENDENCIES.md`](upstream-audit/DEPENDENCIES.md) §4) and the
   [`DEFERRED.md`](upstream-audit/DEFERRED.md) list before merging new upstream `main`.
4. When native modules are built (i.e. a regular, non-`--ignore-scripts` install),
   re-run the full unit suite — the 2,576 environmental failures should drop to ~0
   both on base and on this branch.
