# Workflow Style Guide

## Style rules

- Keep workflows small and composable.
- Use stable, descriptive step IDs.
- Prefer explicit dependencies over inferred ordering.
- Keep elevated steps isolated and late in the graph.
- Supply only the arguments each typed action actually needs.

## Naming guidance

- workflow names should describe the job outcome
- step IDs should describe the specific action

Good:
- `read_readme`
- `session_summary_note`
- `patch_target`

Bad:
- `step1`
- `doit`
- `misc`

## Approval hygiene

- separate safe and elevated phases where possible
- avoid bundling many side effects into one elevated step
- prefer one exact approval per meaningful elevated action
