const DOCUMENTS = {
  resume: {
    path: "assets/Erik_Ghabuzyan_Frontend_Developer_CV.pdf",
    filename: "Erik_Ghabuzyan_Frontend_Developer_CV.pdf"
  },
  cover: {
    path: "assets/Erik_Ghabuzyan_Cover_Letter.pdf",
    filename: "Erik_Ghabuzyan_Cover_Letter.pdf"
  },
  coverMindsize: {
    path: "assets/Erik_Ghabuzyan_Cover_Letter_Mindsize.pdf",
    filename: "Erik_Ghabuzyan_Cover_Letter_Mindsize.pdf"
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action !== "download") return;

  const document = DOCUMENTS[message.key] || DOCUMENTS.resume;

  chrome.downloads.download({
    url: chrome.runtime.getURL(document.path),
    filename: document.filename,
    saveAs: true
  })
    .then((downloadId) => sendResponse({ ok: true, downloadId }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));

  return true;
});