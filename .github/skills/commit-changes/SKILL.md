---
name: commit-changes
description: Review and commit the intended repository changes using English Conventional Commit messages. Use when asked to commit, create a commit, or prepare a changeset for commit.
---

# Commit changes

Use this workflow when the user explicitly asks to create a Git commit. Explain
your actions in Portuguese, but write the commit subject and body in English.

## 1. Inspect scope and repository state

1. Run `git status --short --branch` and inspect staged, unstaged, and untracked
   changes with `git diff --cached`, `git diff`, and targeted file reads.
2. Do not assume every worktree change belongs to this task. Never discard,
   reset, restore, or overwrite user changes.
3. If there are staged changes, inspect them carefully. Do not silently include
   unrelated staged work, or replace the user's staging choices. If the intended
   commit scope is unclear, ask the user which changes to include.
4. If the requested changes can be isolated, stage only their explicit paths
   (or use interactive staging for partial-file changes). Do not use `git add .`
   or `git add -A` in a dirty worktree.
5. If the branch, diff, or requested scope suggests committing unrelated work,
   ask before proceeding. Never amend a commit unless explicitly requested.

## 2. Validate and prepare the message

1. Review the complete diff that will be committed and check for accidental
   files, generated output, credentials, or unrelated changes. Do not commit
   secrets; stop and report if sensitive material is present.
2. Run the smallest relevant existing tests or checks for the changes. If a
   check fails, report the failure and do not claim validation succeeded. Ask
   before committing a change whose relevant checks cannot be run or whose
   failure is unresolved.
3. Use **Conventional Commits** for the subject:
   `<type>(<optional-scope>): <imperative summary>`
4. Write the entire subject and any body in English. Use a concise imperative
   summary, lowercase type, no ending period, and preferably keep the subject
   within 72 characters.
5. Use an appropriate type such as `feat`, `fix`, `docs`, `test`, `refactor`,
   `perf`, `build`, `ci`, or `chore`. Include a scope only when it clarifies the
   change. Do not claim a breaking change unless the diff truly introduces one.
6. If multiple unrelated changes would require different commit messages, ask
   whether to split them rather than combining them into an unclear commit.

## 3. Create and verify the commit

1. Stage only the reviewed changes in scope, then inspect `git diff --cached`
   and confirm the staged diff matches the intended commit exactly.
2. Create a new commit with `git commit`; do not bypass hooks with `--no-verify`
   or equivalent. Resolve hook failures rather than bypassing them.
3. Include this trailer at the end of the commit message:
   `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`
4. After the commit, verify it with `git show --stat --oneline HEAD` and
   `git status --short --branch`. Report the commit hash, English subject,
   validation performed, and any remaining uncommitted changes.
