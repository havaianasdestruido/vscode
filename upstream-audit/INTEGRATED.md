# Integrated — upstream VS Code PRs merged into this fork

Branch: `arena/3ef2aa27-vscode` · Base: `6253548aac3` (fork `main`, 2026-10-31)
Result: **22 upstream PRs merged cleanly (`--no-ff`) + 3 documented fork-adaptation commits.**

All merges preserve original authors (`git log --no-merges` shows upstream authorship);
merge commits are fork-authored and reference the PR number in their subject.
`refs/remotes/upstream/pr/*` for all 22 IDs are kept locally for reference and are fully
merged (ancestors of HEAD).

## Merge register (chronological order of integration)

| # | PR | Subject (merge commit) | Merge |
|---|---|---|---|
| 1 | [#339434](https://github.com/microsoft/vscode/pull/339434) | base: avoid Base64 encoding string-chain amplification | `65cb1e9bfd7` |
| 2 | [#318520](https://github.com/microsoft/vscode/pull/318520) | Sanitize non-finite range coordinates in `Diagnostic.from` | `1bf1cd950d6` |
| 3 | [#338014](https://github.com/microsoft/vscode/pull/338014) | Fix `MonarchTokenizer.getLoadStatus()` infinite loop on circular embedding | `f863b5eb6ab` |
| 4 | [#313960](https://github.com/microsoft/vscode/pull/313960) | Fix Firefox selection crash: shadow DOM + null hit result | `e65ac25aafb` |
| 5 | [#212294](https://github.com/microsoft/vscode/pull/212294) | Add token background colors to themes | `eacb88d5cb2` |
| 6 | [#319151](https://github.com/microsoft/vscode/pull/319151) | `workbench.fontSize` / `workbench.fontFamily` settings | `8ef633327cc` |
| 7 | [#339952](https://github.com/microsoft/vscode/pull/339952) | Hide action list item icon / submenu indicator from screen readers | `d2c4c3ed8bf` |
| 8 | [#319327](https://github.com/microsoft/vscode/pull/319327) | Strip codicon glyphs from hover accessible view | `6fab8c43f7a` |
| 9 | [#328542](https://github.com/microsoft/vscode/pull/328542) | Force terminal redraw on visibility change | `fcae37b5bf8` |
| 10 | [#313196](https://github.com/microsoft/vscode/pull/313196) | `cd` to recent directory with spaces (PowerShell) | `b1642f5397c` |
| 11 | [#299245](https://github.com/microsoft/vscode/pull/299245) | git quick diff/blame for worktrees inside bare repositories | `4c76f84bee3` |
| 12 | [#243245](https://github.com/microsoft/vscode/pull/243245) | Don't offer “Add to .gitignore” on .gitignore itself | `fbc24af6fa2` |
| 13 | [#313612](https://github.com/microsoft/vscode/pull/313612) | Stop reopening closed repos | `2fa6b44955e` |
| 14 | [#313554](https://github.com/microsoft/vscode/pull/313554) | Prunes stale closed repository entries | `1c5d3d1f2ec` |
| 15 | [#314614](https://github.com/microsoft/vscode/pull/314614) | Guard `parseGitChangesRaw` against undefined paths | `182a19575bc` |
| 16 | [#335415](https://github.com/microsoft/vscode/pull/335415) | Preserve collapse state in the SCM Repositories view | `0a1d94cce5e` |
| 17 | [#333712](https://github.com/microsoft/vscode/pull/333712) | Markdown preview: compare document identity | `53ee9724963` |
| 18 | [#332081](https://github.com/microsoft/vscode/pull/332081) | Markdown engine: cache tokens by document identity | `d68690cf735` |
| 19 | [#316756](https://github.com/microsoft/vscode/pull/316756) | Markdown preview: always refresh on file-system change | `8870ae712c1` |
| 20 | [#315495](https://github.com/microsoft/vscode/pull/315495) | Webview service worker: resolve webview id for worker clients | `c61c6f075de` |
| 21 | [#311700](https://github.com/microsoft/vscode/pull/311700) | Color `*_test.go` like `*.test.ts` | `1f836ab80cb` |
| 22 | [#208316](https://github.com/microsoft/vscode/pull/208316) | `html.format.templating`: allow array of options | `a3598c7b26c` |

Detailed per-PR reviews (author, size, files, rationale, scoring) are in [SHORTLIST.md](SHORTLIST.md).

## Fork-adaptation commits (3)

Each PR was merged **verbatim** (`git merge --no-ff refs/remotes/upstream/pr/N`, no
content changes inside the merge). Where a PR was authored against an older tree and
its code no longer type-checked or behaved correctly against current upstream code,
the necessary adaptation was made in a **separate, clearly-attributed follow-up
commit**, preserving the PR's logic and intent:

| Commit | PR | Why needed | What changed |
|---|---|---|---|
| `cb43247580f` | #212294 | The PR emits `mtkbg<i>` classes for token background colors. Current upstream token metadata sets `ColorId.DefaultBackground` (2) on **every default token**, so the PR's class generation as-written added `mtkbg2` to all default tokens and broke 21 `ModelLinesTokens` assertions (default tokens must render byte-identically to upstream). | `TokenMetadata.getClassNameFromMetadata` now guards `background && background !== ColorId.DefaultBackground` — theme-declared backgrounds still get their class; default tokens stay identical to upstream. |
| `d9a2f184412` | #311700 | The PR listens via `EventType.VISIBILITY_CHANGE`, a constant that does not exist in `src/vs/base/browser/dom.ts` (never has, in this tree or upstream `main`) — caught by the post-merge typecheck delta. | Uses the `'visibilitychange'` string literal, exactly like the 8+ existing upstream listeners (`animationSync.ts` et al.). PR behavior unchanged. |
| `0141fbb48cc` | #243245 | The PR adds a `contextValue` getter to git's `Resource` returning `'ignorable'`. Upstream #263927 (merged after the PR was authored) already uses `contextValue` to expose the repository kind, gating `scmResourceState == worktree` menu clauses — a clean-textual but semantically duplicate member (caught by `gulp compile-extension:git`). | Single composite getter: space-separated `<repositoryKind> ignorable` (as applicable); the four `scmResourceState` `when`-clauses in `extensions/git/package.json` switched from `==` to `=~` regex matching. Both the upstream worktree menus and the PR's `git.ignore` gating keep working. |

## Verification evidence

Environment note: 2 vCPU / 3.8 GB RAM sandbox; `npm ci --ignore-scripts` (native modules
unbuilt by design). Full-suite results below must be read against that baseline.

1. **Merges**: 22/22 `git merge --no-ff` clean (zero textual conflicts); all 22 PR refs
   verified as ancestors of HEAD; original authors preserved in history.
2. **Transpile**: `gulp transpile-client-esbuild` — exit 0 (run after each adaptation).
   `node --check out/vs/workbench/contrib/webview/browser/pre/service-worker.js` — OK.
3. **Unit tests (targeted delta list, 204 node-runnable files)**:
   - pristine base `6253548a`: **6,726 passing / 0 failing / 31 pending**
   - merged tree + adaptations (final): **6,753 passing / 0 failing / 31 pending**
   → +27 new tests, **zero regressions**. (Runner: patched local copy of
   `test/unit/node/index.js` with the node-version gate disabled — untracked, deleted
   after use; no other modification.)
4. **Unit tests (full node suite, final tree, accidental but complete run)**:
   15,139 passing / 2,576 failing / 72 pending in ~35 min. The 2,576 failures are all
   the known environmental signature (unbuilt native modules, e.g.
   `@vscode/sqlite3` `Cannot find module '../build/Release/vscode-sqlite3.node'`)
   — the pristine-base full run showed the same signature (2,578 environmental
   failures at its abort point); none are attributable to the merges.
5. **Extension compiles** (`gulp compile-extension:*`, tsgo): `git` **0 errors** (after
   adaptation `0141fbb48cc`), `markdown-language-features` **0 errors**,
   `html-language-features-client` **0 errors**, `html-language-features-server`
   **0 errors**.
6. **Typecheck (targeted, baseline-delta methodology)**: the sandbox cannot hold a full
   `src/tsconfig.json` program in memory (tsgo `GOMAXPROCS=1` and classic `tsc.js` at
   3.4 GB and 3.58 GB heap are all OOM-killed; upstream's `typecheck-client` runs on
   larger CI runners). Instead, every `.ts` file changed by the merges (plus its tests)
   was typechecked with the same compiler and options in two closure configs
   (`src/tsconfig.tc1.json`: base/editor/platform; `src/tsconfig.tc2.json`: workbench),
   each run **both on the pristine base and on the merged tree**:
   - TC1: identical 19 artifacts on both sides (all `Timeout`/`TimeoutHandle`, caused by
     the config's `node` types addition — unchanged files only) → **merge delta: 0**.
   - TC2: initial delta was exactly one error (#311700's phantom `EventType`
     constant, see adaptation `d9a2f184412`); after the fix, identical error sets on
     both sides → **merge delta: 0**.
   - Both configs were temporary (deleted after verification; not committed).
7. **Functional spot-check (browser-suite gap)**: `monarch.test.ts` and
   `actionList.test.ts` only run in the browser test suite (plain-node ESM loader
   rejects their `.css` imports). PR #338014's fix was verified with a browser-free
   harness driving `MonarchTokenizer` directly with two mutually-embedding languages:
   `getLoadStatus()` returns `{"loaded":true}` instead of stack-overflowing — PASS.
   #339952's two `aria-hidden` attributes are compile-verified (tsgo 0 errors) and
   covered by its 19-line unit test, which is browser-gated upstream as well.

## Supersession watchlist

Upstream may merge its own version of one of these PRs (or a competing fix). When
syncing with upstream `main` later, watch for: **#339952** (already MS-approved),
**#331805**, **#318520** (jrieken-invited validation), **#208316** — see
[DEPENDENCIES.md](DEPENDENCIES.md) §4 for the full list with overlap notes.
