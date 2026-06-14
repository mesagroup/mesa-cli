# Issue Body Templates

Use these templates when crafting GitHub issue bodies. Replace placeholders; delete sections that do not apply.

When creating issues, also apply:

- **Label**: `epic`, `story`, `task`, `bug`, or `spike` (+ `priority:*`)
- **Native Type** (mesagroup org): `Feature` for stories, `Task` for tasks/spikes, `Bug` for bugs; epics have no native type — use `epic` label only

---

## Epic

```markdown
## Goal / Outcome

<One sentence describing the business or product outcome this epic delivers.>

## Background / Context

<Why now? What problem exists? Link related issues, docs, or ADRs.>

## Scope

### In scope

- <item>
- <item>

### Out of scope

- <item>

## Success metrics

- <measurable outcome, e.g. "Users can run verify from the UI on mobile and desktop">
- <metric>

## Implementation plan

### Phase 1 — <name>

<What ships, exit criteria>

### Phase 2 — <name>

<What ships, exit criteria>

### Phase 3 — <name>

<What ships, exit criteria>

## Child stories

- [ ] <Proposed story title> (create issue and link as `- [ ] #N`)
- [ ] <Proposed story title>

## Risks / Dependencies

- <risk or dependency>
```

---

## Story

```markdown
## User story

**As a** <persona>,
**I want** <capability>,
**so that** <benefit>.

## Acceptance criteria

### Scenario: <name>

- **Given** <precondition>
- **When** <action>
- **Then** <expected result>

### Scenario: <name>

- **Given** …
- **When** …
- **Then** …

<!-- Or use a checklist when G/W/T is overkill:
- [ ] <criterion>
-->

## Technical notes

- <implementation hints, affected modules, APIs>
- <links to existing code or docs>

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Tests added or updated where applicable
- [ ] Documentation updated if user-facing
- [ ] `mesa verify` passes on affected generated projects (if applicable)

## Parent epic

Part of #<epic-number> (omit if standalone)
```

---

## Task

```markdown
## Summary

<One paragraph: what needs to be done and why.>

## Steps

- [ ] <step>
- [ ] <step>

## Technical notes

- <files, commands, constraints>

## Parent

Story #<number> or Epic #<number> (if applicable)
```

---

## Bug

```markdown
## Summary

<One-line description of the defect>

## Steps to reproduce

1. <step>
2. <step>
3. <step>

## Expected behavior

<what should happen>

## Actual behavior

<what happens instead>

## Environment

- OS:
- `mesa` version:
- Node version:

## Logs / screenshots

<paste relevant output>

## Parent

Story #<number> (if applicable)
```

---

## Spike

```markdown
## Question

<What do we need to learn or decide?>

## Time box

<e.g. 2 days>

## Approach

- <experiment or research step>

## Deliverable

- Recommendation doc, POC, or decision recorded in issue comments

## Outcome

_Fill in after spike completes._
```
