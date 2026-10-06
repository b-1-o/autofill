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
  authorizedToWork: "",
  requiresSponsorship: ""
};

const INPUTS = Object.keys(DEFAULT_PROFILE);
const $ = (id) => document.getElementById(id);

async function getProfile() {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return { ...DEFAULT_PROFILE, ...(result[STORAGE_KEY] || {}) };
}

function renderProfile(profile) {
  $("profileName").textContent =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Your profile";
  $("profileEmail").textContent =
    profile.email || "Add your details in Edit Profile";

  for (const id of INPUTS) $(id).value = profile[id] || "";
}

function setStatus(message) {
  $("status").textContent = message;
}

async function saveProfile() {
  const profile = {};
  for (const id of INPUTS) profile[id] = $(id).value.trim();

  await chrome.storage.sync.set({ [STORAGE_KEY]: profile });
  renderProfile(profile);
  setStatus("Profile saved.");
}

async function fillCurrentTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id) {
    setStatus("No active tab.");
    return;
  }

  try {
    const profile = await getProfile();

    const response = await chrome.runtime.sendMessage({
      action: "fill",
      tabId: tab.id,
      profile
    });

    const count = Number(response?.filled || 0);
    setStatus(
      count
        ? `${count} field(s) filled. Review the form.`
        : "No recognizable empty fields found."
    );
  } catch {
    setStatus("This page cannot be autofilled.");
  }
}

$("fillButton").addEventListener("click", fillCurrentTab);

$("editProfile").addEventListener("click", () => {
  $("profileEditor").classList.toggle("hidden");
});

$("saveProfile").addEventListener("click", saveProfile);

document.querySelectorAll("[data-file]").forEach((button) => {
  button.addEventListener("click", async () => {
    button.textContent = "…";

    try {
      const response = await chrome.runtime.sendMessage({
        action: "download",
        key: button.dataset.file
      });

      if (!response?.ok) throw new Error(response?.error || "Download failed");
      button.textContent = "Saved";
    } catch {
      button.textContent = "Error";
    }

    setTimeout(() => {
      button.textContent = "Get";
    }, 1000);
  });
});

(async () => {
  renderProfile(await getProfile());
})();