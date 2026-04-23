# ToolFlow Publication Readiness

## Purpose

This note tracks the minimum hardening required before sharing ToolFlow outside its original local workspace context.

## What was cleaned up in this pass

- removed publication-facing reliance on machine-specific narrative in the main README
- added a public overview document describing what ToolFlow is, why it exists, and what problems it solves
- added explicit authorship and attribution notes
- documented Hermes/Nous Research inspiration rather than silently absorbing it
- excluded runtime ledger and mirror data from normal packaging surfaces via `.gitignore`
- excluded workspace-specific example workflow payloads from normal npm-style packaging via `.npmignore`
- documented progress-update behavior in public-facing language

## Remaining publication cautions

1. **License is not yet declared**
   - do not publish publicly without an explicit license decision
2. **ClawHub fit should be deliberate**
   - ClawHub is primarily a skill distribution surface, while ToolFlow is presently a broader runtime/package project
   - publication may be best done either as:
     - a ToolFlow skill/operator bundle, or
     - a repository release plus a thinner ClawHub-facing skill wrapper
3. **Local-development posture remains explicit**
   - elevated execution is still intentionally narrow and development-oriented
4. **Examples should remain generic**
   - avoid shipping workspace-specific workflow artifacts, IDs, or environment assumptions
   - several repo-local example workflows remain useful for local history and should not be treated as public generic examples

## Recommended next step before external publication

Choose the outward packaging shape:
- **Option A:** publish ToolFlow as a repository/project first, then publish a ClawHub skill that installs or fronts it
- **Option B:** publish a narrower ToolFlow authoring/runtime skill to ClawHub and keep the full monorepo as the reference implementation

My judgment is that Option B is likely cleaner for ClawHub, which is, after all, a skill marketplace rather than a museum for ambitious monorepos.
