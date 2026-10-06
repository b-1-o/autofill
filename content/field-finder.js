(() => {
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
        const node = document.getElementById(id);

        if (node) {
          values.push(node.textContent);
        }
      }
    }

    return values
      .filter(Boolean)
      .join(" ");
  }

  function getFieldTokens(el) {
    return [
      getLabelText(el),
      el.getAttribute("name"),
      el.getAttribute("id"),
      el.getAttribute("placeholder"),
      el.getAttribute("aria-label"),
      el.getAttribute("autocomplete"),
      el.getAttribute("data-testid")
    ]
      .filter(Boolean)
      .map(normalize)
      .filter(Boolean);
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

  function aliasScore(token, alias) {
    const normalizedAlias = normalize(alias);

    if (!normalizedAlias) {
      return 0;
    }

    if (token === normalizedAlias) {
      return 4;
    }

    if (token.split(" ").includes(normalizedAlias)) {
      return 3;
    }

    if (token.includes(normalizedAlias)) {
      return 2;
    }

    return 0;
  }

  function getFieldScore(el, aliases) {
    if (isExcludedField(el)) {
      return 0;
    }

    const tokens = getFieldTokens(el);
    let bestScore = 0;

    for (const token of tokens) {
      for (const alias of aliases) {
        bestScore = Math.max(
          bestScore,
          aliasScore(token, alias)
        );
      }
    }

    return bestScore;
  }

  function findFields(aliases, root = document) {
    const candidates = [
      ...root.querySelectorAll("input, textarea, select")
    ];

    return candidates
      .map((el, index) => ({
        el,
        score: getFieldScore(el, aliases),
        index
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.index - b.index;
      })
      .map((item) => item.el);
  }

  function findField(aliases, root = document) {
    return findFields(aliases, root)[0] || null;
  }

  function hasMeaningfulValue(el) {
    const type = normalize(el.getAttribute("type"));

    if (type === "radio" || type === "checkbox") {
      return el.checked;
    }

    if (el.tagName === "SELECT") {
      const selected = el.options[el.selectedIndex];

      if (!selected) {
        return false;
      }

      return Boolean(
        String(selected.value ?? "").trim()
      );
    }

    return Boolean(
      String(el.value ?? "").trim()
    );
  }

  function detectPlatform() {
    const host = window.location.hostname;

    if (host.includes("greenhouse")) return "Greenhouse";
    if (host.includes("lever")) return "Lever";
    if (host.includes("myworkdayjobs")) return "Workday";
    if (host.includes("ashbyhq")) return "Ashby";
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("jobright")) return "Jobright";
    if (host.includes("indeed")) return "Indeed";
    if (host.includes("smartrecruiters")) return "SmartRecruiters";

    return "Unknown";
  }

  globalThis.__B1O_FIELD_FINDER__ = Object.freeze({
    normalize,
    getLabelText,
    getFieldTokens,
    isExcludedField,
    findField,
    findFields,
    hasMeaningfulValue,
    detectPlatform
  });
})();
