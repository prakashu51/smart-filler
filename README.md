# 🧠 Smart Form Filler

A Chrome Extension that automatically fills web forms with realistic fake data using [Faker.js](https://fakerjs.dev/). Built for developers and QA testers to speed up form testing workflows.

---

## 📦 Features

- ✅ Fills standard HTML form inputs (text, email, phone, password, date, etc.)
- ✅ Supports native HTML `<select>` dropdowns
- ✅ Supports **React Select** components
- ✅ Supports **Radix UI / Shadcn** custom combobox dropdowns (`role="combobox"`)
- ✅ Supports **Material-UI**, **Ant Design**, **Bootstrap** components
- ✅ Fills `<textarea>` fields with meaningful sentences
- ✅ Handles **dynamic forms** — fills new fields that appear after selections
- ✅ Handles **API-loaded dropdowns** with retry logic
- ✅ Supports **modals and dialogs** (`role="dialog"`)
- ✅ Localization support (US English / India)
- ✅ Manual trigger only — does **not** auto-run on every page
- ✅ Skips language/locale selectors to avoid changing website language

---

## 🖥️ Installation (Local / Developer Mode)

1. **Clone or download** this repository:
   ```bash
   git clone git@github.com:prakashu51/smart-filler.git
   ```

2. Open **Google Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

3. Enable **Developer Mode** (toggle in the top-right corner)

4. Click **"Load unpacked"** and select the cloned folder

5. The **Smart Form Filler** icon will appear in your Chrome toolbar

---

## 🚀 Usage

1. Navigate to any webpage with a form
2. Click the **Smart Form Filler** icon in the Chrome toolbar
3. Select your preferred **locale** (US or India)
4. Click **"Fill Form"**
5. The extension will automatically fill all detected form fields

---

## 🌍 Localization

| Option | Locale | Description |
|--------|--------|-------------|
| [US] United States | `en` | English names, addresses, phone numbers |
| [IN] India | `en_IND` | Indian names, addresses, phone formats |

---

## 📋 Supported Form Elements

### Standard HTML Inputs

| Input Type | Generated Data |
|------------|---------------|
| `text` (name) | Full name / First name / Last name |
| `text` (address) | Street address |
| `text` (city) | City name |
| `text` (zip/pincode) | ZIP / Postal code |
| `text` (company) | Company name |
| `text` (job/title) | Job title |
| `email` | Random email address |
| `tel` / `number` (phone) | 10-digit phone number |
| `password` | Secure random password |
| `date` | Past date (up to 20 years) |
| `datetime-local` | Past datetime |
| `time` | Random time |
| `url` | Random URL |
| `color` | Random hex color |
| `range` | Random value within min/max |
| `checkbox` | Random checked/unchecked |
| `radio` | Checked |
| `textarea` | 2 meaningful sentences |

### Custom / Framework Components

| Component Type | Detection Method |
|---------------|-----------------|
| Native `<select>` | Standard HTML select element |
| React Select | `.react-select__control` class |
| Radix UI / Shadcn | `button[role="combobox"]` |
| Material-UI Select | `.MuiSelect-select` class |
| Ant Design Select | `.ant-select-selector` class |
| Bootstrap Dropdown | `.dropdown-toggle` class |
| Contenteditable | `[contenteditable="true"]` attribute |

---

## ⚙️ How It Works

### Script Injection
The extension injects scripts **only when you click "Fill Form"** — it does not run automatically on page load.

```
Popup Click → Inject faker.min.js → Inject content.js → Fill Form
```

### Dynamic Form Handling
Many modern forms reveal new fields after a selection is made (e.g., selecting a "Request" type reveals a "Lab" dropdown). The extension handles this with a **3-pass retry strategy**:

| Pass | Delay | Purpose |
|------|-------|---------|
| 1st | 500ms | Initial fill on page load |
| 2nd | 3000ms | Fill newly appeared dynamic fields |
| 3rd | 5000ms | Fill slow API-loaded fields |

### Dropdown Selection Strategy
- All dropdowns → **First available option** selected
- "Surgical phase" dropdown → Specifically selects **"Surgery with X-Guide®"** (index 3)
- Language/locale selectors → **Blocked** (never touched)

### Language Selector Protection
The extension automatically detects and skips language selectors by checking:
- Button text (e.g., "EN", "PT", "ES")
- Element ID/class containing "language", "locale", "lang"
- Buttons located inside `<header>` or `<nav>` elements

---

## 📁 Project Structure

```
smart-filler/
├── manifest.json        # Chrome extension manifest (v3)
├── content.js           # Main form filling logic
├── popup.html           # Extension popup UI
├── popup.js             # Popup interaction logic
├── styles.css           # Popup styles
├── faker.min.js         # Faker.js library (v5.5.3)
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🔒 Permissions

| Permission | Reason |
|------------|--------|
| `storage` | Save selected locale preference |
| `activeTab` | Access the current active tab |
| `scripting` | Inject scripts into the page |

---

## 🧪 Tested On

- Standard HTML forms
- React forms with controlled components
- Radix UI / Shadcn UI components
- Forms with API-loaded dropdown options
- Modal/dialog forms
- Single Page Applications (React, Next.js)

---

## ⚠️ Known Limitations

- Cannot fill **CAPTCHA** fields
- Cannot fill **file upload** inputs
- Some heavily obfuscated custom components may not be detected
- Forms behind authentication walls require you to be logged in first

---

## 🛠️ Development

To modify the extension:

1. Edit the relevant files (`content.js`, `popup.js`, etc.)
2. Go to `chrome://extensions/`
3. Click the **refresh icon** on the Smart Form Filler card
4. Test on your target page

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**prakashu51**  
GitHub: [@prakashu51](https://github.com/prakashu51)
