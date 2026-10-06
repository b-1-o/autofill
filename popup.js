const DEFAULT_PROFILE = {
  firstName: "Erik",
  lastName: "Ghabuzyan",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  linkedin: "https://www.linkedin.com/in/b1o",
  github: "https://github.com/b-1-o",
  portfolio: "https://b-1-o.github.io/myUI",
  jobTitle: "Frontend Developer · UI Engineer",
  company: "Self Employed",
  experienceTitle: "Freelance Web Developer",
  experienceDates: "2025-01 — Present",
  skills: "JavaScript (ES6+), TypeScript, HTML5, CSS3, React.js, Next.js, Vite, Node.js, Tailwind CSS, CSS Modules, Framer Motion, Figma, REST APIs, PostgreSQL, Git, GitHub, Vercel, ESLint, Prettier, Accessibility (a11y), Responsive Web Design, UI/UX, API Integration",
  summary: "Front-End Developer with hands-on experience building modern, responsive and high-performance web applications. Strong in React, TypeScript, JavaScript and Next.js, with a focus on UI engineering, responsive design, accessibility, performance optimization and clean, maintainable code. Comfortable integrating REST APIs, working with PostgreSQL, and shipping to production on Vercel. Open to Frontend Developer, React Developer, UI Engineer and Web Developer roles.",
  experienceDescription: "Designed and developed responsive websites and web applications for personal, portfolio and client-focused projects. Built modern front-end interfaces using React, TypeScript, JavaScript, HTML and CSS. Integrated third-party APIs and external services into production applications. Deployed and maintained applications on Vercel and GitHub Pages; version control with Git & GitHub. Optimized responsive layouts, animations, loading performance and mobile interactions. Focused on clean UI, accessibility (a11y), cross-browser compatibility and maintainable frontend architecture.",
  workAuthorized: "",
  sponsorship: "",
  disability: "",
  gender: "",
  lgbtq: "",
  veteran: "",
  race: "",
  ethnicity: "",
  orientation: "",
  pronouns: "",
  sensitive: false
};

const FIELDS = [
  "firstName","lastName","email","phone","address","city","state","zip",
  "linkedin","github","portfolio","jobTitle","company","experienceTitle",
  "experienceDates","skills","summary","experienceDescription",
  "workAuthorized","sponsorship","disability","gender","lgbtq","veteran",
  "race","ethnicity","orientation","pronouns"
];

const SENSITIVE_FIELDS = new Set([
  "workAuthorized","sponsorship","disability","gender","lgbtq","veteran",
  "race","ethnicity","orientation","pronouns"
]);

function $(id) {
  return document.getElementById(id);
}

function updateSensitiveVisibility() {
  $("sensitiveSection").classList.toggle("open", $("sensitiveToggle").checked);
}

async function loadProfile() {
  const { profile } = await chrome.storage.local.get("profile");
  const merged = { ...DEFAULT_PROFILE, ...(profile || {}) };

  for (const field of FIELDS) {
    if ($(field)) $(field).value = merged[field] || "";
  }

  $("sensitiveToggle").checked = Boolean(merged.sensitive);
  updateSensitiveVisibility();
}

async function saveProfile() {
  const { profile } = await chrome.storage.local.get("profile");
  const next = { ...DEFAULT_PROFILE, ...(profile || {}) };

  for (const field of FIELDS) {
    if ($(field)) next[field] = $(field).value.trim();
  }

  next.sensitive = $("sensitiveToggle").checked;

  // Sensitive values are stored only in chrome.storage.local.
  await chrome.storage.local.set({ profile: next });
  $("resultText").textContent = "Profile saved locally.";
  updateSensitiveVisibility();
}

async function getProfile() {
  const { profile } = await chrome.storage.local.get("profile");
  return {
    ...DEFAULT_PROFILE,
    ...(profile || {}),
    sensitive: $("sensitiveToggle").checked
  };
}

function setStatus(ok) {
  $("statusDot").style.background = ok ? "#e7e7eb" : "#a35b5b";
}

async function sendToCurrentTab(type) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab.");

  return chrome.tabs.sendMessage(
    tab.id,
    type === "autofill"
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
  } catch {
    $("resultText").textContent = "Open a normal web page with an application form, then try again.";
    setStatus(false);
  }
});

$("scanBtn").addEventListener("click", async () => {
  try {
    const result = await sendToCurrentTab("scan");
    $("resultText").textContent = result?.message || "Scan complete.";
    $("pageHint").textContent = result?.page || "Page scanned.";
    setStatus(true);
  } catch {
    $("resultText").textContent = "This page does not expose an accessible content script.";
    setStatus(false);
  }
});

$("saveBtn").addEventListener("click", saveProfile);

$("sensitiveToggle").addEventListener("change", async () => {
  updateSensitiveVisibility();
  await saveProfile();
});

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
