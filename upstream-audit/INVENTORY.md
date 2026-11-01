# Upstream PR Inventory — microsoft/vscode

**Audit started:** 2026-10-31/11-01 (UTC) · **Fork:** `havaianasdestruido/vscode` · **Baseline:** `6253548aac3633310dfcfd8e546a2595834dc593` (fork `main`, an ancestor of upstream `main` @ `1306698e328e5e531f5e632301d30020aa994eff`)

## Collection method and coverage

- **Source of truth:** GitHub GraphQL (`repository.pullRequests(states: OPEN)`, 50 per page, ordered `createdAt ASC`) via the `gh` CLI, paginated through **all 62 pages**.
- **Reconciliation:** the full open-PR number set was independently retrieved via the REST `pulls` API (31 pages × 100) — **both sets contained exactly the same 3,061 PRs** (0 missing, 0 extra).
- **Raw data:** `upstream-audit/data/pages/page-001.json … page-062.json` (resumable, per-page), consolidated into **`upstream-audit/pr-inventory.json`** (2.9 MB, one record per PR with number, title, url, author, authorAssociation, dates, draft/mergeable state, labels, milestone, base/head refs + OIDs, head repo, additions/deletions/changedFiles, commit/comment/review/reaction counts).
- **Retrieval failures:** 0 pages failed permanently (transient 502s and GraphQL resource-limit errors were resolved by reducing page size to 50 and retrying).
- **Per-PR detail data** (for the shortlist): `upstream-audit/data/prs/<number>.json` — full PR record incl. body, files with patches, reviews, issue comments, commits. 99/99 fetched, 0 failures.

**No PR was silently skipped.** Every open PR received a metadata screening (scripted classification + scoring, `upstream-audit/screening.json`); every plausible integration candidate from that screen received a manual source-code review of its actual patch (see `SHORTLIST.md`).

## Headline numbers

| Metric | Value |
|---|---:|
| Open PRs discovered (GraphQL) | **3,061** |
| Open PRs (REST reconciliation) | 3,061 (set-identical) |
| Targeting `main` | 3,009 |
| Targeting other/fork branches | 52 |
| Drafts | 854 (27.9%) |
| Authored by Bot-type accounts | 393 (`copilot-swe-agent` 283, `vscodebot-pr` 37, `dependabot` 18, `azure-pipelines` 6, …) |
| Human-authored, non-draft, targeting `main` | 1,815 |
| GitHub-reported `mergeable: CONFLICTING` | 440 (14.4%) |
| Author association: MEMBER / COLLABORATOR | 225 / 131 |
| Author association: CONTRIBUTOR / NONE | 1,441 / 1,264 |

## Age distribution (at audit time)

| Age | Count | % |
|---|---:|---:|
| < 1 month | 516 | 16.9% |
| 1–6 months | 1,258 | 41.1% |
| 6–12 months | 882 | 28.8% |
| 1–2 years | 222 | 7.3% |
| 2–4 years | 140 | 4.6% |
| > 4 years | 43 | 1.4% |

## Size distribution

| Changed files | Count | | ± lines | Count |
|---|---:|---|---|---:|
| 1 file | 980 | | < 50 | 1,487 |
| 2–5 | 1,454 | | 50–500 | 1,232 |
| 6–20 | 500 | | 500–5k | 313 |
| 21–100 | 111 | | > 5k | 29 |
| > 100 | 16 | | | |

## Screening categories (a PR may carry several)

| Category | Count |
|---|---:|
| bugfix (title/label heuristic) | 1,197 |
| draft | 854 |
| feature-or-other | 815 |
| automation (bot-authored) | 430 |
| ui-ux | 412 |
| git-scm | 141 |
| testing | 70 |
| language-support | 69 |
| extension-api | 48 |
| documentation | 46 |
| performance | 45 |
| infrastructure | 45 |
| accessibility | 24 |
| security | 7 |

## Top authors among open PRs

`copilot-swe-agent` (283, bot), `yogeshwaran-c` (190), `vs-code-engineering` (86), `justschen` (51), `maruthang` (50), `denizguney` (45), `ulugbekna` (44), `vscodebot-pr` (37, bot), `osortega` (35), `dmitrivMS` (31), `SimonSiefke` (30), `joshspicer` (29), `murataslan1` (27), `TylerLeonhardt` (25), `jruales` (25).

## Most common labels

`triage-needed` 256, `errors-fix` 111, `*error-fix-driving` 108, `freeze-slow-crash-leak` 32, `errors-fix-need-intervention` 25, `dependencies` 18, `git` 15, `javascript` 15, `outline` 11, `changes-requested` 9, `info-needed` 8, `install-update` 8, `intervention-patch-too-large` 8, `bug` 7, `engineering` 7, `chat` 7, `feature-request` 6, `under-discussion` 6.

## Screening funnel

| Stage | Count |
|---|---:|
| Open PRs discovered | 3,061 |
| Metadata screening (100%) | 3,061 |
| Excluded by hard rules (bot-authored, draft, non-`main` base) | 1,336 |
| Eligible pool | 1,725 |
| Shortlist for detailed review (top overall + top per category) | 99 |
| Detailed patch review performed (incl. #332081 fetched additionally) | ~30 |
| Selected for integration | 22 |
| Deferred (documented) | 18 |
| Rejected (documented) | 9 + whole-class exclusions |

## Notes on methodology and honesty

- The 3,061-PR collection is exhaustive and verified; the **metadata screening is exhaustive** (all PRs classified and scored by script).
- The **detailed source-code review is NOT exhaustive over all 3,061 diffs** — it was performed on the 99-PR shortlist (prioritized by screening score and category coverage) with ~30 patches read in full depth. This document does not claim otherwise.
- GitHub `mergeable` was `UNKNOWN` for 2,275 PRs (lazy computation); true merge-cleanliness for selected PRs was verified locally with real `git merge` against our baseline.
