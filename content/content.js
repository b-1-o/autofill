(() => {
  if (window.__B1O_AUTOFILL_LOADED__) return;
  window.__B1O_AUTOFILL_LOADED__ = true;

  const FIELD_MAP = {
    firstName: ["first name", "firstname", "given name", "given-name", "fname"],
    lastName: ["last name", "lastname", "surname", "family name", "family-name", "lname"],
    email: ["email", "e-mail", "email address"],
    phone: ["phone", "mobile", "cell", "telephone", "phone number", "mobile phone"],
    location: ["location", "city", "home city", "current city", "address city"],
    company: ["current company", "company", "employer", "organization", "current employer"],
    linkedin: ["linkedin", "linkedin url", "linkedin profile"],
    github: ["github", "github url", "github profile"],
    portfolio: ["portfolio", "personal website", "website", "website url", "portfolio url"],
    authorizedToWork: [
      "authorized to work",
      "work authorization",
      "legally authorized",
      "eligible to work",
      "right to work",
      "authorized for employment"
    ],
    requiresSponsorship: [
      "requires sponsorship",
      "require sponsorship",
      "sponsorship",
      "visa sponsorship",
      "future sponsorship"
    ]
  };

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  function collectFieldText(el) {
    const values = [
      el.getAttribute("aria-label"),
      el.getAttribute("name"),
      el.getAttribute("id"),
      el.getAttribute("placeholder"),
      el.getAttribute("autocomplete"),
      el.getAttribute("data-testid")
    ].filter(Boolean);

    for (const label of el.labels || []) values.push(label.textContent);

    const parentLabel = el.closest("label");
    if (parentLabel) values.push(parentLabel.textContent);

    const fieldset = el.closest("fieldset");
    const legend = fieldset?.querySelector("legend");
    if (legend) values.push(legend.textContent);

    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      for (const id of labelledBy.split(/\s+/)) {
        const node = document.getElementById(id);
        if (node) values.push(node.textContent);
      }
    }

    return values.map(normalize).filter(Boolean);
  }

  function aliasScore(text, alias) {
    if (text === alias) return 4;
    if (text.split(" ").includes(alias)) return 3;
    if (text.includes(alias)) return 1;
    return 0;
  }

  function findFieldKey(el) {
    const texts = collectFieldText(el);
    let best = null;

    for (const [key, aliases] of Object.entries(FIELD_MAP)) {
      for (const alias of aliases) {
        const needle = normalize(alias);
        for (const text of texts) {
          const score = aliasScore(text, needle);
          if (!best || score > best.score) best = score ? { key, score } : best;
        }
      }
    }

    return best?.key || null;
  }

  function setNativeValue(el, value) {
    const prototype = Object.getPrototypeOf(el);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    const setter = descriptor?.set;

    if (setter) setter.call(el, value);
    else el.value = value;

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function setSelect(el, value) {
    const target = normalize(value);
    const options = [...el.options];

    const exact = options.find((option) => {
      const text = normalize(option.textContent);
      const optionValue = normalize(option.value);
      return text === target || optionValue === target;
    });

    const fuzzy = options.find((option) => {
      const text = normalize(option.textContent);
      const optionValue = normalize(option.value);
      return text.includes(target) || optionValue.includes(target);
    });

    const match = exact || fuzzy;
    if (!match) return false;

    // Avoid replacing a deliberate user selection.
    if (el.value && normalize(el.value) !== target) return false;

    el.value = match.value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function choiceText(input) {
    return normalize([
      input.value,
      input.getAttribute("aria-label"),
      input.labels?.[0]?.textContent,
      input.closest("label")?.textContent
    ].filter(Boolean).join(" "));
  }

  function setChoice(input, value) {
    const target = normalize(value);
    const group = input.name
      ? [...document.querySelectorAll('input[name="' + CSS.escape(input.name) + '"]')]
      : [input];

    if (group.some((candidate) => candidate.checked)) return false;

    const match = group.find((candidate) => {
      const text = choiceText(candidate);
      if (target === "yes") return text === "yes" || text.includes("yes");
      if (target === "no") return text === "no" || text.includes("no");
      return text === target || text.includes(target);
    });

    if (!match) return false;
    match.click();
    return true;
  }

  function fillField(el, profile) {
    if (el.disabled || el.readOnly) return false;

    const key = findFieldKey(el);
    if (!key) return false;

    const value = profile[key];
    if (value === undefined || value === null || value === "") return false;

    const type = normalize(el.getAttribute("type"));
    if (["file", "hidden", "submit", "button", "reset"].includes(type)) return false;

    if (el.tagName === "SELECT") return setSelect(el, value);

    if (type === "radio" || type === "checkbox") {
      return setChoice(el, value);
    }

    if (String(el.value || "").trim()) return false;

    setNativeValue(el, value);
    return true;
  }

  function fillAll(profile) {
    let filled = 0;

    for (const field of document.querySelectorAll("input, textarea, select")) {
      if (fillField(field, profile)) filled++;
    }

    return filled;
  }

  function watchForAsyncFields(profile) {
    let debounce = null;

    const observer = new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(() => fillAll(profile), 100);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      clearTimeout(debounce);
    }, 7000);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.action === "ping") {
      sendResponse({ ok: true });
      return;
    }

    if (message?.action === "fill") {
      if (message.tabId !== sender.tab?.id) return;
      const filled = fillAll(message.profile || {});
      watchForAsyncFields(message.profile || {});

      sendResponse({
        ok: true,
        filled
      });
    }
  });
})();