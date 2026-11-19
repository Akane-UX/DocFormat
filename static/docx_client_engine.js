const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';

function cmToTwips(cm) {
  return Math.round((parseFloat(cm) / 2.54) * 1440);
}

function ptToHalfPt(pt) {
  return Math.round(parseFloat(pt) * 2);
}

function ptToTwips(pt) {
  return Math.round(parseFloat(pt) * 20);
}

function lineSpacingToTwips(mult) {
  return Math.round(parseFloat(mult) * 240);
}

const PAGE_SIZES_CM = {
  A4: [21.0, 29.7],
  F4: [21.5, 33.0],
  Letter: [21.59, 27.94],
  Legal: [21.59, 35.56]
};

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(u8) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) {
    crc = CRC32_TABLE[(crc ^ u8[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

async function inflateRawBytes(compressedBytes) {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(compressedBytes);
  writer.close();
  const reader = ds.readable.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const ch of chunks) {
    out.set(ch, offset);
    offset += ch.length;
  }
  return out;
}

async function deflateRawBytes(rawBytes) {
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(rawBytes);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const ch of chunks) {
    out.set(ch, offset);
    offset += ch.length;
  }
  return out;
}

async function readZipEntries(arrayBuffer) {
  const u8 = new Uint8Array(arrayBuffer);
  const dv = new DataView(arrayBuffer);
  let eocdOffset = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65558); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('File bukan arsip DOCX/ZIP yang valid.');
  }
  const totalEntries = dv.getUint16(eocdOffset + 10, true);
  const cdOffset = dv.getUint32(eocdOffset + 16, true);
  let ptr = cdOffset;
  const dec = new TextDecoder('utf-8');
  const fileMap = new Map();

  for (let i = 0; i < totalEntries; i++) {
    if (dv.getUint32(ptr, true) !== 0x02014b50) break;
    const method = dv.getUint16(ptr + 10, true);
    const compSize = dv.getUint32(ptr + 20, true);
    const nameLen = dv.getUint16(ptr + 28, true);
    const extraLen = dv.getUint16(ptr + 30, true);
    const commentLen = dv.getUint16(ptr + 32, true);
    const localHeaderOffset = dv.getUint32(ptr + 42, true);
    const name = dec.decode(u8.subarray(ptr + 46, ptr + 46 + nameLen));
    ptr += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith('/')) continue;

    const lNameLen = dv.getUint16(localHeaderOffset + 26, true);
    const lExtraLen = dv.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + lNameLen + lExtraLen;
    const compSlice = u8.subarray(dataStart, dataStart + compSize);

    if (method === 0) {
      fileMap.set(name, new Uint8Array(compSlice));
    } else if (method === 8) {
      fileMap.set(name, await inflateRawBytes(compSlice));
    } else {
      throw new Error(`Metode kompresi ZIP (${method}) tidak didukung.`);
    }
  }
  return fileMap;
}

async function writeZipEntries(fileMap) {
  const enc = new TextEncoder();
  const localParts = [];
  const cdParts = [];
  let localOffset = 0;
  let count = 0;

  for (const [name, rawData] of fileMap.entries()) {
    const nameBytes = enc.encode(name);
    const uncompBytes = rawData instanceof Uint8Array ? rawData : enc.encode(String(rawData));
    const crc = crc32(uncompBytes);
    const compBytes = await deflateRawBytes(uncompBytes);

    const lh = new Uint8Array(30 + nameBytes.length);
    const ldv = new DataView(lh.buffer);
    ldv.setUint32(0, 0x04034b50, true);
    ldv.setUint16(4, 20, true);
    ldv.setUint16(6, 0, true);
    ldv.setUint16(8, 8, true);
    ldv.setUint16(10, 0, true);
    ldv.setUint16(12, 0x21, true);
    ldv.setUint32(14, crc, true);
    ldv.setUint32(18, compBytes.length, true);
    ldv.setUint32(22, uncompBytes.length, true);
    ldv.setUint16(26, nameBytes.length, true);
    ldv.setUint16(28, 0, true);
    lh.set(nameBytes, 30);

    localParts.push(lh, compBytes);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(cd.buffer);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 20, true);
    cdv.setUint16(6, 20, true);
    cdv.setUint16(8, 0, true);
    cdv.setUint16(10, 8, true);
    cdv.setUint16(12, 0, true);
    cdv.setUint16(14, 0x21, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, compBytes.length, true);
    cdv.setUint32(24, uncompBytes.length, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint16(30, 0, true);
    cdv.setUint16(32, 0, true);
    cdv.setUint16(34, 0, true);
    cdv.setUint16(36, 0, true);
    cdv.setUint32(38, 0, true);
    cdv.setUint32(42, localOffset, true);
    cd.set(nameBytes, 46);

    cdParts.push(cd);
    localOffset += lh.length + compBytes.length;
    count++;
  }

  let cdSize = 0;
  for (const p of cdParts) cdSize += p.length;

  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(4, 0, true);
  edv.setUint16(6, 0, true);
  edv.setUint16(8, count, true);
  edv.setUint16(10, count, true);
  edv.setUint32(12, cdSize, true);
  edv.setUint32(16, localOffset, true);
  edv.setUint16(20, 0, true);

  return new Blob([...localParts, ...cdParts, eocd], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

const BAB_SPLIT_REGEX = /^\s*(BAB\s+(?:[IVXLCDM]+|\d+))\s*[-:.–—]+\s*(.+)$/i;
const BAB_INLINE_REGEX = /^\s*(BAB\s+(?:[IVXLCDM]+|\d+))\s+(PENDAHULUAN|TINJAUAN\s+PUSTAKA.*|LANDASAN\s+TEORI.*|METODOLOGI.*|METODE\s+PENELITIAN.*|HASIL\s+DAN\s+PEMBAHASAN.*|PEMBAHASAN.*|PENUTUP|KESIMPULAN.*|SIMPULAN.*)\s*$/i;
const BAB_REGEX = /^\s*(BAB\s+(?:[IVXLCDM]+|\d+)(?:\s*[-:.–—]?\s*.*)?|DAFTAR\s+(?:ISI|PUSTAKA|GAMBAR|TABEL|LAMPIRAN)|KATA\s+PENGANTAR|PRAKATA|ABSTRAK|ABSTRACT|RINGKASAN|LAMPIRAN|PENUTUP|PENDAHULUAN)\s*$/i;
const SUBBAB_L2_REGEX = /^\s*(?:[A-Z]\.\s+\S+|(?:\d+|[IVXLCDM]+)\.\d+\.?\s+\S+)/i;
const SUBBAB_L3_REGEX = /^\s*(?:\d+\.\d+\.\d+\.?\s+\S+|[a-z]\.\s+[A-Z]\S*)/;
const SUBBAB_L4_REGEX = /^\s*(?:\d+\.\d+\.\d+\.\d+\.?\s+\S+)/i;
const CAPTION_REGEX = /^\s*(?:Gambar|Tabel|Lampiran|Figure|Table|Bagan|Grafik)\s+\d+(?:[.-]\d+)?\s*[:.]?\s*\S+/i;
const COVER_KEYWORDS = /^\s*(DISUSUN\s+OLEH|DIAJUKAN\s+UNTUK|OLEH\s*:|DOSEN\s+PENGAMPU|PROGRAM\s+STUDI|FAKULTAS|UNIVERSITAS|NIM\s*[:.]|NPM\s*[:.])/i;

function getDirectChildren(parent, localName) {
  const out = [];
  if (!parent || !parent.childNodes) return out;
  for (let i = 0; i < parent.childNodes.length; i++) {
    const n = parent.childNodes[i];
    if (n.nodeType === 1 && n.localName === localName) {
      out.push(n);
    }
  }
  return out;
}

function getFirstDirectChild(parent, localName) {
  if (!parent || !parent.childNodes) return null;
  for (let i = 0; i < parent.childNodes.length; i++) {
    const n = parent.childNodes[i];
    if (n.nodeType === 1 && n.localName === localName) return n;
  }
  return null;
}

function removeDirectChildren(parent, localName) {
  for (const ch of getDirectChildren(parent, localName)) {
    parent.removeChild(ch);
  }
}

function getAllDescendants(parent, localName) {
  const out = [];
  if (!parent) return out;
  const all = parent.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) out.push(all[i]);
  }
  return out;
}

