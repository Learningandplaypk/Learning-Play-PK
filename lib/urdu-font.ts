/**
 * Deferred Noto Nastaliq Urdu @font-face.
 *
 * The woff2 files are copied to public/fonts/ by scripts/copy-urdu-font.mjs
 * (prebuild / predev). We never request /fonts/urdu.css — that 404'd on every
 * page because the stylesheet was never written and public/fonts was gitignored.
 *
 * The face is injected as an inline <style> on first engagement or 1.5s after
 * load, so Urdu never competes with LCP for bandwidth.
 */

export const URDU_FONT_FAMILY = "Noto Nastaliq Urdu Variable";

export const URDU_FONT_FILES = [
  "noto-nastaliq-urdu-arabic-wght-normal.woff2",
  "noto-nastaliq-urdu-latin-wght-normal.woff2",
] as const;

export const URDU_FONT_CSS = `@font-face{font-family:'${URDU_FONT_FAMILY}';font-style:normal;font-display:swap;font-weight:400 700;src:url('/fonts/noto-nastaliq-urdu-arabic-wght-normal.woff2') format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB;}@font-face{font-family:'${URDU_FONT_FAMILY}';font-style:normal;font-display:swap;font-weight:400 700;src:url('/fonts/noto-nastaliq-urdu-latin-wght-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}`;

/** Inline bootstrap — zero extra network request for a stylesheet. */
export const URDU_FONT_BOOTSTRAP = `(function(){var done=false;function flip(){if(done)return;done=true;if(!document.getElementById('urdu-font-face')){var s=document.createElement('style');s.id='urdu-font-face';s.textContent=${JSON.stringify(URDU_FONT_CSS)};document.head.appendChild(s);}['scroll','touchstart','pointerdown','keydown'].forEach(function(e){removeEventListener(e,flip,{capture:true});});}if(document.readyState==='complete'){setTimeout(flip,0);}addEventListener('load',function(){['scroll','touchstart','pointerdown','keydown'].forEach(function(e){addEventListener(e,flip,{capture:true,once:true,passive:true});});setTimeout(flip,1500);});})();`;
