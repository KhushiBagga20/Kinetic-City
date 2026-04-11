# Design System Specification: High-End Editorial Finance

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Architect."** 

This system rejects the static, boxy constraints of traditional fintech. It draws inspiration from high-end editorial layouts where typography acts as a structural element and negative space is as communicative as the content itself. By utilizing a deep, atmospheric base (`#00161b`) and a high-voltage accent (`#cdff9a`), we create a "dark-mode-first" experience that feels premium, authoritative, and energetic. We break the "template" look through intentional asymmetry—letting headlines bleed across container boundaries and using overlapping glass layers to create a sense of three-dimensional depth.

---

## 2. Colors
Our palette is rooted in tonal depth and extreme contrast. The primary relationship is between the midnight depths of the surface and the radioactive glow of the primary accents.

*   **Primary Accent (`primary` / `#ffffff` & `primary_fixed` / `#c0f18e`):** White is used for core readability, while the "Electric Lime" (`#c0f18e`) is reserved for high-impact CTAs and critical data highlights.
*   **The Atmospheric Base (`surface` / `#00161b`):** This is the foundation. It provides the "ink-trap" depth required for the lime accent to vibrate visually.
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be defined solely through background color shifts. Transition from `surface` to `surface_container_low` or `surface_bright` (`#203d43`) to denote a change in context.
*   **Surface Hierarchy & Nesting:** Treat the UI as stacked sheets of glass. An inner card should not have a border; it should be a `surface_container_high` element sitting on a `surface_dim` background.
*   **The "Glass & Gradient" Rule:** Use `surface_container_highest` with a 60% opacity and a `20px` backdrop-blur for floating navigation or modal overlays. For hero sections, use a subtle linear gradient from `surface_bright` to `surface_container_lowest` to create a sense of infinite vertical space.

---

## 3. Typography
Typography is the "Architecture" of this system. We use **Manrope** for its technical precision and **Inter** for functional clarity.

*   **Display (`display-lg` / 3.5rem):** Used for "The Game-Changer" headlines. Mirror the reference image: use wide letter-spacing (-0.02em) and force intentional line breaks to create asymmetrical blocks of text.
*   **Headline (`headline-lg` / 2rem):** Professional and impactful. Headlines should always be `on_surface` (white/light cyan) to ensure they pierce the dark background.
*   **Body (`body-lg` / 1rem):** Set in Manrope for an editorial feel. Use generous line-height (1.6) to maintain the "premium" and "spacious" requirement.
*   **Labels (`label-md` / 0.75rem):** Set in Inter. These are functional "metadata" tags. Use `on_surface_variant` to keep them secondary to the primary narrative.

---

## 4. Elevation & Depth
In this design system, light does not come from "above"—it emerges from the layering of the materials themselves.

*   **The Layering Principle:** Depth is achieved by "stacking" tonal tiers.
    *   *Level 0:* `surface_container_lowest` (Background)
    *   *Level 1:* `surface_container` (Content Sections)
    *   *Level 2:* `surface_container_high` (Interactive Cards)
*   **Ambient Shadows:** If a card must float, use a shadow with a 40px blur, 0% spread, and 6% opacity. The shadow color must be `surface_container_lowest` (a deep teal-black) to maintain a naturalistic feel.
*   **The "Ghost Border" Fallback:** For input fields or high-density data tables, use the `outline_variant` token at **15% opacity**. This creates a "suggestion" of a container without breaking the editorial flow.
*   **Signature Glow:** For primary buttons, apply a subtle outer glow using the `primary_fixed` color (`#c0f18e`) at 20% opacity to simulate a light-emitting diode.

---

## 5. Components

### Buttons
*   **Primary:** Background: `primary_fixed` (`#c0f18e`), Text: `on_primary_fixed` (`#0e2000`). Shape: `full` (pill). No border. The high contrast between lime and black-green is the primary driver of energy.
*   **Secondary/Ghost:** Background: `none`, Text: `primary` (white), Border: `outline` at 20% opacity. 

### Cards
*   **Editorial Card:** Background: `surface_container_low`. Corner Radius: `xl` (`0.75rem`). Use padding of `2rem` (32px) minimum to ensure the "spacious" feel. Never use dividers; use `32px` of vertical whitespace to separate header from body.

### Input Fields
*   **Modern Finance Input:** Background: `surface_container_highest`. Border: None. Bottom-border only (2px) using `primary_fixed` **only on focus**.

### Data Visualization (Finance Specific)
*   **Trend Lines:** Use `primary_fixed` for growth and `error` (`#ffb4ab`) for loss. Lines should be 2.5px thick with a soft glow effect.
*   **Balance Chips:** Use `secondary_container` with `on_secondary_container` text for a subtle, sophisticated "stashed" look.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts. Let a headline start on the far left and the body text start in the center-right column.
*   **Do** use large amounts of `surface` space. If you think there is enough padding, add 16px more.
*   **Do** use `primary_fixed` (`#c0f18e`) sparingly. It is a laser, not a paint bucket. Use it to guide the eye to the "Deposit" or "Sign Up" button.

### Don't:
*   **Don't** use pure black `#000000`. It kills the atmospheric depth of the `#203d43` (Surface Bright) and `#00161b` (Surface) relationship.
*   **Don't** use standard 1px grey dividers. They make the application look like a spreadsheet. Use tonal shifts.
*   **Don't** center-align everything. Modern editorial design relies on the tension created by off-center elements and varying weights.