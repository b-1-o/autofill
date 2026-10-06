const STORAGE_KEY = "profile";

const DEFAULT_PROFILE = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  location: "",
  company: "",
  linkedin: "",
  github: "",
  portfolio: "",
  yearsOfExperience: "",
  authorizedToWork: "",
  requiresSponsorship: ""
};

const FIELD_IDS = Object.keys(DEFAULT_PROFILE);

const $ = (id) => document.getElementById(id);

function setStatus(message, type = "") {
  const status = $("status");
  status.textContent = message;
  status.className = "status" + (type ? " " + type : "");
}

async function loadProfile() {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const profile = {
    ...DEFAULT_PROFILE,
    ...(result[STORAGE_KEY] || {})
  };

  for (const id of FIELD_IDS) {
    const field = $(id);
    if (field) field.value = profile[id] ?? "";
  }
}

function readProfileFromForm() {
  const profile = {};

  for (const id of FIELD_IDS) {
    const field = $(id);
    profile[id] = field ? field.value.trim() : "";
  }

  return profile;
}

async function saveProfile(showStatus = true) {
  const profile = readProfileFromForm();

  await chrome.storage.sync.set({
    [STORAGE_KEY]: profile
  });

  if (showStatus) {
    setStatus("Saved.", "success");
  }

  return profile;
}

async function fillCurrentTab() {
  const fillButton = $("fillButton");
  fillButton.disabled = true;
  setStatus("Filling…");

  try {
    const profile = await saveProfile(false);

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab?.id) {
      throw new Error("No active tab");
    }

    // Main frame: the requested popup -> content-script flow.
    const mainFrameResult = await chrome.tabs.sendMessage(tab.id, {
      type: "FILL_FORM",
      profile
    });

    // Embedded frames: inject a trigger into every frame.
    // The trigger carries no profile data; each frame reads sync storage.
    await chrome.scripting.executeScript({
      target: {
        tabId: tab.id,
        allFrames: true
      },
      files: ["content/trigger-fill.js"]
    });

    const filled = Number(mainFrameResult?.filled || 0);

    setStatus(
      filled > 0
        ? "Filled " + filled + " field" + (filled === 1 ? "" : "s") + ". Review the form."
        : "Filled 0 fields. Check the site's field labels.",
      "success"
    );
  } catch (error) {
    console.error("Autofill failed:", error);
    setStatus(
      "Error: this page may not support extension scripts.",
      "error"
    );
  } finally {
    fillButton.disabled = false;
  }
}

$("saveButton").addEventListener("click", () => {
  saveProfile().catch((error) => {
    console.error("Save failed:", error);
    setStatus("Error: profile was not saved.", "error");
  });
});

$("fillButton").addEventListener("click", fillCurrentTab);

$("coverLetterButton").addEventListener("click", () => {
  console.log("AI cover-letter generation placeholder.");
  setStatus("AI cover-letter generation is not connected yet.");
});

loadProfile().catch((error) => {
  console.error("Profile load failed:", error);
  setStatus("Error: could not load saved profile.", "error");
});
