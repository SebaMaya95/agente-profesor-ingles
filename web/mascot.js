// Colly, la mascota: un border collie animado, dibujado en SVG (personaje original).
// Estados de ánimo: happy, cheer, sad, think.

const FUR = "#1a2440";
const FUR_LIGHT = "#33406a";
const WHITE = "#ffffff";
const TAN = "#e6b070";
const NOSE = "#0a0e1c";
const TONGUE = "#ff7d92";

const eyes = (mood) => {
  if (mood === "cheer") {
    // ojos felices cerrados (arcos)
    return `<path d="M72 104q12-16 24 0" fill="none" stroke="${WHITE}" stroke-width="6" stroke-linecap="round"/>
            <path d="M124 104q12-16 24 0" fill="none" stroke="${WHITE}" stroke-width="6" stroke-linecap="round"/>`;
  }
  const eye = (cx) => `
    <ellipse cx="${cx}" cy="104" rx="14" ry="${mood === "sad" ? 13 : 15}" fill="${WHITE}"/>
    <circle cx="${cx + (mood === "think" ? 3 : 0)}" cy="${mood === "sad" ? 108 : 105}" r="8.5" fill="#5a3b22"/>
    <circle cx="${cx + (mood === "think" ? 3 : 0)}" cy="${mood === "sad" ? 108 : 105}" r="4.6" fill="${NOSE}"/>
    <circle cx="${cx + 3 + (mood === "think" ? 3 : 0)}" cy="${mood === "sad" ? 104 : 101}" r="2.6" fill="${WHITE}"/>`;
  return eye(84) + eye(136);
};

const brows = (mood) => {
  const tan = (x, y, r = 5) => `<ellipse cx="${x}" cy="${y}" rx="${r + 2}" ry="${r}" fill="${TAN}"/>`;
  if (mood === "sad") return `${tan(76, 84)}${tan(144, 84)}`.replace(/cy="84"/g, 'cy="86"');
  if (mood === "think") return `${tan(76, 82)}${tan(144, 76, 6)}`;
  if (mood === "cheer") return `${tan(76, 80)}${tan(144, 80)}`;
  return `${tan(76, 84)}${tan(144, 84)}`;
};

const mouth = (mood) => {
  switch (mood) {
    case "cheer":
      return `<path d="M92 156q18 34 36 0z" fill="#7a1f3a"/><path d="M100 164q10 14 20 0q-10-6-20 0z" fill="${TONGUE}"/>`;
    case "sad":
      return `<path d="M110 152v6" stroke="${NOSE}" stroke-width="3.5" stroke-linecap="round"/>
              <path d="M96 168q14-12 28 0" fill="none" stroke="${NOSE}" stroke-width="3.5" stroke-linecap="round"/>`;
    case "think":
      return `<path d="M110 152v5" stroke="${NOSE}" stroke-width="3.5" stroke-linecap="round"/>
              <path d="M98 162q12 6 24-2" fill="none" stroke="${NOSE}" stroke-width="3.5" stroke-linecap="round"/>`;
    default:
      return `<path d="M110 152v6" stroke="${NOSE}" stroke-width="3.5" stroke-linecap="round"/>
              <path d="M110 158q-8 10-18 4M110 158q8 10 18 4" fill="none" stroke="${NOSE}" stroke-width="3.5" stroke-linecap="round"/>
              <path d="M102 164q8 18 16 0z" fill="${TONGUE}"/>`;
  }
};

export function mascot(mood = "happy", size = 120) {
  const extra = mood === "think" ? `<g class="collie-q"><circle cx="186" cy="40" r="18" fill="#2f6bff"/><text x="186" y="48" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="24" fill="#fff">?</text></g>` : "";
  const sparkle = mood === "cheer" ? `<g fill="#ffc83d" class="collie-sparkle"><path d="M28 40l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><path d="M190 32l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/></g>` : "";
  return `<svg class="collie collie--${mood}" viewBox="0 0 220 220" width="${size}" height="${size}" role="img" aria-label="Colly, la mascota">
  <ellipse cx="110" cy="214" rx="62" ry="6" fill="#0f2748" opacity=".12"/>
  <path d="M34 220c0-38 32-58 76-58s76 20 76 58z" fill="${FUR}"/>
  <path d="M110 168c-14 14-16 34-12 52h24c4-18 2-38-12-52z" fill="${WHITE}"/>
  <g class="collie-ear collie-ear--l"><path d="M56 58C28 54 12 92 22 128c5 16 24 12 34-6 8-15 14-46 0-64z" fill="${FUR}"/><path d="M50 76c-14 4-18 26-14 42 2 8 10 6 14-2 4-10 6-30 0-40z" fill="${FUR_LIGHT}"/></g>
  <g class="collie-ear collie-ear--r"><path d="M164 58c28-4 44 34 34 70-5 16-24 12-34-6-8-15-14-46 0-64z" fill="${FUR}"/><path d="M170 76c14 4 18 26 14 42-2 8-10 6-14-2-4-10-6-30 0-40z" fill="${FUR_LIGHT}"/></g>
  <ellipse cx="110" cy="104" rx="64" ry="58" fill="${FUR}"/>
  <path d="M110 44c-10 12-13 32-15 52-2 18-12 34-12 52 0 14 12 22 27 22s27-8 27-22c0-18-10-34-12-52-2-20-5-40-15-52z" fill="${WHITE}"/>
  ${brows(mood)}
  ${eyes(mood)}
  <ellipse cx="110" cy="140" rx="13" ry="10" fill="${NOSE}"/>
  <ellipse cx="105" cy="136" rx="4" ry="2.4" fill="#fff" opacity=".55"/>
  ${mouth(mood)}
  <path d="M68 172q42 30 84 0l-6 20q-36 22-72 0z" fill="#2f6bff"/>
  <path d="M68 172q42 30 84 0" fill="none" stroke="#1d4fd1" stroke-width="3"/>
  <circle cx="92" cy="186" r="3" fill="#fff" opacity=".85"/><circle cx="110" cy="192" r="3" fill="#fff" opacity=".85"/><circle cx="128" cy="186" r="3" fill="#fff" opacity=".85"/>
  ${extra}${sparkle}
</svg>`;
}
