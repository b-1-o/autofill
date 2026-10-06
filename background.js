const FILES = {
  resume: {
    file: "assets/Erik_Ghabuzyan_Frontend_Developer_CV.pdf",
    name: "Erik_Ghabuzyan_Frontend_Developer_CV.pdf"
  },
  resumeShort: {
    file: "assets/Erik_G_Frontend_Developer_CV.pdf",
    name: "Erik_G_Frontend_Developer_CV.pdf"
  },
  cover: {
    file: "assets/Erik_Ghabuzyan_Cover_Letter.pdf",
    name: "Erik_Ghabuzyan_Cover_Letter.pdf"
  },
  coverMindsize: {
    file: "assets/Erik_Ghabuzyan_Cover_Letter_Mindsize.pdf",
    name: "Erik_Ghabuzyan_Cover_Letter_Mindsize.pdf"
  }
};

function extensionFileUrl(file) {
  return chrome.runtime.getURL(file);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "download-file") return;

  const entry = FILES[message.key] || FILES.resume;

  chrome.downloads.download({
    url: extensionFileUrl(entry.file),
    filename: entry.name,
    saveAs: true
  })
    .then((downloadId) => sendResponse({ ok: true, downloadId }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));

  return true;
});
