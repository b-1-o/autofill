(() => {
  const SENSITIVE_KEYS = new Set([
    "disability", "gender", "lgbtq", "veteran", "race", "ethnicity", "orientation", "pronouns"
  ]);

  const FIELD_ALIASES = {
    firstName: ["first name", "firstname", "given name", "given-name", "fname"],
    lastName: ["last name", "lastname", "family name", "family-name", "surname", "lname"],
    email: ["email", "e-mail", "email address"],
    phone: ["phone", "mobile", "mobile phone", "telephone", "phone number"],
    address: ["street address", "address line 1", "address1", "street", "address"],
    city: ["city", "town"],
    state: ["state", "province", "state/province", "state or province", "region"],
    zip: ["zip", "zip code", "postal code", "postcode"],
    linkedin: ["linkedin", "linkedin url", "linkedin profile"],
    github: ["github", "github url", "github profile"],
    portfolio: ["portfolio", "website", "personal website", "portfolio url", "website url"],
    jobTitle: ["current title", "job title", "title", "position", "role"],
    company: ["current company", "company", "employer", "current employer", "organization"],
    experienceTitle: ["experience title", "previous title", "role title", "position title"],
    skills: ["skills", "technical skills", "technologies", "tech stack", "stack"],
    summary: ["professional summary", "summary", "about you", "about yourself", "profile", "professional profile"],
    experienceDescription: ["experience description", "work experience", "job description", "responsibilities", "duties", "describe your experience"],
    workAuthorized: ["authorized to work", "work authorization", "legally authorized", "eligible to work", "right to work"],
    sponsorship: ["sponsorship", "require sponsorship", "visa sponsorship", "future sponsorship"],
    disability: ["disability", "disabled"],
    gender: ["gender", "sex"],
    lgbtq: ["lgbtq", "lgbt", "identify as lgbt"],
    veteran: ["veteran", "military service"],
    race: ["race", "racial"],
    ethnicity: ["ethnicity", "hispanic or latino", "latino", "latina"],
    orientation: ["sexual orientation", "orientation"],
    pronouns: ["pronouns"]
  };

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  function labelText(el) {
    const pieces = [
      el.getAttribute("aria-label"),
      el.getAttribute("placeholder"),
      el.getAttribute("name"),
      el.getAttribute("id"),
      el.getAttribute("autocomplete"),
      el.getAttribute("data-testid")
    ].filter(Boolean);

    if (el.labels?.length) {
      for (const label of el.labels) pieces.push(label.textContent);
    }

    const parent = el.closest("label");
    if (parent) pieces.push(parent.textContent);

    const fieldset = el.closest("fieldset");
    if (fieldset?.querySelector("legend")) {
      pieces.push(fieldset.querySelector("legend").textContent);
    }

    const nearby = el.parentElement?.innerText;
    if (nearby && nearby.length < 240) pieces.push(nearby);

    return normalize(pieces.join(" | "));
  }

  function matchKey(el) {
    const haystack = labelText(el);

    // Longer aliases first to avoid "title" winning over "job title".
    const keys = Object.entries(FIELD_ALIASES).sort((a, b) =>
      Math.max(...b[1].map((x) => normalize(x).length)) -
      Math.max(...a[1].map((x) => normalize(x).length))
    );

    for (const [key, aliases] of keys) {
      if (aliases.some((alias) => haystack.includes(normalize(alias)))) return key;
    }

    const autocomplete = normalize(el.getAttribute("autocomplete"));
    const autoMap = {
      "given name": "firstName",
      "family name": "lastName",
      "email": "email",
      "tel": "phone",
      "street address": "address",
      "address level2": "city",
      "address level1": "state",
      "postal code": "zip"
    };
    return autoMap[autocomplete] || null;
  }

  function fire(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function setNativeValue(el, value) {
    const prototype = Object.getPrototypeOf(el);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor?.set) descriptor.set.call(el, value);
    else el.value = value;
    fire(el);
  }

  function chooseOption(el, wanted) {
    const target = normalize(wanted);
    const options = Array.from(el.options || []);
    const exact = options.find((option) =>
      normalize(option.textContent) === target || normalize(option.value) === target
    );
    const fuzzy = options.find((option) => {
      const text = normalize(option.textContent);
      const value = normalize(option.value);
      return target && (text.includes(target) || target.includes(text) || value.includes(target) || target.includes(value));
    });
    const match = exact || fuzzy;
    if (!match) return false;
    el.value = match.value;
    fire(el);
    return true;
  }

  function chooseRadioOrCheckbox(input, wanted) {
    if (!input || !wanted) return false;
    const target = normalize(wanted);
    const group = input.name
      ? Array.from(document.querySelectorAll('input[name="' + CSS.escape(input.name) + '"]'))
      : [input];

    let candidates = group;
    const fieldset = input.closest("fieldset");
    if (fieldset) candidates = Array.from(fieldset.querySelectorAll('input[type="radio"], input[type="checkbox"]'));

    const match = candidates.find((candidate) => {
      const surrounding = normalize([
        candidate.value,
        candidate.getAttribute("aria-label"),
        candidate.labels?.[0]?.textContent,
        candidate.closest("label")?.textContent
      ].filter(Boolean).join(" "));
      return surrounding === target || surrounding.includes(target) || target.includes(surrounding);
    });

    if (!match) return false;
    if (!match.checked) match.click();
    return true;
  }

  function fillElement(el, profile) {
    if (!el || el.disabled || el.readOnly) return false;

    const key = matchKey(el);
    if (!key) return false;
    if (SENSITIVE_KEYS.has(key) && !profile.sensitive) return false;

    const value = profile[key];
    if (value === undefined || value === null || value === "") return false;

    const tag = el.tagName.toLowerCase();
    const type = normalize(el.getAttribute("type"));

    if (tag === "select") return chooseOption(el, value);

    if (type === "radio" || type === "checkbox") {
      return chooseRadioOrCheckbox(el, value);
    }

    if (tag === "input" || tag === "textarea") {
      setNativeValue(el, value);
      return true;
    }

    return false;
  }

  function addResumeHelper() {
    const inputs = Array.from(document.querySelectorAll('input[type="file"]'));

    for (const input of inputs) {
      if (input.dataset.b1oHelper) continue;

      const descriptor = labelText(input);
      if (!descriptor.includes("resume") && !descriptor.includes("cv") && !descriptor.includes("cover letter")) continue;

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = descriptor.includes("cover letter") ? "Get cover letter" : "Get CV";
      button.dataset.b1oHelperButton = "1";

      Object.assign(button.style, {
        marginLeft: "8px",
        padding: "5px 9px",
        borderRadius: "7px",
        border: "1px solid #b8b8be",
        background: "#111214",
        color: "#f5f5f5",
        fontSize: "12px",
        cursor: "pointer",
        verticalAlign: "middle",
        zIndex: "2147483647"
      });

      button.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          type: "download-file",
          key: descriptor.includes("cover letter") ? "cover" : "resume"
        });
      });

      input.insertAdjacentElement("afterend", button);
      input.dataset.b1oHelper = "1";
    }
  }

  function collectFields() {
    return Array.from(document.querySelectorAll("input, select, textarea"))
      .filter((el) => !["submit", "button", "hidden", "file"].includes(normalize(el.getAttribute("type"))));
  }

  function isLikelyJobPage() {
    const text = normalize(document.body?.innerText?.slice(0, 12000));
    const signals = [
      "apply now", "apply for this job", "application", "resume", "cover letter",
      "work authorization", "linkedin", "github", "candidate information",
      "greenhouse", "lever", "workday", "icims", "ashby"
    ];
    return signals.filter((signal) => text.includes(normalize(signal))).length >= 2;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "scan") {
      const fields = collectFields();
      const detected = fields.filter((field) => matchKey(field)).length;

      sendResponse({
        ok: true,
        page: isLikelyJobPage() ? "Application/job form detected." : "General web page scanned.",
        message: detected + " recognizable field(s) found."
      });
      return;
    }

    if (message?.type === "autofill") {
      const fields = collectFields();
      let filled = 0;
      let skippedSensitive = 0;

      for (const field of fields) {
        const key = matchKey(field);
        if (!key) continue;

        if (SENSITIVE_KEYS.has(key) && !message.profile?.sensitive) {
          skippedSensitive++;
          continue;
        }

        if (fillElement(field, message.profile || {})) filled++;
      }

      addResumeHelper();

      sendResponse({
        ok: true,
        message: filled + " field(s) filled. " +
          (skippedSensitive
            ? skippedSensitive + " sensitive field(s) left untouched."
            : "Review before submitting.")
      });
    }
  });

  addResumeHelper();
})();
