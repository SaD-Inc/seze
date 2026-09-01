import { describe, expect, test } from "bun:test";

import {
  analyticsErrorCode,
  readCampaignAttribution,
  resolveFirstTouchAttribution,
  sanitizeAnalyticsEvent,
  sanitizeAnalyticsPath,
  shouldInitializeAnalytics,
} from "~/lib/analytics";

describe("analytics privacy", () => {
  test("redacts private table codes from game and join paths", () => {
    expect(sanitizeAnalyticsPath("/game/AB12CD")).toBe("/game/:code");
    expect(sanitizeAnalyticsPath("/game/AB12CD/history")).toBe(
      "/game/:code/history",
    );
    expect(sanitizeAnalyticsPath("/join/XY34ZA")).toBe("/join/:code");
    expect(sanitizeAnalyticsPath("/rules")).toBe("/rules");
  });

  test("keeps only safe, allowlisted campaign parameters", () => {
    expect(
      readCampaignAttribution(
        "?utm_source=reddit&utm_medium=community&utm_campaign=launch-1&code=AB12CD",
      ),
    ).toEqual({
      utm_source: "reddit",
      utm_medium: "community",
      utm_campaign: "launch-1",
    });

    expect(
      readCampaignAttribution(
        "?utm_source=person%40example.com&utm_campaign=https%3A%2F%2Fexample.com",
      ),
    ).toEqual({});
  });

  test("keeps the first safe campaign touch through later navigation", () => {
    const firstTouch = resolveFirstTouchAttribution(
      "?utm_source=reddit&utm_campaign=first-launch",
      null,
    );
    const afterNavigation = resolveFirstTouchAttribution(
      "?utm_source=x&utm_campaign=second-launch",
      firstTouch.serialized,
    );

    expect(afterNavigation.attribution).toEqual({
      utm_source: "reddit",
      utm_campaign: "first-launch",
    });
  });

  test("never sends local development events to the configured project", () => {
    expect(shouldInitializeAnalytics("localhost")).toBe(false);
    expect(shouldInitializeAnalytics("127.0.0.1")).toBe(false);
    expect(shouldInitializeAnalytics("preview.localhost")).toBe(false);
    expect(shouldInitializeAnalytics("playseze.com")).toBe(true);
  });

  test("redacts URL properties without removing SDK authentication", () => {
    const event = sanitizeAnalyticsEvent({
      uuid: "test-event",
      event: "game completed",
      properties: {
        token: "phc_project_token",
        $current_url: "https://playseze.com/game/AB12CD?token=secret",
        $pathname: "/join/XY34ZA",
        $referrer: "https://example.com/private/path?email=person@example.com",
        $session_referrer:
          "https://another.example/private/path?token=another-secret",
        $utm_source: "person@example.com",
        $initial_utm_campaign: "launch-1",
        win_reason: "center",
      },
      $set_once: {
        $initial_utm_source: "person@example.com",
        safe_property: "kept",
      },
    });

    expect(event?.properties).toEqual({
      token: "phc_project_token",
      $current_url: "https://playseze.com/game/:code",
      $pathname: "/join/:code",
      $referrer: "https://example.com/",
      $session_referrer: "https://another.example/",
      $initial_utm_campaign: "launch-1",
      win_reason: "center",
    });
    expect(event?.$set_once).toEqual({ safe_property: "kept" });
  });

  test("maps only stable transport error codes", () => {
    expect(analyticsErrorCode({ data: { code: "NOT_FOUND" } })).toBe(
      "not_found",
    );
    expect(analyticsErrorCode({ data: { code: "SOMETHING_NEW" } })).toBe(
      "unknown",
    );
    expect(analyticsErrorCode(new Error("contains private detail"))).toBe(
      "unknown",
    );
  });
});
