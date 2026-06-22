/**
 * Editorial Density palette — JS-accessible mirror of the CSS variables in
 * `globals.css`. Some components style via inline `style={}` rather than
 * Tailwind utilities (mostly because they animate or compute colors), so
 * they pull these constants instead of repeating hex literals.
 */

export const NAVY          = "#1B2840";
/* navy-700 — заливки действий/данных: чат-бабблы, серии графиков (решение 2026-06-22, DESIGN.md).
   Текст/цифры остаются на NAVY (navy-900). */
export const NAVY_700      = "#2A3654";
export const NAVY_300      = "#8892AA";
export const GOLD          = "#B89548";
export const BORDER        = "#D9D3C2";
export const T2            = "#5C6478";
export const T3            = "#8A8B87";
export const SURFACE       = "#F5F2EA";
export const SURFACE_RAISE = "#FBF9F3";
export const SURFACE_MUTED = "#E5E0D2";
export const CANVAS_BG     = "#EDE9E0";

/* Slate-blue ramp — extracted from the inner rings of the reference palette.
   SLATE_MID is the mid ring; SLATE_INNER is the innermost (softest) ring.
   INSIGHT_CARD_BG is SLATE_INNER at ~30% opacity over SURFACE_RAISE — used
   as the insight card surface so source nodes read as distinctly cool against
   the warm canvas. */
export const SLATE_MID       = "#A9AFBD";
export const SLATE_INNER     = "#D1D5DC";
export const INSIGHT_CARD_BG = "#F3F4F6";

/* Radius tokens — JS mirror of --radius-* in globals.css.
   RADIUS_BUBBLE is intentionally NOT shared with mode-switcher tabs (which
   are square, 0). Two independent decisions — one structural, one conversational. */
export const RADIUS_BUBBLE = 4;

/* Card / spacing constants — used by the canvas layout maths. */
export const CARD_W     = 200;   /* insight card width (reduced for compact layout) */
export const HERO_W     = 360;
export const CARD_H_EST = 130;   /* realistic insight card height estimate */
export const COL_GAP    = 14;
