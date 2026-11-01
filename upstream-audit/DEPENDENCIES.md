# Dependency Graph and Conflict Analysis

## 1. Cross-PR dependencies

| Dependency | Status |
|---|---|
| #333712 (preview.ts identity) **⇄** #332081 (markdownEngine.ts TokenCache identity) | **Functional pair** — two layers of the same bug (#331900). Both must be present for the full fix; each is independently correct and harmless alone. **Integrate both, in this order.** |
| #333712 / #332081 **+** #316756 (always refresh on FS change) | **Complementary** — #316756 fixes the dropped-watcher-event facet of the same stale-preview family (#265277/#331900). Same subsystem, different mechanism (debounce coalescing prevents interference). |
| #313612 (stop reopening closed repos) **⇄** #313554 (prune stale closed repos) | **Loose pair** — same author, same day, adjacent code in `extensions/git/src/model.ts` (closed-repositories manager). No logical dependency; both touch `model.ts` so **merge sequentially**. |
| #208316 (html templating schema) → external `vscode-html-languageservice` | **External dependency already satisfied**: languageservice PR #181 merged 2024-03-22; baseline pins `^6.0.0-next.2`. No action needed. |
| #240604 | superseded by upstream MS PR **#317164** — rejected, not integrated. |
| #339434, #318520, #338014, #313960, #212294, #319151, #339952, #319327, #328542, #313196, #299245, #243245, #314614, #335415, #315495, #311700 | **Independent** — no inter-PR dependencies. |

## 2. File-overlap matrix (among selected PRs)

| File / area | PRs | Verdict |
|---|---|---|
| `extensions/git/src/model.ts` | #313612, #313554 | Different sections (worktree scan filter vs failed-open prune). Sequential merge; verify auto-merge. |
| `extensions/git/src/git.ts` | #313612 (getWorktreesFS regex), #314614 (parseGitChangesRaw guards) | Different functions — no conflict expected. |
| `extensions/markdown-language-features/src/preview/preview.ts` | #333712 (class at top), #316756 (watcher in constructor) | Different regions; sequential merge. |
| `extensions/markdown-language-features/src/markdownEngine.ts` | #332081 only | — |
| All other selected PRs | pairwise disjoint | — |

No two selected PRs are alternative implementations of the same feature. No mutually exclusive approaches were selected (competing alternatives were resolved during screening: #240604 vs upstream #317164 → rejected; #313612 vs nothing; etc.).

## 3. Relationship to our fork's baseline

- Fork baseline `6253548a` **is an ancestor** of `upstream/main` (`1306698e`) — verified with `git merge-base --is-ancestor` after unshallowing. Consequently the merge base of every selected PR head against our branch is a true historical commit, and each merge brings **only the PR's own commits** as new ancestry (no unrelated upstream history is dragged in).
- All 22 selected PRs were reported `mergeable` by GitHub against current upstream `main`; each is additionally verified with a **real local `git merge`** during integration.
- Ordering: independent PRs may merge in any order; the pairs above are merged in the stated order. Thematic batches (see INTEGRATED.md): core/editor → workbench/UI/a11y → git/SCM → markdown → web/icons/language.

## 4. Upstream-supersession watchlist (for future audits)

- #339952 — already approved upstream (jruales); likely to merge into `microsoft/vscode` soon. Our merge remains valid (identical change).
- #331805 — dependent upstream PR #339389 already merged; the PR itself is still iterating.
- #318520 — actively updated by author; upstream CHANGES_REQUESTED being addressed.
