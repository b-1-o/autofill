const STORAGE_KEY = "profile";

const DEPLOYED_VERCEL_URL = "";
const LOCAL_AI_ENDPOINT =
  "http://localhost:3000/api/generate";

const CONTENT_SCRIPT_FILES = [
  "content/field-map.js",
  "content/field-finder.js",
  "content/field-setter.js",
  "content/form-filler.js",
  "content/content.js"
];

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
  requiresSponsorship: "",
  coverLetterTemplate: ""
};

const APPLICATION_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "location",
  "company",
  "linkedin",
  "github",
  "portfolio",
  "yearsOfExperience",
  "authorizedToWork",
  "requiresSponsorship"
];

const FIELD_LABELS = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  phone: "Phone",
  location: "Location",
  company: "Company",
  linkedin: "LinkedIn",
  github: "GitHub",
  portfolio: "Portfolio",
  yearsOfExperience: "Years of Experience",
  authorizedToWork: "Authorized to Work",
  requiresSponsorship: "Requires Sponsorship"
};

const FIELD_IDS = Object.keys(DEFAULT_PROFILE);

const $ = (id) =>
  document.getElementById(id);

function setStatus(
  message,
  type = ""
) {
  const status = $("status");

  status.textContent = message;

  status.className =
    "status" +
    (type
      ? " " + type
      : "");
}

async function loadProfile() {
  const result =
    await chrome.storage.sync.get(
      STORAGE_KEY
    );

  const profile = {
    ...DEFAULT_PROFILE,
    ...(result[STORAGE_KEY] || {})
  };

  for (const id of FIELD_IDS) {
    const field = $(id);

    if (field) {
      field.value =
        profile[id] ?? "";
    }
  }
}

function readProfileFromForm() {
  const profile = {};

  for (const id of FIELD_IDS) {
    const field = $(id);

    profile[id] = field
      ? field.value.trim()
      : "";
  }

  return profile;
}

async function saveProfile(
  showStatus = true
) {
  const profile =
    readProfileFromForm();

  await chrome.storage.sync.set({
    [STORAGE_KEY]: profile
  });

  if (showStatus) {
    setStatus(
      "Saved.",
      "success"
    );
  }

  return profile;
}

async function ensureContentScripts(
  tabId
) {
  try {
    await chrome.tabs.sendMessage(
      tabId,
      {
        type: "PING"
      }
    );

    return;
  } catch {
    await chrome.scripting.executeScript({
      target: {
        tabId,
        allFrames: true
      },
      files: CONTENT_SCRIPT_FILES
    });
  }
}

function mergeFillReports(
  reports
) {
  const reportByKey = new Map();

  for (const key of APPLICATION_FIELDS) {
    reportByKey.set(
      key,
      {
        key,
        label:
          FIELD_LABELS[key],
        filled: false,
        found: false
      }
    );
  }

  for (const report of reports) {
    if (
      !report ||
      !Array.isArray(report.fields)
    ) {
      continue;
    }

    for (const field of report.fields) {
      const existing =
        reportByKey.get(field.key);

      if (!existing) {
        continue;
      }

      existing.filled =
        Boolean(
          existing.filled ||
          field.filled
        );

      existing.found =
        Boolean(
          existing.found ||
          field.found
        );
    }
  }

  const fields =
    APPLICATION_FIELDS.map(
      (key) =>
        reportByKey.get(key)
    );

  const filled =
    fields.filter(
      (field) =>
        field.filled
    ).length;

  const platform =
    reports.find(
      (report) =>
        report?.platform &&
        report.platform !== "Unknown"
    )?.platform ||
    reports.find(
      (report) =>
        report?.platform
    )?.platform ||
    "Unknown";

  return {
    platform,
    fields,
    filled,
    total: APPLICATION_FIELDS.length
  };
}

function renderFillReport(
  report
) {
  const reportCard =
    $("reportCard");

  const reportList =
    $("reportList");

  const unfilledList =
    $("unfilledList");

  reportCard.classList.remove(
    "hidden"
  );

  $("reportSummary").textContent =
    "Filled " +
    report.filled +
    " / " +
    report.total +
    " fields";

  $("platform").textContent =
    "Platform: " +
    report.platform;

  reportList.innerHTML = "";
  unfilledList.innerHTML = "";

  for (const field of report.fields) {
    const row =
      document.createElement(
        "div"
      );

    row.className =
      "report-row " +
      (
        field.filled
          ? "ok"
          : "fail"
      );

    const icon =
      document.createElement(
        "span"
      );

    icon.className =
      "report-icon";

    icon.textContent =
      field.filled
        ? "✓"
        : "✗";

    const label =
      document.createElement(
        "span"
      );

    label.className =
      "report-label";

    label.textContent =
      field.label;

    row.append(
      icon,
      label
    );

    reportList.appendChild(
      row
    );

    if (!field.filled) {
      const item =
        document.createElement(
          "span"
        );

      item.className =
        "unfilled-chip";

      item.textContent =
        field.label;

      unfilledList.appendChild(
        item
      );
    }
  }

  if (
    !unfilledList.children.length
  ) {
    const item =
      document.createElement(
        "span"
      );

    item.className =
      "unfilled-chip";

    item.textContent =
      "None";

    unfilledList.appendChild(
      item
    );
  }
}

