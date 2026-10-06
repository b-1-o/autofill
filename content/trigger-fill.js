(() => {
  // The popup handles the main frame with tabs.sendMessage().
  // This file is injected into all frames and only fills embedded frames.
  if (
    window.top === window.self
  ) {
    return null;
  }

  if (
    typeof globalThis.__B1O_FILL_FROM_STORAGE__ !==
    "function"
  ) {
    return null;
  }

  return globalThis
    .__B1O_FILL_FROM_STORAGE__();
})();
