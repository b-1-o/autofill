// Injected into every frame by popup.js.
// No personal profile data is passed through this script.

if (window.top !== window.self) {
  document.dispatchEvent(new Event("B1O_AUTOFILL_REQUEST"));
}
