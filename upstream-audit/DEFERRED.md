# Deferred — plausible candidates intentionally postponed

These PRs look worthwhile but were **not** integrated in this round. Common reasons:
active upstream review in progress (re-merging risks divergence), scope too large to
verify responsibly in this environment, or verification requires interactive
UI/browser testing this sandbox cannot perform. Revisit on the next sync.

| PR | Title (short) | Why deferred | Revisit trigger |
|---|---|---|---|
| [#331805](https://github.com/microsoft/vscode/pull/331805) | Notebook diff editor memory leak | Active MS review with unresolved CHANGES_REQUESTED; high-risk area (notebook diff) | Upstream decision (merge/close) |
| [#333909](https://github.com/microsoft/vscode/pull/333909) | IME jitter: keep textarea short unless screen reader | Accessibility behavior of the `Unknown` screen-reader-detector path needs verification | Upstream review progress |
| [#296767](https://github.com/microsoft/vscode/pull/296767) | Quick input horizontal resize | Needs interactive UI testing (drag behavior, layout on small screens) | Interactive test session |
| [#314872](https://github.com/microsoft/vscode/pull/314872) | RTL text in find decorations | Requires browser-test run; bidi subtleties easy to get subtly wrong | Browser suite available locally |
| [#314348](https://github.com/microsoft/vscode/pull/314348) | `scm.diffDecorationsAlgorithm` setting | PR contains a duplicate setting-registration bug as-written; upstream regression status unclear | Upstream fix of the PR or clear regression report |
| [#333640](https://github.com/microsoft/vscode/pull/333640) | microsoft-authentication instance discovery | Awaiting owner (TylerLeonhardt) review; auth code is high-blast-radius | Upstream decision |
| [#269623](https://github.com/microsoft/vscode/pull/269623) | Local settings in configuration editing | Huge scope, textual conflicts, controversial design (duplicates other proposals) | Upstream direction |
| [#327494](https://github.com/microsoft/vscode/pull/327494) | Git SHA-256 repositories support | 445 lines, conflicts with current git extension code, needs focused verification | Dedicated effort round |
| [#317194](https://github.com/microsoft/vscode/pull/317194) | Focus-follows-mouse accessibility setting | 555 lines, unreviewed upstream, touches window/focus management | Upstream review |
| [#342397](https://github.com/microsoft/vscode/pull/342397) | Share one schema object (24 kB memory) | Trivial value; constant object dedupe | Free slot, low priority |

See also the supersession watchlist in [DEPENDENCIES.md](DEPENDENCIES.md) §4 — deferred
items there overlap with integrated ones and need coordination on the next upstream sync.
