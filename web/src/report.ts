// PDF report generator for the local bone-age estimate.
//
// Pure: no DOM, no window, no network, no dependencies. It takes the analysis
// data plus every display string and returns the finished PDF bytes.
//
// The file is written by hand: base-14 Helvetica with /WinAnsiEncoding for the
// text, /DCTDecode for the radiograph (the JPEG bytes are copied verbatim, not
// re-encoded), an uncompressed content stream per page and a classic cross
// reference table whose offsets are measured on the emitted bytes.
//
// NOT ONE user-visible word lives here. Everything the reader sees arrives in
// `labels`; numbers and dates are formatted with `Intl` from `locale` and
// substituted into the `{placeholder}` templates the labels carry.

/* ------------------------------------------------------------------ types */

export interface ReportCrop {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** The analysed radiograph, already oriented and cropped, as JPEG bytes. */
export interface ReportImage {
  /** Raw JPEG file bytes; embedded unchanged with /DCTDecode. */
  jpeg: Uint8Array;
  /** Pixel width of the JPEG. */
  width: number;
  /** Pixel height of the JPEG. */
  height: number;
}

/**
 * Every string the reader can see. Flat on purpose: each field maps to one
 * i18n key. Templates use `{placeholder}` markers, listed per field.
 */
export interface ReportLabels {
  /** Product name printed at the top left of every page. */
  productName: string;
  /** Short badge at the top right, e.g. "USO EXPERIMENTAL". */
  experimentalBadge: string;
  /** Main document title. */
  documentTitle: string;
  /** One-line description under the title. */
  documentSubtitle: string;
  /** Optional line under the subtitle. Template: {datetime}. */
  generatedOnTemplate?: string;

  /** Caption above the headline value, e.g. "Idade óssea estimada". */
  estimatedBoneAgeLabel: string;
  /** Pre-composed human age of the estimate, e.g. "11 anos e 2 meses". */
  estimatedAgeText: string;
  /** Small note under the headline value, e.g. "média das três redes". */
  estimatedBoneAgeCaption: string;
  /** Caption of the chronological-age column. */
  chronologicalAgeLabel: string;
  /** Optional pre-composed human chronological age. */
  chronologicalAgeText?: string;
  /** Caption of the difference column. */
  differenceLabel: string;
  /** Small note under the difference, e.g. "comparação descritiva". */
  differenceCaption: string;
  /** Value shown when the date of birth or chronological age is missing. */
  notInformedValue: string;
  /** Value shown when the difference cannot be computed. */
  notComputedValue: string;

  /** Heading of the exam-data table. */
  examDataHeading: string;
  /** Row label for the biological sex. */
  sexLabel: string;
  /** Already-translated sex word for this exam ("feminino" / "male"). */
  sexValue: string;
  /** Row label for the date of birth. */
  dateOfBirthLabel: string;
  /** Row label for the examination date. */
  examinationDateLabel: string;
  /** Row label for the source file name. */
  sourceFileLabel: string;
  /** Row label for the analysed image pixel size. */
  analysedImageSizeLabel: string;

  /** Heading above the radiograph. */
  radiographHeading: string;
  /** Caption printed under the radiograph. */
  radiographCaption: string;

  /** Heading of the technical block. */
  technicalHeading: string;
  /** Row label for the ensemble mean. */
  ensembleMeanLabel: string;
  /** Row label for one network output. Template: {index}. */
  networkOutputLabelTemplate: string;
  /** Row label for the elapsed time. */
  runtimeLabel: string;
  /** Row label for the crop coordinates. */
  cropLabel: string;
  /** Row label for the model identifier. */
  modelLabel: string;
  /** Row label for the pinned model revision. */
  modelRevisionLabel: string;
  /** Row label for the execution environment. */
  executionEnvironmentLabel: string;
  /** Description of the runtime, e.g. "ONNX FP32 · WebAssembly/CPU". */
  executionEnvironmentValue: string;
  /** Row label for the preprocessing chain. */
  preprocessingLabel: string;
  /** Description of the preprocessing chain. */
  preprocessingValue: string;

  /** Heading of the references block. */
  referencesHeading: string;
  /** Model, its author/publisher and the source URL. */
  referenceModelLine: string;
  /** Network architecture and parameter count. */
  referenceArchitectureLine: string;
  /** Training dataset, sample count and published error. */
  referenceDatasetLine: string;
  /** Licence of the redistributed weights and the modification notice. */
  referenceLicenseLine: string;
  /** Application code, its licence and repository. */
  referenceApplicationLine: string;

  /** Heading inside the disclaimer callout. */
  disclaimerHeading: string;
  /** Full experimental / non-diagnostic disclaimer. */
  disclaimerText: string;
  /** Privacy line printed in the page footer. */
  privacyNote: string;
  /** Page footer counter. Template: {page}, {total}. */
  pageNumberTemplate: string;

