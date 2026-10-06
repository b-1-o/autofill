# Autofill — Chrome Extension for Job Applications

## The Problem

Applying to 10+ jobs daily means re-typing the same data into 10 different ATS platforms — each with different field names, IDs, and React-controlled inputs.

## The Solution

A Manifest V3 extension that stores your profile once, then fills recognized application fields with one click. It handles React-controlled inputs, iframes, dynamically loaded fields, and select/radio/checkbox elements.

## The Result

Target result: reduce a typical application workflow from ~15 minutes toward ~2 minutes per form.

Replace the target with measured results after real testing.

## Demo

![Demo](./assets/demo.gif)

(placeholder — GIF will be added)

## Features

- Profile stored locally via chrome.storage.sync
- One-click fill on application forms
- React-controlled input handling (native setter + event dispatch)
- Dynamic form support via MutationObserver
- iframe support for embedded application forms
- Extensible field mapping with aliases per field
- Detailed fill report with filled/unfilled fields
- Manual review before submission
- Cover-letter template stored with the profile
- Optional Vercel serverless endpoint for the cover-letter placeholder
- No automatic submission
- CAPTCHA and file inputs skipped by design

The normal autofill path does not require a backend. The optional cover-letter action sends its request to the configured endpoint only when the user explicitly clicks Generate Cover Letter.

## Tech Stack

JavaScript · Chrome Extension API (Manifest V3) · chrome.storage.sync · MutationObserver · Vercel Serverless

## Installation

1. Clone this repo
2. Open chrome://extensions
3. Enable Developer mode (top right)
4. Click "Load unpacked" → select this folder
5. Pin the extension to your toolbar

## How it works

~~~text
Popup
  ↓
chrome.storage.sync
  ↓
content.js
  ↓
field-map + field-finder + field-setter
  ↓
form-filler
  ↓
DOM
~~~

1. User saves their profile in the popup → stored in chrome.storage.sync
2. User opens an application form → content scripts load automatically
3. User clicks Fill Form → popup sends FILL_FORM to the content script
4. field-finder.js locates fields through labels, names, IDs, placeholders, ARIA metadata, and aliases
5. field-setter.js fills native inputs, selects, radios, and checkboxes while preserving React-controlled input behavior
6. form-filler.js creates the fill report and keeps watching dynamic DOM changes for a short period
7. The popup merges main-frame and iframe reports
8. The user reviews the form and submits it manually

## Testing

Tested on:

- LinkedIn Easy Apply — X/Y fields
- Jobright — X/Y fields
- Greenhouse — X/Y fields
- Lever — X/Y fields

(placeholder — fill after real testing)

Known limitations:

- Workday: custom widgets and some dropdowns may require manual entry
- Ashby: shadow DOM controls are not supported yet
- Custom autocomplete/combobox components may require manual entry
- CAPTCHA and file inputs are intentionally skipped
- Real browser testing is still required before making platform support claims

## Roadmap

- [ ] AI-generated cover letters with OpenAI + Vercel
- [ ] Per-platform field mappings
- [ ] Application history log in local extension storage
- [ ] Chrome Web Store publication

## Privacy

The normal autofill flow does not send profile data to a backend. The profile is stored with Chrome extension storage and synced through Chrome Sync.

The optional cover-letter action is different: when the user clicks Generate Cover Letter, the extension sends the question, visible job-description text, and profile payload to the configured endpoint.

Do not store passwords, API keys, session tokens, or other secrets in extension storage.

## AI endpoint

The repository includes api/generate.js.

Request:

~~~json
{
  "question": "Write a concise, truthful cover letter for this job.",
  "jobDescription": "...",
  "profile": {}
}
~~~

Response:

~~~json
{
  "answer": "AI endpoint placeholder. Connect OpenAI API here."
}
~~~

The current function is intentionally a stub. The real OpenAI request belongs inside the Vercel function so the API key stays server-side.

### Local endpoint

Run the Vercel function locally, then the extension uses:

~~~text
http://localhost:3000/api/generate
~~~

### Production endpoint

Set DEPLOYED_VERCEL_URL in popup/popup.js to the deployed Vercel project URL, without a trailing slash. Then update host_permissions in manifest.json to that exact hostname before publishing.

Browser extension popup code cannot read Vercel's server-side process.env.VERCEL_URL directly, so the project uses an explicit deployment URL constant plus a localhost fallback instead.

## Assets

- assets/demo.gif — short product demo
- assets/popup.png — popup screenshot
- assets/README.md — recording instructions

## License

MIT
