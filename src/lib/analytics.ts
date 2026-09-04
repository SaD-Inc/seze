import type { CaptureResult, PostHog, Properties } from "posthog-js";

import type {
  BotDifficulty,
  PlayerColor,
  RulesetVersion,
  WinReason,
} from "~/game/types";

type EntryPoint = "game_over" | "home";
type JoinMethod = "manual_code" | "quick_link";
type AnalyticsErrorCode =
  | "bad_request"
  | "conflict"
  | "forbidden"
  | "internal_server_error"
  | "not_found"
  | "timeout"
  | "unauthorized"
  | "unknown";

type AnalyticsEvents = {
  "site entered": {
    entry_path: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_medium?: string;
    utm_source?: string;
    utm_term?: string;
  };
  "table create intent": { entry_point: EntryPoint };
  "table created": {
    entry_point: EntryPoint;
    match_id: string;
    ruleset_version: RulesetVersion;
  };
  "table create failed": {
    entry_point: EntryPoint;
    error_code: AnalyticsErrorCode;
  };
  "bot game create intent": { difficulty: BotDifficulty };
  "bot game created": {
    difficulty: BotDifficulty;
    match_id: string;
    ruleset_version: RulesetVersion;
  };
  "bot game create failed": {
    difficulty: BotDifficulty;
    error_code: AnalyticsErrorCode;
  };
  "table join intent": { join_method: JoinMethod };
  "second player joined": {
    join_method: JoinMethod;
    match_id: string;
    ruleset_version: RulesetVersion;
  };
  "table join failed": {
    join_method: JoinMethod;
    error_code: AnalyticsErrorCode;
  };
  "invite copied": { match_id: string; share_method: "clipboard" };
  "invite copy failed": { share_method: "clipboard" };
  "game first move made": {
    match_id: string;
    player_color: PlayerColor;
    ruleset_version: RulesetVersion;
  };
  "game completed": {
    match_id: string;
    move_count: number;
    player_color: PlayerColor;
    ruleset_version: RulesetVersion;
    win_reason: WinReason;
  };
  "first win share shown": { match_id: string; win_reason: WinReason };
  "first win share clicked": {
    match_id: string;
    share_method: "clipboard" | "native";
  };
  "first win share completed": {
    match_id: string;
    share_method: "clipboard" | "native";
  };
  "rematch requested": {
    match_id: string;
    request_type: "accepted" | "initiated";
  };
  "rematch created": { match_id: string; ruleset_version: RulesetVersion };
  "rematch request failed": { error_code: AnalyticsErrorCode };
};

type AnalyticsEventName = keyof AnalyticsEvents;
type AnalyticsProperties = Record<
  string,
  boolean | number | string | null | undefined
>;

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;
type CampaignAttribution = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const ATTRIBUTION_STORAGE_KEY = "seze:analytics:v1:first-touch";

const ERROR_CODES = new Set<AnalyticsErrorCode>([
  "bad_request",
  "conflict",
  "forbidden",
  "internal_server_error",
  "not_found",
  "timeout",
  "unauthorized",
  "unknown",
]);

const localMilestones = new Set<string>();
let analyticsClientPromise: Promise<PostHog | null> | null = null;
let memoryAttribution: CampaignAttribution | null = null;

export function sanitizeAnalyticsPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "game" && segments.length >= 2) {
    return segments[2] === "history" ? "/game/:code/history" : "/game/:code";
  }

  if (segments[0] === "join" && segments.length >= 2) {
    return "/join/:code";
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function readCampaignAttribution(search: string) {
  const params = new URLSearchParams(search);
  const attribution: CampaignAttribution = {};

  for (const key of UTM_KEYS) {
    const value = sanitizeCampaignValue(params.get(key));
    if (value) attribution[key] = value;
  }

  return attribution;
}

export function resolveFirstTouchAttribution(
  search: string,
  stored: string | null,
): { attribution: CampaignAttribution; serialized: string } {
  if (stored !== null) {
    try {
      const attribution = sanitizeStoredAttribution(JSON.parse(stored));
      return { attribution, serialized: JSON.stringify(attribution) };
    } catch {
      // Replace corrupt session data with the current safe first touch.
    }
  }

  const attribution = readCampaignAttribution(search);
  return { attribution, serialized: JSON.stringify(attribution) };
}

export function analyticsErrorCode(error: unknown): AnalyticsErrorCode {
  if (!error || typeof error !== "object") return "unknown";

  const data = "data" in error ? error.data : undefined;
  if (!data || typeof data !== "object" || !("code" in data)) return "unknown";

  const code = String(data.code).toLowerCase() as AnalyticsErrorCode;
  return ERROR_CODES.has(code) ? code : "unknown";
}

export function sanitizeAnalyticsEvent(
  event: CaptureResult | null,
): CaptureResult | null {
  if (!event) return event;

  return {
    ...event,
    properties: sanitizePropertyMap(event.properties),
    ...(event.$set ? { $set: sanitizePropertyMap(event.$set) } : {}),
    ...(event.$set_once
      ? { $set_once: sanitizePropertyMap(event.$set_once) }
      : {}),
  };
}

function sanitizePropertyMap(input: Properties): Properties {
  const properties = { ...input };

  for (const [key, value] of Object.entries(properties)) {
    if (isUtmProperty(key)) {
      const safeValue =
        typeof value === "string" ? sanitizeCampaignValue(value) : undefined;
      if (safeValue) properties[key] = safeValue;
      else delete properties[key];
      continue;
    }

    if (typeof value !== "string" || !isUrlProperty(key)) continue;
    properties[key] = sanitizeAnalyticsUrl(
      value,
      key.toLowerCase().includes("referrer"),
    );
  }

  return properties;
}

export async function initializeAnalytics(): Promise<PostHog | null> {
  if (typeof window === "undefined") return null;
  if (!shouldInitializeAnalytics(window.location.hostname)) return null;

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!(projectToken && apiHost)) return null;

  analyticsClientPromise ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(projectToken, {
        api_host: apiHost,
        ui_host: "https://eu.posthog.com",
        defaults: "2026-05-30",
        strict_script_versioning: true,
        autocapture: true,
        capture_pageview: "history_change",
        capture_pageleave: true,
        mask_all_element_attributes: true,
        mask_all_text: true,
        disable_session_recording: true,
        person_profiles: "identified_only",
        before_send: (event) => sanitizeAnalyticsEvent(event),
      });

      return posthog;
    })
    .catch(() => null);

  return analyticsClientPromise;
}