  /** A month value. Template: {months}. */
  monthsValueTemplate: string;
  /** An elapsed time. Template: {seconds}. */
  secondsValueTemplate: string;
  /** A signed month difference. Template: {sign}, {months}. */
  differenceValueTemplate: string;
  /** Crop coordinates. Template: {x0}, {y0}, {x1}, {y1}. */
  cropValueTemplate: string;
  /** Pixel size of the analysed image. Template: {width}, {height}. */
  imageSizeValueTemplate: string;
}

export interface ReportInput {
  /** Ensemble estimate in months. */
  months: number;
  /** The three individual network outputs, in months. */
  folds: number[];
  /** Elapsed seconds, including model loading. */
  seconds: number;
  /** Model identifier, e.g. "ianpan/bone-age". */
  modelId: string;
  /** Pinned model revision reported at runtime. */
  modelRevision: string;
  /** Biological sex given to the network. */
  sex: "male" | "female";
  /** Date of birth as "YYYY-MM-DD"; empty when not informed. */
  dateOfBirth: string;
  /** Examination date as "YYYY-MM-DD". */
  examinationDate: string;
  /** Chronological age in months, or undefined when no date of birth. */
  chronologicalMonths?: number;
  /** Crop applied to the oriented image. */
  crop: ReportCrop;
  /** Name of the file the operator opened. */
  fileName: string;
  /** BCP 47 locale used for number and date formatting. */
  locale: string;
  /** Optional ISO timestamp of the report generation. */
  generatedAt?: string;
  /** The analysed radiograph. */
  image: ReportImage;
  /** Every display string. */
  labels: ReportLabels;
}

/* ------------------------------------------------- WinAnsi (cp1252) codec */

const COMBINING = /[\u0300-\u036f]/g;

// The 27 cp1252 positions between 0x80 and 0x9F that are not Latin-1.
const WIN_ANSI_HIGH: Record<string, number | undefined> = {
  "€": 0x80,
  "‚": 0x82,
  "ƒ": 0x83,
  "„": 0x84,
  "…": 0x85,
  "†": 0x86,
  "‡": 0x87,
  "ˆ": 0x88,
  "‰": 0x89,
  "Š": 0x8a,
  "‹": 0x8b,
  "Œ": 0x8c,
  "Ž": 0x8e,
  "‘": 0x91,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
  "•": 0x95,
  "–": 0x96,
  "—": 0x97,
  "˜": 0x98,
  "™": 0x99,
  "š": 0x9a,
  "›": 0x9b,
  "œ": 0x9c,
  "ž": 0x9e,
  "Ÿ": 0x9f,
};

// Characters outside cp1252 worth spelling out instead of dropping to "?".
const TRANSLITERATE: Record<string, string | undefined> = {
  "\u2212": "-", // minus sign
  "\u2010": "-", // hyphen
  "\u2011": "-", // non-breaking hyphen
  "\u2012": "-", // figure dash
  "\u2015": "-", // horizontal bar
  "\u2043": "-", // hyphen bullet
  "\u2044": "/", // fraction slash
  "\u2002": " ", // en space
  "\u2003": " ", // em space
  "\u2007": " ", // figure space
  "\u2009": " ", // thin space
  "\u200a": " ", // hair space
  "\u202f": " ", // narrow no-break space
  "\u2192": "->",
  "\u2190": "<-",
  "\u2265": ">=",
  "\u2264": "<=",
  "\u2260": "!=",
};

function encodeChar(ch: string, depth: number): string {
  const code = ch.codePointAt(0);
  if (code === undefined) return "";
  if (code === 0x09 || code === 0x0a || code === 0x0d) return " ";
  if (code >= 0x20 && code <= 0x7e) return ch;
  if (code >= 0xa0 && code <= 0xff) return ch;
  const high = WIN_ANSI_HIGH[ch];
  if (high !== undefined) return String.fromCharCode(high);
  if (depth < 3) {
    const spelled = TRANSLITERATE[ch];
    if (spelled !== undefined && spelled !== ch) {
      return encodeWinAnsi(spelled, depth + 1);
    }
    const stripped = ch.normalize("NFD").replace(COMBINING, "");
    if (stripped.length > 0 && stripped !== ch) {
      return encodeWinAnsi(stripped, depth + 1);
    }
  }
  return "?";
}

/**
 * Encode text to cp1252 / WinAnsiEncoding, returned as a "byte string" whose
 * every char code is the byte value. Characters outside cp1252 degrade to
 * their unaccented base letter, to a spelled-out equivalent, or to "?" — they
 * never emit a byte the font cannot show.
 */
export function encodeWinAnsi(text: string, depth = 0): string {
  let out = "";
  for (const ch of String(text ?? "")) out += encodeChar(ch, depth);
  return out;
}

/* --------------------------------------------------- Helvetica AFM widths */

// Glyph advance widths in 1/1000 em for WinAnsiEncoding codes 32..255.
// Undefined WinAnsi codes (127, 129, 141, 143, 144, 157) carry 0; the encoder
// above never emits them.
const HELVETICA: readonly number[] = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278,
  278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584,
  584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556,
  833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278,
  278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222,
  500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
  500, 334, 260, 334, 584, 0, 556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000,
  667, 333, 1000, 0, 611, 0, 0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000,
  500, 333, 944, 0, 500, 667, 278, 333, 556, 556, 556, 556, 260, 556, 333, 737,
  370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 556, 537, 278, 333,
  333, 365, 556, 834, 834, 834, 611, 667, 667, 667, 667, 667, 667, 1000, 722,
  667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778,
  584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556,
  889, 500, 556, 556, 556, 556, 278, 278, 278, 278, 556, 556, 556, 556, 556,
  556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500,
];