function getWAttr(el, attrLocal) {
  if (!el) return null;
  return el.getAttribute(`w:${attrLocal}`) || el.getAttributeNS(W_NS, attrLocal) || el.getAttribute(attrLocal);
}

function setWAttr(el, attrLocal, val) {
  el.setAttribute(`w:${attrLocal}`, String(val));
}

function removeWAttr(el, attrLocal) {
  el.removeAttribute(`w:${attrLocal}`);
  el.removeAttributeNS(W_NS, attrLocal);
}

function createWEl(xmlDoc, localName) {
  return xmlDoc.createElementNS(W_NS, `w:${localName}`);
}

function ensureDirectChild(xmlDoc, parent, localName) {
  let child = getFirstDirectChild(parent, localName);
  if (!child) {
    child = createWEl(xmlDoc, localName);
    parent.appendChild(child);
  }
  return child;
}

function ensurePPr(xmlDoc, p) {
  let pPr = getFirstDirectChild(p, 'pPr');
  if (!pPr) {
    pPr = createWEl(xmlDoc, 'pPr');
    p.insertBefore(pPr, p.firstChild);
  }
  return pPr;
}

function ensureRPr(xmlDoc, r) {
  let rPr = getFirstDirectChild(r, 'rPr');
  if (!rPr) {
    rPr = createWEl(xmlDoc, 'rPr');
    r.insertBefore(rPr, r.firstChild);
  }
  return rPr;
}

function getParagraphText(p) {
  const tNodes = getAllDescendants(p, 't');
  let s = '';
  for (const t of tNodes) {
    s += (t.textContent || '').replace(/\u00A0/g, ' ');
  }
  return s.replace(/[ \t]+/g, ' ').trim();
}

function hasMedia(p) {
  return (
    getAllDescendants(p, 'drawing').length > 0 ||
    getAllDescendants(p, 'pict').length > 0 ||
    getAllDescendants(p, 'object').length > 0 ||
    getAllDescendants(p, 'oMath').length > 0
  );
}

function isListParagraph(p) {
  const pPr = getFirstDirectChild(p, 'pPr');
  if (pPr && getFirstDirectChild(pPr, 'numPr')) return true;
  const txt = getParagraphText(p);
  return /^\s*(?:[-•*]|\d+\)|[a-z]\))\s+\S+/.test(txt);
}

function classifyParagraph(p) {
  const txt = getParagraphText(p);
  if (hasMedia(p) && txt.length < 120) return 'media';
  if (!txt) return 'empty';

  const pPr = getFirstDirectChild(p, 'pPr');
  const pStyle = pPr ? getFirstDirectChild(pPr, 'pStyle') : null;
  const styleVal = (getWAttr(pStyle, 'val') || '').toLowerCase().replace(/\s+/g, '');
  const outlineEl = pPr ? getFirstDirectChild(pPr, 'outlineLvl') : null;
  const lvlVal = getWAttr(outlineEl, 'val');

  if ((styleVal === 'heading1' || styleVal === 'judul1' || styleVal === 'title' || lvlVal === '0') && txt.length <= 140) return 'heading1';
  if ((styleVal === 'heading2' || styleVal === 'judul2' || styleVal === 'subtitle' || lvlVal === '1') && txt.length <= 160) return 'heading2';
  if ((styleVal === 'heading3' || styleVal === 'judul3' || lvlVal === '2') && txt.length <= 160) return 'heading3';
  if ((styleVal === 'heading4' || styleVal === 'judul4' || lvlVal === '3') && txt.length <= 160) return 'heading4';
  if (styleVal.includes('caption')) return 'caption';
  if (styleVal.includes('toc')) return 'toc';

  if (txt.length <= 120 && !txt.endsWith('.') && BAB_REGEX.test(txt)) return 'heading1';
  if (txt.length <= 140 && !txt.endsWith('.') && SUBBAB_L4_REGEX.test(txt)) return 'heading4';
  if (txt.length <= 140 && !txt.endsWith('.') && SUBBAB_L3_REGEX.test(txt)) return 'heading3';
  if (txt.length <= 140 && !txt.endsWith('.') && SUBBAB_L2_REGEX.test(txt)) return 'heading2';
  if (txt.length <= 180 && CAPTION_REGEX.test(txt)) return 'caption';
  if (isListParagraph(p)) return 'list';
  return 'body';
}

function sanitizeParagraphWhitespace(xmlDoc, p, stripTabs = true, collapseSpaces = true, removeSoftBreaks = false) {
  if (stripTabs) {
    for (const tabEl of [...getAllDescendants(p, 'tab')]) {
      if (tabEl.parentNode && tabEl.parentNode.localName === 'r') {
        const tRepl = createWEl(xmlDoc, 't');
        tRepl.textContent = ' ';
        tabEl.parentNode.replaceChild(tRepl, tabEl);
      }
    }
  }
  if (removeSoftBreaks) {
    for (const brEl of [...getAllDescendants(p, 'br')]) {
      const bType = getWAttr(brEl, 'type');
      if (bType !== 'page' && bType !== 'column' && brEl.parentNode && brEl.parentNode.localName === 'r') {
        const tRepl = createWEl(xmlDoc, 't');
        tRepl.textContent = ' ';
        brEl.parentNode.replaceChild(tRepl, brEl);
      }
    }
  }
  const tNodes = getAllDescendants(p, 't');
  if (!tNodes.length) return;

  let seenNonSpace = false;
  for (const tNode of tNodes) {
    let txt = (tNode.textContent || '').replace(/\u00A0/g, ' ').replace(/\u200B/g, '');
    if (collapseSpaces) {
      txt = txt.replace(/[ \t]{2,}/g, ' ');
    }
    if (!seenNonSpace) {
      txt = txt.replace(/^[ \t]+/, '');
      if (txt.length > 0) seenNonSpace = true;
    }
    tNode.textContent = txt;
    tNode.setAttributeNS(XML_NS, 'xml:space', 'preserve');
  }

  for (let i = tNodes.length - 1; i >= 0; i--) {
    const tNode = tNodes[i];
    if (tNode.textContent) {
      const stripped = tNode.textContent.replace(/[ \t]+$/, '');
      tNode.textContent = stripped;
      if (stripped.length > 0) break;
    }
  }
}

function detectHasCover(paragraphs) {
  let hits = 0;
  const limit = Math.min(14, paragraphs.length);
  for (let i = 0; i < limit; i++) {
    const txt = getParagraphText(paragraphs[i]);
    if (txt.length < 90 && COVER_KEYWORDS.test(txt)) hits++;
  }
  return hits >= 2;
}

function detectHasToc(paragraphs) {
  const limit = Math.min(35, paragraphs.length);
  for (let i = 0; i < limit; i++) {
    const txt = getParagraphText(paragraphs[i]).toUpperCase();
    if (txt === 'DAFTAR ISI' || txt === 'TABLE OF CONTENTS') return true;
  }
  return false;
}

