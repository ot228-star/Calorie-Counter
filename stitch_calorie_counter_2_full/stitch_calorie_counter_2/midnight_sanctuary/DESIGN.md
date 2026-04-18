# Design System: The Mindful Guardian

## 1. Overview & Creative North Star
**Creative North Star: The Digital Sanctuary**

This design system is a departure from the frantic, data-heavy trackers of the past. It is built to feel like a "Mindful Guardian"—a calm, supportive presence that prioritizes peace of mind over rigid tracking. We achieve this by moving away from the "grid-and-line" template look, instead utilizing **Tonal Architecture**. 

The experience is defined by soft depth, generous breathing room, and intentional asymmetry. We treat the interface as a physical space—a quiet room at midnight—where information doesn't compete for attention but emerges softly from the shadows through layered surfaces and sophisticated typography.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the deep midnight of the soul, using high-chroma mints and emeralds to represent vitality and growth.

### Tonal separation over Hard Lines
*   **The No-Line Rule:** You are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts.
*   **Surface Hierarchy:** Use the `surface-container` tiers to create "nested" depth. 
    *   **Base:** `surface` (#0b1325) or `surface-container-lowest` (#060e20).
    *   **Sections:** Use `surface-container-low` (#131b2e) for secondary sections.
    *   **Cards:** Use `surface-container` (#171f32) or `surface-container-high` (#222a3d) to make elements "advance" toward the user.

### Signature Textures & Glass
*   **The Glass Rule:** For floating navigation or modal overlays, use `surface-bright` (#31394d) at 60% opacity with a `24px` backdrop blur. This ensures the midnight base "bleeds" through, maintaining the sanctuary feel.
*   **Vibrant Accents:** Use `primary` (#4edea2) for success states and `primary-container` (#08b77f) for secondary emphasis. `tertiary` (#44d8f1) is reserved exclusively for hydration and fluid metrics.

---

## 3. Typography
We use a dual-typeface system to balance authoritative "Editorial" flair with highly legible utility.

*   **Headlines & Heroes (Plus Jakarta Sans):** These are your "Editorial" voices. Use `display-lg` and `headline-md` for daily summaries and caloric goals. The wide aperture of Plus Jakarta Sans feels modern and inviting.
*   **Body & Labels (Manrope):** Chosen for its geometric stability. All numeric data—calories, macros, timestamps—must use **Tabular Figures** (`font-variant-numeric: tabular-nums`) to ensure that numbers align perfectly in lists, maintaining a sense of order.
*   **Visual Hierarchy:** Use `on-surface-variant` (#bbcabf) for all secondary labels. This muted mint-grey reduces visual noise, allowing the primary white text (`on-surface`) to lead the eye.

---

## 4. Elevation & Depth
Depth in this system is organic, not artificial.

*   **The Layering Principle:** Instead of shadows, stack containers. Place a `surface-container-highest` card inside a `surface-container-low` wrapper. The delta in luminance creates a natural lift.
*   **Ambient Shadows:** If a card must "float" (e.g., a meal log entry), use an ultra-diffused shadow: `0px 20px 40px rgba(0, 0, 0, 0.4)`. The shadow must never be pure black; it should feel like an absence of light in a deep blue room.
*   **The Ghost Border Fallback:** If a layout feels too "muddy," use a `1px` stroke of `outline-variant` (#3c4a42) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons & Interaction
*   **Primary CTA:** Pill-shaped (`rounded-full`), using a subtle linear gradient from `primary` (#4edea2) to `primary-container` (#08b77f). This adds "soul" to the action.
*   **Secondary Action:** Ghost style with `title-sm` typography. No container, just a soft `primary` text color.

### Progress & Metrics
*   **Friendly Progress Bars:** Use a `12px` (thick) height with `rounded-full` caps. The track should be `surface-container-highest`, and the fill should be a soft gradient of `primary`.
*   **Food Thumbnails:** Always use `rounded-md` (1.5rem). This softens the "tech" feel of the imagery, making the food feel more integrated into the UI.

### Cards & Lists
*   **Meal Cards:** Forbid divider lines between entries. Use a `16px` vertical gap.
*   **Selection Chips:** Use `rounded-full` with `surface-container-high` as the unselected state. When selected, animate to `primary` with `on-primary` text.

### Inputs
*   **The Sanctuary Input:** Use `surface-container-low` for the field background. On focus, do not use a heavy border; instead, transition the background to `surface-container-high` and add a soft `2px` outer glow in `primary` at 20% opacity.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical margins (e.g., more padding at the bottom than the top) to give the layout an editorial, premium feel.
*   **Do** use `tertiary-container` (#00b1c8) for water tracking to differentiate "fluids" from "nutrients."
*   **Do** leverage "White Space" as a functional element. If a screen feels busy, increase the gap between tonal surfaces.

### Don’t
*   **Don’t** use pure black (#000000). It breaks the "midnight sanctuary" immersion.
*   **Don’t** use 100% opaque borders. They are the enemy of this system’s softness.
*   **Don’t** use standard "drop shadows" with 0 blur. Everything must feel diffused and atmospheric.
*   **Don’t** crowd the "Hero Numbers." If the user has met their goal, let that number breathe in the center of the screen using `display-lg`.