const HELVETICA_BOLD: readonly number[] = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278,
  278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584,
  584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611,
  833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333,
  278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278,
  556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556,
  500, 389, 280, 389, 584, 0, 556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000,
  667, 333, 1000, 0, 611, 0, 0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000,
  556, 333, 944, 0, 500, 667, 278, 333, 556, 556, 556, 556, 280, 556, 333, 737,
  370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 611, 556, 278, 333,
  333, 365, 556, 834, 834, 834, 611, 722, 722, 722, 722, 722, 722, 1000, 722,
  667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778,
  584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556,
  889, 556, 556, 556, 556, 556, 278, 278, 278, 278, 611, 611, 611, 611, 611,
  611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556,
];

/** Advance width, in points, of an already WinAnsi-encoded byte string. */
function widthOfEncoded(bytes: string, bold: boolean, size: number): number {
  const table = bold ? HELVETICA_BOLD : HELVETICA;
  let units = 0;
  for (let i = 0; i < bytes.length; i++) {
    const code = bytes.charCodeAt(i);
    units += code >= 32 && code <= 255 ? table[code - 32] : 0;
  }
  return (units * size) / 1000;
}

/** Advance width, in points, of `text` set in Helvetica at `size`. */
export function measureText(text: string, bold: boolean, size: number): number {
  return widthOfEncoded(encodeWinAnsi(text), bold, size);
}

function breakWord(word: string, bold: boolean, size: number, max: number) {
  const parts: string[] = [];
  let current = "";
  for (let i = 0; i < word.length; i++) {
    const ch = word.charAt(i);
    if (current !== "" && widthOfEncoded(current + ch, bold, size) > max) {
      parts.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  if (current !== "") parts.push(current);
  return parts.length > 0 ? parts : [""];
}

function wrapEncoded(
  bytes: string,
  bold: boolean,
  size: number,
  max: number,
): string[] {
  const words = bytes.split(" ").filter((word) => word.length > 0);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";
  let index = 0;
  while (index < words.length) {
    const word = words[index];
    if (current === "") {
      if (widthOfEncoded(word, bold, size) <= max) {
        current = word;
      } else {
        const parts = breakWord(word, bold, size, max);
        for (let i = 0; i < parts.length - 1; i++) lines.push(parts[i]);
        current = parts[parts.length - 1];
      }
      index++;
    } else if (widthOfEncoded(`${current} ${word}`, bold, size) <= max) {
      current = `${current} ${word}`;
      index++;
    } else {
      lines.push(current);
      current = "";
    }
  }
  if (current !== "") lines.push(current);
  return lines;
}

/**
 * Word-wrap `text` to `max` points using the real Helvetica advance widths.
 * Returns WinAnsi-encoded byte strings, one per rendered line. Hard newlines
 * in the source start a new line; words longer than the column are split.
 */
export function wrapText(
  text: string,
  bold: boolean,
  size: number,
  max: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of String(text ?? "").split(/\r\n|\r|\n/)) {
    const encoded = encodeWinAnsi(paragraph).trim();
    if (encoded === "") {
      lines.push("");
      continue;
    }
    for (const line of wrapEncoded(encoded, bold, size, Math.max(max, 1))) {
      lines.push(line);
    }
  }
  return lines.length > 0 ? lines : [""];
}

/* ------------------------------------------------------ formatting helpers */

function fill(template: string, values: Record<string, string>): string {
  return String(template ?? "").replace(
    /\{(\w+)\}/g,
    (match: string, key: string) =>
      Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );
}

function formatNumber(value: number, locale: string, digits: number): string {
  if (!Number.isFinite(value)) return String(value);
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return value.toFixed(digits);
  }
}

function formatInteger(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value)) : String(value);
}

function formatIsoDate(iso: string, locale: string): string {
  const text = String(iso ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!match) return text;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  if (Number.isNaN(date.getTime())) return text;
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return text;
  }
}

function formatIsoDateTime(iso: string, locale: string): string {
  const text = String(iso ?? "").trim();
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  } catch {
    return text;
  }
}

/* ------------------------------------------------------------ page canvas */