function setRunFontAndSize(xmlDoc, r, opts) {
  const rPr = ensureRPr(xmlDoc, r);
  if (opts.cleanOverrides !== false) {
    ['spacing', 'w', 'kern', 'position', 'shd', 'highlight'].forEach((tag) => removeDirectChildren(rPr, tag));
  }
  if (opts.applyFont !== false && opts.fontName) {
    const rFonts = ensureDirectChild(xmlDoc, rPr, 'rFonts');
    setWAttr(rFonts, 'ascii', opts.fontName);
    setWAttr(rFonts, 'hAnsi', opts.fontName);
    setWAttr(rFonts, 'cs', opts.fontName);
    setWAttr(rFonts, 'eastAsia', opts.fontName);
    ['asciiTheme', 'hAnsiTheme', 'cstheme', 'eastAsiaTheme'].forEach((a) => removeWAttr(rFonts, a));
  }
  if (opts.applySize !== false && opts.sizePt != null) {
    const half = String(ptToHalfPt(opts.sizePt));
    const sz = ensureDirectChild(xmlDoc, rPr, 'sz');
    setWAttr(sz, 'val', half);
    const szCs = ensureDirectChild(xmlDoc, rPr, 'szCs');
    setWAttr(szCs, 'val', half);
  }
  if (opts.bold !== undefined && opts.bold !== null) {
    let b = getFirstDirectChild(rPr, 'b');
    let bCs = getFirstDirectChild(rPr, 'bCs');
    if (opts.bold) {
      if (!b) b = ensureDirectChild(xmlDoc, rPr, 'b');
      setWAttr(b, 'val', 'true');
      if (!bCs) bCs = ensureDirectChild(xmlDoc, rPr, 'bCs');
      setWAttr(bCs, 'val', 'true');
    } else {
      if (b) rPr.removeChild(b);
      if (bCs) rPr.removeChild(bCs);
    }
  }
  if (opts.italic !== undefined && opts.italic !== null) {
    let iEl = getFirstDirectChild(rPr, 'i');
    if (opts.italic) {
      if (!iEl) iEl = ensureDirectChild(xmlDoc, rPr, 'i');
      setWAttr(iEl, 'val', 'true');
    } else if (iEl) {
      rPr.removeChild(iEl);
    }
  }
  if (opts.colorHex) {
    const col = ensureDirectChild(xmlDoc, rPr, 'color');
    setWAttr(col, 'val', opts.colorHex.replace('#', ''));
    ['themeColor', 'themeTint', 'themeShade'].forEach((a) => removeWAttr(col, a));
  }
}

function setParagraphFormat(xmlDoc, p, opts) {
  const pPr = ensurePPr(xmlDoc, p);
  ['contextualSpacing', 'mirrorIndents', 'framePr', 'shd'].forEach((t) => removeDirectChildren(pPr, t));

  if (opts.clearTabs) removeDirectChildren(pPr, 'tabs');
  if (opts.clearNumPr) removeDirectChildren(pPr, 'numPr');

  if (opts.styleId) {
    const pStyle = ensureDirectChild(xmlDoc, pPr, 'pStyle');
    setWAttr(pStyle, 'val', opts.styleId);
  }
  if (opts.outlineLevel !== undefined && opts.outlineLevel !== null) {
    const ol = ensureDirectChild(xmlDoc, pPr, 'outlineLvl');
    setWAttr(ol, 'val', opts.outlineLevel);
  } else if (opts.styleId === 'Normal') {
    removeDirectChildren(pPr, 'outlineLvl');
  }

  if (opts.align) {
    const jc = ensureDirectChild(xmlDoc, pPr, 'jc');
    setWAttr(jc, 'val', opts.align);
  }
  if (opts.lineSpacing != null || opts.spaceBeforePt != null || opts.spaceAfterPt != null) {
    const spacing = ensureDirectChild(xmlDoc, pPr, 'spacing');
    ['beforeAutospacing', 'afterAutospacing', 'beforeLines', 'afterLines'].forEach((a) => removeWAttr(spacing, a));
    if (opts.lineSpacing != null) {
      setWAttr(spacing, 'line', lineSpacingToTwips(opts.lineSpacing));
      setWAttr(spacing, 'lineRule', 'auto');
    }
    if (opts.spaceBeforePt != null) {
      setWAttr(spacing, 'before', ptToTwips(opts.spaceBeforePt));
    }
    if (opts.spaceAfterPt != null) {
      setWAttr(spacing, 'after', ptToTwips(opts.spaceAfterPt));
    }
  }
  if (opts.firstLineCm != null || opts.leftIndentCm != null || opts.rightIndentCm != null) {
    const ind = ensureDirectChild(xmlDoc, pPr, 'ind');
    ['leftChars', 'rightChars', 'firstLineChars', 'hangingChars'].forEach((a) => removeWAttr(ind, a));
    if (opts.firstLineCm != null) {
      if (opts.firstLineCm > 0) {
        setWAttr(ind, 'firstLine', cmToTwips(opts.firstLineCm));
        removeWAttr(ind, 'hanging');
      } else {
        setWAttr(ind, 'firstLine', '0');
        removeWAttr(ind, 'hanging');
      }
    }
    if (opts.leftIndentCm != null) {
      setWAttr(ind, 'left', cmToTwips(opts.leftIndentCm));
    }
    if (opts.rightIndentCm != null) {
      setWAttr(ind, 'right', cmToTwips(opts.rightIndentCm));
    }
  }
  if (opts.keepNext) {
    ensureDirectChild(xmlDoc, pPr, 'keepNext');
    ensureDirectChild(xmlDoc, pPr, 'keepLines');
  } else {
    removeDirectChildren(pPr, 'keepNext');
  }
  if (opts.pageBreakBefore) {
    ensureDirectChild(xmlDoc, pPr, 'pageBreakBefore');
  } else {
    removeDirectChildren(pPr, 'pageBreakBefore');
  }
}

function formatBabHeadingRuns(xmlDoc, p, txt, babLayout, uppercaseBab, fontName, sizePt, applyFont) {
  let cleanTxt = txt.replace(/\s+/g, ' ').trim();
  if (uppercaseBab) cleanTxt = cleanTxt.toUpperCase();

  for (const ch of [...p.childNodes]) {
    if (ch.nodeType === 1 && ch.localName !== 'pPr') {
      p.removeChild(ch);
    }
  }

  if (babLayout === 'split_line') {
    const m = cleanTxt.match(BAB_SPLIT_REGEX) || cleanTxt.match(BAB_INLINE_REGEX);
    if (m) {
      const r1 = createWEl(xmlDoc, 'r');
      setRunFontAndSize(xmlDoc, r1, { fontName, sizePt, bold: true, colorHex: '000000', applyFont, applySize: true });
      const t1 = createWEl(xmlDoc, 't');
      t1.textContent = m[1].trim();
      r1.appendChild(t1);
      r1.appendChild(createWEl(xmlDoc, 'br'));
      const t2 = createWEl(xmlDoc, 't');
      t2.textContent = m[2].trim();
      r1.appendChild(t2);
      p.appendChild(r1);
      return;
    }
  }

  const mDash = cleanTxt.match(BAB_SPLIT_REGEX);
  if (mDash && babLayout === 'single_line') {
    cleanTxt = `${mDash[1].trim()} ${mDash[2].trim()}`;
  }

  const r = createWEl(xmlDoc, 'r');
  setRunFontAndSize(xmlDoc, r, { fontName, sizePt, bold: true, colorHex: '000000', applyFont, applySize: true });
  const t = createWEl(xmlDoc, 't');
  t.textContent = cleanTxt;
  r.appendChild(t);
  p.appendChild(r);
}

