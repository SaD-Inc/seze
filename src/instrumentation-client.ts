import { captureSiteEntry, initializeAnalytics } from "~/lib/analytics";

function scheduleAnalytics() {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(
      () => void initializeAnalytics().then(captureSiteEntry),
      { timeout: 2_000 },
    );
    return;
  }

  setTimeout(() => void initializeAnalytics().then(captureSiteEntry), 0);
}

if (document.readyState === "complete") {
  scheduleAnalytics();
} else {
  window.addEventListener("load", scheduleAnalytics, { once: true });
}
