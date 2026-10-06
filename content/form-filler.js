(() => {
  const FIELD_MAP =
    globalThis.__B1O_FIELD_MAP__ || {};

  const FIELD_LABELS =
    globalThis.__B1O_FIELD_LABELS__ || {};

  const FIELD_ORDER =
    globalThis.__B1O_FIELD_ORDER__ ||
    Object.keys(FIELD_MAP);

  const finder =
    globalThis.__B1O_FIELD_FINDER__;

  const setter =
    globalThis.__B1O_FIELD_SETTER__;

  if (!finder || !setter) {
    console.error(
      "[Autofill] Form filler modules did not initialize in the expected order."
    );

    return;
  }

  function isStreetAddressField(el) {
    const autocomplete =
      finder.normalize(
        el.getAttribute("autocomplete")
      );

    const tokens =
      finder
        .getFieldTokens(el)
        .join(" ");

    return (
      autocomplete === "street address" ||
      tokens.includes("street address") ||
      tokens.includes("address line 1") ||
      tokens.includes("address line 2")
    );
  }

  function isEmptyField(el) {
    return !finder.hasMeaningfulValue(el);
  }

  function fillProfileField(
    key,
    value,
    root = document
  ) {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return false;
    }

    const candidates =
      finder.findFields(
        FIELD_MAP[key] || [],
        root
      );

    if (!candidates.length) {
      return false;
    }

    /*
     * Every ranked candidate is considered in order.
     * An occupied text field is skipped so another empty
     * match can be filled without overwriting user input.
     */
    for (const el of candidates) {
      if (finder.isExcludedField(el)) {
        continue;
      }

      if (
        key === "location" &&
        isStreetAddressField(el)
      ) {
        continue;
      }

      const type =
        finder.normalize(
          el.getAttribute("type")
        );

      if (el.tagName === "SELECT") {
        if (
          setter.setSelect(
            el,
            value
          )
        ) {
          return true;
        }

        if (
          finder.hasMeaningfulValue(
            el
          )
        ) {
          return true;
        }

        continue;
      }

      if (
        type === "radio" ||
        type === "checkbox"
      ) {
        if (
          el.name &&
          setter.setRadioOrCheckbox(
            el.name,
            value,
            root
          )
        ) {
          return true;
        }

        if (
          finder.hasMeaningfulValue(
            el
          )
        ) {
          return true;
        }

        continue;
      }

      if (isEmptyField(el)) {
        setter.setNativeValue(
          el,
          String(value)
        );

        return true;
      }
    }

    return false;
  }

  function generateReport(
    profile,
    root = document
  ) {
    return FIELD_ORDER.map((key) => {
      const aliases =
        FIELD_MAP[key] || [];

      const candidates =
        finder.findFields(
          aliases,
          root
        );

      let filled = false;

      try {
        filled =
          fillProfileField(
            key,
            profile[key],
            root
          );
      } catch (error) {
        console.warn(
          "[Autofill] Failed field:",
          key,
          error
        );
      }

      const afterFill =
        finder.findFields(
          aliases,
          root
        );

      const finalFilled =
        afterFill.some((el) => {
          if (
            key === "location" &&
            isStreetAddressField(el)
          ) {
            return false;
          }

          return finder.hasMeaningfulValue(
            el
          );
        });

      return {
        key,
        label:
          FIELD_LABELS[key] || key,
        filled:
          Boolean(
            filled ||
            finalFilled
          ),
        found:
          candidates.length > 0
      };
    });
  }

  function fillAllFormFields(
    profile,
    root = document
  ) {
    const fields =
      generateReport(
        profile,
        root
      );

    return {
      platform:
        finder.detectPlatform(),
      fields,
      filled:
        fields.filter(
          (field) => field.filled
        ).length,
      total:
        fields.length
    };
  }

  function startMutationObserver(
    profile
  ) {
    if (
      globalThis.__B1O_MUTATION_OBSERVER__
    ) {
      globalThis
        .__B1O_MUTATION_OBSERVER__
        .disconnect();
    }

    if (!document.body) {
      return;
    }

    let timer = null;

    const observer =
      new MutationObserver(() => {
        clearTimeout(timer);

        timer =
          setTimeout(
            () => {
              fillAllFormFields(
                profile
              );
            },
            120
          );
      });

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

    globalThis.__B1O_MUTATION_OBSERVER__ =
      observer;

    setTimeout(() => {
      observer.disconnect();

      if (timer) {
        clearTimeout(timer);
      }

      if (
        globalThis.__B1O_MUTATION_OBSERVER__ ===
        observer
      ) {
        globalThis.__B1O_MUTATION_OBSERVER__ =
          null;
      }
    }, 10000);
  }

  async function getSavedProfile() {
    const result =
      await chrome.storage.sync.get(
        "profile"
      );

    return (
      result.profile || {}
    );
  }

  async function fillFromStorage() {
    const profile =
      await getSavedProfile();

    const report =
      fillAllFormFields(
        profile
      );

    startMutationObserver(
      profile
    );

    return report;
  }

  globalThis.__B1O_FORM_FILLER__ =
    Object.freeze({
      fillAllFormFields,
      generateReport,
      startMutationObserver,
      getSavedProfile,
      fillFromStorage
    });
})();
