# b1o Autofill

A lightweight Manifest V3 browser extension for speeding up job applications with a review-first workflow.

## What it does

- Prefills common application fields from a local profile.
- Uses semantic signals from labels, placeholders, `name`, `id`, `aria-label`, and `autocomplete`.
- Works across common ATS-style forms without depending on a single vendor.
- Includes your CV and cover letters from `assets/`.
- Adds a small helper next to detected resume / cover-letter file inputs so the correct PDF can be downloaded quickly.
- Keeps sensitive EEO autofill disabled by default.
- Never clicks a job site's final Submit button.

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

## Recommended flow

1. Open a job application.
2. Click the extension.
3. Click **Scan fields** to see how much of the form is recognized.
4. Click **Autofill this page**.
5. Upload the downloaded CV / cover letter when the site requires a file.
6. Review every answer, especially legal / demographic questions.
7. Submit manually.

## Important limitations

Browsers intentionally protect local file inputs. An extension can download a bundled PDF for you, but it should not silently inject a local file into an employer's file picker. This extension therefore keeps document upload as a visible user action.

Some ATS forms are built with custom components or cross-origin iframes and may expose little information to content scripts. The extension skips fields it cannot identify rather than guessing.

## Profile storage

The profile is stored with `chrome.storage.local` on the browser where the extension is installed. No external server or analytics endpoint is included in this project.

## Development

This repository has no build step. Edit the JS/CSS/HTML directly, then reload the unpacked extension from the extensions page.