async function fillCurrentTab() {
  const fillButton =
    $("fillButton");

  fillButton.disabled =
    true;

  setStatus(
    "Filling…"
  );

  try {
    const profile =
      await saveProfile(false);

    const [tab] =
      await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

    if (!tab?.id) {
      throw new Error(
        "No active tab"
      );
    }

    await ensureContentScripts(
      tab.id
    );

    const mainFrame =
      await chrome.tabs.sendMessage(
        tab.id,
        {
          type: "FILL_FORM",
          profile
        }
      );

    const frameResults =
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id,
          allFrames: true
        },
        files: [
          "content/trigger-fill.js"
        ]
      });

    const reports = [
      mainFrame,
      ...frameResults
        .map(
          (item) =>
            item.result
        )
        .filter(Boolean)
    ];

    const merged =
      mergeFillReports(
        reports
      );

    renderFillReport(
      merged
    );

    setStatus(
      "Filled " +
        merged.filled +
        " / " +
        merged.total +
        " fields.",
      "success"
    );
  } catch (error) {
    console.error(
      "Autofill failed:",
      error
    );

    setStatus(
      "Error: this page may not support extension scripts.",
      "error"
    );
  } finally {
    fillButton.disabled =
      false;
  }
}

async function getJobDescription(
  tabId
) {
  const results =
    await chrome.scripting.executeScript({
      target: {
        tabId,
        frameIds: [0]
      },
      func: () =>
        (
          document.body?.innerText ||
          ""
        ).slice(
          0,
          12000
        )
    });

  return (
    results?.[0]?.result ||
    ""
  );
}

function getAiEndpoint() {
  const deployed =
    DEPLOYED_VERCEL_URL
      .trim()
      .replace(/\/+$/, "");

  if (deployed) {
    return (
      deployed +
      "/api/generate"
    );
  }

  return LOCAL_AI_ENDPOINT;
}

async function generateCoverLetter() {
  const button =
    $("coverLetterButton");

  button.disabled =
    true;

  try {
    const [tab] =
      await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

    if (!tab?.id) {
      throw new Error(
        "No active tab"
      );
    }

    const profile =
      await saveProfile(false);

    const jobDescription =
      await getJobDescription(
        tab.id
      );

    const question =
      profile.coverLetterTemplate ||
      "Write a concise, truthful cover letter for this job.";

    const response =
      await fetch(
        getAiEndpoint(),
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify({
              question,
              jobDescription,
              profile
            })
        }
      );

    if (!response.ok) {
      throw new Error(
        "AI endpoint returned " +
          response.status
      );
    }

    const data =
      await response.json();

    if (!data?.answer) {
      throw new Error(
        "AI endpoint returned no answer"
      );
    }

    $("coverLetterTemplate").value =
      data.answer;

    await saveProfile(false);

    setStatus(
      "Cover letter generated.",
      "success"
    );
  } catch (error) {
    console.error(
      "AI generation failed:",
      error
    );

    const message =
      DEPLOYED_VERCEL_URL.trim()
        ? "AI request failed — check the Vercel endpoint."
        : "AI endpoint not deployed yet — see README";

    setStatus(
      message,
      "error"
    );
  } finally {
    button.disabled =
      false;
  }
}

$("saveButton")
  .addEventListener(
    "click",
    () => {
      saveProfile().catch(
        (error) => {
          console.error(
            "Save failed:",
            error
          );

          setStatus(
            "Error: profile was not saved.",
            "error"
          );
        }
      );
    }
  );

$("fillButton")
  .addEventListener(
    "click",
    fillCurrentTab
  );

$("coverLetterButton")
  .addEventListener(
    "click",
    generateCoverLetter
  );

loadProfile().catch(
  (error) => {
    console.error(
      "Profile load failed:",
      error
    );

    setStatus(
      "Error: could not load saved profile.",
      "error"
    );
  }
);
