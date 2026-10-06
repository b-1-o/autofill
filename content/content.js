(() => {
  if (globalThis.__B1O_AUTOFILL_INITIALIZED__) {
    return;
  }

  globalThis.__B1O_AUTOFILL_INITIALIZED__ = true;

  const STORAGE_KEY = "profile";

  const FIELD_MAP = {
    firstName: [
      "first name",
      "firstname",
      "given name",
      "given-name",
      "fname",
      "first"
    ],
    lastName: [
      "last name",
      "lastname",
      "surname",
      "family name",
      "lname",
      "last"
    ],
    email: [
      "email",
      "e-mail",
      "email address",
      "emailaddress"
    ],
    phone: [
      "phone",
      "mobile",
      "cell",
      "telephone",
      "phone number",
      "mobile phone",
      "cell phone",
      "contact number"
    ],
    location: [
      "location",
      "city",
      "home city",
      "current city",
      "city state",
      "city/state",
      "location city",
      "address"
    ],
    company: [
      "company",
      "current company",
      "employer",
      "current employer",
      "organization",
      "present company",
      "present employer"
    ],
    linkedin: [
      "linkedin",
      "linkedin url",
      "linkedin profile",
      "linkedin profile url"
    ],
    github: [
      "github",
      "github url",
      "github profile",
      "github profile url"
    ],
    portfolio: [
      "portfolio",
      "portfolio url",
      "website",
      "website url",
      "personal site",
      "personal website",
      "personal website url"
    ],
    yearsOfExperience: [
      "years of experience",
      "years experience",
      "experience years",
      "total experience",
      "professional experience"
    ],
    authorizedToWork: [
      "authorized to work",
      "work authorization",
      "legally authorized",
      "legally eligible",
      "eligible to work",
      "right to work",
      "authorized for employment",
      "authorized to work in the us",
      "authorized to work in united states"
    ],
    requiresSponsorship: [
      "requires sponsorship",
      "require sponsorship",
      "sponsorship",
      "visa sponsorship",
      "future sponsorship",
      "need sponsorship",
      "will you require sponsorship"
    ]
  };

  function normalize(value) {
    return String(value ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getLabelText(el) {
    const values = [];

    if (el.id) {
      const explicitLabel = document.querySelector(
        'label[for="' + CSS.escape(el.id) + '"]'
      );

      if (explicitLabel) {
        values.push(explicitLabel.textContent);
      }
    }

    const parentLabel = el.closest("label");
    if (parentLabel) {
      values.push(parentLabel.textContent);
    }

    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) {
      values.push(ariaLabel);
    }

    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      for (const id of labelledBy.split(/\s+/)) {
        const labelledNode = document.getElementById(id);
        if (labelledNode) {
          values.push(labelledNode.textContent);
        }
      }
    }

    return values.filter(Boolean).join(" ");
  }

  function getFieldTokens(el) {
    return [
      getLabelText(el),
      el.getAttribute("name"),
      el.getAttribute("id"),
      el.getAttribute("placeholder"),
      el.getAttribute("autocomplete"),
      el.getAttribute("data-testid")
    ]
      .filter(Boolean)
      .map(normalize)
      .filter(Boolean);
  }

  function tokenMatchesAlias(token, alias) {
    const normalizedAlias = normalize(alias);

    if (!normalizedAlias) {
      return false;
    }

    return (
      token === normalizedAlias ||
      token.split(" ").includes(normalizedAlias) ||
      token.includes(normalizedAlias)
    );
  }

  function findField(aliases, root = document) {
    const aliasList = aliases.map(normalize).filter(Boolean);
    const candidates = [
      ...root.querySelectorAll("input, textarea, select")
    ];

    let bestMatch = null;
    let bestScore = 0;

    for (const el of candidates) {
      if (isExcludedField(el)) {
        continue;
      }

      const tokens = getFieldTokens(el);

      for (const token of tokens) {
        for (const alias of aliasList) {
          if (token === alias && bestScore < 3) {
            bestScore = 3;
            bestMatch = el;
          } else if (tokenMatchesAlias(token, alias) && bestScore < 2) {
            bestScore = 2;
            bestMatch = el;
          }
        }
      }
    }

    return bestMatch;
  }

  function findFields(aliases, root = document) {
    const aliasList = aliases.map(normalize).filter(Boolean);
    const matches = [];

    for (const el of root.querySelectorAll("input, textarea, select")) {
      if (isExcludedField(el)) {
        continue;
      }

      const tokens = getFieldTokens(el);

      if (
        tokens.some((token) =>
          aliasList.some((alias) => tokenMatchesAlias(token, alias))
        )
      ) {
        matches.push(el);
      }
    }

    return matches;
  }

  function isExcludedField(el) {
    const type = normalize(el.getAttribute("type"));

    return (
      el.disabled ||
      el.readOnly ||
      el.hidden ||
      type === "hidden" ||
      type === "file" ||
      type === "password" ||
      type === "submit" ||
      type === "button" ||
      type === "reset" ||
      el.getAttribute("aria-hidden") === "true"
    );
  }

  function isStreetAddressField(el) {
    const autocomplete = normalize(el.getAttribute("autocomplete"));
    const tokens = getFieldTokens(el).join(" ");

    return (
      autocomplete === "street address" ||
      tokens.includes("street address") ||
      tokens.includes("address line 1") ||
      tokens.includes("address line 2")
    );
  }

  function setNativeValue(el, value) {
    const proto =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;

    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");

    if (!descriptor?.set) {
      throw new Error("Native value setter is unavailable");
    }

    descriptor.set.call(el, value);

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function setSelect(el, value) {
    const target = normalize(value);

    if (!target) {
      return false;
    }

    const options = [...el.options];

    const exactIndex = options.findIndex((option) => {
      const optionText = normalize(option.textContent);
      const optionValue = normalize(option.value);
      return optionText === target || optionValue === target;
    });

    const fuzzyIndex = options.findIndex((option) => {
      const optionText = normalize(option.textContent);
      const optionValue = normalize(option.value);

      return (
        optionText.includes(target) ||
        target.includes(optionText) ||
        optionValue.includes(target) ||
        target.includes(optionValue)
      );
    });

    const index = exactIndex >= 0 ? exactIndex : fuzzyIndex;

    if (index < 0) {

      return false;
    }

    const currentOption = options[el.selectedIndex];
    if (
      currentOption &&
      (
        normalize(currentOption.textContent) === target ||
        normalize(currentOption.value) === target
      )
    ) {
      return false;
    }

    el.selectedIndex = index;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));

    return true;
  }

  function getChoiceText(input) {
    const values = [input.value, input.getAttribute("aria-label")];

    if (input.id) {
      const label = document.querySelector(
        'label[for="' + CSS.escape(input.id) + '"]'
      );
      if (label) values.push(label.textContent);
    }

    const parentLabel = input.closest("label");
    if (parentLabel) values.push(parentLabel.textContent);

    return normalize(values.filter(Boolean).join(" "));
  }

  function setRadioOrCheckbox(name, value, root = document) {
    const target = normalize(value);

    if (!name || !target) {
      return false;
    }

    const selector =
      'input[name="' +
      CSS.escape(name) +
      '"][type="radio"], input[name="' +
      CSS.escape(name) +
      '"][type="checkbox"]';

    const group = [...root.querySelectorAll(selector)];

    if (!group.length || group.some((input) => input.checked)) {
      return false;
    }

    const match = group.find((input) => {
      const text = getChoiceText(input);

      if (target === "yes") {
        return text === "yes" || text.startsWith("yes ");
      }

      if (target === "no") {
        return text === "no" || text.startsWith("no ");
      }

      return text === target || text.includes(target);
    });

    if (!match) {
      return false;
    }

    match.click();
    return true;
  }

  function fillOneField(key, value, root = document) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return false;
    }

    const candidates = findFields(FIELD_MAP[key] || [], root);
    let changed = false;

    for (const el of candidates) {
      if (isExcludedField(el)) {
        continue;
      }

      if (key === "location" && isStreetAddressField(el)) {
        continue;
      }

      const type = normalize(el.getAttribute("type"));

      if (el.tagName === "SELECT") {
        if (setSelect(el, value)) {
          changed = true;
        }
        continue;
      }

      if (type === "radio" || type === "checkbox") {
        if (el.name && setRadioOrCheckbox(el.name, value, root)) {
          changed = true;
        }
        continue;
      }

      if (String(el.value ?? "").trim()) {
        continue;
      }

      setNativeValue(el, String(value));
      changed = true;
    }

    return changed;
  }

  function fillAllFormFields(profile, root = document) {
    let filled = 0;

    for (const [key, value] of Object.entries(profile)) {
      if (!Object.prototype.hasOwnProperty.call(FIELD_MAP, key)) {
        continue;
      }

      if (fillOneField(key, value, root)) {
        filled += 1;
      }
    }

    return filled;
  }

  async function getSavedProfile() {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    return result[STORAGE_KEY] || {};
  }

  function startMutationObserver(profile) {
    if (globalThis.__B1O_MUTATION_OBSERVER__) {
      globalThis.__B1O_MUTATION_OBSERVER__.disconnect();
    }

    if (!document.body) {
      return;
    }

    let timer = null;

    const observer = new MutationObserver(() => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        fillAllFormFields(profile);
      }, 120);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    globalThis.__B1O_MUTATION_OBSERVER__ = observer;

    setTimeout(() => {
      observer.disconnect();

      if (timer) {
        clearTimeout(timer);
      }

      if (globalThis.__B1O_MUTATION_OBSERVER__ === observer) {
        globalThis.__B1O_MUTATION_OBSERVER__ = null;
      }
    }, 10000);
  }

  async function fillFromStorage() {
    const profile = await getSavedProfile();
    const filled = fillAllFormFields(profile);
    startMutationObserver(profile);
    return filled;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "FILL_FORM") {
      return;
    }

    try {
      const profile = message.profile || {};
      const filled = fillAllFormFields(profile);

      startMutationObserver(profile);

      sendResponse({
        ok: true,
        filled
      });
    } catch (error) {
      console.error("Autofill error:", error);

      sendResponse({
        ok: false,
        filled: 0,
        error: String(error)
      });
    }
  });

  document.addEventListener("B1O_AUTOFILL_REQUEST", () => {
    fillFromStorage()
      .then((filled) => {
        console.debug("Autofill embedded frame filled:", filled);
      })
      .catch((error) => {
        console.error("Autofill embedded frame error:", error);
      });
  });

  // Keep findField available for debugging from the extension's isolated world.
  globalThis.__B1O_findField__ = findField;
})();