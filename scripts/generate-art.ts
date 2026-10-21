/**
 * مُولّد الأصول البصرية الأصلية لـ Loomix.
 * ينتج بوستر (2:3) وخلفية (16:9) لكل عمل بأسلوب سينمائي مجرّد:
 * هندسة قوية، مصدر ضوء واضح، وتدرّج لوني محدود.
 * لا نص عربي داخل الصورة — العنوان يُعرض بطباعة الموقع فوق البوستر.
 *
 * التشغيل: npm run art:generate
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import sharp from "sharp";
import { join } from "node:path";
import { CATALOG, type ArtVariant, type PaletteKey } from "../db/catalog";

type Palette = {
  night: string; // أقصى لون داكن في السماء
  deep: string; // لون الكتلة الأساسي
  mid: string; // كتلة أقرب للضوء
  accent: string; // لون الضوء المميز
  glow: string; // قلب الضوء
  cool: string; // لون بارد للتباين
};

const PALETTES: Record<PaletteKey, Palette> = {
  brass: { night: "#05070B", deep: "#0C131C", mid: "#1E2B3B", accent: "#E8B466", glow: "#FFE7BE", cool: "#5D7C9B" },
  sand: { night: "#070503", deep: "#120D07", mid: "#2C2011", accent: "#EFC27A", glow: "#FFEDCB", cool: "#7A6A4E" },
  ember: { night: "#070403", deep: "#130A07", mid: "#2E160D", accent: "#F58F4B", glow: "#FFD3AC", cool: "#7C4A3A" },
  teal: { night: "#020706", deep: "#06120F", mid: "#0F2C26", accent: "#6ED0B6", glow: "#C6F8EB", cool: "#2F6E7A" },
  oxblood: { night: "#060305", deep: "#11070A", mid: "#2C1018", accent: "#DC6B74", glow: "#FFC0C4", cool: "#6E3A52" },
  indigo: { night: "#03040A", deep: "#070A18", mid: "#141E42", accent: "#9AABFF", glow: "#E0E5FF", cool: "#4B5A9C" },
  steel: { night: "#04060A", deep: "#0A1119", mid: "#1D2A39", accent: "#B2CBE2", glow: "#F0F8FF", cool: "#587087" },
  violet: { night: "#05030A", deep: "#0D0715", mid: "#241138", accent: "#C58FF2", glow: "#EFD6FF", cool: "#6C4A8E" },
  forest: { night: "#030705", deep: "#06100A", mid: "#123020", accent: "#A2D19B", glow: "#E2FBDE", cool: "#4A7A5C" },
  cyan: { night: "#020609", deep: "#05101A", mid: "#0B2637", accent: "#5ED6EE", glow: "#C3F7FF", cool: "#2F7082" },
};

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = {
  w: number;
  h: number;
  p: Palette;
  r: () => number;
  seed: string;
  wide: boolean;
};

const f = (n: number) => Math.round(n * 100) / 100;

function defs(ctx: Ctx) {
  const { p, seed, w } = ctx;
  const g = seed;
  return `<defs>
    <linearGradient id="${g}-sky" x1="0" y1="0" x2="0.15" y2="1">
      <stop offset="0" stop-color="${p.night}"/>
      <stop offset="0.55" stop-color="${p.deep}"/>
      <stop offset="1" stop-color="${p.mid}"/>
    </linearGradient>
    <radialGradient id="${g}-sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${p.glow}" stop-opacity="1"/>
      <stop offset="0.28" stop-color="${p.accent}" stop-opacity="0.85"/>
      <stop offset="0.62" stop-color="${p.accent}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${g}-halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${p.accent}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${g}-beam" x1="0" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="${p.glow}" stop-opacity="0.55"/>
      <stop offset="0.3" stop-color="${p.accent}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${g}-slab" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${p.night}"/>
      <stop offset="0.7" stop-color="${p.deep}"/>
      <stop offset="1" stop-color="${p.mid}"/>
    </linearGradient>
    <linearGradient id="${g}-rim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${p.glow}" stop-opacity="0"/>
      <stop offset="0.55" stop-color="${p.glow}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${p.glow}" stop-opacity="0.1"/>
    </linearGradient>
    <radialGradient id="${g}-vig" cx="0.5" cy="0.42" r="0.8">
      <stop offset="0.5" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
    </radialGradient>
    <linearGradient id="${g}-floorlight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.accent}" stop-opacity="0.4"/>
      <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${g}-safe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.night}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${p.night}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.92"/>
    </linearGradient>
    <filter id="${g}-soft"><feGaussianBlur stdDeviation="${f(w * 0.035)}"/></filter>
    <filter id="${g}-grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>`;
}

const stars = (ctx: Ctx, count: number, maxY: number) =>
  Array.from({ length: count }, () => {
    const x = ctx.r() * ctx.w;
    const y = ctx.r() * maxY;
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.6 + ctx.r() * 1.3)}" fill="${ctx.p.cool}" opacity="${f(0.15 + ctx.r() * 0.45)}"/>`;
  }).join("");

/** قطرة ضوء: حزمة ضوئية من نقطة أعلى الإطار */
function beam(ctx: Ctx) {
  const { w, h, p, seed, r } = ctx;
  const ox = w * (0.58 + r() * 0.16);
  const oy = -h * 0.06;
  const spreadTop = w * 0.06;
  const spreadBottom = w * (0.62 + r() * 0.16);
  const hitY = h * (0.72 + r() * 0.08);
  const hitX = ox - w * 0.16;

  const seats = Array.from({ length: 5 }, (_, i) => {
    const y = hitY + (h - hitY) * (i / 5) + h * 0.02;
    const scale = 1 + i * 0.28;
    return `<rect x="${f(hitX - w * 0.34 * scale)}" y="${f(y)}" width="${f(w * 0.68 * scale)}" height="${f(h * 0.05 * scale + 2)}" rx="${f(h * 0.012 * scale)}" fill="#000" opacity="${f(0.55 - i * 0.06)}"/>`;
  }).join("");

  return `<g>
    <rect width="${w}" height="${h}" fill="url(#${seed}-sky)"/>
    ${stars(ctx, 26, h * 0.55)}
    <polygon points="${f(ox - spreadTop)},${f(oy)} ${f(ox + spreadTop)},${f(oy)} ${f(ox + spreadBottom / 2)},${f(hitY)} ${f(ox - spreadBottom / 2)},${f(hitY)}" fill="url(#${seed}-beam)"/>
    <polygon points="${f(ox - spreadTop * 0.3)},${f(oy)} ${f(ox + spreadTop * 0.3)},${f(oy)} ${f(ox + spreadBottom * 0.14)},${f(hitY)} ${f(ox - spreadBottom * 0.14)},${f(hitY)}" fill="${p.glow}" opacity="0.22"/>
    <ellipse cx="${f(hitX)}" cy="${f(hitY)}" rx="${f(w * 0.34)}" ry="${f(h * 0.05)}" fill="url(#${seed}-halo)" opacity="0.9" filter="url(#${seed}-soft)"/>
    <rect y="${f(hitY)}" width="${w}" height="${f(h - hitY)}" fill="${p.night}" opacity="0.55"/>
    ${seats}
    <rect y="${f(hitY)}" width="${w}" height="${f(h - hitY)}" fill="url(#${seed}-floorlight)" opacity="0.35"/>
    <line x1="0" y1="${f(hitY)}" x2="${w}" y2="${f(hitY)}" stroke="${p.accent}" stroke-opacity="0.5" stroke-width="1.5"/>
    ${Array.from({ length: 40 }, () => {
      const x = hitX - w * 0.2 + r() * w * 0.3;
      const y = hitY - r() * h * 0.35;
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + r() * 1.1)}" fill="${p.glow}" opacity="${f(0.1 + r() * 0.35)}"/>`;
    }).join("")}
  </g>`;
}

/** كسوف: حلقة ضوء حول قرص مظلم */
function eclipse(ctx: Ctx) {
  const { w, h, p, seed, r } = ctx;
  const cx = w * (0.5 + (r() - 0.5) * 0.08);
  const cy = h * (0.38 + r() * 0.05);
  const rad = w * (0.26 + r() * 0.05);
  return `<g>
    <rect width="${w}" height="${h}" fill="url(#${seed}-sky)"/>
    ${stars(ctx, 34, h * 0.62)}
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad * 2.1)}" fill="url(#${seed}-halo)" opacity="0.55"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad * 1.22)}" fill="url(#${seed}-sun)" opacity="0.85"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad)}" fill="none" stroke="${p.glow}" stroke-width="${f(rad * 0.055)}" opacity="0.95"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad)}" fill="none" stroke="${p.glow}" stroke-width="${f(rad * 0.16)}" opacity="0.25" filter="url(#${seed}-soft)"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad * 0.94)}" fill="${p.night}"/>
    <path d="M0 ${f(h * 0.74)} Q ${f(w * 0.3)} ${f(h * 0.70)} ${f(w * 0.55)} ${f(h * 0.745)} T ${w} ${f(h * 0.72)} L ${w} ${h} L 0 ${h} Z" fill="${p.night}" opacity="0.96"/>
    <path d="M0 ${f(h * 0.74)} Q ${f(w * 0.3)} ${f(h * 0.70)} ${f(w * 0.55)} ${f(h * 0.745)} T ${w} ${f(h * 0.72)}" fill="none" stroke="${p.accent}" stroke-opacity="0.55" stroke-width="1.6"/>
    <ellipse cx="${f(cx)}" cy="${f(h * 0.77)}" rx="${f(w * 0.24)}" ry="${f(h * 0.02)}" fill="${p.accent}" opacity="0.3" filter="url(#${seed}-soft)"/>
  </g>`;
}

/** عدسة: قزحية سداسية */
function aperture(ctx: Ctx) {
  const { w, h, p, seed, r } = ctx;
  const cx = w * 0.5;
  const cy = h * (0.4 + r() * 0.04);
  const rad = w * 0.33;
  const blades = 6;
  const pts = Array.from({ length: blades }, (_, i) => {
    const a = (i / blades) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  });
  const inner = Array.from({ length: blades }, (_, i) => {
    const a = ((i + 0.5) / blades) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * rad * 0.34, cy + Math.sin(a) * rad * 0.34];
  });
  const poly = pts.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
  const bladeLines = pts
    .map(([x, y], i) => {
      const [ix, iy] = inner[(i + blades - 1) % blades];
      return `<line x1="${f(x)}" y1="${f(y)}" x2="${f(ix)}" y2="${f(iy)}" stroke="${p.glow}" stroke-opacity="0.5" stroke-width="1.4"/>`;
    })
    .join("");
  return `<g>
    <rect width="${w}" height="${h}" fill="url(#${seed}-sky)"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad * 1.5)}" fill="url(#${seed}-halo)" opacity="0.75"/>
    <polygon points="${poly}" fill="${p.night}" opacity="0.85"/>
    <polygon points="${poly}" fill="none" stroke="${p.accent}" stroke-opacity="0.6" stroke-width="2"/>
    ${bladeLines}
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad * 0.3)}" fill="url(#${seed}-sun)" opacity="0.9"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad * 0.09)}" fill="${p.glow}"/>
    ${Array.from({ length: 4 }, (_, i) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad * (1.12 + i * 0.18))}" fill="none" stroke="${p.accent}" stroke-opacity="${f(0.22 - i * 0.04)}" stroke-width="1"/>`).join("")}
    <rect y="${f(h * 0.82)}" width="${w}" height="${f(h * 0.18)}" fill="${p.night}" opacity="0.6"/>
    <line x1="0" y1="${f(h * 0.82)}" x2="${w}" y2="${f(h * 0.82)}" stroke="${p.accent}" stroke-opacity="0.28" stroke-width="1"/>
  </g>`;
}

/** كثبان: طبقات مع ضوء خلفي */
function dunes(ctx: Ctx) {
  const { w, h, p, seed, r } = ctx;
  const sunX = w * (0.62 + r() * 0.12);
  const sunY = h * (0.34 + r() * 0.05);
  const sunR = w * 0.055;
  let layers = "";
  const count = 5;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const y = h * (0.52 + t * 0.36);
    const amp = h * (0.075 - t * 0.008);
    const c1 = w * (0.12 + r() * 0.22);
    const c2 = w * (0.5 + r() * 0.34);
    const fill = i === 0 ? p.deep : i % 2 === 0 ? p.night : p.deep;
    layers += `<path d="M0 ${f(y)} C ${f(c1)} ${f(y - amp)}, ${f(c2)} ${f(y + amp * 0.8)}, ${w} ${f(y - amp * 0.3)} L ${w} ${h} L 0 ${h} Z" fill="${fill}" opacity="${f(0.98 - t * 0.05)}"/>`;
    layers += `<path d="M0 ${f(y)} C ${f(c1)} ${f(y - amp)}, ${f(c2)} ${f(y + amp * 0.8)}, ${w} ${f(y - amp * 0.3)}" fill="none" stroke="${p.accent}" stroke-opacity="${f(0.55 - t * 0.09)}" stroke-width="${f(1.8 - t * 0.2)}"/>`;
  }
  return `<g>
    <rect width="${w}" height="${h}" fill="url(#${seed}-sky)"/>
    <circle cx="${f(sunX)}" cy="${f(sunY)}" r="${f(w * 0.34)}" fill="url(#${seed}-sun)" opacity="0.9"/>
    <circle cx="${f(sunX)}" cy="${f(sunY)}" r="${f(sunR * 1.3)}" fill="${p.glow}" opacity="0.18" filter="url(#${seed}-soft)"/>
    <circle cx="${f(sunX)}" cy="${f(sunY)}" r="${f(sunR)}" fill="${p.glow}" opacity="0.95"/>
    ${layers}
    <path d="M0 ${f(h * 0.75)} Q ${f(w * 0.45)} ${f(h * 0.71)} ${w} ${f(h * 0.76)}" fill="none" stroke="${p.glow}" stroke-opacity="0.2" stroke-width="1"/>
  </g>`;
}

/** مسلّة: كتلة عمودية بحدّ ضوئي */
function monolith(ctx: Ctx) {
  const { w, h, p, seed, r } = ctx;
  const bw = w * (0.16 + r() * 0.05);
  const bx = w * (0.44 + r() * 0.14);
  const by = h * (0.13 + r() * 0.05);
  const bh = h * (0.6 + r() * 0.06);
  const lightX = bx - w * 0.2;
  return `<g>
    <rect width="${w}" height="${h}" fill="url(#${seed}-sky)"/>
    ${stars(ctx, 30, h * 0.6)}
    <circle cx="${f(lightX)}" cy="${f(h * 0.42)}" r="${f(w * 0.22)}" fill="url(#${seed}-halo)" opacity="0.8"/>
    <circle cx="${f(lightX)}" cy="${f(h * 0.42)}" r="${f(w * 0.026)}" fill="${p.glow}" opacity="0.9"/>
    <rect x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}" fill="url(#${seed}-slab)"/>
    <rect x="${f(bx)}" y="${f(by)}" width="${f(bw * 0.09)}" height="${f(bh)}" fill="url(#${seed}-rim)" opacity="0.9"/>
    <rect x="${f(bx + bw * 0.91)}" y="${f(by)}" width="${f(bw * 0.09)}" height="${f(bh)}" fill="${p.night}" opacity="0.6"/>
    <rect x="${f(bx - w * 0.1)}" y="${f(by + bh)}" width="${f(bw + w * 0.2)}" height="${f(h * 0.2)}" fill="url(#${seed}-floorlight)" opacity="0.5"/>
    <line x1="0" y1="${f(by + bh)}" x2="${w}" y2="${f(by + bh)}" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="1.4"/>
    ${Array.from({ length: 22 }, () => {
      const x = r() * w;
      const y = by + r() * h * 0.35;
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + r() * 1.2)}" fill="${p.glow}" opacity="${f(0.08 + r() * 0.3)}"/>`;
    }).join("")}
  </g>`;
}

/** مدينة: مبانٍ صامتة وخطوط متلاشية */
function grid(ctx: Ctx) {
  const { w, h, p, seed, r } = ctx;
  const horizon = h * (0.6 + r() * 0.04);
  const vpx = w * (0.46 + r() * 0.1);
  let towers = "";
  let x = -w * 0.05;
  while (x < w * 1.05) {
    const bw = w * (0.03 + r() * 0.075);
    const bh = h * (0.06 + r() * 0.22);
    towers += `<rect x="${f(x)}" y="${f(horizon - bh)}" width="${f(bw)}" height="${f(bh)}" fill="${p.night}"/>`;
    if (r() > 0.55) {
      towers += `<rect x="${f(x + bw * 0.18)}" y="${f(horizon - bh + bh * 0.18)}" width="${f(bw * 0.16)}" height="${f(bh * 0.12)}" fill="${p.accent}" opacity="${f(0.15 + r() * 0.4)}"/>`;
    }
    x += bw + w * (0.004 + r() * 0.02);
  }
  let avenues = "";
  for (let i = -9; i <= 9; i++) {
    const tx = vpx + i * w * 0.15;
    avenues += `<line x1="${f(vpx)}" y1="${f(horizon)}" x2="${f(tx)}" y2="${h}" stroke="${p.accent}" stroke-opacity="${f(0.05 + Math.abs(i) * 0.004)}" stroke-width="1"/>`;
  }
  let cross = "";
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const y = horizon + Math.pow(t, 2.2) * (h - horizon);
    cross += `<line x1="0" y1="${f(y)}" x2="${w}" y2="${f(y)}" stroke="${p.accent}" stroke-opacity="${f(0.04 + t * 0.1)}" stroke-width="1"/>`;
  }
  return `<g>
    <rect width="${w}" height="${h}" fill="url(#${seed}-sky)"/>
    <circle cx="${f(vpx)}" cy="${f(horizon)}" r="${f(w * 0.3)}" fill="url(#${seed}-halo)" opacity="0.9"/>
    <circle cx="${f(vpx)}" cy="${f(horizon - h * 0.005)}" r="${f(w * 0.045)}" fill="url(#${seed}-sun)" opacity="0.95"/>
    ${towers}
    <rect y="${f(horizon)}" width="${w}" height="${f(h - horizon)}" fill="${p.night}" opacity="0.6"/>
    ${avenues}
    ${cross}
    <line x1="0" y1="${f(horizon)}" x2="${w}" y2="${f(horizon)}" stroke="${p.glow}" stroke-opacity="0.6" stroke-width="1.6"/>
  </g>`;
}

/** حلقات: مدارات حول نواة */
function rings(ctx: Ctx) {
  const { w, h, p, seed, r } = ctx;
  const cx = w * 0.5;
  const cy = h * (0.42 + r() * 0.04);
  const core = w * 0.035;
  let out = "";
  for (let i = 0; i < 11; i++) {
    const rr = w * (0.09 + i * 0.042);
    out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="none" stroke="${i % 3 === 0 ? p.accent : p.cool}" stroke-opacity="${f(Math.max(0.06, 0.34 - i * 0.024))}" stroke-width="${i % 3 === 0 ? 1.6 : 1}"/>`;
  }
  const arc = `${f(cx - w * 0.32)} ${f(cy)} A ${f(w * 0.32)} ${f(h * 0.1)} 0 1 1 ${f(cx + w * 0.32)} ${f(cy)}`;
  return `<g>
    <rect width="${w}" height="${h}" fill="url(#${seed}-sky)"/>
    ${stars(ctx, 40, h * 0.7)}
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(w * 0.26)}" fill="url(#${seed}-halo)" opacity="0.7"/>
    ${out}
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(core * 2.6)}" fill="url(#${seed}-sun)" opacity="0.55"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(core)}" fill="${p.glow}"/>
    <ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(w * 0.32)}" ry="${f(h * 0.1)}" fill="none" stroke="${p.glow}" stroke-opacity="0.35" stroke-width="1.4" transform="rotate(-14 ${f(cx)} ${f(cy)})"/>
    <path d="M0 ${f(h * 0.8)} Q ${f(w * 0.5)} ${f(h * 0.76)} ${w} ${f(h * 0.81)} L ${w} ${h} L 0 ${h} Z" fill="${p.night}" opacity="0.9"/>
  </g>`;
}

