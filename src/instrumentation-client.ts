import posthog from "posthog-js";

import { env } from "~/env";

posthog.init(env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
  api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
  ui_host: "https://eu.posthog.com",
  defaults: "2026-05-30",
  strict_script_versioning: true,
});
