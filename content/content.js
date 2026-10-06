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
})();
