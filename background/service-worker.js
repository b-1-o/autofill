chrome.runtime.onInstalled.addListener((details) => {
  console.log("Autofill installed:", details.reason);
});
