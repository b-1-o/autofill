const DEFAULT_PROFILE = {
  firstName: "Erik",
  lastName: "Ghabuzyan",
  email: "eghabuzyan@gmail.com",
  phone: "7472798744",
  address: "12605 Barbara Ann St",
  city: "Los Angeles",
  state: "CA",
  zip: "91605",
  linkedin: "https://www.linkedin.com/in/b1o",
  github: "https://github.com/b-1-o",
  portfolio: "https://b-1-o.github.io/myUI",
  jobTitle: "Frontend Developer · UI Engineer",
  summary: "Front-End Developer with hands-on experience building modern, responsive and high-performance web applications. Strong in React, TypeScript, JavaScript and Next.js, with a focus on UI engineering, responsive design, accessibility, performance optimization and clean, maintainable code. Comfortable integrating REST APIs, working with PostgreSQL, and shipping to production on Vercel. Open to Frontend Developer, React Developer, UI Engineer and Web Developer roles.",
  workAuthorized: "Yes",
  sponsorship: "No",
  disability: "No",
  gender: "Male",
  lgbtq: "No",
  veteran: "No",
  race: "White",
  ethnicity: "No",
  orientation: "Heterosexual",
  pronouns: "He/Him",
  sensitive: false
};

const FIELDS = [
  "firstName","lastName","email","phone","address","city","state","zip",
  "linkedin","github","portfolio","jobTitle"
];

function $(id) {
  return document.getElementById(id);
}

async function loadProfile() {
  const { profile } = await chrome.storage.local.get("profile");
  const merged = { ...DEFAULT_PROFILE, ...(profile || {}) };

  for (const field of FIELDS) {
    $(field).value = merged[field] || "";
  }
  $("sensitiveToggle").checked = Boolean(merged.sensitive);
}

async function saveProfile() {
  const { profile } = await chrome.storage.local.get("profile");
  const next = { ...DEFAULT_PROFILE, ...(profile || {}) };

  for (const field of FIELDS) {
    next[field] = $(field).value.trim();
  }

  next.sensitive = $("sensitiveToggle").checked;
  await chrome.storage.local.set({ profile: next });
  $("resultText").textContent = "Profile saved locally.";
}

async function getProfile() {
  const { profile } = await chrome.storage.local.get("profile");
  return { ...DEFAULT_PROFILE, ...(profile || {}), sensitive: $("sensitiveToggle").checked };
}

function setStatus(ok) {
  $("statusDot").style.background = ok ? "#e7e7eb" : "#a35b5b";
}

async function sendToCurrentTab(type) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab.");

  return chrome.tabs.sendMessage(tab.id, type === "autofill"
    ? { type: "autofill", profile: await getProfile() }
    : { type: "scan" }
  );
}

$("autofillBtn").addEventListener("click", async () => {
  try {
    await saveProfile();
    const result = await sendToCurrentTab("autofill");
    $("resultText").textContent = result?.message || "Done.";
    setStatus(true);
  } catch (error) {
    $("resultText").textContent = "Open a normal web page with an application form, then try again.";
    setStatus(false);
  }
});

$("scanBtn").addEventListener("click", async () => {
  try {
    const result = await sendToCurrentTab("scan");
    $("resultText").textContent = result?.message || "Scan complete.";
    $("pageHint").textContent = result?.page || "Application page detected.";
    setStatus(true);
  } catch (error) {
    $("resultText").textContent = "This page does not expose an accessible content script.";
    setStatus(false);
  }
});

$("saveBtn").addEventListener("click", saveProfile);

$("sensitiveToggle").addEventListener("change", saveProfile);

document.querySelectorAll("[data-download]").forEach((button) => {
  button.addEventListener("click", async () => {
    const key = button.dataset.download;
    button.textContent = "…";
    try {
      const result = await chrome.runtime.sendMessage({ type: "download-file", key });
      if (!result?.ok) throw new Error(result?.error || "Download failed");
      button.textContent = "Saved";
    } catch {
      button.textContent = "Error";
    }
    setTimeout(() => { button.textContent = "Download"; }, 1200);
  });
});

loadProfile();
