# Iteration 002: Structure Scaffold

## What Changed

- added `shared/` helpers for config normalization and storage access
- added `content/` module scaffolding for detector, mapper, generator, executor, observer, report, and engine entrypoints
- added a `popup/` entrypoint and rewired the popup to use shared helpers
- routed the extension through a new Phase 1 scaffold while preserving current behavior via a legacy engine bridge

## Why

This keeps the extension usable while we progressively replace the old single-file content script with modular Phase 1 components.

## Notes

- current autofill behavior is still largely driven by the legacy engine
- the new engine now owns orchestration, storage normalization, and reporting setup
- `locale` and `language` are introduced structurally even though multilingual generation is not implemented yet

## Risks or Follow-Ups

- the legacy engine still contains site-specific logic that should be removed in a later Phase 1 iteration
- locale-aware generation still needs to move out of the legacy bridge into `generator.js`
- popup UX is still intentionally minimal

## Next Step

Implement the normalized detector model and semantic field taxonomy, then start replacing legacy heuristics incrementally instead of all at once
