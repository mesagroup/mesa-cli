# Creating GitHub Issues

When the user asks to open a GitHub issue, follow this workflow strictly.

## 1. Gather Context First

Before creating anything, make sure you understand the problem:

- **What happened?** Reproduce the exact error, command, or behavior.
- **What was expected?** Clarify what should have happened instead.
- **What environment?** OS, tool versions, terminal type.
- **Is this a bug, feature request, or improvement?**

If any of the above is unclear, **ask the user before proceeding**. Do not guess or assume — a vague issue wastes everyone's time.

Use conversation history as context: if the user has been debugging a problem with you, extract the relevant details from the conversation instead of asking again.

## 2. Check gh Authentication

Before attempting to create the issue, verify auth:

```bash
gh auth status
```

If not authenticated:
1. Run `gh auth login --web --git-protocol https`
2. Give the user the one-time code and the URL to open in browser
3. Wait for confirmation before proceeding

## 3. Create the Issue

Write the issue body to a temporary file, then use `--body-file`. This avoids shell quoting problems on both PowerShell and bash.

```bash
# 1. Write body to a temp file (issue-body.md)
# 2. Create the issue
gh issue create --repo <owner>/<repo> --title "<title>" --body-file issue-body.md
# 3. Delete the temp file
rm issue-body.md
```

## 4. Issue Structure

### Title
Concise, action-oriented. Start with the area of impact.
- Good: `Post-install: add PATH diagnostic when mesa command is not found`
- Bad: `Bug with install`

### Body Format

```markdown
## Problem
What is broken or missing. Include exact error messages, screenshots, or logs from the conversation.

## Expected behavior
What should happen instead.

## Steps to reproduce
1. Numbered steps to trigger the problem
2. Include exact commands run

## Proposed solution
Concrete options (A/B/C) with trade-offs when relevant. If only one approach makes sense, describe it directly.

## Environment
- OS and version
- Tool versions (node, npm, etc.)
- Terminal type
```

Adapt sections to the issue type — feature requests may skip "Steps to reproduce", improvements may skip "Environment".

## 5. After Creation

- Print the issue URL so the user can review it
- Delete the temporary body file
- Ask if they want to assign it, add labels, or link it to a milestone