export function shouldInitializeAnalytics(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return !(
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost")
  );
}

export function captureAnalyticsEvent<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEvents[Name],
) {
  const attribution = readSessionAttribution();

  void initializeAnalytics().then((posthog) => {
    if (!posthog) return;
    posthog.capture(name, {
      ...attribution,
      ...(properties as AnalyticsProperties),
    });
  });
}

export function captureAnalyticsEventOnce<Name extends AnalyticsEventName>(
  name: Name,
  scope: string,
  properties: AnalyticsEvents[Name],
) {
  if (!markMilestone(name, scope)) return;
  captureAnalyticsEvent(name, properties);
}

export function captureSiteEntry() {
  if (typeof window === "undefined") return;

  captureAnalyticsEventOnce("site entered", "browser-session", {
    entry_path: sanitizeAnalyticsPath(window.location.pathname),
  });
}

function readSessionAttribution(): CampaignAttribution {
  if (typeof window === "undefined") return {};

  try {
    const stored = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    const resolved = resolveFirstTouchAttribution(
      window.location.search,
      stored,
    );
    if (stored !== resolved.serialized) {
      window.sessionStorage.setItem(
        ATTRIBUTION_STORAGE_KEY,
        resolved.serialized,
      );
    }
    return resolved.attribution;
  } catch {
    memoryAttribution ??= readCampaignAttribution(window.location.search);
    return memoryAttribution;
  }
}

function sanitizeStoredAttribution(value: unknown): CampaignAttribution {
  if (!value || typeof value !== "object") return {};

  const attribution: CampaignAttribution = {};
  for (const key of UTM_KEYS) {
    const candidate = (value as Record<string, unknown>)[key];
    const safeValue =
      typeof candidate === "string"
        ? sanitizeCampaignValue(candidate)
        : undefined;
    if (safeValue) attribution[key] = safeValue;
  }

  return attribution;
}

function sanitizeCampaignValue(value: string | null): string | undefined {
  if (!value) return undefined;

  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > 80 ||
    normalized.includes("@") ||
    /https?:\/\//i.test(normalized)
  ) {
    return undefined;
  }

  return /^[a-zA-Z0-9._~+-]+$/.test(normalized) ? normalized : undefined;
}

function isUrlProperty(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    normalized.includes("referrer") ||
    normalized.includes("current_url") ||
    normalized.includes("entry_url") ||
    normalized.includes("pathname")
  );
}

function isUtmProperty(key: string): boolean {
  const normalized = key.toLowerCase();
  return UTM_KEYS.some((utmKey) => normalized.endsWith(utmKey));
}

function sanitizeAnalyticsUrl(value: string, originOnly: boolean): string {
  try {
    const absolute = /^[a-z][a-z\d+.-]*:\/\//i.test(value);
    const url = new URL(value, "https://analytics.invalid");
    const pathname = originOnly ? "/" : sanitizeAnalyticsPath(url.pathname);
    return absolute ? `${url.origin}${pathname}` : pathname;
  } catch {
    return sanitizeAnalyticsPath(value.split(/[?#]/, 1)[0] ?? "/");
  }
}

function markMilestone(name: AnalyticsEventName, scope: string): boolean {
  const key = `seze:analytics:v1:${name}:${hashLocalScope(scope)}`;

  try {
    if (window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.setItem(key, "1");
    return true;
  } catch {
    if (localMilestones.has(key)) return false;
    localMilestones.add(key);
    return true;
  }
}

function hashLocalScope(value: string): string {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(36);
}
