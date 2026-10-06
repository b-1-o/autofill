(() => {
  function detectPlatform(hostname = window.location.hostname) {
    const host = String(
      hostname || ""
    ).toLowerCase();

    if (host.includes("greenhouse.io")) {
      return "Greenhouse";
    }

    if (host.includes("lever.co")) {
      return "Lever";
    }

    if (
      host.includes("myworkdayjobs.com") ||
      host.includes("workday.com")
    ) {
      return "Workday";
    }

    if (host.includes("ashbyhq.com")) {
      return "Ashby";
    }

    if (host.includes("linkedin.com")) {
      return "LinkedIn";
    }

    if (host.includes("jobright.ai")) {
      return "Jobright";
    }

    return "Unknown";
  }

  globalThis.__B1O_DETECT_PLATFORM__ =
    detectPlatform;
})();
