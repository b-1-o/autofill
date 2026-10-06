# b1o Autofill

Minimal Manifest V3 browser extension for filling common job-application fields quickly.

## MVP

- Profile stored in `chrome.storage.sync`.
- Simple popup with **Fill Form** and **Edit Profile**.
- Field matching by `label`, `name`, `id`, `placeholder`, and accessibility metadata.
- React-safe input updates using the native value setter plus `input` / `change` events.
- `select`, radio, and checkbox support.
- `all_frames: true` so matching content scripts can run in embedded application frames.
- `MutationObserver` watches briefly after Fill for fields that appear asynchronously.
- CV and cover-letter downloads from the bundled `assets/` files.
- No automatic submit.

Chrome's MV3 `scripting` API can inject a script into all frames, and this project keeps the extension content-script based for the MVP. citeturn131938search0

Chrome documents `storage.sync` as cross-browser Chrome Sync storage with roughly 100 KB total capacity and 8 KB per item, which is plenty for a small text profile. citeturn131938search1

## Install in Chrome / Brave

1. Open `chrome://extensions/` or `brave://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the repository folder.
5. Pin **b1o Autofill**.
6. Open **⚙ Edit Profile**, enter your values, and click **Save Profile**.

## Usage

1. Open a job application page.
2. Open the extension.
3. Press **Fill Form**.
4. Review every filled field and screening question.
5. Upload the requested CV/cover letter.
6. Submit manually.

## Profile

The popup stores the profile in `chrome.storage.sync` so Chrome can sync it between signed-in browser instances.

Do not store passwords, API keys, session tokens, or other confidential secrets in the profile. Chrome notes that sync/local extension storage is not encrypted. citeturn131938search2

## File layout

```
autofill/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   └── content.js
├── background/
│   └── service-worker.js
└── assets/
```

## Scope

This is intentionally an MVP. It does not auto-submit, solve CAPTCHAs, bypass website protections, or invent answers to screening questions.