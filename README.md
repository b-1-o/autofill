# b1o Autofill

A lightweight Manifest V3 browser extension for speeding up job applications with a review-first workflow.

## What it does

- Prefills common application fields from a local profile.
- Detects fields through labels, placeholders, `name`, `id`, `aria-label`, `autocomplete`, and nearby form text.
- Covers contact fields plus professional fields such as company, role, skills, summary, and experience description.
- Includes your CV and cover letters from `assets/`.
- Adds a small helper next to detected resume / cover-letter file inputs so the correct PDF can be downloaded quickly.
- Keeps optional EEO autofill disabled by default.
- Never clicks a job site's final Submit button.

## Privacy

Because this repository is public, personal contact details and EEO values are **not hard-coded into the GitHub source**. Enter them once in the extension popup and they are stored with `chrome.storage.local` on your browser.

The repository does not include an external backend, analytics endpoint, or profile-sync service.

## Included documents

- `assets/Erik_Ghabuzyan_Frontend_Developer_CV.pdf`
- `assets/Erik_G_Frontend_Developer_CV.pdf`
- `assets/Erik_Ghabuzyan_Cover_Letter.pdf`
- `assets/Erik_Ghabuzyan_Cover_Letter_Mindsize.pdf`

## Install locally in Chrome / Brave

1. Open `chrome://extensions` (Brave: `brave://extensions`).
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the repository folder.
5. Pin **b1o Autofill**.
6. Enter your contact information once and click **Save locally**.

## Recommended flow

1. Open a job application.
2. Click the extension.
3. Click **Scan fields**.
4. Click **Autofill this page**.
5. Download the appropriate CV / cover letter and upload it when the site requires a file.
6. Review every answer.
7. Submit manually.

## Why uploads stay manual

Browsers protect local file inputs. An extension can download a bundled PDF quickly, but it should not silently inject a local file into an employer's file picker. This project therefore keeps document upload visible and user-controlled.

## Limitations

Custom React/Vue controls, cross-origin embedded frames, CAPTCHA flows, and vendor-specific widgets may require manual entry. The extension skips fields it cannot identify rather than guessing.

## Development

There is no build step. Edit the JS/CSS/HTML directly, then reload the unpacked extension from the extensions page.
