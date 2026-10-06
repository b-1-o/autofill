# Autofill — Chrome Extension for Job Applications

Review-first Chrome extension for quickly filling common job-application forms across modern ATS platforms.

## Problem

Applying to 10+ jobs daily means re-typing the same information into different ATS platforms, each with different field names, IDs, markup, React-controlled inputs, and loading behavior.

## Solution

A Manifest V3 extension that stores a job-application profile once, then fills recognized application fields with one click.

The MVP is designed around real-world form problems:

- React-controlled inputs
- dynamically rendered fields
- embedded iframes
- select, radio, and checkbox controls
- inconsistent labels and field attributes
- ATS-specific hostnames

## Result

Target benchmark: reduce a typical application workflow from roughly 15 minutes toward roughly 2 minutes per form.

This is intentionally a benchmark target until measured across real applications. Replace it with measured X/Y results and actual timing after testing.

## Demo

![Demo](./assets/demo.gif)

Placeholder: add assets/demo.gif after recording the final ~15 second product demo.

## Features

- Profile stored locally through chrome.storage.sync
- One-click form filling
- React-controlled input handling with native value setters and event dispatch
- Dynamic form support through MutationObserver
- Embedded iframe support for applications such as Workday
- Extensible FIELD_MAP alias dictionary
- ATS platform detection for Greenhouse, Lever, Workday, Ashby, LinkedIn, and Jobright
- Detailed fill report with filled/unfilled fields
- Manual review before submission
- Optional cover-letter template storage
- AI cover-letter integration point through a Vercel serverless endpoint
- No automatic form submission
- No CAPTCHA solving
- No external analytics in the extension MVP

### Data flow

The normal autofill path stays local to the browser:

Popup → chrome.storage.sync → content script → DOM

The optional AI action is different: when the user explicitly presses Generate with AI, the configured Vercel endpoint receives the selected prompt/profile/job-description payload.

## Tech Stack

- JavaScript
- Chrome Extension API
- Manifest V3
- chrome.storage.sync
- chrome.tabs.sendMessage
- chrome.scripting.executeScript
- MutationObserver
- Vanilla CSS
- Vercel Node.js Serverless Function
- Node.js 24.x

## Installation

1. Clone this repo.
2. Open chrome://extensions/ in Chrome or brave://extensions/ in Brave.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the project root.
6. Open the extension popup.
7. Enter your profile and click Save.

## How it works

Popup → chrome.storage.sync → content.js → field modules → DOM

The popup saves the profile in Chrome Sync storage.
Fill Form sends FILL_FORM to the current tab main frame with chrome.tabs.sendMessage.
The popup also uses chrome.scripting.executeScript with allFrames: true to trigger filling inside embedded frames.
field-map.js provides aliases.
field-finder.js normalizes and ranks labels, names, IDs, placeholders, and ARIA metadata.
field-setter.js handles React-safe values, selects, radio buttons, and checkboxes.
platform-detector.js identifies the current ATS by hostname.
content.js orchestrates filling and returns a detailed field report.
MutationObserver watches for newly rendered controls for a short window after Fill Form.
The user reviews the completed form and submits it manually.

Chrome's Scripting API supports allFrames: true and returns one result per frame that succeeds.

## Supported platforms

Initial platform detection covers:

- LinkedIn
- Jobright
- Greenhouse
- Lever
- Workday
- Ashby

The host permissions and content scripts also include additional job platforms and ATS providers for future field mapping work.

A specific form may still require manual entry when it uses custom web components, custom comboboxes, shadow DOM, unusual markup, cross-origin restrictions, CAPTCHA, or platform-specific widgets.

## Testing

Tested on:

- LinkedIn Easy Apply — X/Y fields
- Jobright — X/Y fields
- Greenhouse — X/Y fields
- Lever — X/Y fields

Additional manual checks:

- Workday — iframe behavior
- Ashby — standard DOM fields
- Dynamic form — fields inserted after initial render
- Select / radio / checkbox fields
- Existing values — Fill Form must not overwrite deliberate user input

### Known limitations

- Workday: some custom widgets and dropdowns still require manual entry.
- Ashby: shadow DOM controls are not supported yet.
- Custom autocomplete/combobox components may require platform-specific adapters.
- File inputs are intentionally left for manual upload.
- CAPTCHA and submission are intentionally outside the scope of the MVP.

## Roadmap

- [ ] AI-generated cover letters with OpenAI through Vercel
- [ ] Per-platform field mappings
- [ ] Stronger Workday-specific controls
- [ ] Shadow DOM support where technically accessible
- [ ] Guarded screening-question assistance
- [ ] Local application history
- [ ] Field confidence scoring
- [ ] Automatic ATS/platform detection improvements
- [ ] Chrome Web Store release

## AI endpoint

The repository contains a small Vercel Serverless Function at api/generate.js.

The current implementation is intentionally a stub.

Request:

POST /api/generate

Body:

{
  question: "Write a concise cover letter for this role.",
  jobDescription: "...",
  profile: {}
}

Response:

{
  answer: "Based on my experience with React, TypeScript...",
  stub: true
}

### Real OpenAI integration

Recommended production architecture:

Chrome Extension → Vercel Function → OpenAI API

The OpenAI API key should live only in Vercel environment variables. It should never be shipped inside the extension.

## Privacy

The autofill MVP has no external backend, analytics SDK, or tracking service.

The profile is stored through Chrome extension storage. Chrome documents storage.sync as extension storage for synchronized settings and notes that local and sync storage are not encrypted, so passwords, API keys, session tokens, and other secrets should not be stored there.

The AI feature is opt-in. When the user clicks Generate with AI, the extension sends the configured request payload to the configured Vercel endpoint.

## Repository hygiene

Private application documents should not be committed to this repository.

The .gitignore excludes:

- *.pdf
- *.zip
- node_modules/
- .DS_Store
- *.log

Demo-only media belongs under assets/.

## License

MIT