function makeStyledParagraph(xmlDoc, text, fontName, sizePt, opts = {}) {
  const p = createWEl(xmlDoc, 'p');
  setParagraphFormat(xmlDoc, p, {
    align: opts.align || 'center',
    lineSpacing: opts.lineSpacing || 1.5,
    spaceBeforePt: opts.spaceBeforePt ?? 0,
    spaceAfterPt: opts.spaceAfterPt ?? 6,
    firstLineCm: 0,
    leftIndentCm: 0,
    rightIndentCm: 0,
    pageBreakBefore: !!opts.pageBreakBefore,
    styleId: opts.styleId || 'Normal',
    outlineLevel: opts.outlineLevel,
    clearTabs: true
  });
  if (text) {
    const r = createWEl(xmlDoc, 'r');
    setRunFontAndSize(xmlDoc, r, {
      fontName,
      sizePt,
      bold: !!opts.bold,
      italic: !!opts.italic,
      colorHex: '000000'
    });
    const t = createWEl(xmlDoc, 't');
    t.setAttributeNS(XML_NS, 'xml:space', 'preserve');
    t.textContent = opts.uppercase ? text.toUpperCase() : text;
    r.appendChild(t);
    p.appendChild(r);
  }
  return p;
}

function makePageBreakParagraph(xmlDoc) {
  const p = createWEl(xmlDoc, 'p');
  const r = createWEl(xmlDoc, 'r');
  const br = createWEl(xmlDoc, 'br');
  setWAttr(br, 'type', 'page');
  r.appendChild(br);
  p.appendChild(r);
  return p;
}

function buildCoverNodes(xmlDoc, coverData, fontName) {
  const nodes = [];
  const docLabel = (coverData.doc_label || 'MAKALAH / LAPORAN').trim();
  const title = (coverData.title || 'JUDUL DOKUMEN LAPORAN ATAU MAKALAH').trim();
  const course = (coverData.course || '').trim();
  const lecturer = (coverData.lecturer || '').trim();
  const author = (coverData.author || 'Nama Penyusun').trim();
  const nim = (coverData.nim || '').trim();
  const faculty = (coverData.faculty || '').trim();
  const institution = (coverData.institution || 'NAMA INSTITUSI / UNIVERSITAS').trim();
  const year = (coverData.year || '2026').trim();

  nodes.push(makeStyledParagraph(xmlDoc, docLabel, fontName, 14, { bold: true, spaceBeforePt: 12, spaceAfterPt: 12, uppercase: true }));
  nodes.push(makeStyledParagraph(xmlDoc, title, fontName, 16, { bold: true, spaceBeforePt: 6, spaceAfterPt: 14, uppercase: true }));

  if (course) {
    nodes.push(makeStyledParagraph(xmlDoc, `Diajukan untuk Memenuhi Tugas Mata Kuliah ${course}`, fontName, 11, { spaceBeforePt: 6, spaceAfterPt: 18 }));
  }
  if (lecturer) {
    nodes.push(makeStyledParagraph(xmlDoc, 'Dosen Pengampu:', fontName, 11, { spaceBeforePt: 12, spaceAfterPt: 2 }));
    nodes.push(makeStyledParagraph(xmlDoc, lecturer, fontName, 12, { bold: true, spaceBeforePt: 0, spaceAfterPt: 24 }));
  }
  nodes.push(makeStyledParagraph(xmlDoc, '', fontName, 12, { spaceBeforePt: 18, spaceAfterPt: 18 }));
  nodes.push(makeStyledParagraph(xmlDoc, 'Disusun Oleh:', fontName, 12, { spaceBeforePt: 14, spaceAfterPt: 4 }));
  nodes.push(makeStyledParagraph(xmlDoc, author, fontName, 12, { bold: true, spaceBeforePt: 0, spaceAfterPt: 2 }));
  if (nim) {
    nodes.push(makeStyledParagraph(xmlDoc, `NIM/NPM: ${nim}`, fontName, 12, { spaceBeforePt: 0, spaceAfterPt: 24 }));
  }
  nodes.push(makeStyledParagraph(xmlDoc, '', fontName, 12, { spaceBeforePt: 28, spaceAfterPt: 28 }));
  if (faculty) {
    nodes.push(makeStyledParagraph(xmlDoc, faculty, fontName, 14, { bold: true, spaceBeforePt: 12, spaceAfterPt: 4, uppercase: true }));
  }
  if (institution) {
    nodes.push(makeStyledParagraph(xmlDoc, institution, fontName, 14, { bold: true, spaceBeforePt: 0, spaceAfterPt: 4, uppercase: true }));
  }
  if (year) {
    nodes.push(makeStyledParagraph(xmlDoc, year, fontName, 13, { bold: true, spaceBeforePt: 0, spaceAfterPt: 0, uppercase: true }));
  }
  nodes.push(makePageBreakParagraph(xmlDoc));
  return nodes;
}

function buildTocNodes(xmlDoc, headings, fontName, sizePt, lineSpacing) {
  const nodes = [];
  nodes.push(makeStyledParagraph(xmlDoc, 'DAFTAR ISI', fontName, sizePt + 2, {
    bold: true,
    spaceBeforePt: 0,
    spaceAfterPt: 18,
    lineSpacing,
    uppercase: true,
    styleId: 'Heading1',
    outlineLevel: 0
  }));

  const items = headings && headings.length ? headings : [
    ['heading1', 'BAB I PENDAHULUAN', 1],
    ['heading2', '1.1 Latar Belakang', 1],
    ['heading2', '1.2 Rumusan Masalah', 2],
    ['heading1', 'BAB II PEMBAHASAN', 3],
    ['heading1', 'BAB III PENUTUP', 8],
    ['heading1', 'DAFTAR PUSTAKA', 10]
  ];

  for (const [level, text, pg] of items) {
    const p = createWEl(xmlDoc, 'p');
    const pPr = ensurePPr(xmlDoc, p);
    const tabs = ensureDirectChild(xmlDoc, pPr, 'tabs');
    const tab = createWEl(xmlDoc, 'tab');
    setWAttr(tab, 'val', 'right');
    setWAttr(tab, 'leader', 'dot');
    setWAttr(tab, 'pos', cmToTwips(14.0));
    tabs.appendChild(tab);

    const isBold = level === 'heading1';
    const leftCm = level === 'heading1' ? 0 : (level === 'heading2' ? 0.75 : 1.5);
    setParagraphFormat(xmlDoc, p, {
      align: 'both',
      lineSpacing,
      spaceBeforePt: isBold ? 4 : 0,
      spaceAfterPt: 2,
      firstLineCm: 0,
      leftIndentCm: leftCm
    });

    const r1 = createWEl(xmlDoc, 'r');
    setRunFontAndSize(xmlDoc, r1, { fontName, sizePt, bold: isBold, colorHex: '000000' });
    const t1 = createWEl(xmlDoc, 't');
    t1.textContent = isBold ? text.toUpperCase() : text;
    r1.appendChild(t1);
    p.appendChild(r1);

    const rTab = createWEl(xmlDoc, 'r');
    rTab.appendChild(createWEl(xmlDoc, 'tab'));
    p.appendChild(rTab);

    const rPg = createWEl(xmlDoc, 'r');
    setRunFontAndSize(xmlDoc, rPg, { fontName, sizePt, bold: isBold, colorHex: '000000' });
    const tPg = createWEl(xmlDoc, 't');
    tPg.textContent = String(pg);
    rPg.appendChild(tPg);
    p.appendChild(rPg);

    nodes.push(p);
  }

  nodes.push(makePageBreakParagraph(xmlDoc));
  return nodes;
}