/** قوس: فتحة معمارية مضاءة */
function arch(ctx: Ctx) {
  const { w, h, p, seed, r } = ctx;
  const aw = w * (0.4 + r() * 0.08);
  const ax = (w - aw) / 2 + (r() - 0.5) * w * 0.05;
  const top = h * (0.14 + r() * 0.04);
  const bottom = h * 0.84;
  const radius = aw / 2;
  const d = `M ${f(ax)} ${f(bottom)} L ${f(ax)} ${f(top + radius)} A ${f(radius)} ${f(radius)} 0 0 1 ${f(ax + aw)} ${f(top + radius)} L ${f(ax + aw)} ${f(bottom)} Z`;
  return `<g>
    <rect width="${w}" height="${h}" fill="url(#${seed}-sky)"/>
    <ellipse cx="${f(w * 0.5)}" cy="${f(bottom * 0.98)}" rx="${f(w * 0.5)}" ry="${f(h * 0.35)}" fill="url(#${seed}-halo)" opacity="0.35" filter="url(#${seed}-soft)"/>
    <path d="${d}" fill="${p.mid}"/>
    <path d="${d}" fill="url(#${seed}-sun)" opacity="0.55"/>
    <clipPath id="${seed}-clip"><path d="${d}"/></clipPath>
    <g clip-path="url(#${seed}-clip)">
      <rect x="${f(ax)}" y="${f(top + radius * 0.9)}" width="${f(aw)}" height="${f(h)}" fill="${p.night}" opacity="0.55"/>
      <rect x="${f(ax + aw * 0.42)}" y="${f(top + radius * 0.7)}" width="${f(aw * 0.16)}" height="${f(h)}" fill="${p.glow}" opacity="0.14"/>
      ${Array.from({ length: 5 }, (_, i) => `<rect x="${f(ax + aw * (0.06 + i * 0.19))}" y="${f(top + radius)}" width="${f(aw * 0.045)}" height="${f(bottom)}" fill="${p.night}" opacity="0.5"/>`).join("")}
    </g>
    <path d="${d}" fill="none" stroke="${p.accent}" stroke-opacity="0.75" stroke-width="2"/>
    <path d="${d}" fill="none" stroke="${p.glow}" stroke-opacity="0.18" stroke-width="7"/>
    <rect x="0" y="${f(bottom)}" width="${w}" height="${f(h - bottom)}" fill="${p.night}"/>
    <rect x="0" y="${f(bottom)}" width="${w}" height="${f(h * 0.09)}" fill="url(#${seed}-floorlight)" opacity="0.4"/>
    <line x1="0" y1="${f(bottom)}" x2="${w}" y2="${f(bottom)}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="1.5"/>
  </g>`;
}

