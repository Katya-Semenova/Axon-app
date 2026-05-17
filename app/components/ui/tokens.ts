/**
 * Editorial Density palette — JS-accessible mirror of the CSS variables in
 * `globals.css`. Some components style via inline `style={}` rather than
 * Tailwind utilities (mostly because they animate or compute colors), so
 * they pull these constants instead of repeating hex literals.
 */

export const NAVY          = "#1B2840";
export const NAVY_300      = "#8892AA";
export const GOLD          = "#B89548";
export const BORDER        = "#D9D3C2";
export const T2            = "#5C6478";
export const T3            = "#8A8B87";
export const SURFACE       = "#F5F2EA";
export const SURFACE_RAISE = "#FBF9F3";
export const SURFACE_MUTED = "#E5E0D2";
export const CANVAS_BG     = "#EDE9E0";

/* Card / spacing constants — used by the canvas layout maths. */
export const CARD_W     = 240;
export const HERO_W     = 360;
export const CARD_H_EST = 254;
export const COL_GAP    = 14;
