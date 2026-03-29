# The Design System: Editorial Excellence for Modern Banking

## 1. Overview & Creative North Star
**The Creative North Star: "The Civic Luminary"**

Banking for the people of India requires more than just a functional interface; it requires an experience that feels both transitionally authoritative and digitally progressive. This design system moves away from the "generic blue-box" banking template. Instead, we adopt a **High-End Editorial** approach. 

We break the standard grid through **intentional asymmetry** and **tonal depth**. By utilizing large-scale typography and overlapping elements, we create a sense of curation. The interface should feel like a premium financial journal—spacious, organized, and deeply trustworthy. We aren't just building a portal; we are building a digital institution.

---

## 2. Colors & Tonal Architecture
The palette is rooted in the heritage of `primary: #002361` but elevated through a sophisticated Material 3 tonal structure.

### The "No-Line" Rule
To achieve a signature premium look, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through background shifts. For instance, a `surface-container-low` section should sit against a `surface` background to create a clean, modern break without the visual "noise" of lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the container tokens to create "nested" depth:
- **Base Layer:** `surface` (#f7f9ff)
- **Secondary Content:** `surface-container-low` (#edf4ff)
- **Interactive Cards:** `surface-container-lowest` (#ffffff)
- **High-Emphasis Overlays:** `surface-container-highest` (#d1e4fb)

### The "Glass & Gradient" Rule
To escape a "flat" appearance, apply **Glassmorphism** to floating elements (like Navigation Bars or Quick Action menus). Use `surface` colors at 80% opacity with a `20px` backdrop blur. 
**Signature Textures:** Use subtle linear gradients for hero backgrounds, transitioning from `primary` (#002361) to `primary_container` (#1B3A7D) at a 135-degree angle. This adds "visual soul" and professional polish.

---

## 3. Typography: The Editorial Voice
Our typography balances the architectural strength of **Manrope** for headers with the human-centric legibility of **Public Sans** for data.

- **Display (Manrope):** Use `display-lg` (3.5rem) for hero statements. The sheer scale conveys institutional power.
- **Headlines (Manrope):** `headline-md` (1.75rem) should be used with generous leading to ensure an editorial feel.
- **Body (Public Sans):** `body-lg` (1rem) is our workhorse. It must remain airy and readable.
- **Labels (Public Sans):** `label-md` (0.75rem) in `on_surface_variant` (#444650) provides a sophisticated metadata layer.

**Hierarchy Tip:** Contrast a `display-sm` headline with a `label-md` uppercase tag above it to create an "Article Header" look that feels more curated than a standard web form.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often a crutch for poor spacing. This design system prioritizes **Tonal Layering.**

- **The Layering Principle:** Place a `surface-container-lowest` card (Pure White) on a `surface-container-low` background. The slight shift in hex value creates a "soft lift" that is easier on the eyes than a shadow.
- **Ambient Shadows:** For floating modals or "Primary CTAs," use extra-diffused shadows. 
    - *Formula:* `0px 12px 32px rgba(9, 29, 46, 0.06)`. Note the use of the `on_surface` color for the shadow tint rather than pure black.
- **The "Ghost Border" Fallback:** If accessibility requires a container edge, use the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components: Refined Interaction

### Buttons
- **Primary:** `primary_container` (#1B3A7D) background, White text. `xl` (0.75rem) corner radius. Use 16px 32px padding to give the button "authority."
- **Secondary:** `surface_container_high` background with `on_primary_fixed_variant` text. No border.
- **Tertiary:** Text-only, using `primary` color, with an icon-suffix for direction.

### Cards & Data Lists
- **Rule:** Forbid divider lines. 
- **Execution:** Separate list items using `spacing-4` (1rem) of vertical white space or by alternating background tints between `surface` and `surface-container-low`.
- **Corner Radius:** All cards must use `xl` (0.75rem / 12px) to soften the professional tone and make it feel modern.

### Input Fields
- **Default State:** `surface_container_low` background, no border, `lg` (0.5rem) radius.
- **Focus State:** `surface_container_lowest` background with a 2px `primary` (#002361) "Ghost Border" at 40% opacity. This "glow" effect feels more modern than a hard line.

### Additional Signature Components
- **The Progress Rail:** For multi-step banking forms, use a thin `surface_variant` rail with a `secondary` (#006b58) active fill.
- **Micro-Stats:** Small cards using `tertiary_container` (#593600) backgrounds and `on_tertiary_fixed` text to highlight interest rates or account balances.

---

## 6. Do’s and Don’ts

### Do:
- **Use Intentional Asymmetry:** Align a headline to the left and a supporting body paragraph to the right of a 12-column grid to create visual interest.
- **Embrace White Space:** Use `3xl` (64px) spacing between major sections to let the content breathe.
- **Layer Textures:** Place "Glass" elements over subtle gradient backgrounds to create a sense of premium materiality.

### Don’t:
- **Don't use pure black text:** Always use `on_surface` (#091d2e). It’s softer and more sophisticated.
- **Don't use 1px borders:** They clutter the UI. Use color shifts instead.
- **Don't crowd the margins:** Banking info is stressful; the UI should be the opposite. If it feels "packed," double your spacing tokens.
- **Don't use "Drop Shadows" on everything:** If a component doesn't move or float, it doesn't need a shadow. Use tonal shifts.