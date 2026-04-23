# ToolFlow Security Assessment, 2026-04-23

## Scope

This assessment reviews the public ToolFlow repository as prepared for broader external use, with special attention to risk introduced by:
- runtime action families
- plugin defaults
- approval boundaries
- progress reporting behavior
- suitability for exposure to untrusted or semi-trusted users

## Executive judgment

**Initial judgment before this pass: NO-GO for broad public-user exposure without changes.**

The most serious problem was that the ordinary `session` lane included actions that could be converted into arbitrary local script execution by passing custom interpreter and script-path arguments. That violated the intended security model and would have created an unacceptable public risk surface.

**Judgment after this pass: CONDITIONAL GO for publication as a project, but not as a casually exposed multi-user runtime.**

ToolFlow is now in a materially safer posture for public release, but it should still be treated as:
- a framework/runtime requiring operator judgment
- not a turnkey safe multi-tenant execution service
- not suitable for exposure to random internet users without additional boundary controls in the host platform

## Findings

### 1. Critical, fixed: ordinary session lane allowed script execution

**Prior state:**
- `health_downtrend_monitor` accepted `scriptPath`, `pythonBin`, and other runtime-controlled values
- `workspace_governance_monthly` accepted `scriptPath` and `shellBin`
- both executed in the ordinary `session` lane rather than the elevated lane

**Risk:**
- arbitrary local script execution without elevated approval semantics
- mismatch between documented security posture and actual executable surface

**Disposition:**
- removed these actions from the public safe profile and runtime action set

### 2. Medium, fixed: plugin default progress sink created noisy or ambiguous side effects

**Prior state:**
- the plugin defaulted long-run progress updates to a command sink invoking `openclaw system event`

**Risk:**
- deployment-dependent side effects
- possible cross-session noise or accidental disclosure in shared environments

**Disposition:**
- changed public default to `stderr`
- live user-facing progress remains possible, but now requires explicit operator configuration

### 3. Medium, unresolved: latest-run and ledger visibility are not multi-tenant safe by themselves

ToolFlow runtime methods such as status and receipts can operate on the latest run when no explicit run id is supplied.

**Risk:**
- in a shared host integration, one user could potentially observe another user's run metadata if the caller layer does not enforce ownership or session scoping

**Required mitigation in host platform:**
- bind runs to an operator/user/session authority context
- require explicit run ids where cross-user ambiguity exists
- do not expose raw latest-run helpers directly to untrusted users

### 4. Medium, unresolved: elevated lane remains development-oriented

The elevated lane is meaningfully better than blind shell execution because it is approval-bound and allowlisted, but it still assumes:
- local operator control
- local filesystem trust
- development-key custody

**Risk:**
- misuse if deployed as though it were already hardened multi-user infrastructure

**Required mitigation:**
- stronger key custody
- clearer operator ceremony
- host-level sandboxing and authority boundaries

### 5. Low to medium, documentation risk: project can be misunderstood as safer than its deployment context

ToolFlow now has a better documented posture, but random users may still infer that a typed workflow runtime is automatically safe in a public multi-user setting.

**Mitigation:**
- keep warning language explicit
- do not market it as internet-safe multi-tenant infrastructure

## Recommendations

### Required before broader user exposure
1. keep ordinary lanes free of interpreter/script launchers
2. keep progress side effects opt-in, not implicit
3. add run ownership and caller scoping in the host integration layer
4. require explicit elevated enablement and allowlists

### Recommended next hardening tranche
1. add run ownership metadata and ownership-checked status/inspect helpers
2. separate public safe profile from local/operator extensions more cleanly
3. document deployment patterns for single-user vs shared-user hosts
4. add tests asserting that ordinary lanes cannot spawn interpreters or launch arbitrary scripts

## Bottom line

ToolFlow can be published.

ToolFlow should **not** be treated as a turnkey public execution surface for random users without a stronger host-side trust model.

That distinction matters rather a great deal.