const PAGE_WIDTH = 595.276;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 56;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 54;
const COLUMN = PAGE_WIDTH - MARGIN_X * 2;
const RIGHT_EDGE = MARGIN_X + COLUMN;
const HEADER_BASELINE = PAGE_HEIGHT - MARGIN_TOP;
const HEADER_RULE = HEADER_BASELINE - 11;
const CONTENT_TOP = HEADER_RULE - 28;
const FOOTER_RULE = MARGIN_BOTTOM + 24;
const FOOTER_BASELINE = FOOTER_RULE - 12;
const CONTENT_BOTTOM = FOOTER_RULE + 16;
const ASCENT = 0.78;

type Rgb = readonly [number, number, number];

// Straight out of tokens.css.
const INK: Rgb = [0.153, 0.212, 0.173]; // --ink   #27362c
const GREEN: Rgb = [0.157, 0.333, 0.278]; // --green #285547
const MUTED: Rgb = [0.467, 0.506, 0.443]; // --muted #778171
const RULE: Rgb = [0.875, 0.894, 0.851]; // --line  #dfe4d9
const CANVAS: Rgb = [0.075, 0.11, 0.098]; // canvas ground #131c19
const WARN_FILL: Rgb = [0.957, 0.941, 0.89]; // badge bg     #f4f0e3
const WARN_LINE: Rgb = [0.863, 0.843, 0.776]; // badge border #dcd7c6
const WARN_INK: Rgb = [0.514, 0.447, 0.29]; // badge ink    #83724a

interface Style {
  bold: boolean;
  size: number;
  color: Rgb;
  leading: number;
}

interface Doc {
  pages: string[][];
  ops: string[];
  y: number;
  productName: string;
  badge: string;
}

/** PDF real number: fixed notation, at most three decimals, no "-0". */
function num(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(safe * 1000) / 1000;
  const text = (rounded === 0 ? 0 : rounded).toFixed(3);
  const trimmed = text.replace(/\.?0+$/, "");
  return trimmed === "" || trimmed === "-" ? "0" : trimmed;
}

function color(rgb: Rgb): string {
  return `${num(rgb[0])} ${num(rgb[1])} ${num(rgb[2])}`;
}

function escapeString(bytes: string): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const ch = bytes.charAt(i);
    if (ch === "\\" || ch === "(" || ch === ")") out += "\\";
    out += ch;
  }
  return out;
}

function textOp(
  bytes: string,
  x: number,
  baseline: number,
  bold: boolean,
  size: number,
  rgb: Rgb,
): string {
  return [
    "BT",
    `/${bold ? "F2" : "F1"} ${num(size)} Tf`,
    `${color(rgb)} rg`,
    `1 0 0 1 ${num(x)} ${num(baseline)} Tm`,
    `(${escapeString(bytes)}) Tj`,
    "ET",
  ].join(" ");
}

function drawEncoded(
  doc: Doc,
  bytes: string,
  x: number,
  baseline: number,
  style: Style,
) {
  doc.ops.push(textOp(bytes, x, baseline, style.bold, style.size, style.color));
}

function drawLeft(
  doc: Doc,
  text: string,
  x: number,
  baseline: number,
  style: Style,
) {
  drawEncoded(doc, encodeWinAnsi(text), x, baseline, style);
}

function drawRight(
  doc: Doc,
  text: string,
  right: number,
  baseline: number,
  style: Style,
) {
  const bytes = encodeWinAnsi(text);
  const width = widthOfEncoded(bytes, style.bold, style.size);
  drawEncoded(doc, bytes, right - width, baseline, style);
}

function hairline(doc: Doc, x: number, y: number, width: number, rgb = RULE) {
  doc.ops.push(
    `${color(rgb)} RG 0.6 w ${num(x)} ${num(y)} m ${num(x + width)} ${num(y)} l S`,
  );
}

function vertical(doc: Doc, x: number, top: number, height: number) {
  doc.ops.push(
    `${color(RULE)} RG 0.6 w ${num(x)} ${num(top)} m ${num(x)} ${num(top - height)} l S`,
  );
}

function fillRect(
  doc: Doc,
  x: number,
  bottom: number,
  width: number,
  height: number,
  rgb: Rgb,
) {
  doc.ops.push(
    `${color(rgb)} rg ${num(x)} ${num(bottom)} ${num(width)} ${num(height)} re f`,
  );
}

function strokeRect(
  doc: Doc,
  x: number,
  bottom: number,
  width: number,
  height: number,
  rgb: Rgb,
) {
  doc.ops.push(
    `${color(rgb)} RG 0.6 w ${num(x)} ${num(bottom)} ${num(width)} ${num(height)} re S`,
  );
}

function beginPage(doc: Doc) {
  doc.ops = [];
  doc.pages.push(doc.ops);
  drawLeft(doc, doc.productName, MARGIN_X, HEADER_BASELINE, {
    bold: true,
    size: 12,
    color: GREEN,
    leading: 14,
  });
  drawRight(doc, doc.badge, RIGHT_EDGE, HEADER_BASELINE + 1, {
    bold: false,
    size: 7.5,
    color: WARN_INK,
    leading: 10,
  });
  hairline(doc, MARGIN_X, HEADER_RULE, COLUMN);
  doc.y = CONTENT_TOP;
}

