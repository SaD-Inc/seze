async function initializeAnalytics() {
  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!(projectToken && apiHost)) return;

  const { default: posthog } = await import("posthog-js");

  posthog.init(projectToken, {
    api_host: apiHost,
    ui_host: "https://eu.posthog.com",
    defaults: "2026-05-30",
    strict_script_versioning: true,
  });
}

function scheduleAnalytics() {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => void initializeAnalytics(), {
      timeout: 2_000,
    });
    return;
  }

  setTimeout(() => void initializeAnalytics(), 0);
}

if (document.readyState === "complete") {
  scheduleAnalytics();
} else {
  window.addEventListener("load", scheduleAnalytics, { once: true });
}
