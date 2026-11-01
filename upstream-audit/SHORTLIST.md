# Integration Shortlist — microsoft/vscode open PRs

Detailed source-code reviews of the best candidates from the 3,061-PR audit.
Scores use the mission rubric: Technical quality 25 · Usefulness 20 · Stability 20 · Tests 15 · Architecture 10 · Maintenance 10.

**Legend:** ✅ = selected for integration · ⏸ = deferred (see DEFERRED.md) · ❌ = rejected (see REJECTED.md)

---

## Selected candidates (22)

### 1. ✅ PR #339434 — `base`: avoid Base64 encoding string-chain amplification — **92 · Exceptional**
- **Author:** karthiknadig (**MEMBER**, MS) · +60/−15, 2 files · [PR](https://github.com/microsoft/vscode/pull/339434)
- **What:** rewrites `encodeBase64` to write into one pre-sized `VSBuffer` instead of building a chain of 1-char strings (rope amplification). 4 MiB input: 254 ms→13.6 ms, 106.7 MiB→5.3 MiB retained.
- **Review:** byte-for-byte identical output; remainder/padding/urlSafe logic verified against the old implementation; extensive new tests (padded × urlSafe matrix, buffer-view offsets, large buffers with all remainders). Independently reproduced by dmitrivMS in real Code OSS incl. a bounded `resourceRead` RPC roundtrip.
- **Files:** `src/vs/base/common/buffer.ts`, `src/vs/base/test/common/buffer.test.ts` · **Conflicts:** none (mergeable) · **Effort:** trivial merge.

### 2. ✅ PR #339952 — Hide action list item icon and submenu indicator from screen readers — **88 · Strong**
- **Author:** DivyaRaval1909 · +21/−0, 2 files · [PR](https://github.com/microsoft/vscode/pull/339952)
- **What:** `aria-hidden="true"` on decorative `ActionList` icons/submenu indicators; VoiceOver was announcing private-use codicon glyphs as `[?]`.
- **Review:** 2 attributes + a 19-line unit test asserting both elements. **Approved upstream by jruales (MS) on 2026-10-27.** Consistent with the existing `labelIcon` aria-hidden pattern.
- **Files:** `src/vs/platform/actionWidget/browser/actionList.ts`, `.../test/browser/actionList.test.ts` · **Effort:** trivial.

### 3. ✅ PR #318520 — Sanitize non-finite range coordinates in `Diagnostic.from` — **86 · Strong**
- **Author:** yogeshwaran-c (CONTRIBUTOR) · +99/−3, 2 files · [PR](https://github.com/microsoft/vscode/pull/318520)
- **What:** `NaN`/`Infinity` diagnostic coordinates serialize as JSON `null` and break LSP code-action requests (#177094). Sanitizes only non-finite coordinates (fallback `1` / clamped end), preserving the rest.
- **Review:** narrow scope (converter only), jrieken explicitly invited improved range validation on the issue; 5 new unit tests including Range-reordering edge cases. Initial `CHANGES_REQUESTED` (dbaeumer) addressed per follow-ups; actively updated (2026-10-31).
- **Files:** `src/vs/workbench/api/common/extHostTypeConverters.ts`, `.../test/common/extHostTypeConverters.test.ts` · **Effort:** trivial.

### 4. ✅ PR #338014 — Fix `MonarchTokenizer.getLoadStatus()` infinite loop on circular embedding — **85 · Strong**
- **Author:** hardikkaurani (CONTRIBUTOR) · +35/−2, 2 files · [PR](https://github.com/microsoft/vscode/pull/338014)
- **What:** circular `nextEmbedded` language references caused unbounded recursion / stack overflow (monaco-editor#5026). Adds standard DFS cycle detection via an optional `visited` set.
- **Review:** correct, minimal, backward-compatible signature change; 28-line regression test wiring two mutually-embedding tokenizers.
- **Files:** `src/vs/editor/standalone/common/monarch/monarchLexer.ts`, `.../test/browser/monarch.test.ts` · **Effort:** trivial.

### 5. ✅ PR #313960 — Firefox selection crash: shadow DOM + null hit result in hit-testing — **85 · Strong**
- **Author:** aesraethr · +20/−1, 1 file · [PR](https://github.com/microsoft/vscode/pull/313960)
- **What:** Firefox 131+ requires `{shadowRoots}` for `caretPositionFromPoint` inside shadow DOM; without it the result is null and `_doHitTestWithCaretPositionFromPoint` dereferences `offsetNode` and crashes (monaco-editor#4679, open since 2024).
- **Review:** mirrors the shadow-root handling already present in the sibling `_doHitTestWithCaretRangeFromPoint`; null-check returns `UnknownHitTestResult` exactly like other failure paths. Gecko-only path — zero impact on Electron/Chromium desktop. **Directly valuable for our future web port.**
- **Files:** `src/vs/editor/browser/controller/mouseTarget.ts` · **Effort:** trivial.

### 6. ✅ PR #319151 — `workbench.fontSize` / `workbench.fontFamily` settings — **84 · Strong**
- **Author:** DisturbedSage5840C · +67/−2, 3 files · [PR](https://github.com/microsoft/vscode/pull/319151)
- **What:** the single most-requested VS Code feature (issue #519, 4.7k+ 👍, open since 2015): configurable workbench UI font size/family, applied live via CSS custom properties.
- **Review:** mirrors the existing `workbench.fontAliasing` pattern; **defaults are byte-identical when unset** (`var(--vscode-workbench-font-size, 13px)`); fontFamily value sanitized against CSS-injection characters before being written to a CSS property; runtime clamping 8–30 px. Opt-in, application scope. No automated tests (manual UI feature) — verified by compile + code review here.
- **Files:** `src/vs/workbench/browser/parts/…` (`workbench.ts`, `workbench.contribution.ts`, `media/style.css`) · **Effort:** small.

### 7. ✅ PR #212294 — Add token background colors to themes — **84 · Strong**
- **Author:** mattmundell · +8/−0, 2 files · [PR](https://github.com/microsoft/vscode/pull/212294)
- **What:** emits `.mtkbg<i>` CSS classes for theme token background colors (9-year-old issue #3429; token metadata already carries background — only class generation + CSS were missing).
- **Review:** **inert unless a theme/extension registers token background colors** (default themes do not), so default rendering is unchanged; 4 lines per file; approved by one community reviewer; longstanding community demand.
- **Files:** `src/vs/editor/common/encodedTokenAttributes.ts`, `src/vs/editor/common/languages/supports/tokenization.ts` · **Effort:** trivial.

### 8. ✅ PR #313612 — Stop reopening closed repos (#313526) — **84 · Strong**
- **Author:** eamodio (CONTRIBUTOR, GitLens author) · +6/−2, 2 files · [PR](https://github.com/microsoft/vscode/pull/313612)
- **What:** “Close Other Repositories” was silently undone by the next `git status`-driven worktree re-scan; filters closed repos out of `checkForWorktrees()` queueing, and fixes an unescaped-dot regex in `getWorktreesFS()` (`\/.git.*$` → `\/\.git$/`).
- **Review:** precise root-cause writeup; correct use of `pathEquals` against the closed-set; regex fix is right (the old pattern would strip too much on segments like `/agit/`).
- **Files:** `extensions/git/src/model.ts`, `extensions/git/src/git.ts` · **Pairs with #313554** (same author/day, complementary paths) · **Effort:** trivial.

### 9. ✅ PR #313554 — Prunes stale closed repository entries (#313551) — **82 · Strong**
- **Author:** eamodio (CONTRIBUTOR) · +11/−0, 1 file · [PR](https://github.com/microsoft/vscode/pull/313554)
- **What:** closed-repository records whose path no longer exists on disk are pruned when a reopen attempt fails, instead of persisting forever.
- **Files:** `extensions/git/src/model.ts` · **Effort:** trivial.

### 10. ✅ PR #299245 — git quick diff/blame for worktrees inside bare repositories — **84 · Strong**
- **Author:** dabravin · +8/−2, 1 file · [PR](https://github.com/microsoft/vscode/pull/299245)
- **What:** `dotGit.commonPath` of a bare repo is an ancestor of the worktree root, so every working-tree file was treated as git metadata → no gutter decorations, no inline blame (#299244).
- **Review:** condition verified against all five scenarios in the PR's table (standard repo source/.git, bare+internal worktree source/metadata, external worktree) — all correct. Confirmed working by multiple users on the issue.
- **Files:** `extensions/git/src/quickDiffProvider.ts` · **Effort:** trivial.

### 11. ✅ PR #243245 — Don't offer “Add to .gitignore” on .gitignore itself — **82 · Strong**
- **Author:** gjsjohnmurray (CONTRIBUTOR, well-known community maintainer) · +6/−2, 2 files · [PR](https://github.com/microsoft/vscode/pull/243245)
- **What:** adds an `ignorable` `contextValue` to git `Resource` (absent for `.gitignore`) and gates the two `git.ignore` menu items on it. Fixes #187354 (issue tagged *help wanted* upstream).
- **Files:** `extensions/git/src/repository.ts`, `extensions/git/package.json` · **Effort:** trivial.

### 12. ✅ PR #314614 — Guard `parseGitChangesRaw` against undefined paths — **80 · Strong**
- **Author:** yogeshwaran-c · +6/−0, 1 file · [PR](https://github.com/microsoft/vscode/pull/314614)
- **What:** truncated `-z` segment streams produced `Uri.file(undefined)` throws that broke commit-history diffs (#287615). Adds the same defensive `break` guard already used elsewhere in the parser.
- **Files:** `extensions/git/src/git.ts` · **Effort:** trivial.

### 13. ✅ PR #335415 — Preserve collapse state in the SCM Repositories view — **78 · Valuable**
- **Author:** JulianHock · +19/−8, 1 file · [PR](https://github.com/microsoft/vscode/pull/335415)
- **What:** the Repositories view re-expanded collapsed parents (with submodules) on every visibility change; fixes view-state capture on hide and threads an `expandParent` flag so re-registration never force-expands, while keeping “expand on first child”.
- **Review:** logic read in full; behavior matrix preserved (first-submodule expansion kept, single-repo auto-expand untouched).
- **Files:** `src/vs/workbench/contrib/scm/browser/scmRepositoriesViewPane.ts` · **Effort:** small.

### 14. ✅ PR #328542 — Force terminal redraw on visibility change — **80 · Strong**
- **Author:** DijieDeng · +18/−1, 1 file · [PR](https://github.com/microsoft/vscode/pull/328542)
- **What:** macOS desktop-switch/lock left the GPU-accelerated terminal canvas stale (#311614); `onDidResumeOS` doesn't fire for those. Adds a `visibilitychange` listener calling the existing `forceRedraw()` path (refactored into a shared helper).
- **Review:** defensive-only, reuses the proven redraw path, disposable listener, fires only on transition to `visible`. Also aligns with browser semantics (useful for the web port).
- **Files:** `src/vs/workbench/contrib/terminal/electron-browser/terminalNativeContribution.ts` · **Effort:** trivial.

### 15. ✅ PR #313196 — `cd` to recent directory with spaces (PowerShell) — **78 · Valuable**
- **Author:** yogeshwaran-c · +10/−1, 1 file · [PR](https://github.com/microsoft/vscode/pull/313196)
- **What:** Ctrl+G recent-directory quickpick built `cd & 'C:\path with spaces'` (call-operator form meant for invoking executables) which is invalid PowerShell. Special-cases PowerShell with proper single-quote escaping (`''`).
- **Review:** correct escaping; `preparePathForShell` semantics preserved for its other call sites; safe fallback for unknown shell type.
- **Files:** `src/vs/workbench/contrib/terminalContrib/history/browser/terminalRunRecentQuickPick.ts` · **Effort:** trivial.

### 16. ✅ PR #333712 — Markdown preview: compare document identity (½ of #331900) — **80 · Strong**
- **Author:** jrbarkin · +59/−1, 2 files · [PR](https://github.com/microsoft/vscode/pull/333712)
- **What:** `PreviewDocumentVersion` compared only (uri, version); after the preview's document lease lapses, a reopened document restarts at version 1 and equals the stale recorded version → preview freezes. Adds a `WeakMap`-based document identity to the comparison.
- **Review:** WeakMap avoids retaining documents; 3 regression tests. **Must be paired with #332081** (same bug, other layer).
- **Files:** `extensions/markdown-language-features/src/preview/preview.ts`, `.../test/previewDocumentVersion.test.ts` · **Effort:** small.

### 17. ✅ PR #332081 — Markdown engine: cache tokens by document identity (½ of #331900) — **80 · Strong**
- **Author:** dkontyko · +17/−3, 2 files · [PR](https://github.com/microsoft/vscode/pull/332081)
- **What:** `TokenCache` keyed on uri+version → stale tokens served to reopened documents. Keys on document object identity + version + config instead. Regression test renders two same-uri/same-version documents with different content.
- **Files:** `extensions/markdown-language-features/src/markdownEngine.ts`, `.../test/engine.test.ts` · **Pairs with #333712.** · **Effort:** small.

### 18. ✅ PR #316756 — Markdown preview: always refresh on file-system change — **78 · Valuable**
- **Author:** yogeshwaran-c · +10/−5, 1 file · [PR](https://github.com/microsoft/vscode/pull/316756)
- **What:** the FS-watcher path was dropped whenever the file was open as a TextDocument, but `onDidChangeTextDocument` doesn't reliably fire for external overwrites (etag/stat caching, remote FS timing) → stale preview (#265277). Removes the guard; duplicates coalesce via the existing 300 ms debounce + version check.
- **Files:** `extensions/markdown-language-features/src/preview/preview.ts` · complements #333712/#332081 · **Effort:** trivial.

### 19. ✅ PR #315495 — Webview service worker: resolve webview id for worker clients — **78 · Valuable**
- **Author:** yongsooim · +57/−10, 1 file · [PR](https://github.com/microsoft/vscode/pull/315495)
- **What:** regression from #311844 — `worker`/`sharedworker` clients pass the guard but never route (no `id` searchParam) → dynamic-import fetches hang to timeout. Resolves the owning webview iframe by origin, **failing closed when an origin maps to multiple webviews**.
- **Review:** careful ambiguity handling; validated with a local service-worker VM mock (4 scenarios). Contained to paths that currently hang anyway. **Directly valuable for the web port.**
- **Files:** `src/vs/workbench/contrib/webview/browser/pre/service-worker.js` · **Effort:** small.

### 20. ✅ PR #311700 — Color `*_test.go` like `*.test.ts` — **80 · Strong**
- **Author:** jakebailey (**MEMBER**, TS team) · +107/−1, 4 files · [PR](https://github.com/microsoft/vscode/pull/311700)
- **What:** icon-class generation only understood dot-separated compounds; adds underscore-suffix compounds (`foo_test.go` → `_test.go-ext-file-icon`) so icon themes can target Go test files; Seti theme entries + new 88-line test file.
- **Review:** additive and inert for themes that don't define such keys; LGTM'd by benvillalobos (design question about class bloat acknowledged — one extra class per underscore-containing segment, negligible).
- **Files:** `src/vs/editor/common/services/getIconClasses.ts`, `src/vs/editor/test/common/services/getIconClasses.test.ts`, `extensions/theme-seti/icons/vs-seti-icon-theme.json` (+1) · **Effort:** small.

### 21. ✅ PR #319327 — Strip codicon glyphs from hover accessible view — **80 · Strong**
- **Author:** yogeshwaran-c · +30/−2, 3 files · [PR](https://github.com/microsoft/vscode/pull/319327)
- **What:** Private-Use-Area codicon glyphs leak into `innerText` and are announced as “space” by screen readers (#217974). Adds `stripCodiconGlyphs` (PUA range) used by the hover accessible view.
- **Review:** correct, minimal; unit tests cover glyph removal and preservation of CJK/accented/emoji text.
- **Files:** `src/vs/base/common/iconLabels.ts`, `src/vs/base/test/common/iconLabels.test.ts`, `src/vs/editor/contrib/hover/browser/markdownHoverParticipant.ts` · **Effort:** trivial.

### 22. ✅ PR #208316 — `html.format.templating`: allow array of options — **80 · Strong**
- **Author:** simon-knu · +39/−2, 2 files · [PR](https://github.com/microsoft/vscode/pull/208316)
- **What:** declares the already-supported-by-runtime array form (`"html.format.templating": ["angular"]`) in the settings schema with an enum + localized descriptions. Angular 17 control-flow formatting currently requires typing the setting by hand and ignoring a schema warning.
- **Review:** **verified** that the runtime dependency already supports it: microsoft/vscode-html-languageservice#181 was merged 2024-03-22 (“Update js-beautify v1.15.1 to add new angular templating option”) and our baseline pins `vscode-html-languageservice ^6.0.0-next.2` — the PR is schema/declaration-only, so it cannot change formatting behavior for existing boolean users. 4 community approvals.
- **Files:** `extensions/html-language-features/package.json`, `extensions/html-language-features/package.nls.json` · **Effort:** trivial.

---

## Notable candidates NOT selected (full list in DEFERRED.md / REJECTED.md)

| PR | Title (short) | Disposition |
|---|---|---|
| #331805 | notebook diff editor memory leak | ⏸ active MS review, unresolved CHANGES_REQUESTED |
| #333909 | IME jitter: short textarea unless screen reader | ⏸ a11y verification of `Unknown` path pending |
| #296767 | quick input horizontal resize | ⏸ needs interactive UI testing |
| #314872 | RTL text in find decorations | ⏸ needs browser-test run; bidi subtleties |
| #314348 | `scm.diffDecorationsAlgorithm` setting | ⏸ duplicate registration bug in PR; verify upstream regression status |
| #333640 | microsoft-authentication instance discovery | ⏸ awaiting owner (TylerLeonhardt) review |
| #269623 | local settings in configuration editing | ⏸ huge scope, conflicts, controversial |
| #327494 | Git SHA-256 repositories | ⏸ 445 lines, conflicting, needs focused effort |
| #317194 | focus-follows-mouse a11y setting | ⏸ 555 lines, unreviewed |
| #342397 | 24 kB memory (shared schema object) | ⏸ trivial value |
| #162893 | curly-bracket multi-file creation | ❌ wrong layer (`FileService.createFile`), breaks literal `{}` names |
| #134146 | MSYS2 git compatibility | ❌ superseded by msys2/MINGW-packages#26470 |
| #190057 | tsdk trust prompt bypass | ❌ weakens deliberate security boundary |
| #243558 | views collapse downwards | ❌ MS reviewer tested & rejected UX |
| #262399 | activity bar inactive opacity | ❌ declined by MS a11y lead |
| #332421 | AsyncDataTree LRU eviction | ❌ auto-collapses user's expanded nodes |
| #335046 | chat participant ID regex throws | ❌ runtime throws in hot path, no coverage |
| #240604 | bracket snippet overwrite | ❌ superseded by MS PR #317164 |

**Whole-class exclusions** (documented, not individually re-reviewed): 393 bot-authored PRs (no human upstream review; `copilot-swe-agent`, `vscodebot-pr`, `dependabot`, …), 854 drafts, 52 PRs targeting non-`main` bases. The remaining ~55 shortlist entries not listed above were screened but not selected this round (value/priority or pending upstream review) — see `screening.json` for their metadata.
