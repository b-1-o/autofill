(() => {
  if (
    globalThis.__B1O_AUTOFILL_INITIALIZED__
  ) {
    return;
  }

  globalThis.__B1O_AUTOFILL_INITIALIZED__ =
    true;

  const finder =
    globalThis.__B1O_FIELD_FINDER__;

  const formFiller =
    globalThis.__B1O_FORM_FILLER__;

  if (
    !finder ||
    !formFiller
  ) {
    console.error(
      "[Autofill] Content modules did not initialize in the expected order."
    );

    return;
  }

  function detectPlatform() {
    return finder.detectPlatform();
  }

  console.info(
    "[Autofill] Platform: " +
      detectPlatform()
  );

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
          platform:
            detectPlatform()
        });

        return;
      }

      if (
        message?.type !== "FILL_FORM"
      ) {
        return;
      }

      try {
        const profile =
          message.profile || {};

        const report =
          formFiller.fillAllFormFields(
            profile
          );

        formFiller.startMutationObserver(
          profile
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

        const fields =
          formFiller.generateReport(
            {},
            document
          ).map((field) => ({
            ...field,
            filled: false
          }));

        sendResponse({
          ok: false,
          platform:
            detectPlatform(),
          fields,
          filled: 0,
          total: fields.length,
          error: String(error)
        });
      }

      return true;
    }
  );

  globalThis.__B1O_FILL_FROM_STORAGE__ =
    formFiller.fillFromStorage;

  globalThis.__B1O_FILL_ALL_FORM_FIELDS__ =
    formFiller.fillAllFormFields;

  globalThis.__B1O_GET_PLATFORM__ =
    detectPlatform;

  function hasApplicationFields() {
    const fieldMap = globalThis.__B1O_FIELD_MAP__ || {};
    const keys = ["firstName", "lastName", "email", "phone", "location"];

    return (
      keys.filter((key) => {
        const aliases = fieldMap[key] || [];
        return aliases.length && finder.findFields(aliases).length > 0;
      }).length >= 2
    );
  }

  function showFloatingButton() {
    if (
      window.top !== window.self ||
      document.getElementById("__b1o_autofill_button__") ||
      !hasApplicationFields()
    ) {
      return;
    }

    const button = document.createElement("button");
    button.id = "__b1o_autofill_button__";
    button.type = "button";
    button.textContent = "Fill with Autofill";

    Object.assign(button.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      zIndex: "2147483647",
      border: "1px solid rgba(255,255,255,.14)",
      borderRadius: "12px",
      padding: "11px 15px",
      background: "#111116",
      color: "#f5f5f5",
      boxShadow: "0 12px 30px rgba(0,0,0,.28)",
      font: "600 13px Inter, system-ui, sans-serif",
      cursor: "pointer"
    });

    button.addEventListener("mouseenter", () => {
      button.style.background = "#181820";
    });

    button.addEventListener("mouseleave", () => {
      button.style.background = "#111116";
    });

    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Filling…";

      try {
        const report = await formFiller.fillFromStorage();
        button.textContent =
          "Filled " + report.filled + "/" + report.total;
      } catch (error) {
        console.error("[Autofill] Floating fill failed:", error);
        button.textContent = "Fill failed";
      }

      window.setTimeout(() => {
        button.disabled = false;
        button.textContent = "Fill with Autofill";
      }, 2200);
    });

    document.body.appendChild(button);
  }

  window.setTimeout(showFloatingButton, 900);

  const pageObserver = new MutationObserver(() => {
    if (document.getElementById("__b1o_autofill_button__")) {
      return;
    }

    window.setTimeout(showFloatingButton, 250);
  });

  if (document.body) {
    pageObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.setTimeout(() => {
      pageObserver.disconnect();
    }, 15000);
  }
})();