function buildStylesXmlString(fontName, sizeBody, sizeH1, sizeH2, sizeH3, alignH1, alignH2, lineSpacing) {
  const lineTwips = lineSpacingToTwips(lineSpacing);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${W_NS}">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="0" w:after="120" w:line="${lineTwips}" w:lineRule="auto"/>
      <w:jc w:val="both"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}" w:eastAsia="${fontName}"/>
      <w:sz w:val="${ptToHalfPt(sizeBody)}"/>
      <w:szCs w:val="${ptToHalfPt(sizeBody)}"/>
      <w:color w:val="000000"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="0" w:after="240" w:line="${lineTwips}" w:lineRule="auto"/>
      <w:ind w:left="0" w:firstLine="0"/>
      <w:jc w:val="${alignH1}"/>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}" w:eastAsia="${fontName}"/>
      <w:b w:val="true"/>
      <w:bCs w:val="true"/>
      <w:color w:val="000000"/>
      <w:sz w:val="${ptToHalfPt(sizeH1)}"/>
      <w:szCs w:val="${ptToHalfPt(sizeH1)}"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="200" w:after="80" w:line="${lineTwips}" w:lineRule="auto"/>
      <w:ind w:left="0" w:firstLine="0"/>
      <w:jc w:val="${alignH2}"/>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}" w:eastAsia="${fontName}"/>
      <w:b w:val="true"/>
      <w:bCs w:val="true"/>
      <w:color w:val="000000"/>
      <w:sz w:val="${ptToHalfPt(sizeH2)}"/>
      <w:szCs w:val="${ptToHalfPt(sizeH2)}"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="120" w:after="40" w:line="${lineTwips}" w:lineRule="auto"/>
      <w:ind w:left="0" w:firstLine="0"/>
      <w:jc w:val="${alignH2}"/>
      <w:outlineLvl w:val="2"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}" w:eastAsia="${fontName}"/>
      <w:b w:val="true"/>
      <w:bCs w:val="true"/>
      <w:color w:val="000000"/>
      <w:sz w:val="${ptToHalfPt(sizeH3)}"/>
      <w:szCs w:val="${ptToHalfPt(sizeH3)}"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading4">
    <w:name w:val="heading 4"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="80" w:after="40" w:line="${lineTwips}" w:lineRule="auto"/>
      <w:ind w:left="0" w:firstLine="0"/>
      <w:jc w:val="${alignH2}"/>
      <w:outlineLvl w:val="3"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}" w:eastAsia="${fontName}"/>
      <w:b w:val="true"/>
      <w:i w:val="true"/>
      <w:color w:val="000000"/>
      <w:sz w:val="${ptToHalfPt(sizeBody)}"/>
      <w:szCs w:val="${ptToHalfPt(sizeBody)}"/>
    </w:rPr>
  </w:style>
</w:styles>`;
}

function buildPageNumberXmlString(fontName, sizePt, align, isHeader) {
  const tag = isHeader ? 'hdr' : 'ftr';
  const half = ptToHalfPt(sizePt);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:${tag} xmlns:w="${W_NS}">
  <w:p>
    <w:pPr><w:jc w:val="${align}"/></w:pPr>
    <w:r>
      <w:rPr><w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/><w:sz w:val="${half}"/><w:szCs w:val="${half}"/></w:rPr>
      <w:fldChar w:fldCharType="begin"/>
    </w:r>
    <w:r>
      <w:rPr><w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/><w:sz w:val="${half}"/><w:szCs w:val="${half}"/></w:rPr>
      <w:instrText xml:space="preserve"> PAGE </w:instrText>
    </w:r>
    <w:r>
      <w:rPr><w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/><w:sz w:val="${half}"/><w:szCs w:val="${half}"/></w:rPr>
      <w:fldChar w:fldCharType="separate"/>
    </w:r>
    <w:r>
      <w:rPr><w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/><w:sz w:val="${half}"/><w:szCs w:val="${half}"/></w:rPr>
      <w:t>1</w:t>
    </w:r>
    <w:r>
      <w:rPr><w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/><w:sz w:val="${half}"/><w:szCs w:val="${half}"/></w:rPr>
      <w:fldChar w:fldCharType="end"/>
    </w:r>
  </w:p>
</w:${tag}>`;
}

async function inspectDocxArrayBuffer(arrayBuffer, filename, sizeBytes) {
  const fileMap = await readZipEntries(arrayBuffer);
  if (!fileMap.has('word/document.xml')) {
    throw new Error('Struktur word/document.xml tidak ditemukan di dalam file.');
  }
  const xmlStr = new TextDecoder('utf-8').decode(fileMap.get('word/document.xml'));
  const xmlDoc = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const body = getFirstDirectChild(xmlDoc.documentElement, 'body');
  const paragraphs = body ? getDirectChildren(body, 'p') : [];
  const tables = body ? getDirectChildren(body, 'tbl') : [];

  let nonEmpty = 0;
  let wordCount = 0;
  const headings = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const txt = getParagraphText(p);
    if (txt) {
      nonEmpty++;
      wordCount += txt.split(/\s+/).filter(Boolean).length;
    }
    const cls = classifyParagraph(p);
    if ((cls === 'heading1' || cls === 'heading2' || cls === 'heading3' || cls === 'heading4') && txt) {
      headings.push({ level: cls, text: txt.slice(0, 100) });
    }
  }

  const hasCover = detectHasCover(paragraphs);
  const hasToc = detectHasToc(paragraphs);

  const currentMargins = { top: 2.54, left: 2.54, bottom: 2.54, right: 2.54 };
  const sectPr = body ? getFirstDirectChild(body, 'sectPr') : null;
  if (sectPr) {
    const pgMar = getFirstDirectChild(sectPr, 'pgMar');
    if (pgMar) {
      ['top', 'left', 'bottom', 'right'].forEach((side) => {
        const v = parseInt(getWAttr(pgMar, side), 10);
        if (!isNaN(v)) {
          currentMargins[side] = Number(((v / 1440) * 2.54).toFixed(2));
        }
      });
    }
  }

  return {
    filename,
    size_kb: Number((sizeBytes / 1024).toFixed(1)),
    paragraph_count: nonEmpty,
    word_count: wordCount,
    table_count: tables.length,
    heading_count: headings.length,
    headings: headings.slice(0, 25),
    has_cover: hasCover,
    has_toc: hasToc,
    current_margins_cm: currentMargins
  };
}

