# Local Test Pages

These pages give you stable local scenarios for validating the extension after each iteration.

## Files

- `simple-form.html`: plain HTML smoke test
- `dynamic-form.html`: delayed fields plus custom combobox test

## How to Use

1. Open `chrome://extensions/`
2. Reload the unpacked extension
3. Open either local HTML file in Chrome
4. Trigger the extension popup and click `Fill Form`

## What to Check

### `simple-form.html`

- basic fields are filled
- textarea is filled
- select is chosen
- checkbox/radio behavior still works

### `dynamic-form.html`

- request type combobox can be filled
- delayed fields appear after selection
- delayed fields are filled on retry
- language buttons `EN`, `ES`, `PT` are not changed accidentally
