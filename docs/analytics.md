# Product analytics

SEZE sends anonymous product events to PostHog when the public PostHog
environment variables are configured. Automatic pageviews, page leaves, and
interaction events are enabled so PostHog Web Analytics can calculate traffic
and engagement metrics. Autocaptured element text and attributes are masked,
and session replay remains disabled. URL properties are sanitized before events
are sent so private table codes, queries, and fragments are not collected.
Analytics initialization is also disabled on localhost so development and CI
browser checks cannot pollute the live project.

## Cross-device match attribution

PostHog gives anonymous browsers different `distinct_id` values. A host and an
invited opponent therefore cannot form one standard person-based funnel across
two devices, even though they participate in the same game.

Each game receives a random, server-issued `analyticsMatchId` that is separate
from its private join code, player tokens, and database primary key. The client
sends it only as the `match_id` property on match-scoped success and milestone
events. Aggregate analysis and HogQL can group those events by `match_id`
without sending the table code, guest names, player tokens, moves, or private
URLs to PostHog. A rematch receives a new identifier because it is a new match.

## Campaign attribution

Only `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, and `utm_content`
are retained. Values are length- and character-limited and reject email- or
URL-like content. The sanitized first touch is stored in session storage and
added to later custom events after client-side navigation. Private invitation
links never inherit campaign query parameters.

PostHog SDK URL and referrer properties are redacted before sending. Dynamic
game paths become `/game/:code` or `/join/:code`, queries and fragments are
removed, and referrers retain only their origin.

References:

- [PostHog campaign attribution troubleshooting](https://posthog.com/docs/web-analytics/campaign-attribution-troubleshooting)
- [PostHog UTM segmentation](https://posthog.com/docs/data/utm-segmentation)
