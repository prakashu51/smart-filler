# Feature Release Testing Strategy

## Goal

Validate each feature release with a repeatable mix of smoke checks, regression checks, and scenario-specific checks before committing and before tagging a release.

## Testing Cadence

### After every coding iteration

Run a fast local smoke pass:

- reload extension in `chrome://extensions/`
- open popup and confirm it loads without console errors
- run autofill on at least one simple HTML form
- run autofill on one dynamic or framework-heavy form
- confirm no obvious regression in current supported controls

### After every feature release

Run a broader regression pass:

- standard inputs
- textarea
- native select
- custom combobox
- dynamic fields
- modal form
- locale switching
- fields that should be skipped

## Recommended Test Matrix

Keep a small, stable matrix and expand only when needed.

### Tier 1: Smoke

- simple registration form
- contact form
- checkout-style address form

### Tier 2: Framework and dynamic behavior

- React-controlled form
- Radix or shadcn combobox form
- modal dialog form
- form with delayed field rendering

### Tier 3: Edge cases

- readonly and disabled fields
- pre-filled fields
- language selector in header
- multiple forms on the same page

## Release Checklist

For each feature release, capture:

- feature being released
- expected behavior
- affected modules
- tested scenarios
- known gaps

## Suggested Manual Test Cases

### Autofill core

- fills text, email, phone, textarea, select, checkbox, radio
- dispatches `input` and `change` events where expected
- does not crash on pages without forms

### Safety

- does not fill hidden, disabled, or readonly fields once that behavior is implemented
- does not alter obvious language selectors
- does not repeatedly refill the same field unless intended

### Locale and future language support

- switching locale updates generated formatting as expected
- future language support should verify generated names and text samples, not just formats

## How to Work Per Feature

1. build the feature in a small iteration
2. smoke test immediately
3. record the result in `.agents/iterations/`
4. commit only when the feature works and old core paths still pass smoke tests
5. every few iterations, run the broader regression matrix

## Commit Guidance

Prefer one commit per stable iteration, not one commit per file change.

Good commit timing:

- scaffold complete and extension still loads
- detector complete and smoke-tested
- mapper complete and smoke-tested
- generator upgrade complete and smoke-tested
- observer or dynamic behavior upgrade complete and smoke-tested

Avoid committing in the middle of a broken refactor unless you intentionally want a checkpoint branch.