async function formatDocxArrayBuffer(arrayBuffer, config) {
  const fileMap = await readZipEntries(arrayBuffer);
  const dec = new TextDecoder('utf-8');
  const enc = new TextEncoder();
  const xmlStr = dec.decode(fileMap.get('word/document.xml'));
  const xmlDoc = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const body = getFirstDirectChild(xmlDoc.documentElement, 'body');

  const enabled = config.enabled_modules || {};
  const doMargin = enabled.margin !== false;
  const doFont = enabled.font !== false;
  const doSize = enabled.font_size !== false;
  const doAlign = enabled.alignment !== false;
  const doSpacing = enabled.line_spacing !== false;
  const doParaSpacing = enabled.paragraph_spacing !== false;
  const doIndent = enabled.indentation !== false;
  const doHeadings = enabled.headings !== false;
  const doPageNumbers = enabled.page_numbers !== false;
  const doTables = enabled.tables !== false;

  const whitespaceMode = config.whitespace_cleanup_mode || 'aggressive';
  const headingMode = config.heading_mode || 'Heading123';
  const babLayout = config.bab_layout || 'single_line';
  const coverMode = config.cover_mode || 'auto_if_missing';
  const tocMode = config.toc_mode || 'auto_if_missing';

  const fontName = config.font_name || 'Times New Roman';
  const fontSizeBody = parseFloat(config.font_size_body || 12);
  const fontSizeH1 = parseFloat(config.font_size_h1 || 14);
  const fontSizeH2 = parseFloat(config.font_size_h2 || 12);
  const fontSizeH3 = parseFloat(config.font_size_h3 || 12);
  const fontSizeTable = parseFloat(config.font_size_table || 10);

  const alignBody = config.alignment_body || 'both';
  const alignH1 = config.alignment_h1 || 'center';
  const alignH2 = config.alignment_h2 || 'left';

  const lineSpacing = parseFloat(config.line_spacing || 1.5);
  const spaceBeforePt = parseFloat(config.space_before_pt ?? 0);
  const spaceAfterPt = parseFloat(config.space_after_pt ?? 6);
  const firstLineIndentCm = parseFloat(config.first_line_indent_cm ?? 1.27);

  const pageBreakBab = config.page_break_bab !== false;
  const uppercaseBab = config.uppercase_bab !== false;
  const forceBlackText = config.force_black_text !== false;

  const paperSize = config.paper_size || 'A4';
  const marginTopCm = parseFloat(config.margin_top_cm || 4.0);
  const marginLeftCm = parseFloat(config.margin_left_cm || 4.0);
  const marginBottomCm = parseFloat(config.margin_bottom_cm || 3.0);
  const marginRightCm = parseFloat(config.margin_right_cm || 3.0);
  const pageNumPos = config.page_number_position || 'bottom_right';

  const stats = {
    paragraphs_formatted: 0,
    headings_formatted: 0,
    tables_formatted: 0,
    empty_lines_removed: 0,
    spaces_cleaned: 0,
    cover_added: false,
    toc_added: false,
    page_numbers_added: false,
    margins_applied: `${marginTopCm}-${marginLeftCm}-${marginBottomCm}-${marginRightCm} cm (${paperSize})`
  };

  let paragraphs = getDirectChildren(body, 'p');

  if (whitespaceMode !== 'keep') {
    for (const p of [...paragraphs]) {
      const txt = getParagraphText(p);
      const hasPageBr = getAllDescendants(p, 'br').some((br) => getWAttr(br, 'type') === 'page');
      if (!txt && !hasMedia(p) && !hasPageBr) {
        body.removeChild(p);
        stats.empty_lines_removed++;
      }
    }
    paragraphs = getDirectChildren(body, 'p');
  }

  const detectedHeadings = [];
  let firstH1Seen = false;

  for (let idx = 0; idx < paragraphs.length; idx++) {
    const p = paragraphs[idx];
    const cls = classifyParagraph(p);

    if (cls === 'empty') continue;

    if (cls === 'media') {
      setParagraphFormat(xmlDoc, p, { align: 'center', firstLineCm: 0, leftIndentCm: 0, spaceBeforePt: 6, spaceAfterPt: 6 });
      continue;
    }

    if (whitespaceMode === 'aggressive' || whitespaceMode === 'standard') {
      sanitizeParagraphWhitespace(
        xmlDoc,
        p,
        cls !== 'toc',
        true,
        whitespaceMode === 'aggressive' && cls === 'body'
      );
      stats.spaces_cleaned++;
    }

    const txt = getParagraphText(p);
    if (!txt && !hasMedia(p)) continue;

    if (cls === 'caption') {
      setParagraphFormat(xmlDoc, p, {
        align: 'center',
        lineSpacing: doSpacing ? 1.15 : null,
        spaceBeforePt: doParaSpacing ? 6 : null,
        spaceAfterPt: doParaSpacing ? 8 : null,
        firstLineCm: 0,
        leftIndentCm: 0,
        styleId: 'Normal',
        clearTabs: true
      });
      for (const r of getAllDescendants(p, 'r')) {
        setRunFontAndSize(xmlDoc, r, {
          fontName,
          sizePt: Math.max(10, fontSizeBody - 1),
          italic: true,
          colorHex: forceBlackText ? '000000' : null,
          applyFont: doFont,
          applySize: doSize
        });
      }
      stats.paragraphs_formatted++;
      continue;
    }

    if ((cls === 'heading1' || cls === 'heading2' || cls === 'heading3' || cls === 'heading4') && doHeadings && headingMode !== 'skip') {
      const estPg = Math.max(1, Math.floor(idx / 18) + 1);
      detectedHeadings.push([cls, txt, estPg]);
      stats.headings_formatted++;

      if (cls === 'heading1') {
        const shouldBreak = pageBreakBab && firstH1Seen;
        firstH1Seen = true;
        setParagraphFormat(xmlDoc, p, {
          align: alignH1,
          lineSpacing: doSpacing ? lineSpacing : null,
          spaceBeforePt: 0,
          spaceAfterPt: 12,
          firstLineCm: 0,
          leftIndentCm: 0,
          rightIndentCm: 0,
          keepNext: true,
          pageBreakBefore: shouldBreak,
          styleId: 'Heading1',
          outlineLevel: 0,
          clearTabs: true,
          clearNumPr: true
        });
        formatBabHeadingRuns(xmlDoc, p, txt, babLayout, uppercaseBab, fontName, fontSizeH1, doFont);
      } else if (cls === 'heading2') {
        setParagraphFormat(xmlDoc, p, {
          align: alignH2,
          lineSpacing: doSpacing ? lineSpacing : null,
          spaceBeforePt: 10,
          spaceAfterPt: 4,
          firstLineCm: 0,
          leftIndentCm: 0,
          rightIndentCm: 0,
          keepNext: true,
          pageBreakBefore: false,
          styleId: 'Heading2',
          outlineLevel: 1,
          clearTabs: true,
          clearNumPr: true
        });
        for (const r of getAllDescendants(p, 'r')) {
          setRunFontAndSize(xmlDoc, r, {
            fontName,
            sizePt: fontSizeH2,
            bold: true,
            italic: false,
            colorHex: forceBlackText ? '000000' : null,
            applyFont: doFont,
            applySize: true
          });
        }
      } else {
        const isH3 = cls === 'heading3';
        setParagraphFormat(xmlDoc, p, {
          align: alignH2,
          lineSpacing: doSpacing ? lineSpacing : null,
          spaceBeforePt: 6,
          spaceAfterPt: 2,
          firstLineCm: 0,
          leftIndentCm: 0,
          rightIndentCm: 0,
          keepNext: true,
          pageBreakBefore: false,
          styleId: isH3 ? 'Heading3' : 'Heading4',
          outlineLevel: isH3 ? 2 : 3,
          clearTabs: true,
          clearNumPr: true
        });
        for (const r of getAllDescendants(p, 'r')) {
          setRunFontAndSize(xmlDoc, r, {
            fontName,
            sizePt: isH3 ? fontSizeH3 : fontSizeBody,
            bold: true,
            italic: !isH3,
            colorHex: forceBlackText ? '000000' : null,
            applyFont: doFont,
            applySize: true
          });
        }
      }
      continue;
    }

    if (cls === 'list') {
      const pPr = getFirstDirectChild(p, 'pPr');
      const hasNumPr = !!(pPr && getFirstDirectChild(pPr, 'numPr'));
      setParagraphFormat(xmlDoc, p, {
        align: doAlign ? alignBody : null,
        lineSpacing: doSpacing ? lineSpacing : null,
        spaceBeforePt: doParaSpacing ? 0 : null,
        spaceAfterPt: doParaSpacing ? Math.max(2, spaceAfterPt / 2) : null,
        firstLineCm: hasNumPr ? null : 0,
        leftIndentCm: hasNumPr ? null : 0.63,
        rightIndentCm: 0,
        clearTabs: true
      });
      for (const r of getAllDescendants(p, 'r')) {
        setRunFontAndSize(xmlDoc, r, {
          fontName,
          sizePt: fontSizeBody,
          colorHex: forceBlackText ? '000000' : null,
          applyFont: doFont,
          applySize: doSize
        });
      }
      stats.paragraphs_formatted++;
      continue;
    }

    setParagraphFormat(xmlDoc, p, {
      align: doAlign ? alignBody : null,
      lineSpacing: doSpacing ? lineSpacing : null,
      spaceBeforePt: doParaSpacing ? spaceBeforePt : null,
      spaceAfterPt: doParaSpacing ? spaceAfterPt : null,
      firstLineCm: doIndent ? firstLineIndentCm : null,
      leftIndentCm: doIndent ? 0 : null,
      rightIndentCm: 0,
      styleId: 'Normal',
      clearTabs: true
    });
    for (const r of getAllDescendants(p, 'r')) {
      setRunFontAndSize(xmlDoc, r, {
        fontName,
        sizePt: fontSizeBody,
        colorHex: forceBlackText ? '000000' : null,
        applyFont: doFont,
        applySize: doSize
      });
    }
    stats.paragraphs_formatted++;
  }

  if (doTables) {
    const tables = getAllDescendants(body, 'tbl');
    for (const tbl of tables) {
      let tblPr = getFirstDirectChild(tbl, 'tblPr');
      if (!tblPr) {
        tblPr = createWEl(xmlDoc, 'tblPr');
        tbl.insertBefore(tblPr, tbl.firstChild);
      }
      const jc = ensureDirectChild(xmlDoc, tblPr, 'jc');
      setWAttr(jc, 'val', 'center');

      const rows = getDirectChildren(tbl, 'tr');
      rows.forEach((row, rIdx) => {
        for (const p of getAllDescendants(row, 'p')) {
          sanitizeParagraphWhitespace(xmlDoc, p, true, true, false);
          setParagraphFormat(xmlDoc, p, {
            align: rIdx === 0 ? 'center' : 'left',
            lineSpacing: 1.15,
            spaceBeforePt: 2,
            spaceAfterPt: 2,
            firstLineCm: 0,
            leftIndentCm: 0,
            rightIndentCm: 0,
            clearTabs: true
          });
          for (const r of getAllDescendants(p, 'r')) {
            setRunFontAndSize(xmlDoc, r, {
              fontName,
              sizePt: fontSizeTable,
              bold: rIdx === 0 ? true : undefined,
              colorHex: forceBlackText ? '000000' : null,
              applyFont: doFont,
              applySize: doSize
            });
          }
        }
      });
      stats.tables_formatted++;
    }
  }

  const alreadyHasToc = detectHasToc(paragraphs);
  if (tocMode === 'force' || (tocMode === 'auto_if_missing' && !alreadyHasToc)) {
    const tocNodes = buildTocNodes(xmlDoc, detectedHeadings, fontName, fontSizeBody, lineSpacing);
    for (let i = tocNodes.length - 1; i >= 0; i--) {
      body.insertBefore(tocNodes[i], body.firstChild);
    }
    stats.toc_added = true;
  }

  const alreadyHasCover = detectHasCover(paragraphs);
  if (coverMode === 'force' || (coverMode === 'auto_if_missing' && !alreadyHasCover)) {
    const coverNodes = buildCoverNodes(xmlDoc, config.cover_data || {}, fontName);
    for (let i = coverNodes.length - 1; i >= 0; i--) {
      body.insertBefore(coverNodes[i], body.firstChild);
    }
    stats.cover_added = true;
  }

  let mainSectPr = getFirstDirectChild(body, 'sectPr');
  if (!mainSectPr) {
    mainSectPr = createWEl(xmlDoc, 'sectPr');
    body.appendChild(mainSectPr);
  }
  const allSectPrs = getAllDescendants(body, 'sectPr');
  if (!allSectPrs.includes(mainSectPr)) allSectPrs.push(mainSectPr);

  if (doMargin) {
    const [wCm, hCm] = PAGE_SIZES_CM[paperSize] || PAGE_SIZES_CM.A4;
    for (const sectPr of allSectPrs) {
      const pgSz = ensureDirectChild(xmlDoc, sectPr, 'pgSz');
      setWAttr(pgSz, 'w', cmToTwips(wCm));
      setWAttr(pgSz, 'h', cmToTwips(hCm));

      const pgMar = ensureDirectChild(xmlDoc, sectPr, 'pgMar');
      setWAttr(pgMar, 'top', cmToTwips(marginTopCm));
      setWAttr(pgMar, 'left', cmToTwips(marginLeftCm));
      setWAttr(pgMar, 'bottom', cmToTwips(marginBottomCm));
      setWAttr(pgMar, 'right', cmToTwips(marginRightCm));
      setWAttr(pgMar, 'header', cmToTwips(1.25));
      setWAttr(pgMar, 'footer', cmToTwips(1.25));
      setWAttr(pgMar, 'gutter', '0');
    }
  }

  fileMap.set(
    'word/styles.xml',
    enc.encode(buildStylesXmlString(fontName, fontSizeBody, fontSizeH1, fontSizeH2, fontSizeH3, alignH1, alignH2, lineSpacing))
  );

  if (doPageNumbers && pageNumPos !== 'none') {
    const isHeader = pageNumPos.startsWith('top_');
    const alignVal = pageNumPos.endsWith('center') ? 'center' : 'right';
    const partFilename = isHeader ? 'header_docformat.xml' : 'footer_docformat.xml';
    const partPath = `word/${partFilename}`;
    const relType = isHeader
      ? 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header'
      : 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer';
    const contentType = isHeader
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml';
    const relId = 'rIdDocFormatPgNum';

    fileMap.set(partPath, enc.encode(buildPageNumberXmlString(fontName, Math.max(10, fontSizeBody - 1), alignVal, isHeader)));

    const relsPath = 'word/_rels/document.xml.rels';
    if (fileMap.has(relsPath)) {
      const relsDoc = new DOMParser().parseFromString(dec.decode(fileMap.get(relsPath)), 'application/xml');
      const relRoot = relsDoc.documentElement;
      for (const el of [...getDirectChildren(relRoot, 'Relationship')]) {
        if (el.getAttribute('Id') === relId) relRoot.removeChild(el);
      }
      const newRel = relsDoc.createElementNS(relRoot.namespaceURI || 'http://schemas.openxmlformats.org/package/2006/relationships', 'Relationship');
      newRel.setAttribute('Id', relId);
      newRel.setAttribute('Type', relType);
      newRel.setAttribute('Target', partFilename);
      relRoot.appendChild(newRel);
      fileMap.set(relsPath, enc.encode(new XMLSerializer().serializeToString(relsDoc)));
    }

    const ctPath = '[Content_Types].xml';
    if (fileMap.has(ctPath)) {
      const ctDoc = new DOMParser().parseFromString(dec.decode(fileMap.get(ctPath)), 'application/xml');
      const ctRoot = ctDoc.documentElement;
      const partAttr = `/word/${partFilename}`;
      const exists = getDirectChildren(ctRoot, 'Override').some((el) => el.getAttribute('PartName') === partAttr);
      if (!exists) {
        const ov = ctDoc.createElementNS(ctRoot.namespaceURI || 'http://schemas.openxmlformats.org/package/2006/content-types', 'Override');
        ov.setAttribute('PartName', partAttr);
        ov.setAttribute('ContentType', contentType);
        ctRoot.appendChild(ov);
        fileMap.set(ctPath, enc.encode(new XMLSerializer().serializeToString(ctDoc)));
      }
    }

    const refTag = isHeader ? 'headerReference' : 'footerReference';
    for (const sectPr of allSectPrs) {
      for (const oldRef of [...getDirectChildren(sectPr, refTag)]) {
        if (getWAttr(oldRef, 'type') === 'default') sectPr.removeChild(oldRef);
      }
      const refEl = createWEl(xmlDoc, refTag);
      setWAttr(refEl, 'type', 'default');
      refEl.setAttributeNS(R_NS, 'r:id', relId);
      sectPr.insertBefore(refEl, sectPr.firstChild);
      if (stats.cover_added) {
        ensureDirectChild(xmlDoc, sectPr, 'titlePg');
      }
    }
    stats.page_numbers_added = true;
  }

  fileMap.set('word/document.xml', enc.encode(new XMLSerializer().serializeToString(xmlDoc)));
  const outBlob = await writeZipEntries(fileMap);
  return { blob: outBlob, stats };
}

