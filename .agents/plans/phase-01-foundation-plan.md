# Phase 1 Foundation Plan

## Goal

Build a reliable, extensible autofill engine for the Chrome extension so later phases can add profiles, developer tooling, automation, and multilingual random data without forcing a rewrite.

## Why Phase 1 Comes First

The current extension works through a single injected content script with hardcoded heuristics and special-case rules. That is enough for quick demos, but it is not a stable base for:

- profile-based filling
- domain-specific behavior
- automation and replay
- confidence scoring
- multilingual generators

Phase 1 should focus on correctness, modularity, and observability.

## Product Direction This Plan Supports

This phase is intentionally designed to support the later roadmap:

1. Phase 1: Core engine rewrite
2. Phase 2: Profiles and rules
3. Phase 3: Developer UX and debugging
4. Phase 4: Automation and replay
5. Phase 5: AI-assisted workflows

Future multilingual random fills are part of the long-term design and are accounted for in the data-generation interfaces introduced in Phase 1.

## Current Pain Points

- Fill logic is concentrated in one file
- locale selection exists in the popup but is not honored in practice
- framework support is heuristic-heavy and difficult to extend
- dynamic field handling relies on fixed delays
- site-specific logic is mixed into the generic engine
- there is no normalized field model
- there is no fill report or confidence system

## Phase 1 Outcomes

By the end of Phase 1, we should have:

- a modular extension structure
- a normalized field-detection pipeline
- a score-based field mapping system
- a safer fill executor for standard inputs and common custom controls
- dynamic form support via `MutationObserver`
- a small internal reporting layer for skipped, filled, and low-confidence fields
- a clean config surface for future profiles and locale/language generators

## Proposed Repository Shape

This does not require a framework migration yet. We can stay in plain JavaScript first and still organize the code well.

```text
smart-filler/
  manifest.json
  faker.min.js
  popup.html
  styles.css
  popup/
    popup.js
  content/
    index.js
    engine.js
    detector.js
    mapper.js
    generator.js
    executor.js
    observer.js
    adapters.js
    report.js
    constants.js
  shared/
    storage.js
    config.js
    locales.js
    utils.js
  options/
    options.html
    options.js
  .agents/
    ...
```

Note:

- `options/` can remain mostly stubbed in Phase 1 if needed, but the path should exist in the design.
- We do not need to fully migrate files in one shot if we prefer an incremental cutover.

## Phase 1 Architectural Principles

### 1. Separate detection from generation

The engine should first understand what a field is, then decide what value to generate. This keeps future profile-based values and multilingual random generators easy to plug in.

### 2. Remove business-specific hardcoding

Generic extension logic should not include product- or client-specific rules such as special handling for a single dropdown option.

### 3. Prefer configuration over embedded conditions

Blocked selectors, keyword aliases, and site-specific overrides should move toward config-driven rules.

### 4. Track confidence

If the engine is unsure, it should mark the field as low confidence instead of silently guessing.

### 5. Be safe by default

Do not overwrite disabled, readonly, hidden, or already-completed fields unless explicitly allowed by a later user option.

### 6. Keep language and locale separate

Future multilingual support should distinguish:

- locale formatting: phone, address, zip/postal, date style
- content language: names, city names, sentence generation

That distinction matters later for use cases like:

- English values formatted for India
- Spanish names and labels for LATAM testing
- Arabic or Hindi language datasets in later stages

## Core Modules

### `detector.js`

Responsibility:

- collect candidate fields
- extract attributes and relationships
- identify component type

Output per field:

```js
{
  id,
  elementType,
  componentKind,
  inputType,
  name,
  label,
  placeholder,
  ariaLabel,
  autocomplete,
  required,
  disabled,
  readOnly,
  visible,
  options,
  pathHint
}
```

### `mapper.js`

Responsibility:

- map detected fields to semantic field types
- compute confidence score
- expose matched reason metadata

Examples of semantic field types:

- `first_name`
- `last_name`
- `full_name`
- `email`
- `phone`
- `address_line_1`
- `city`
- `state`
- `postal_code`
- `company`
- `job_title`
- `password`
- `date`
- `url`
- `notes`

### `generator.js`

Responsibility:

- generate values based on semantic type
- centralize random data behavior
- prepare for locale/language expansion

Phase 1 should introduce an interface like:

```js
generateValue({
  fieldType,
  locale,
  language,
  constraints,
  profileValue
})
```

In Phase 1, `language` can default to `en`, but the interface should already exist.

### `executor.js`

Responsibility:

- apply values safely
- dispatch correct events
- support common HTML inputs and targeted custom controls
- avoid refilling the same element repeatedly unless needed

### `observer.js`

Responsibility:

- watch for newly inserted fields
- debounce reprocessing
- support modern SPA and modal behavior

### `report.js`

Responsibility:

- summarize what happened during a run
- expose counts like filled, skipped, blocked, low-confidence

This becomes very useful in Phase 3 when adding a debug UI.

## Detection Strategy for Phase 1

The detector should extract signals from:

- `name`
- `id`
- `type`
- `placeholder`
- `aria-label`
- associated `<label>`
- wrapping text context
- `autocomplete`
- select option text
- control role attributes

Field matching should be weighted, not binary.

Example scoring model:

```text
label match         0.35
name/id match       0.25
autocomplete match  0.20
type compatibility  0.10
placeholder match   0.10
```

The exact weights can evolve, but Phase 1 should adopt the pattern.

## Scope for Supported Elements in Phase 1

Must support:

- `input`
- `textarea`
- native `select`
- contenteditable
- common combobox/listbox patterns

Supported carefully, not promiscuously:

- React Select
- Radix UI / shadcn-style comboboxes
- common custom listbox patterns

Explicit non-goals for Phase 1:

- CAPTCHA
- file uploads
- rich business workflow automation
- AI-assisted mapping
- exhaustive support for every proprietary UI kit

## Locale and Future Language Strategy

Phase 1 should introduce a structured config like:

```js
{
  locale: "en-US",
  language: "en",
  region: "US"
}
```

Why:

- `locale` controls formatting rules
- `language` controls text dataset generation
- `region` helps with address and phone defaults

Later examples:

- `en-US` / `en` / `US`
- `en-IN` / `en` / `IN`
- `es-MX` / `es` / `MX`
- `hi-IN` / `hi` / `IN`

Phase 1 does not need to fully ship all languages, but it must not hardcode assumptions that make that impossible later.

## Popup and UI Plan for Phase 1

The popup should remain simple but evolve slightly:

- fill action
- locale selector
- future-ready language selector placeholder or hidden config support
- optional mode toggle placeholder for later options

We do not need full profile management in the popup yet.

## Storage Design

Use `chrome.storage.local` for now.

Phase 1 storage keys should be simple and stable:

- `fillSettings`
- `engineConfig`
- `lastRunReport`

Avoid locking storage to a Phase 1-only shape that breaks when profiles arrive later.

## Suggested Phase 1 Deliverables

### Iteration 1

- create new module structure
- move popup logic into a dedicated folder
- introduce shared config and storage helpers

### Iteration 2

- implement field detector
- implement normalized field model
- add associated label extraction

### Iteration 3

- implement mapper with confidence scoring
- add semantic field taxonomy

### Iteration 4

- implement generator abstraction
- fix locale handling properly
- remove current hardcoded domain/business behavior

### Iteration 5

- implement fill executor and field event handling
- add safe-skip logic for readonly, disabled, and hidden fields

### Iteration 6

- implement `MutationObserver` dynamic support
- add fill report
- validate on a few representative forms

## Risks and Guardrails

### Risk: Overengineering too early

Guardrail:

- keep Phase 1 in vanilla JS
- favor small modules over framework migration

### Risk: Breaking currently working sites

Guardrail:

- preserve current behavior where it is generic and useful
- remove only clearly project-specific logic

### Risk: Multilingual support becoming bolted-on later

Guardrail:

- add `language` to the generator contract now
- keep locale and language separate from the beginning

## Definition of Done for Phase 1

Phase 1 is complete when:

- the extension reliably fills common forms better than the current version
- locale handling is accurate and no longer ignored
- there is no single giant fill file driving everything
- dynamic forms are processed without relying only on fixed retry timers
- hardcoded one-off business rules are removed from generic logic
- the engine can expose structured results for future debugging
- the codebase is ready for Phase 2 profile and rules work

## Recommended Immediate Next Step

Start with the file structure refactor and storage/config primitives first, then move the detection pipeline over before touching advanced custom-component logic.
