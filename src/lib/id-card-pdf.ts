import type { jsPDF } from "jspdf";
import { getInitials } from "@/lib/initials";
import { formatShortDate } from "@/lib/format";

/**
 * Printable staff ID card, front and back, as a two-page PDF.
 *
 * Drawn with vector primitives rather than rasterising the DOM: the card is
 * meant to be printed at physical size, and a screenshot-based PDF turns 6pt
 * label text into mush. Only the portrait and the QR are bitmaps.
 *
 * Page size is 54 x 86 mm — a CR80 badge in portrait, which is what lanyard
 * holders take.
 */

const CARD_W = 54;
const CARD_H = 86;
const HEADER_H = 24;
const MARGIN = 5;

/** LHP palette, matched to tailwind.config.ts so print and screen agree. */
const INK: RGB = [15, 17, 21];
const PAPER: RGB = [255, 255, 255];
const BRAND: RGB = [138, 100, 32];
const BRAND_MID: RGB = [168, 124, 44];
const BRAND_BRIGHT: RGB = [201, 162, 39];
const BRAND_SOFT: RGB = [243, 233, 211];
const RULE: RGB = [214, 208, 196];
const BODY_INK: RGB = [58, 63, 75];
const BACK_BODY: RGB = [206, 200, 188];

type RGB = [number, number, number];

export type IdCardStaff = {
  name: string;
  stfId: string;
  roles: string[];
  venues: string[];
  dateEngaged: string;
};

export type IdCardInput = {
  staff: IdCardStaff;
  /** PNG data URL of the verification QR. */
  qrDataUrl: string;
  /** Data URL of the portrait, or null to fall back to a monogram. */
  photoDataUrl: string | null;
};

/* -------------------------------------------------------------------------- */

export async function buildIdCardPdf(input: IdCardInput): Promise<jsPDF> {
  // Dynamically imported so ~350 kB of jsPDF stays out of the settings bundle
  // for the majority of visits that never download a card.
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    unit: "mm",
    format: [CARD_W, CARD_H],
    orientation: "portrait",
    compress: true,
  });
  doc.setFont("helvetica", "normal");

  drawFront(doc, input);
  doc.addPage([CARD_W, CARD_H], "portrait");
  drawBack(doc, input.staff);

  doc.setProperties({
    title: `LHP Staff ID — ${input.staff.name} (${input.staff.stfId})`,
    author: "Lion Hospitality Partners",
    subject: "Staff identification card",
  });

  return doc;
}

/* --------------------------------- front ---------------------------------- */

function drawFront(doc: jsPDF, { staff, qrDataUrl, photoDataUrl }: IdCardInput) {
  drawHeader(doc);

  // Portrait, straddling the header edge so the card has a focal point.
  const frame = 21;
  const frameX = (CARD_W - frame) / 2;
  const frameY = HEADER_H - frame / 2;

  fill(doc, PAPER);
  doc.roundedRect(frameX, frameY, frame, frame, 2.6, 2.6, "F");

  const inner = frame - 2.4;
  const innerX = frameX + 1.2;
  const innerY = frameY + 1.2;

  if (photoDataUrl) {
    doc.addImage(
      photoDataUrl,
      photoDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG",
      innerX,
      innerY,
      inner,
      inner,
      undefined,
      "FAST",
    );
  } else {
    // Same monogram rule as the on-screen avatar.
    fill(doc, BRAND_SOFT);
    doc.roundedRect(innerX, innerY, inner, inner, 1.8, 1.8, "F");
    text(doc, getInitials(staff.name) || "?", CARD_W / 2, innerY + inner / 2 + 2.4, {
      size: 19,
      weight: "bold",
      color: BRAND,
      align: "center",
    });
  }

  let y = frameY + frame + 6;

  const name = staff.name.toUpperCase();
  const size = nameSize(doc, name);
  doc.setFont("helvetica", "bold");
  text(doc, truncate(doc, name, CARD_W - MARGIN * 2, size), CARD_W / 2, y, {
    size,
    weight: "bold",
    color: INK,
    align: "center",
  });

  y += 4.6;
  const role = staff.roles[0] ?? "Staff";
  text(doc, truncate(doc, role.toUpperCase(), CARD_W - MARGIN * 2, 6.5), CARD_W / 2, y, {
    size: 6.5,
    weight: "bold",
    color: BRAND,
    align: "center",
    charSpace: 0.28,
  });

  y += 3.4;
  stroke(doc, RULE);
  doc.setLineWidth(0.25);
  doc.line(MARGIN + 2, y, CARD_W - MARGIN - 2, y);

  y += 4.6;
  const rows: [string, string][] = [
    ["ID No", staff.stfId],
    ["Venue", staff.venues[0] ?? "—"],
    ["Issued", formatShortDate(staff.dateEngaged)],
  ];
  for (const [label, value] of rows) {
    detailRow(doc, label, value, y);
    y += 4.4;
  }

  // QR anchored to the bottom so the card reads top-to-bottom: who, then proof.
  const qr = 15.5;
  const qrY = CARD_H - 5.5 - 3.4 - qr;
  doc.addImage(qrDataUrl, "PNG", (CARD_W - qr) / 2, qrY, qr, qr, undefined, "FAST");

  text(doc, "SCAN TO VERIFY", CARD_W / 2, CARD_H - 4.4, {
    size: 5,
    weight: "bold",
    color: BRAND,
    align: "center",
    charSpace: 0.35,
  });
}

