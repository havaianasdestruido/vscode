# Rejected — candidates reviewed and NOT integrated, with reasons

These PRs were individually reviewed during the shortlist phase and excluded on their
own merits (not merely deprioritized). Each entry records the decisive reason so the
decision can be revisited if circumstances change.

| PR | Title (short) | Reason for rejection |
|---|---|---|
| [#162893](https://github.com/microsoft/vscode/pull/162893) | Multi-file creation from curly-bracket expansion (`a/{b,c}.txt`) | Wrong layer: implements `FileService.createFile` semantics for an explorer feature, and makes it impossible to create literal `{}` filenames. Overlaps with long-standing MS design debate; not mergeable without upstream direction. |
| [#134146](https://github.com/microsoft/vscode/pull/134146) | MSYS2 git compatibility (path/argv quoting) | Superseded: the substantive fix landed in msys2/MINGW-packages#26470 (upstream git-for-windows packaging). Risk of double-fixing and drift. |
| [#190057](https://github.com/microsoft/vscode/pull/190057) | TSDK trust prompt bypass (use trusted SDK without re-prompt) | Weakens a deliberate security boundary (workspace-trust prompt for TypeScript SDK). Security-relevant relaxations should come from upstream only. |
| [#243558](https://github.com/microsoft/vscode/pull/243558) | Move collapsed views downwards instead of hiding | MS reviewer tested the UX and rejected it; changes core workbench layout behavior with no upstream consensus. |
| [#262399](https://github.com/microsoft/vscode/pull/262399) | Activity bar inactive-item opacity setting | Declined by MS accessibility lead (contrast/consistency concerns). |
| [#332421](https://github.com/microsoft/vscode/pull/332421) | AsyncDataTree LRU eviction of rendered elements | Auto-collapses nodes the user expanded (eviction drops expansion state) — user-visible regression accepted by nobody upstream. |
| [#335046](https://github.com/microsoft/vscode/pull/335046) | Chat participant ID regex throws on malformed input | Fix throws at runtime in a hot path and adds no coverage; the same crash can re-introduce via any caller. Not mergeable as-is. |
| [#240604](https://github.com/microsoft/vscode/pull/240604) | Bracket-pair snippet overwrite behavior | Superseded by MS's own #317164 — merging would conflict with the upstream fix. |
| [#262465-class misc.](data/pr-inventory.json) | (various low-quality / drive-by fixes) | Screened out during full review: no tests, incorrect root-cause analysis, or behavior changes contradicted by issue-thread maintainers. Details in `screening.json`. |

Whole-class exclusions applied before individual review (documented in
[INVENTORY.md](INVENTORY.md)): 393 bot-authored PRs, 854 drafts, 52 PRs based on
non-`main` branches.