function ensure(doc: Doc, height: number) {
  if (doc.y - height < CONTENT_BOTTOM) beginPage(doc);
}

/* --------------------------------------------------------- text stacking */

interface Block {
  text: string;
  style: Style;
  gapBefore: number;
}

interface PlacedLine {
  bytes: string;
  style: Style;
  top: number;
}

interface Stack {
  lines: PlacedLine[];
  height: number;
}

function layoutStack(blocks: Block[], width: number): Stack {
  const lines: PlacedLine[] = [];
  let height = 0;
  for (const block of blocks) {
    if (!block.text) continue;
    height += block.gapBefore;
    for (const bytes of wrapText(
      block.text,
      block.style.bold,
      block.style.size,
      width,
    )) {
      lines.push({ bytes, style: block.style, top: height });
      height += block.style.leading;
    }
  }
  return { lines, height };
}

function paintStack(doc: Doc, stack: Stack, x: number, top: number) {
  for (const line of stack.lines) {
    if (line.bytes === "") continue;
    drawEncoded(
      doc,
      line.bytes,
      x,
      top - line.top - line.style.size * ASCENT,
      line.style,
    );
  }
}

/** Draws a wrapped paragraph at the flow position, breaking pages as needed. */
function flowText(
  doc: Doc,
  text: string,
  style: Style,
  x: number,
  width: number,
  gapBefore = 0,
) {
  if (!text) return;
  doc.y -= gapBefore;
  for (const bytes of wrapText(text, style.bold, style.size, width)) {
    ensure(doc, style.leading);
    if (bytes !== "") {
      drawEncoded(doc, bytes, x, doc.y - style.size * ASCENT, style);
    }
    doc.y -= style.leading;
  }
}

function sectionHeading(doc: Doc, text: string) {
  ensure(doc, 44);
  flowText(
    doc,
    text,
    { bold: true, size: 9.5, color: INK, leading: 13 },
    MARGIN_X,
    COLUMN,
  );
  doc.y -= 4;
  hairline(doc, MARGIN_X, doc.y, COLUMN);
  doc.y -= 9;
}

interface Row {
  label: string;
  value: string;
}

const ROW_LABEL_WIDTH = 132;
const ROW_GAP = 14;

/** A quiet two-column table: hairline, small muted key, value. */
function drawRows(doc: Doc, rows: Row[]) {
  const valueWidth = COLUMN - ROW_LABEL_WIDTH - ROW_GAP;
  const labelStyle: Style = {
    bold: false,
    size: 8,
    color: MUTED,
    leading: 12,
  };
  const valueStyle: Style = { bold: false, size: 9, color: INK, leading: 12 };
  for (const row of rows) {
    const labelLines = layoutStack(
      [{ text: row.label, style: labelStyle, gapBefore: 0 }],
      ROW_LABEL_WIDTH,
    );
    const valueLines = layoutStack(
      [{ text: row.value, style: valueStyle, gapBefore: 0 }],
      valueWidth,
    );
    const inner = Math.max(labelLines.height, valueLines.height, 12);
    const total = inner + 11;
    ensure(doc, total);
    hairline(doc, MARGIN_X, doc.y, COLUMN);
    const top = doc.y - 6;
    paintStack(doc, labelLines, MARGIN_X, top - 0.5);
    paintStack(doc, valueLines, MARGIN_X + ROW_LABEL_WIDTH + ROW_GAP, top);
    doc.y -= total;
  }
}

/* ---------------------------------------------------------- JPEG sniffing */

/** Number of components declared by the JPEG SOF marker, 0 when unknown. */
function jpegComponents(bytes: Uint8Array): number {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return 0;
  let i = 2;
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i++;
      continue;
    }
    let marker = bytes[i + 1];
    while (marker === 0xff && i + 2 < bytes.length) {
      i++;
      marker = bytes[i + 1];
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    if (i + 3 >= bytes.length) break;
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (length < 2) return 0;
    const isFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isFrame) return i + 9 < bytes.length ? bytes[i + 9] : 0;
    if (marker === 0xda) return 0;
    i += 2 + length;
  }
  return 0;
}

function colorSpaceOf(components: number): string {
  if (components === 1) return "/DeviceGray";
  if (components === 4) return "/DeviceCMYK";
  return "/DeviceRGB";
}

/* --------------------------------------------------------- byte assembly */