function detailRow(doc: jsPDF, label: string, value: string, y: number) {
  const labelX = MARGIN + 2;
  const valueX = labelX + 13;

  text(doc, label, labelX, y, { size: 6, weight: "bold", color: INK });
  text(doc, ":", valueX - 2.2, y, { size: 6, weight: "bold", color: BRAND });
  text(doc, truncate(doc, value, CARD_W - MARGIN - 2 - valueX, 6), valueX, y, {
    size: 6,
    color: BODY_INK,
  });
}

/**
 * Shrink long names rather than letting them run off the card. Bottoms out at
 * 6pt — below that a name stops being readable on a badge, so the caller
 * truncates instead.
 */
function nameSize(doc: jsPDF, name: string): number {
  const max = CARD_W - MARGIN * 2;
  for (const size of [11, 10, 9, 8, 7, 6]) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    if (doc.getTextWidth(name) <= max) return size;
  }
  return 6;
}

/* --------------------------------- back ----------------------------------- */

function drawBack(doc: jsPDF, staff: IdCardStaff) {
  fill(doc, INK);
  doc.rect(0, 0, CARD_W, CARD_H, "F");
  drawHeader(doc);

  let y = HEADER_H + 7;

  sectionTitle(doc, "TERMS & CONDITIONS", y);
  y += 5;

  // Kept to three bullets: the back has to clear the footer rule at 77mm, and
  // wrapped 5.5pt copy eats vertical space fast.
  const terms = [
    "This card remains the property of Lion Hospitality Partners.",
    "If found, please return it to us using the contact details below.",
    "Non-transferable. Present on request while on duty; report loss immediately.",
  ];
  for (const term of terms) {
    y = bullet(doc, term, y);
  }

  y += 3;
  sectionTitle(doc, "CONTACT", y);
  y += 5;

  const contacts = [
    ["Email", "contact@lionhospitalitypartners.com"],
    ["Web", "lionhospitalitypartners.com"],
  ];
  for (const [label, value] of contacts) {
    fill(doc, BRAND);
    doc.circle(MARGIN + 1.1, y - 0.9, 1.1, "F");
    text(doc, label, MARGIN + 3.4, y, { size: 5.5, weight: "bold", color: BRAND_SOFT });
    text(doc, value, MARGIN + 3.4, y + 3, { size: 5.5, color: BACK_BODY });
    y += 6;
  }

  // Footer ties the physical card back to the record it was issued from.
  stroke(doc, [58, 55, 50]);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, CARD_H - 9, CARD_W - MARGIN, CARD_H - 9);

  text(doc, staff.stfId, MARGIN, CARD_H - 5.4, {
    size: 5.5,
    weight: "bold",
    color: BRAND_BRIGHT,
  });
  text(doc, formatShortDate(staff.dateEngaged), CARD_W - MARGIN, CARD_H - 5.4, {
    size: 5.5,
    color: BACK_BODY,
    align: "right",
  });
}