async function generateSampleMessyDocxBlob() {
  const enc = new TextEncoder();
  const fileMap = new Map();

  fileMap.set('[Content_Types].xml', enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`));

  fileMap.set('_rels/.rels', enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`));

  fileMap.set('word/_rels/document.xml.rels', enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`));

  fileMap.set('word/styles.xml', enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${W_NS}">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
</w:styles>`));

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W_NS}" xmlns:r="${R_NS}">
  <w:body>
    <w:p><w:pPr><w:spacing w:before="400" w:after="600"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Comic Sans MS" w:hAnsi="Comic Sans MS"/><w:sz w:val="32"/><w:color w:val="2563EB"/></w:rPr><w:t>   Kata Pengantar  </w:t></w:r></w:p>
    <w:p><w:pPr><w:spacing w:before="300" w:after="500"/><w:ind w:left="480"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr><w:t>     Puji   syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa karena atas rahmat dan karunia-Nya   dokumen laporan penelitian mengenai implementasi sistem otomatisasi tata letak dokumen akademik ini dapat diselesaikan tepat pada waktunya.</w:t></w:r></w:p>
    <w:p/>
    <w:p/>
    <w:p><w:pPr><w:spacing w:before="400" w:after="600"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="30"/><w:color w:val="DC2626"/></w:rPr><w:t>  bab i - pendahuluan </w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="Verdana" w:hAnsi="Verdana"/><w:sz w:val="26"/><w:color w:val="1E40AF"/></w:rPr><w:t>  1.1   Latar Belakang</w:t></w:r></w:p>
    <w:p><w:pPr><w:spacing w:before="280" w:after="640"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr><w:t>      Dalam penyusunan karya tulis ilmiah seperti laporan praktikum,   makalah perkuliahan, proposal penelitian, hingga skripsi, konsistensi format penulisan merupakan salah satu indikator penilaian utama. Banyak mahasiswa maupun praktisi menghabiskan waktu berjam-jam hanya untuk menyesuaikan margin 4-4-3-3, mengubah jenis huruf menjadi Times New Roman 12pt, merapikan rata kiri-kanan (justify), serta menyusun daftar isi secara manual.</w:t></w:r></w:p>
    <w:p><w:pPr><w:spacing w:before="300" w:after="500"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="20"/></w:rPr><w:t>    Kesalahan umum yang sering ditemukan pada draf dokumen mentah meliputi penggunaan font yang bercampur aduk,   jarak antar paragraf yang tidak seragam, indentasi baris pertama yang dibuat menggunakan tombol spasi berulang-ulang, hingga bab baru yang tidak menggunakan style Heading 1/2/3.</w:t></w:r></w:p>
    <w:p><w:r><w:t>1.2 Rumusan Masalah</w:t></w:r></w:p>
    <w:p><w:r><w:t>   Berdasarkan uraian latar belakang di atas, maka rumusan masalah yang dibahas dalam laporan ini adalah bagaimana merancang bangun sistem perapi dokumen otomatis berbasis web yang mampu menstandardisasi struktur XML dokumen DOCX secara instan dan akurat sesuai pedoman penulisan ilmiah.</w:t></w:r></w:p>
    <w:p><w:r><w:t>1.2.1 Batasan Teknis Pemrosesan OpenXML</w:t></w:r></w:p>
    <w:p><w:r><w:t>   Pemrosesan mencakup pembersihan spasi ganda, penghapusan jarak paragraf liar bawaan dokumen lama, serta penerapan style Heading 1, Heading 2, dan Heading 3.</w:t></w:r></w:p>
    <w:p><w:r><w:t>1.3 Tujuan Penulisan</w:t></w:r></w:p>
    <w:p><w:r><w:t>   Adapun tujuan dari penyusunan laporan ini meliputi otomatisasi pengaturan margin halaman, penyeragaman tipografi dan spasi baris, pendeteksian struktur BAB dan Sub-bab, pembuatan halaman sampul (cover) otomatis, serta penyusunan daftar isi dan nomor halaman secara terprogram.</w:t></w:r></w:p>
    <w:p><w:r><w:t>bab ii : tinjauan pustaka dan pembahasan</w:t></w:r></w:p>
    <w:p><w:r><w:t>2.1 Standar Tata Tulis Ilmiah di Indonesia</w:t></w:r></w:p>
    <w:p><w:r><w:t>   Secara umum, pedoman penulisan karya ilmiah di berbagai perguruan tinggi Indonesia menerapkan aturan kertas berukuran A4 (21 x 29,7 cm) dengan batas tepi atas 4 cm, tepi kiri 4 cm (untuk ruang penjilidan), tepi bawah 3 cm, dan tepi kanan 3 cm. Huruf standar yang digunakan adalah Times New Roman ukuran 12 poin dengan jarak spasi 1,5 baris atau 2,0 baris untuk tugas akhir.</w:t></w:r></w:p>
    <w:p><w:r><w:t>bab iii - penutup</w:t></w:r></w:p>
    <w:p><w:r><w:t>3.1 Kesimpulan</w:t></w:r></w:p>
    <w:p><w:r><w:t>   Melalui pemanfaatan mesin pemroses OpenXML terstruktur, seluruh ketidakseragaman tipografi, perataan paragraf, margin halaman, struktur bab, hingga kelengkapan halaman sampul dan daftar isi dapat diselesaikan dalam hitungan milidetik tanpa merusak konten asli dokumen.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Daftar Pustaka</w:t></w:r></w:p>
    <w:p><w:r><w:t>Badan Standar Nasional Pendidikan. (2024). Pedoman Tata Naskah Karya Ilmiah Perguruan Tinggi. Jakarta: Balai Pustaka.</w:t></w:r></w:p>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  fileMap.set('word/document.xml', enc.encode(docXml));
  return await writeZipEntries(fileMap);
}

window.ClientDocxEngine = {
  inspectDocxArrayBuffer,
  formatDocxArrayBuffer,
  generateSampleMessyDocxBlob
};
