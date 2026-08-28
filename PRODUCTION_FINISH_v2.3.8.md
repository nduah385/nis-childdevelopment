# NIS Child Development Centre — Production Finish v2.3.8

This release is a performance and resilience hardening pass. It does not change public content, Neon schema/data, R2 media, donation workflow, Contact form behavior, or single-admin policy.

## Public runtime improvements
- Consolidates public theme, Google Maps compatibility and video loading into one browser-safe Neon client.
- Removes single-admin session/admin_users verification from ordinary public visits; it remains enabled on `?admin=1`.
- Replaces repeated donation polling with a targeted MutationObserver.
- Defers public video loading to browser idle time while keeping map/theme loading responsive.
- Preserves `preload="none"` for uploaded videos and lazy/async thumbnail loading.
- Uses targeted Contact observers only for the elements the core settings renderer can update.

## Rendering improvements
- Adds `content-visibility:auto` and intrinsic section sizing for below-the-fold sections on desktop.
- Stabilizes the brand logo box to reduce layout shift.
- Adds scroll padding for the sticky navigation.
- Keeps reduced-motion behavior respected.

## Existing safeguards retained
- Single-primary-administrator enforcement on the admin route.
- Production Guard CI.
- Google Maps host/path validation.
- Sanitized WhatsApp `wa.me` links.
- Cloudflare R2 media architecture.
- Neon Auth + Data API architecture.
