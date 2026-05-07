---
name: generate-readme
description: >-
  Generates or refreshes a project README.md from repository facts (package
  scripts, stack, structure). Use when the user asks for a README, project
  documentation at repo root, or to document setup, build, run, and deployment
  for contributors.
---

# Generate README.md

## When to run

- User asks to create, update, or auto-generate `README.md` (or project docs at repo root).
- User wants onboarding/setup instructions derived from the actual repo.

## Preconditions

1. **Scope**: Default output file is repository root `README.md`. If the user names another path, use that.
2. **Overwrite**: If `README.md` exists, merge improvements unless the user asked for a full replace—then confirm in one short sentence before deleting substantial custom content.
3. **Facts only**: Describe behavior and commands supported by files in the repo. Do not invent features, env vars, or URLs.

## Discovery (run before writing)

Use tools to inspect the project; adapt depth to repo size.

1. **Manifest**: `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod`—scripts, deps, engine constraints.
2. **Entry & framework**: `vite.config.*`, `webpack.config.*`, `next.config.*`, `nuxt.config.*`, `uni-app`/`src/manifest.json`, `angular.json`, etc.
3. **Layout**: Top-level folders (`src/`, `apps/`, `packages/`, `electron/`, `docs/`).
4. **Env & secrets**: `.env.example`, `example.env`, docs mentioning `VITE_*`, API base URLs—document names only, never copy real secrets.
5. **Existing docs**: `CONTRIBUTING.md`, `ELECTRON.md`, `ARCHITECTURE.md`—link instead of duplicating.

## README structure (template)

Use this section order unless the project is too small (then omit empty blocks):

```markdown
# <Project title>

<One-sentence purpose>

## Requirements

- Runtime / Node versions if specified (engines, `.nvmrc`, etc.)

## Install

<Exact commands from manifest>

## Development

<Scripts: dev, test, lint—copy names from package.json or equivalent>

## Build

<Production build and output dir if known>

## Environment

| Variable | Description |
|----------|-------------|
| ... | ... |

(Omit table if no safe public vars found.)

## Project structure

Short bullet map of main directories (no deep tree).

## Related

- Links to other markdown in repo if useful
```

## Language

- Match the language of the user request (e.g. Chinese vs English).
- If unspecified, use the language of existing project docs when consistent; otherwise English.

## Quality bar

- Commands must be copy-pasteable paths from root (e.g. `npm run dev`).
- Prefer **pnpm/yarn/npm** consistently with lockfiles present (`pnpm-lock.yaml` → pnpm).
- Mention platform notes only when evidenced (e.g. `electron/` folder, Capacitor, Dockerfiles).
- No generic filler ("world-class", "blazing fast"). No broken badge URLs unless the user supplies them.

## After writing

- If the repo has a formatter or doc linter, suggest running it only if one exists; do not assume.
- Keep `README.md` proportional to project complexity—small repos get a short README.
