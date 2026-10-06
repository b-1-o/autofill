(() => {
  if (
    globalThis.__B1O_AUTOFILL_INITIALIZED__
  ) {
    return;
  }

  globalThis.__B1O_AUTOFILL_INITIALIZED__ =
    true;

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

  const detectPlatform =
    globalThis.__B1O_DETECT_PLATFORM__;

  if (
    !finder ||
    !setter ||
    !detectPlatform
  ) {
    console.error(
      "Autofill modules did not initialize in the expected order."
    );

    return;
  }

  const platform =
    detectPlatform();

  console.info(
    "[Autofill] Platform:",
    platform,
    window.location.hostname
  );

  function isStreetAddressField(el) {
    const autocomplete =
      finder.normalize(
        el.getAttribute(
          "autocomplete"
        )
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
     * firstName / lastName and every other profile field
     * use all ranked matches. If the strongest candidate
     * is already occupied, the next empty candidate wins.
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
        if (setter.setSelect(el, value)) {
          return true;
        }

        if (finder.hasMeaningfulValue(el)) {
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

        if (finder.hasMeaningfulValue(el)) {
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

  function buildFieldReport(
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

      const usableCandidates =
        candidates.filter((el) => {
          if (
            key === "location" &&
            isStreetAddressField(el)
          ) {
            return false;
          }

          return true;
        });

      const alreadyFilled =
        usableCandidates.some(
          finder.hasMeaningfulValue
        );

      let filled =
        alreadyFilled;

      if (!filled) {
        try {
          filled =
            fillProfileField(
              key,
              profile[key],
              root
            ) || alreadyFilled;
        } catch (error) {
          console.warn(
            "[Autofill] Failed field:",
            key,
            error
          );
        }
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
      buildFieldReport(
        profile,
        root
      );

    return {
      platform,
      fields,
      filled:
        fields.filter(
          (field) =>
            field.filled
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

        timer = setTimeout(
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

  chrome.runtime.onMessage.addListener(
    (
      message,
      sender,
      sendResponse
    ) => {
      if (
        message?.type === "PING"
      ) {
        sendResponse({
          ok: true,
          platform
        });

        return;
      }

      if (
        message?.type !== "FILL_FORM"
      ) {
        return;
      }

      try {
        const report =
          fillAllFormFields(
            message.profile || {}
          );

        startMutationObserver(
          message.profile || {}
        );

        sendResponse({
          ok: true,
          ...report
        });
      } catch (error) {
        console.error(
          "[Autofill] Fill error:",
          error
        );

        sendResponse({
          ok: false,
          platform,
          fields:
            FIELD_ORDER.map(
              (key) => ({
                key,
                label:
                  FIELD_LABELS[key] ||
                  key,
                filled: false,
                found: false
              })
            ),
          filled: 0,
          total:
            FIELD_ORDER.length,
          error:
            String(error)
        });
      }

      return true;
    }
  );

  globalThis.__B1O_FILL_FROM_STORAGE__ =
    fillFromStorage;

  globalThis.__B1O_FILL_ALL_FORM_FIELDS__ =
    fillAllFormFields;

  globalThis.__B1O_GET_PLATFORM__ =
    detectPlatform;
})();
