---
name: agile-github-issues
description: >-
  Classifies agile work (epic, story, task, bug, spike), drafts structured GitHub
  issue bodies from templates, applies mesagroup/mesa-cli labels, sets the native
  GitHub issue Type field, and creates or links issues via gh CLI. Use when the
  user asks to create a GitHub issue, epic, user story, backlog item, task, bug
  report, or spike, or to groom or label issues in this repository.
---

# Agile GitHub Issues

Create well-structured GitHub issues for `mesagroup/mesa-cli` using agile conventions, repo labels, native issue types, and `gh` CLI.

## Prerequisites

1. `gh auth status` must succeed.
2. Run from the repo root (or pass `--repo mesagroup/mesa-cli`).
3. Read [templates.md](templates.md) for body structures.

## Classify work

Use **two layers**: native GitHub **Type** (org-level) + repo **labels** for agile taxonomy and priority.

| Agile kind | Native Type (org) | Label |
|------------|-------------------|-------|
| **Epic** | _(no Epic type in org — use `epic` label only)_ | `epic` |
| **Story** | `Feature` | `story` |
| **Task** | `Task` | `task` |
| **Bug** | `Bug` | `bug` (default repo label) |
| **Spike** | `Task` (time-boxed research) | `spike` |

**Priority** (pick one): `priority: high` | `priority: medium` | `priority: low`

**Status** (optional): `status: blocked` | `status: needs-refinement`

### Classification rules

- Default to **story** when unsure between story and task. Use **task** only as a child of a story.
- **Epic** bodies must include a phased implementation plan and a child-stories checklist.
- **Bug** must include repro steps; skip user-story format. Use native `Bug` type + `bug` label.
- **Spike** must include a time box and a concrete deliverable (recommendation or POC).

### Native issue types (mesagroup org)

Query available types before creating issues (org may add types later):

```bash
gh api graphql -f query='
query {
  organization(login: "mesagroup") {
    issueTypes(first: 20) { nodes { id name } }
  }
}'
```

Current org types: **Task**, **Bug**, **Feature** — no **Epic** type. Epics are identified by the `epic` label and issue body structure only.

## Workflow

### 1. Gather context

Before writing, skim relevant repo areas so issue content is accurate:

- `README.md` — commands (`init`, `prototype`, `verify`, `setup`)
- `src/commands/` — command behavior
- `src/util/verify/` — architecture audit checks (not-sqlite, REST, auth, blob storage, environments)

### 2. Draft the body

Copy the matching template from [templates.md](templates.md). Fill every section; use `N/A` only when truly irrelevant.

### 3. Choose labels and native type

Minimum labels: one work-kind label (`epic`, `story`, `task`, `bug`, or `spike`) + one `priority:*`. Add `status:*` when applicable.

Map agile kind → native type (see table above). Skip native type only when no mapping exists (epics).

### 4. Create the issue

Use a temp body file (preferred for multi-line content):

```bash
BODY=$(mktemp)
cat > "$BODY" <<'EOF'
<paste filled template>
EOF

gh issue create \
  --title "Title in imperative mood" \
  --body-file "$BODY" \
  --label "story" \
  --label "priority: medium"

rm -f "$BODY"
```

Capture the issue number from `gh` output (e.g. `https://github.com/mesagroup/mesa-cli/issues/42` → `#42`).

### 5. Set native issue Type

Try the CLI flag first (supported in newer `gh` versions):

```bash
gh issue edit 42 --type Feature   # may not be available on all gh versions
```

**Fallback — GraphQL** (works today):

```bash
# Resolve issue node id
ISSUE_ID=$(gh api graphql -f query='
query($owner:String!,$repo:String!,$n:Int!) {
  repository(owner:$owner,name:$repo) {
    issue(number:$n) { id }
  }
}' -f owner=mesagroup -f repo=mesa-cli -F n=42 -q .data.repository.issue.id)

# Set type (Feature example)
gh api graphql -f query='
mutation($id:ID!,$typeId:ID!) {
  updateIssue(input:{id:$id, issueTypeId:$typeId}) {
    issue { number issueType { name } }
  }
}' -f id="$ISSUE_ID" -f typeId="IT_kwDOB2U8_84BHIKT"
```

Known type IDs (mesagroup org — re-query if these stop working):

| Name | ID |
|------|-----|
| Task | `IT_kwDOB2U8_84BHIKM` |
| Bug | `IT_kwDOB2U8_84BHIKQ` |
| Feature | `IT_kwDOB2U8_84BHIKT` |

### 6. Link stories to epics

When creating a **story** under an epic:

1. Add `## Parent epic` / `Part of #<epic>` in the story body.
2. After creation, edit the epic to add a linked checklist item:

```bash
gh issue view <epic-num> --json body -q .body > /tmp/epic-body.md
# Append or update: - [ ] #<story-num>
gh issue edit <epic-num> --body-file /tmp/epic-body.md
```

Use `- [ ] #N` (linked) once the child issue exists; use plain `- [ ] Proposed title` for not-yet-created stories.

### 7. Verify

```bash
gh issue view <num> --json title,labels,body,url
gh api graphql -f query='
query {
  repository(owner:"mesagroup",name:"mesa-cli") {
    issue(number:'<num>') { issueType { name } labels(first:10){nodes{name}} }
  }
}'
```

Return the issue URL to the user.

## Title conventions

| Type | Pattern | Example |
|------|---------|---------|
| Epic | Noun phrase (outcome) | `Standalone cross-device UI for mesa CLI` |
| Story | Capability from user POV | `Architecture status analysis agent` |
| Task | Imperative verb | `Add JSON schema for verify output` |
| Bug | Observed vs expected | `verify exits 0 when SQLite dep is dev-only` |
| Spike | Question | `Evaluate Tauri vs PWA for mesa UI shell` |

## MESA architecture constraints (for UI / API epics)

When issues touch generated apps or new services, respect workspace rules:

- **Database**: managed Postgres (Neon, Supabase, RDS) — never SQLite for new work
- **API**: REST, JSON `{ data, error }`, Zod validation
- **Frontend**: Next.js 15 App Router preferred
- **Auth**: username/password (bcrypt/argon2) + JWT (`jose`)
- **Storage**: Vercel Blob for prototypes
- **Environments**: `production` + `preview` in CI/CD

## Examples

### Create a story (label + native type)

```bash
gh issue create \
  --title "Architecture status analysis agent" \
  --body-file story.md \
  --label "story" \
  --label "priority: medium"
# Then set native type to Feature via GraphQL (step 5)
```

### Create an epic (label only — no native Epic type)

```bash
gh issue create \
  --title "Standalone cross-device UI app" \
  --body-file epic.md \
  --label "epic" \
  --label "priority: high"
# No native Epic type in org; epic is conveyed by label + body
```

After each child issue is created, replace plain-text checklist lines with `- [ ] #N` via `gh issue edit`.

## Do not

- Create issues without a work-kind label (`epic`, `story`, `task`, `bug`, or `spike`)
- Use the old default `enhancement` label for new agile work
- Use deprecated `type:*` prefixed labels (renamed to unprefixed names)
- Commit secrets or `.env` contents in issue bodies
- Skip acceptance criteria on stories
- Fake a native Epic type when the org has none configured
