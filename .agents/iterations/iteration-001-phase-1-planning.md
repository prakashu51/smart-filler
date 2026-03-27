# Iteration 001: Phase 1 Planning Setup

## What Changed

- created the `.agents` workspace
- added a Phase 1 foundation plan
- documented a future-safe path for locale and language-aware random data

## Why

We need a stable planning baseline before starting the engine rewrite. This extension has enough technical debt in the core autofill logic that jumping straight into coding would make later phases harder.

## Key Decisions

- keep Phase 1 in plain JavaScript
- prioritize engine architecture before adding profiles
- separate `locale` and `language` in the future generator contract
- remove business-specific hardcoding from the generic autofill engine

## Follow-Ups

- begin Iteration 002 with module scaffolding
- introduce shared storage/config helpers
- define the semantic field taxonomy used by the mapper