const RENDERERS: Record<ArtVariant, (ctx: Ctx) => string> = {
  beam,
  eclipse,
  aperture,
  dunes,
  monolith,
  grid,
  rings,
  arch,
};

function svgFor(variant: ArtVariant, palette: PaletteKey, slug: string, w: number, h: number, wide: boolean, grain = true) {
  const p = PALETTES[palette];
  const seed = `a${hash(slug).toString(36)}`;
  const ctx: Ctx = { w, h, p, r: rng(hash(slug + variant)), seed, wide };
  const body = RENDERERS[variant](ctx);
  const baseline = h - (wide ? 22 : 40);
  const label = `<g opacity="${wide ? 0.55 : 0.6}">
    <line x1="${f(w / 2 - (wide ? 78 : 52))}" y1="${f(baseline - 5)}" x2="${f(w / 2 - (wide ? 38 : 26))}" y2="${f(baseline - 5)}" stroke="${p.glow}" stroke-opacity="0.45" stroke-width="1"/>
    <line x1="${f(w / 2 + (wide ? 38 : 26))}" y1="${f(baseline - 5)}" x2="${f(w / 2 + (wide ? 78 : 52))}" y2="${f(baseline - 5)}" stroke="${p.glow}" stroke-opacity="0.45" stroke-width="1"/>
    <text x="${f(w / 2)}" y="${f(baseline)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${wide ? 12 : 11}" letter-spacing="${wide ? 8 : 7}" fill="${p.glow}">LOOMIX</text>
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
    ${defs(ctx)}
    ${body}
    <rect width="${w}" height="${h}" fill="url(#${seed}-vig)"/>
    ${grain ? `<rect width="${w}" height="${h}" filter="url(#${seed}-grain)" opacity="${wide ? 0.045 : 0.06}"/>` : ""}
    <rect y="${f(h * (wide ? 0.45 : 0.55))}" width="${w}" height="${f(h * (wide ? 0.55 : 0.45))}" fill="url(#${seed}-safe)"/>
    ${label}
  </svg>`;
}