function sectionTitle(doc: jsPDF, label: string, y: number) {
  fill(doc, BRAND_BRIGHT);
  doc.roundedRect(MARGIN, y - 2.8, 1.1, 3.4, 0.5, 0.5, "F");
  text(doc, label, MARGIN + 3, y, {
    size: 6.5,
    weight: "bold",
    color: PAPER,
    charSpace: 0.2,
  });
}

/** Returns the y position after the wrapped bullet. */
function bullet(doc: jsPDF, body: string, y: number): number {
  const indent = MARGIN + 3;
  const width = CARD_W - indent - MARGIN;

  text(doc, "•", MARGIN + 0.6, y, { size: 5.5, weight: "bold", color: BRAND_BRIGHT });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  const lines = doc.splitTextToSize(body, width) as string[];
  text(doc, lines, indent, y, { size: 5.5, color: BACK_BODY, lineHeight: 2.1 });

  return y + lines.length * 2.1 + 1.2;
}

/* -------------------------------- shared ---------------------------------- */

/**
 * Header: solid ink block with gold wedges sweeping in from the left. Keeping
 * the right third clear of decoration guarantees the wordmark always lands on
 * flat colour, whatever the wedge geometry does.
 */
function drawHeader(doc: jsPDF) {
  fill(doc, INK);
  doc.rect(0, 0, CARD_W, HEADER_H, "F");

  wedge(doc, 0.55, 0.3, BRAND);
  wedge(doc, 0.4, 0.18, BRAND_MID);

  // Thin bright rule for a bit of light across the dark field.
  fill(doc, BRAND_BRIGHT);
  const t1 = CARD_W * 0.4;
  const t2 = CARD_W * 0.455;
  const b2 = CARD_W * 0.235;
  const b1 = CARD_W * 0.18;
  doc.lines(
    [
      [t2 - t1, 0],
      [b2 - t2, HEADER_H],
      [b1 - b2, 0],
    ],
    t1,
    0,
    [1, 1],
    "F",
    true,
  );

  text(doc, "LION HOSPITALITY", CARD_W - MARGIN, 10.4, {
    size: 5.6,
    weight: "bold",
    color: PAPER,
    align: "right",
    charSpace: 0.12,
  });
  text(doc, "PARTNERS", CARD_W - MARGIN, 13.6, {
    size: 5,
    color: BRAND_BRIGHT,
    align: "right",
    charSpace: 0.55,
  });
}

/** Diagonal band from the left edge, `top`/`bottom` as fractions of card width. */
function wedge(doc: jsPDF, top: number, bottom: number, color: RGB) {
  const a = CARD_W * top;
  const b = CARD_W * bottom;
  fill(doc, color);
  doc.lines(
    [
      [a, 0],
      [b - a, HEADER_H],
      [-b, 0],
    ],
    0,
    0,
    [1, 1],
    "F",
    true,
  );
}

function text(
  doc: jsPDF,
  value: string | string[],
  x: number,
  y: number,
  opts: {
    size: number;
    weight?: "normal" | "bold";
    color?: RGB;
    align?: "left" | "center" | "right";
    charSpace?: number;
    lineHeight?: number;
  },
) {
  doc.setFont("helvetica", opts.weight ?? "normal");
  doc.setFontSize(opts.size);
  const [r, g, b] = opts.color ?? INK;
  doc.setTextColor(r, g, b);
  if (opts.lineHeight) doc.setLineHeightFactor(opts.lineHeight / (opts.size * 0.3528));

  doc.text(value, x, y, {
    align: opts.align ?? "left",
    charSpace: opts.charSpace ?? 0,
  });

  doc.setLineHeightFactor(1.15);
}

function truncate(doc: jsPDF, value: string, maxWidth: number, size: number): string {
  doc.setFontSize(size);
  if (doc.getTextWidth(value) <= maxWidth) return value;

  let out = value;
  while (out.length > 1 && doc.getTextWidth(`${out}...`) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out.trimEnd()}...`;
}

function fill(doc: jsPDF, [r, g, b]: RGB) {
  doc.setFillColor(r, g, b);
}

function stroke(doc: jsPDF, [r, g, b]: RGB) {
  doc.setDrawColor(r, g, b);
}
