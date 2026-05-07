---
name: "git-commit-push"
description: "Commits and pushes code changes to git repository. Invoke when user asks to commit, push, or submit code changes."
---

# Git Commit & Push

This skill commits staged changes and pushes to the remote repository.

## Usage

Invoke this skill when the user explicitly asks to:
- Commit and push code
- Submit code changes
- Push to repository
- Git commit and push

## What It Does

1. **Check current branch**: `git branch --show-current`
2. **Check remote tracking**: `git branch -vv` to see if local branch tracks a remote branch
3. **Compare branches**: If local branch doesn't track the expected remote branch, prompt user to confirm or set upstream
4. **Stage changes**: `git add -A`
5. **Commit**: `git commit -m "<message>"`
6. **Push**: `git push` (with `-u` if setting upstream for first time)

## Branch Mismatch Handling

- If local branch has no upstream set: offer to `git push -u origin <branch>`
- If remote branch differs from expected: warn user and ask for confirmation
- If no remote configured: inform user and skip push

## Notes

- Default commit message: `chore: commit and push changes`
- If user provides a message, use that instead
- If there are no changes to commit, inform the user
