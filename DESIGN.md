# Design System: "Tenun" — Threads Auto-Post CMS

Generate premium, dark-mode screens for a Threads social-media management dashboard called **Tenun** (Indonesian for "weaving" — a nod to weaving threads). The product lets a creator auto-publish scheduled Threads posts, monitor keyword conversations, approve semi-automated replies before they send, and search Threads from one place.

Generate these screens in this order, keeping one continuous design language across all of them:

1. **Login** — asymmetric split screen: left brand panel (product name, single line tagline, quiet woven-line motif), right compact form.
2. **Dashboard (Overview)** — headline stats row (posts today, replies sent, keyword matches), rate-limit quota bars, live activity feed, next scheduled posts.
3. **Compose Post** — editorial text composer with character counter, schedule picker, planned-posts queue list beside it.
4. **Reply Queue** — approval inbox: target post preview + suggested reply + approve/skip actions.
5. **Keyword Search** — search field with search-mode toggle, results list, each row offering "queue as reply".
6. **Settings / Accounts** — connected Threads account cards, monitored keyword list, rate-limit readouts, token status.

## 1. Visual Theme & Atmosphere

Dark, editorial, quietly confident — a tool that feels like a precision instrument kept in a dark studio. Density 6 / Variance 6 / Motion 6. Charcoal canvas, hairline borders, single warm ember accent. Nothing glows, nothing floats cheaply; hierarchy comes from a restrained scale, weight, and motion. Every screen feels composed like a printed spread, but breathes like an app used daily.

## 2. Color Palette & Roles

- **Umbra Canvas** (`#0D0D0E`) — primary app background. Near-black, never pure `#000000`.
- **Graphite Panel** (`#161618`) — cards, sidebars, elevated surfaces.
- **Ash Rise** (`#1E1E21`) — hover surfaces, input fills, pressed states.
- **Foam Ink** (`#F4F4F5`) — primary text, headline color.
- **Slate Mute** (`#A1A1AA`) — secondary text, descriptions, metadata, labels.
- **Dim Veil** (`#70707A`) — tertiary text, disabled states, timestamps.
- **Hairline** (`rgba(244,244,245,0.08)`) — 1px structural borders and dividers.
- **Ember** (`#E8633C`) — the single accent. CTAs, active states, focus rings, live indicators. Warm burnt orange; saturation below 80%. Never gradiented, never glowing.
- **Healthy Lime** (`#4ADE80`) — semantic "sent / active / success" only.
- **Caution Amber** (`#FBBF24`) — semantic "pending / scheduled / warning" only.
- **Coral Alert** (`#F87171`) — semantic "failed / error / quota exhausted" only.

The three semantic colors must stay small, muted, status-pill-sized. One accent, no purple, no neon, no blue-gradient AI default.

## 3. Typography Rules

- **Display & Body:** `Geist` — Track-tight headlines, weight-driven hierarchy (never size-shouting). Body at relaxed leading, max 65ch.
- **Monospace:** `Geist Mono` — reserved for all numbers: rate-limit quotas (`217/250`), counts, timestamps, thread/media IDs, scheduling times. This mono-for-numbers habit is what makes the dashboard feel like an instrument.
- **Scale:** 13px base for dense dashboard text, 15px for form/editorial text. Headlines via `clamp()` only.
- **Banned:** `Inter`, serif fonts of any kind, system-font fallbacks for headlines.

## 4. Component Stylings

- **Buttons:** Flat fills, zero glow, zero gradient. Primary = Ember fill, dark text inside. Secondary = ghost with 1px Hairline border. Active state translates down 1px (tactile push). Full-height hit area, minimum 44px tap target.
- **Cards:** Used sparingly and only when elevation earns it. `#161618` fill, Hairline 1px border, generously rounded corners (1rem–1.5rem), a faint top-edge light instead of drop shadows. High-density content (queues, activity, results) uses border-top dividers in an open list instead of stacked cards.
- **Inputs:** Label above, helper text optional below, error text below in Coral Alert. Fill = Ash Rise on focus, accent focus ring (2px, offset). No placeholder text that disappears; no floating labels.
- **Status Pills:** Small rounded mono labels — Healthy Lime / Caution Amber / Coral Alert tints on near-transparent fills, not solid blocks.
- **Quota Bars:** Thin segmented progress bars that sit under a mono number (`217/250`). A live "listening" state shows a slowly breathing Ember dot beside the monitored-keyword row.
- **Loaders:** Skeletal shimmer replicating the exact layout shape of the content being loaded. No circular spinners.
- **Empty States:** Composed dark compositions — a subtle woven-thread line motif, a one-line explanation, and a single action. Never a lonely "No data" string.

## 5. Layout Principles

- Left vertical sidebar navigation (icon + label), collapsing to a bottom nav or clean icon rail under 768px. Content max-width 1400px, generous 24–32px gutters.
- Grid-first structure; asymmetric splits for the Login screen (brand panel larger than the form). No centered-login-card cliché.
- Every element occupies its own clean spatial zone — no overlap, no absolutely-positioned stacking.
- Below 768px everything collapses to a strict single column. No horizontal scroll, ever. Touch targets ≥ 44px.
- Full-height regions use `min-h-[100dvh]`, never `h-screen`.

## 6. Motion & Interaction

- Spring physics: `stiffness 100, damping 20` — weighty, premium feel. No linear easing.
- Lists mount in a staggered cascade (rows reveal one after another, 40–60ms apart). Never instant full-list pops.
- Perpetual micro-interactions: the Ember "listening" dot breathes, quota bars shimmer faintly when near capacity, the scheduling time ticks in Geist Mono.
- Animate only `transform` and `opacity`. Everything hardware-accelerated.

## 7. Anti-Patterns (Strictly Banned)

- No emojis anywhere in the UI.
- No `Inter`, no generic serifs, no serif of any kind in a dashboard.
- No pure black (`#000000`), no neon glows, no outer shadows, no purple/blue gradient palette.
- No emoji in buttons ("🚀 Publish"), no "sparkle" or gradient CTA.
- No 3-column equal card rows; no centered-hero dashboard headers.
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize", "Supercharge".
- No placeholder junk like "John Doe" or "Acme Corp"; no fake round stats like "99.9%".
- No filler UI: "Scroll to explore", bouncing chevrons, "Coming soon" buttons.
- No broken image links — no external Unsplash dependancy; prefer tasteful SVG/monochrome illustrations where a visual is needed.