function latin1Bytes(text: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

interface PdfObject {
  dict: string;
  stream?: Uint8Array;
}

function serialize(objects: PdfObject[]): Uint8Array<ArrayBuffer> {
  const chunks: Uint8Array[] = [];
  let length = 0;
  const push = (bytes: Uint8Array) => {
    chunks.push(bytes);
    length += bytes.length;
  };
  const pushText = (text: string) => push(latin1Bytes(text));

  pushText("%PDF-1.7\n%\u00e2\u00e3\u00cf\u00d3\n");

  const offsets: number[] = new Array(objects.length + 1).fill(0);
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    offsets[i + 1] = length;
    pushText(`${i + 1} 0 obj\n`);
    pushText(object.dict);
    if (object.stream) {
      pushText("\nstream\n");
      push(object.stream);
      pushText("\nendstream");
    }
    pushText("\nendobj\n");
  }

  const xrefOffset = length;
  let table = `xref\n0 ${objects.length + 1}\n0000000000 65535 f\r\n`;
  for (let i = 1; i <= objects.length; i++) {
    table += `${String(offsets[i]).padStart(10, "0")} 00000 n\r\n`;
  }
  table += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 5 0 R >>\n`;
  table += `startxref\n${xrefOffset}\n%%EOF`;
  pushText(table);

  const out = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

/* ------------------------------------------------------------- the report */

const CATALOG = 1;
const PAGES = 2;
const FONT_REGULAR = 3;
const FONT_BOLD = 4;
const INFO = 5;
const IMAGE = 6;

/** Builds the one- or two-page PDF report and returns its bytes. */
// Uint8Array<ArrayBuffer>, not the ArrayBufferLike default: the caller hands
// these bytes straight to Blob, which does not accept a SharedArrayBuffer view.
export function buildReportPdf(input: ReportInput): Uint8Array<ArrayBuffer> {
  const labels = input.labels;
  const locale = input.locale || "en-US";
  const decimal = (value: number, digits: number) =>
    formatNumber(value, locale, digits);
  const monthsValue = (value: number, digits: number) =>
    fill(labels.monthsValueTemplate, { months: decimal(value, digits) });

  const jpeg = input.image.jpeg;
  const imageWidth = input.image.width;
  const imageHeight = input.image.height;
  const hasImage =
    jpeg instanceof Uint8Array &&
    jpeg.length > 0 &&
    Number.isFinite(imageWidth) &&
    Number.isFinite(imageHeight) &&
    imageWidth > 0 &&
    imageHeight > 0;

  const doc: Doc = {
    pages: [],
    ops: [],
    y: CONTENT_TOP,
    productName: labels.productName,
    badge: labels.experimentalBadge,
  };
  beginPage(doc);

  /* -- title ------------------------------------------------------------ */

  const titleTop = doc.y;
  flowText(
    doc,
    labels.documentTitle,
    { bold: true, size: 19, color: INK, leading: 23 },
    MARGIN_X,
    COLUMN - 120,
  );
  if (labels.generatedOnTemplate && input.generatedAt) {
    // Sits on the title baseline, so it costs no vertical space.
    drawRight(
      doc,
      fill(labels.generatedOnTemplate, {
        datetime: formatIsoDateTime(input.generatedAt, locale),
      }),
      RIGHT_EDGE,
      titleTop - 19 * ASCENT,
      { bold: false, size: 8, color: MUTED, leading: 11 },
    );
  }
  flowText(
    doc,
    labels.documentSubtitle,
    { bold: false, size: 9.5, color: MUTED, leading: 13.5 },
    MARGIN_X,
    COLUMN * 0.88,
    5,
  );

  /* -- headline result -------------------------------------------------- */

  const chronological =
    typeof input.chronologicalMonths === "number" &&
    Number.isFinite(input.chronologicalMonths)
      ? input.chronologicalMonths
      : undefined;
  const difference =
    chronological === undefined ? undefined : input.months - chronological;

  const eyebrow: Style = { bold: false, size: 8, color: MUTED, leading: 11 };
  const caption: Style = { bold: false, size: 7.5, color: MUTED, leading: 10.5 };

  const bandColumns = [
    {
      x: MARGIN_X,
      width: 174,
      divider: 0,
      blocks: [
        { text: labels.estimatedBoneAgeLabel, style: eyebrow, gapBefore: 0 },
        {
          text: monthsValue(input.months, 1),
          style: { bold: true, size: 22, color: GREEN, leading: 26 },
          gapBefore: 5,
        },
        {
          text: labels.estimatedAgeText,
          style: { bold: false, size: 10, color: INK, leading: 13 },
          gapBefore: 2,
        },
        {
          text: labels.estimatedBoneAgeCaption,
          style: caption,
          gapBefore: 4,
        },
      ],
    },
    {
      x: MARGIN_X + 206,
      width: 130,
      divider: MARGIN_X + 190,
      blocks: [
        { text: labels.chronologicalAgeLabel, style: eyebrow, gapBefore: 0 },
        {
          text:
            chronological === undefined
              ? labels.notInformedValue
              : monthsValue(chronological, 1),
          style: { bold: true, size: 15, color: INK, leading: 19 },
          gapBefore: 5,
        },
        {
          text:
            chronological === undefined
              ? ""
              : (labels.chronologicalAgeText ?? ""),
          style: caption,
          gapBefore: 3,
        },
      ],
    },
    {
      x: MARGIN_X + 352,
      width: 131,
      divider: MARGIN_X + 336,
      blocks: [
        { text: labels.differenceLabel, style: eyebrow, gapBefore: 0 },
        {
          text:
            difference === undefined
              ? labels.notComputedValue
              : fill(labels.differenceValueTemplate, {
                  sign: difference < 0 ? "-" : "+",
                  months: decimal(Math.abs(difference), 1),
                }),
          style: { bold: true, size: 15, color: INK, leading: 19 },
          gapBefore: 5,
        },
        { text: labels.differenceCaption, style: caption, gapBefore: 3 },
      ],
    },
  ];

  const bandStacks = bandColumns.map((entry) =>
    layoutStack(entry.blocks, entry.width),
  );
  const bandHeight = bandStacks.reduce(
    (largest, stack) => Math.max(largest, stack.height),
    0,
  );
  doc.y -= 16;
  ensure(doc, bandHeight + 36);
  hairline(doc, MARGIN_X, doc.y, COLUMN);
  const bandTop = doc.y - 17;
  for (let i = 0; i < bandColumns.length; i++) {
    const entry = bandColumns[i];
    if (entry.divider > 0) vertical(doc, entry.divider, bandTop + 3, bandHeight);
    paintStack(doc, bandStacks[i], entry.x, bandTop);
  }
  doc.y = bandTop - bandHeight - 16;
  hairline(doc, MARGIN_X, doc.y, COLUMN);
  doc.y -= 20;

  /* -- exam data -------------------------------------------------------- */

  sectionHeading(doc, labels.examDataHeading);
  drawRows(doc, [
    { label: labels.sexLabel, value: labels.sexValue },
    {
      label: labels.dateOfBirthLabel,
      value: input.dateOfBirth
        ? formatIsoDate(input.dateOfBirth, locale)
        : labels.notInformedValue,
    },
    {
      label: labels.examinationDateLabel,
      value: formatIsoDate(input.examinationDate, locale),
    },
    { label: labels.sourceFileLabel, value: input.fileName },
    {
      label: labels.analysedImageSizeLabel,
      value: hasImage
        ? fill(labels.imageSizeValueTemplate, {
            width: formatInteger(imageWidth),
            height: formatInteger(imageHeight),
          })
        : labels.notInformedValue,
    },
  ]);

  /* -- radiograph ------------------------------------------------------- */

  if (hasImage) {
    const captionStack = layoutStack(
      [{ text: labels.radiographCaption, style: caption, gapBefore: 0 }],
      COLUMN,
    );
    const reserve = captionStack.height + 12;
    doc.y -= 16;
    // Keep the heading, the plate and its caption together on one page.
    ensure(doc, 44 + reserve + 160);
    sectionHeading(doc, labels.radiographHeading);
    const room = Math.max(doc.y - CONTENT_BOTTOM - reserve, 80);
    const maxBox = Math.min(340, room);
    const scale = Math.min(
      (COLUMN - 20) / imageWidth,
      (maxBox - 20) / imageHeight,
    );
    const drawWidth = Math.max(imageWidth * scale, 1);
    const drawHeight = Math.max(imageHeight * scale, 1);
    const boxHeight = drawHeight + 20;
    const boxBottom = doc.y - boxHeight;
    fillRect(doc, MARGIN_X, boxBottom, COLUMN, boxHeight, CANVAS);
    doc.ops.push(
      `q ${num(drawWidth)} 0 0 ${num(drawHeight)} ` +
        `${num(MARGIN_X + (COLUMN - drawWidth) / 2)} ${num(boxBottom + 10)} cm /Im0 Do Q`,
    );
    doc.y = boxBottom - 10;
    paintStack(doc, captionStack, MARGIN_X, doc.y);
    doc.y -= captionStack.height;
  }

  /* -- technical -------------------------------------------------------- */

  doc.y -= 22;
  sectionHeading(doc, labels.technicalHeading);
  const folds = Array.isArray(input.folds) ? input.folds : [];
  const technical: Row[] = [
    {
      label: labels.ensembleMeanLabel,
      value: monthsValue(input.months, 4),
    },
  ];
  for (let i = 0; i < folds.length; i++) {
    technical.push({
      label: fill(labels.networkOutputLabelTemplate, {
        index: String(i + 1),
      }),
      value: monthsValue(folds[i], 4),
    });
  }
  technical.push(
    {
      label: labels.runtimeLabel,
      value: fill(labels.secondsValueTemplate, {
        seconds: decimal(input.seconds, 1),
      }),
    },
    {
      label: labels.cropLabel,
      value: fill(labels.cropValueTemplate, {
        x0: formatInteger(input.crop.x0),
        y0: formatInteger(input.crop.y0),
        x1: formatInteger(input.crop.x1),
        y1: formatInteger(input.crop.y1),
      }),
    },
    { label: labels.modelLabel, value: input.modelId },
    { label: labels.modelRevisionLabel, value: input.modelRevision },
    {
      label: labels.executionEnvironmentLabel,
      value: labels.executionEnvironmentValue,
    },
    { label: labels.preprocessingLabel, value: labels.preprocessingValue },
  );
  drawRows(doc, technical);

  /* -- references ------------------------------------------------------- */

  doc.y -= 22;
  sectionHeading(doc, labels.referencesHeading);
  const referenceStyle: Style = {
    bold: false,
    size: 8.5,
    color: MUTED,
    leading: 12,
  };
  const bullet = encodeWinAnsi("•");
  for (const reference of [
    labels.referenceModelLine,
    labels.referenceArchitectureLine,
    labels.referenceDatasetLine,
    labels.referenceLicenseLine,
    labels.referenceApplicationLine,
  ]) {
    if (!reference) continue;
    const stack = layoutStack(
      [{ text: reference, style: referenceStyle, gapBefore: 0 }],
      COLUMN - 14,
    );
    ensure(doc, stack.height + 7);
    drawEncoded(doc, bullet, MARGIN_X, doc.y - referenceStyle.size * ASCENT, {
      ...referenceStyle,
      color: GREEN,
    });
    paintStack(doc, stack, MARGIN_X + 14, doc.y);
    doc.y -= stack.height + 7;
  }

  /* -- disclaimer ------------------------------------------------------- */

  const disclaimerWidth = COLUMN - 32;
  const disclaimerStack = layoutStack(
    [
      {
        text: labels.disclaimerHeading,
        style: { bold: true, size: 9, color: WARN_INK, leading: 13 },
        gapBefore: 0,
      },
      {
        text: labels.disclaimerText,
        style: { bold: false, size: 8.5, color: WARN_INK, leading: 12.5 },
        gapBefore: 3,
      },
    ],
    disclaimerWidth,
  );
  const boxHeight = disclaimerStack.height + 28;
  doc.y -= 16;
  ensure(doc, boxHeight);
  fillRect(doc, MARGIN_X, doc.y - boxHeight, COLUMN, boxHeight, WARN_FILL);
  strokeRect(doc, MARGIN_X, doc.y - boxHeight, COLUMN, boxHeight, WARN_LINE);
  paintStack(doc, disclaimerStack, MARGIN_X + 16, doc.y - 14);
  doc.y -= boxHeight;

  /* -- footers ---------------------------------------------------------- */

  const footerStyle: Style = {
    bold: false,
    size: 7.5,
    color: MUTED,
    leading: 10,
  };
  const total = doc.pages.length;
  for (let i = 0; i < total; i++) {
    doc.ops = doc.pages[i];
    hairline(doc, MARGIN_X, FOOTER_RULE, COLUMN);
    drawLeft(doc, labels.privacyNote, MARGIN_X, FOOTER_BASELINE, footerStyle);
    drawRight(
      doc,
      fill(labels.pageNumberTemplate, {
        page: String(i + 1),
        total: String(total),
      }),
      RIGHT_EDGE,
      FOOTER_BASELINE,
      footerStyle,
    );
  }

  /* -- objects ---------------------------------------------------------- */

  const firstPage = hasImage ? IMAGE + 1 : IMAGE;
  const kids: string[] = [];
  for (let i = 0; i < total; i++) kids.push(`${firstPage + i} 0 R`);
  const resources =
    `/Resources << /Font << /F1 ${FONT_REGULAR} 0 R /F2 ${FONT_BOLD} 0 R >>` +
    (hasImage ? ` /XObject << /Im0 ${IMAGE} 0 R >>` : "") +
    " >>";

  const objects: PdfObject[] = [];
  objects[CATALOG - 1] = {
    dict: `<< /Type /Catalog /Pages ${PAGES} 0 R >>`,
  };
  objects[PAGES - 1] = {
    dict: `<< /Type /Pages /Count ${total} /Kids [${kids.join(" ")}] >>`,
  };
  objects[FONT_REGULAR - 1] = {
    dict:
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica" +
      " /Encoding /WinAnsiEncoding >>",
  };
  objects[FONT_BOLD - 1] = {
    dict:
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold" +
      " /Encoding /WinAnsiEncoding >>",
  };
  objects[INFO - 1] = {
    dict: `<< /Title (${escapeString(encodeWinAnsi(labels.documentTitle))}) >>`,
  };
  if (hasImage) {
    objects[IMAGE - 1] = {
      dict:
        "<< /Type /XObject /Subtype /Image" +
        ` /Width ${formatInteger(imageWidth)} /Height ${formatInteger(imageHeight)}` +
        ` /ColorSpace ${colorSpaceOf(jpegComponents(jpeg))}` +
        ` /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,
      stream: jpeg,
    };
  }
  for (let i = 0; i < total; i++) {
    const contentNumber = firstPage + total + i;
    objects[firstPage + i - 1] = {
      dict:
        `<< /Type /Page /Parent ${PAGES} 0 R` +
        ` /MediaBox [0 0 ${num(PAGE_WIDTH)} ${num(PAGE_HEIGHT)}]` +
        ` ${resources} /Contents ${contentNumber} 0 R >>`,
    };
    const content = doc.pages[i].join("\n");
    objects[contentNumber - 1] = {
      dict: `<< /Length ${content.length} >>`,
      stream: latin1Bytes(content),
    };
  }

  return serialize(objects);
}