async function main() {
  const outDir = join(process.cwd(), "public", "art");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  let count = 0;
  const raster = async (svg: string, file: string, quality = 82) => {
    await sharp(Buffer.from(svg), { density: 96 }).webp({ quality, effort: 5 }).toFile(file);
    count += 1;
  };

  for (const item of CATALOG) {
    writeFileSync(join(outDir, `poster-${item.slug}.svg`), svgFor(item.art.variant, item.art.palette, item.slug, 1000, 1500, false), "utf8");
    writeFileSync(join(outDir, `backdrop-${item.slug}.svg`), svgFor(item.art.variant, item.art.palette, item.slug, 1920, 1080, true), "utf8");
    count += 2;
    await raster(svgFor(item.art.variant, item.art.palette, item.slug, 1000, 1500, false, false), join(outDir, `poster-${item.slug}.webp`), 86);
    await raster(svgFor(item.art.variant, item.art.palette, item.slug, 1920, 1080, true, false), join(outDir, `backdrop-${item.slug}.webp`), 84);
  }

  const og = svgFor("beam", "brass", "loomix-og", 1200, 630, true);
  writeFileSync(join(outDir, "og-default.svg"), og, "utf8");
  await raster(og, join(outDir, "og-default.webp"), 88);
  const pattern = svgFor("grid", "brass", "loomix-pattern", 1200, 675, true);
  writeFileSync(join(outDir, "pattern.svg"), pattern, "utf8");
  await raster(pattern, join(outDir, "pattern.webp"), 80);

  console.log(`✓ تم توليد ${count} ملف فنّي في public/art`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
