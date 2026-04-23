# ToolFlow Overview

## What ToolFlow is

ToolFlow is a bounded workflow runtime for agent execution.

It is designed for work that is too large, too consequential, or too interruption-prone to trust to a single conversational turn. ToolFlow gives that work a durable run identity, a typed execution graph, a canonical ledger, and explicit approval and recovery semantics.

In plainer language, ToolFlow is the layer that lets an agent carry a longer job without becoming vague, forgetful, or unaccountable.

## Why ToolFlow exists

ToolFlow was created because ordinary chat-native agent execution has recurrent structural weaknesses:

1. long-running work becomes opaque
2. approvals are often too informal
3. interrupted work is difficult to recover cleanly
4. status reporting is usually derived from conversation rather than canonical run state
5. users are left waiting in silence during long builds or automation runs

ToolFlow exists to replace that pattern with something more disciplined.

## What problems it solves

### 1. Durable execution identity
Each run has a stable run id, a persisted manifest, event log, receipts, and artifacts. The work does not vanish simply because the conversation moved on.

### 2. Typed, inspectable execution
Workflows compile into an explicit graph of typed steps. That gives operators and higher-level systems a clear picture of what the run is meant to do.

### 3. Approval-bounded elevated work
Elevated actions require exact-payload approval. Approval is tied to the specific payload rather than a loose human memory of what was probably intended.

### 4. Recovery after interruption
If a run is interrupted, ToolFlow can reconcile grants and receipts, requeue replayable work, and quarantine steps that require review before replay.

### 5. Progress visibility for long jobs
ToolFlow can emit progress updates during longer runs so users are not left wondering whether the system is still working, blocked, or complete.

### 6. Canonical ledger over conversational guesswork
The ledger remains canonical. Mirrors, summaries, and user-facing updates are useful, but they are not allowed to masquerade as the source of truth.

## Design principles

- **bounded authority over vague autonomy**
- **canonical ledger over conversational inference**
- **exact approvals over broad trust**
- **small, typed surfaces over generic invoke-anything escape hatches**
- **recovery and auditability as first-class concerns**

## Current scope

Current implemented scope includes:
- typed workflow compilation
- file-backed ledger and manifest persistence
- ordinary typed actions
- bounded elevated actions
- recovery and reconciliation
- TaskFlow mirror records
- controller records for higher-level orchestration
- configurable long-run progress updates

Current deliberate boundaries include:
- local-oriented deployment posture
- development-key custody rather than hardened multi-operator ceremony
- narrow action surface rather than a general-purpose remote execution fabric
- no claim of broad production hardening across every environment

## Why it may matter beyond this repo

Many agent systems can demonstrate a clever step. Far fewer can carry a consequential job with durable state, interruption tolerance, approval discipline, and honest progress reporting.

ToolFlow is an attempt to make that category of work boringly reliable, which is usually a sign that the architecture has improved.
