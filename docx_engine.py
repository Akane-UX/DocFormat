import zipfile
import io
import re
from copy import deepcopy
from lxml import etree

NAMESPACES = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
    'xml': 'http://www.w3.org/XML/1998/namespace'
}

W_NS = f"{{{NAMESPACES['w']}}}"
XML_NS = f"{{{NAMESPACES['xml']}}}"

def w_tag(name: str) -> str:
    return f"{W_NS}{name}"

def cm_to_twips(cm: float) -> int:
    return int(round((cm / 2.54) * 1440))

def pt_to_half_pt(pt: float) -> int:
    return int(round(pt * 2))

def pt_to_twips(pt: float) -> int:
    return int(round(pt * 20))

def line_spacing_to_twips(multiplier: float) -> int:
    return int(round(multiplier * 240))

PAGE_SIZES_CM = {
    'A4': (21.0, 29.7),
    'Letter': (21.59, 27.94),
    'F4': (21.5, 33.0),
    'Legal': (21.59, 35.56)
}

BAB_REGEX = re.compile(
    r'^\s*(BAB\s+(?:[IVXLCDM]+|\d+)(?:\s*[-:.]?\s*.*)?|'
    r'DAFTAR\s+(?:ISI|PUSTAKA|GAMBAR|TABEL|LAMPIRAN)|'
    r'KATA\s+PENGANTAR|ABSTRAK|ABSTRACT|RINGKASAN|LAMPIRAN|PENUTUP|PENDAHULUAN)\s*$',
    re.IGNORECASE
)

SUBBAB_L2_REGEX = re.compile(
    r'^\s*(?:[A-Z]\.\s+\S+|(?:\d+|[IVXLCDM]+)\.\d+\.?\s+\S+)',
    re.IGNORECASE
)

SUBBAB_L3_REGEX = re.compile(
    r'^\s*(?:\d+\.\d+\.\d+\.?\s+\S+)',
    re.IGNORECASE
)

CAPTION_REGEX = re.compile(
    r'^\s*(?:Gambar|Tabel|Lampiran|Figure|Table)\s+\d+(?:[.-]\d+)?\s*[:.]?\s*\S+',
    re.IGNORECASE
)

COVER_KEYWORDS = re.compile(
    r'^\s*(DISUSUN\s+OLEH|DIAJUKAN\s+UNTUK|OLEH\s*:|DOSEN\s+PENGAMPU|PROGRAM\s+STUDI|FAKULTAS|UNIVERSITAS|NIM\s*[:.]|NPM\s*[:.])',
    re.IGNORECASE
)

def get_paragraph_text(p_elem) -> str:
    texts = p_elem.xpath('.//w:t/text()', namespaces=NAMESPACES)
    return ''.join(texts).strip()

def has_drawing_or_pict(p_elem) -> bool:
    drawings = p_elem.xpath('.//w:drawing | .//w:pict | .//w:object', namespaces=NAMESPACES)
    return len(drawings) > 0

def is_list_paragraph(p_elem) -> bool:
    num_pr = p_elem.xpath('./w:pPr/w:numPr', namespaces=NAMESPACES)
    if num_pr:
        return True
    txt = get_paragraph_text(p_elem)
    if re.match(r'^\s*(?:[-•*]|\d+\)|[a-z]\))\s+\S+', txt):
        return True
    return False

def classify_paragraph(p_elem, idx: int, total_p: int) -> str:
    txt = get_paragraph_text(p_elem)
    if has_drawing_or_pict(p_elem) and len(txt) < 120:
        return 'media'
    if not txt:
        return 'empty'

    p_style = p_elem.xpath('./w:pPr/w:pStyle/@w:val', namespaces=NAMESPACES)
    style_val = p_style[0].lower() if p_style else ''

    if 'heading1' in style_val or 'heading 1' in style_val or 'judul1' in style_val:
        return 'heading1'
    if 'heading2' in style_val or 'heading 2' in style_val or 'judul2' in style_val:
        return 'heading2'
    if 'heading3' in style_val or 'heading 3' in style_val or 'judul3' in style_val:
        return 'heading3'
    if 'caption' in style_val:
        return 'caption'
    if 'toc' in style_val:
        return 'toc'

    if len(txt) <= 120 and BAB_REGEX.match(txt):
        return 'heading1'
    if len(txt) <= 140 and SUBBAB_L3_REGEX.match(txt):
        return 'heading3'
    if len(txt) <= 140 and SUBBAB_L2_REGEX.match(txt):
        return 'heading2'
    if len(txt) <= 180 and CAPTION_REGEX.match(txt):
        return 'caption'
    if is_list_paragraph(p_elem):
        return 'list'

    return 'body'

def ensure_child(parent, tag_name: str):
    child = parent.find(w_tag(tag_name))
    if child is None:
        child = etree.SubElement(parent, w_tag(tag_name))
    return child

def ensure_pPr(p_elem):
    pPr = p_elem.find(w_tag('pPr'))
    if pPr is None:
        pPr = etree.Element(w_tag('pPr'))
        p_elem.insert(0, pPr)
    return pPr

def ensure_rPr(r_elem):
    rPr = r_elem.find(w_tag('rPr'))
    if rPr is None:
        rPr = etree.Element(w_tag('rPr'))
        r_elem.insert(0, rPr)
    return rPr

def set_run_font_and_size(r_elem, font_name: str = None, size_pt: float = None,
                          bold: bool = None, italic: bool = None, color_hex: str = None,
                          apply_font: bool = True, apply_size: bool = True):
    rPr = ensure_rPr(r_elem)
    if apply_font and font_name:
        rFonts = ensure_child(rPr, 'rFonts')
        rFonts.set(w_tag('ascii'), font_name)
        rFonts.set(w_tag('hAnsi'), font_name)
        rFonts.set(w_tag('cs'), font_name)
        rFonts.set(w_tag('eastAsia'), font_name)
        for attr in ['asciiTheme', 'hAnsiTheme', 'cstheme', 'eastAsiaTheme']:
            if w_tag(attr) in rFonts.attrib:
                del rFonts.attrib[w_tag(attr)]

    if apply_size and size_pt is not None:
        half_pt = str(pt_to_half_pt(size_pt))
        sz = ensure_child(rPr, 'sz')
        sz.set(w_tag('val'), half_pt)
        szCs = ensure_child(rPr, 'szCs')
        szCs.set(w_tag('val'), half_pt)

    if bold is not None:
        b_elem = rPr.find(w_tag('b'))
        if bold:
            if b_elem is None:
                b_elem = etree.SubElement(rPr, w_tag('b'))
            b_elem.set(w_tag('val'), 'true')
        else:
            if b_elem is not None:
                rPr.remove(b_elem)

    if italic is not None:
        i_elem = rPr.find(w_tag('i'))
        if italic:
            if i_elem is None:
                i_elem = etree.SubElement(rPr, w_tag('i'))
            i_elem.set(w_tag('val'), 'true')
        else:
            if i_elem is not None:
                rPr.remove(i_elem)

    if color_hex:
        col = ensure_child(rPr, 'color')
        col.set(w_tag('val'), color_hex.lstrip('#'))

def set_paragraph_format(p_elem, align: str = None, line_spacing: float = None,
                         space_before_pt: float = None, space_after_pt: float = None,
                         first_line_cm: float = None, hanging_cm: float = None,
                         left_indent_cm: float = None, keep_next: bool = False,
                         page_break_before: bool = False):
    pPr = ensure_pPr(p_elem)

    if align:
        jc = ensure_child(pPr, 'jc')
        jc.set(w_tag('val'), align)

    if line_spacing is not None or space_before_pt is not None or space_after_pt is not None:
        spacing = ensure_child(pPr, 'spacing')
        if line_spacing is not None:
            spacing.set(w_tag('line'), str(line_spacing_to_twips(line_spacing)))
            spacing.set(w_tag('lineRule'), 'auto')
        if space_before_pt is not None:
            spacing.set(w_tag('before'), str(pt_to_twips(space_before_pt)))
            if w_tag('beforeAutospacing') in spacing.attrib:
                del spacing.attrib[w_tag('beforeAutospacing')]
        if space_after_pt is not None:
            spacing.set(w_tag('after'), str(pt_to_twips(space_after_pt)))
            if w_tag('afterAutospacing') in spacing.attrib:
                del spacing.attrib[w_tag('afterAutospacing')]

    if first_line_cm is not None or hanging_cm is not None or left_indent_cm is not None:
        ind = ensure_child(pPr, 'ind')
        if first_line_cm is not None:
            if first_line_cm > 0:
                ind.set(w_tag('firstLine'), str(cm_to_twips(first_line_cm)))
                if w_tag('hanging') in ind.attrib:
                    del ind.attrib[w_tag('hanging')]
            else:
                ind.set(w_tag('firstLine'), '0')
        if hanging_cm is not None and hanging_cm > 0:
            ind.set(w_tag('hanging'), str(cm_to_twips(hanging_cm)))
            if w_tag('firstLine') in ind.attrib:
                del ind.attrib[w_tag('firstLine')]
        if left_indent_cm is not None:
            ind.set(w_tag('left'), str(cm_to_twips(left_indent_cm)))

    if keep_next:
        ensure_child(pPr, 'keepNext')

    if page_break_before:
        ensure_child(pPr, 'pageBreakBefore')

def make_styled_paragraph(text: str, font_name: str, size_pt: float, align: str = 'center',
                          bold: bool = False, italic: bool = False, space_before_pt: float = 0,
                          space_after_pt: float = 6, line_spacing: float = 1.5,
                          page_break_before: bool = False, uppercase: bool = False):
    p = etree.Element(w_tag('p'))
    set_paragraph_format(
        p, align=align, line_spacing=line_spacing,
        space_before_pt=space_before_pt, space_after_pt=space_after_pt,
        first_line_cm=0, page_break_before=page_break_before
    )
    if text:
        r = etree.SubElement(p, w_tag('r'))
        set_run_font_and_size(r, font_name=font_name, size_pt=size_pt, bold=bold, italic=italic, color_hex='000000')
        t = etree.SubElement(r, w_tag('t'))
        t.set(f"{XML_NS}space", "preserve")
        t.text = text.upper() if uppercase else text
    return p

def make_page_break_paragraph():
    p = etree.Element(w_tag('p'))
    r = etree.SubElement(p, w_tag('r'))
    br = etree.SubElement(r, w_tag('br'))
    br.set(w_tag('type'), 'page')
    return p

def detect_has_cover(paragraphs) -> bool:
    first_chunk = paragraphs[:14]
    hits = 0
    for p in first_chunk:
        txt = get_paragraph_text(p)
        if len(txt) < 90 and COVER_KEYWORDS.search(txt):
            hits += 1
    return hits >= 2

def detect_has_toc(paragraphs) -> bool:
    for p in paragraphs[:35]:
        txt = get_paragraph_text(p).strip().upper()
        if txt in ('DAFTAR ISI', 'TABLE OF CONTENTS'):
            return True
    return False

def build_cover_elements(cover_data: dict, font_name: str) -> list:
    elems = []
    doc_label = (cover_data.get('doc_label') or 'MAKALAH / LAPORAN').strip()
    title = (cover_data.get('title') or 'JUDUL DOKUMEN LAPORAN ATAU MAKALAH').strip()
    subtitle = (cover_data.get('subtitle') or '').strip()
    author = (cover_data.get('author') or 'Nama Penulis').strip()
    nim = (cover_data.get('nim') or '').strip()
    lecturer = (cover_data.get('lecturer') or '').strip()
    course = (cover_data.get('course') or '').strip()
    faculty = (cover_data.get('faculty') or '').strip()
    institution = (cover_data.get('institution') or 'NAMA INSTITUSI / UNIVERSITAS').strip()
    city = (cover_data.get('city') or '').strip()
    year = (cover_data.get('year') or '2026').strip()

    elems.append(make_styled_paragraph(doc_label, font_name, 14, align='center', bold=True, space_before_pt=12, space_after_pt=12, uppercase=True))
    elems.append(make_styled_paragraph(title, font_name, 16, align='center', bold=True, space_before_pt=6, space_after_pt=12, uppercase=True))

    if subtitle:
        elems.append(make_styled_paragraph(subtitle, font_name, 12, align='center', italic=True, space_before_pt=0, space_after_pt=18))

    if course:
        elems.append(make_styled_paragraph(f"Diajukan untuk Memenuhi Tugas Mata Kuliah {course}", font_name, 11, align='center', italic=False, space_before_pt=6, space_after_pt=18))

    if lecturer:
        elems.append(make_styled_paragraph("Dosen Pengampu:", font_name, 11, align='center', bold=False, space_before_pt=12, space_after_pt=2))
        elems.append(make_styled_paragraph(lecturer, font_name, 12, align='center', bold=True, space_before_pt=0, space_after_pt=24))

    elems.append(make_styled_paragraph("", font_name, 12, space_before_pt=24, space_after_pt=24))
    elems.append(make_styled_paragraph("Disusun Oleh:", font_name, 12, align='center', bold=False, space_before_pt=18, space_after_pt=6))

    author_lines = [line.strip() for line in author.split('\n') if line.strip()]
    for idx, a_line in enumerate(author_lines):
        elems.append(make_styled_paragraph(a_line, font_name, 12, align='center', bold=True, space_before_pt=0, space_after_pt=2))

    if nim:
        elems.append(make_styled_paragraph(f"NIM/NPM: {nim}", font_name, 12, align='center', bold=False, space_before_pt=0, space_after_pt=24))

    elems.append(make_styled_paragraph("", font_name, 12, space_before_pt=36, space_after_pt=36))

    if faculty:
        elems.append(make_styled_paragraph(faculty, font_name, 14, align='center', bold=True, space_before_pt=12, space_after_pt=4, uppercase=True))
    if institution:
        elems.append(make_styled_paragraph(institution, font_name, 14, align='center', bold=True, space_before_pt=0, space_after_pt=4, uppercase=True))
    if city:
        elems.append(make_styled_paragraph(city, font_name, 13, align='center', bold=True, space_before_pt=0, space_after_pt=4, uppercase=True))
    if year:
        elems.append(make_styled_paragraph(year, font_name, 13, align='center', bold=True, space_before_pt=0, space_after_pt=0))

    elems.append(make_page_break_paragraph())
    return elems

def build_toc_elements(headings: list, font_name: str, size_pt: float, line_spacing: float) -> list:
    elems = []
    elems.append(make_styled_paragraph(
        "DAFTAR ISI", font_name, size_pt + 2, align='center',
        bold=True, space_before_pt=0, space_after_pt=18, line_spacing=line_spacing, uppercase=True
    ))

    p_field = etree.Element(w_tag('p'))
    set_paragraph_format(p_field, align='both', line_spacing=line_spacing, space_before_pt=0, space_after_pt=6, first_line_cm=0)

    r_begin = etree.SubElement(p_field, w_tag('r'))
    fc_begin = etree.SubElement(r_begin, w_tag('fldChar'))
    fc_begin.set(w_tag('fldCharType'), 'begin')

    r_instr = etree.SubElement(p_field, w_tag('r'))
    instr = etree.SubElement(r_instr, w_tag('instrText'))
    instr.set(f"{XML_NS}space", "preserve")
    instr.text = ' TOC \\o "1-3" \\h \\z \\u '

    r_sep = etree.SubElement(p_field, w_tag('r'))
    fc_sep = etree.SubElement(r_sep, w_tag('fldChar'))
    fc_sep.set(w_tag('fldCharType'), 'separate')
    elems.append(p_field)

    if not headings:
        headings = [
            ('heading1', 'BAB I PENDAHULUAN', '1'),
            ('heading2', '1.1 Latar Belakang', '1'),
            ('heading2', '1.2 Rumusan Masalah', '2'),
            ('heading1', 'BAB II PEMBAHASAN', '3'),
            ('heading1', 'BAB III PENUTUP', '8'),
            ('heading1', 'DAFTAR PUSTAKA', '10')
        ]

    for idx, (h_level, h_text, est_page) in enumerate(headings):
        p_item = etree.Element(w_tag('p'))
        pPr = ensure_pPr(p_item)
        tabs = ensure_child(pPr, 'tabs')
        tab = etree.SubElement(tabs, w_tag('tab'))
        tab.set(w_tag('val'), 'right')
        tab.set(w_tag('leader'), 'dot')
        tab.set(w_tag('pos'), str(cm_to_twips(14.0)))

        left_cm = 0.0 if h_level == 'heading1' else (0.75 if h_level == 'heading2' else 1.5)
        is_bold = (h_level == 'heading1')
        set_paragraph_format(
            p_item, align='both', line_spacing=line_spacing,
            space_before_pt=4 if is_bold else 0, space_after_pt=2,
            first_line_cm=0, left_indent_cm=left_cm
        )

        r_txt = etree.SubElement(p_item, w_tag('r'))
        set_run_font_and_size(r_txt, font_name=font_name, size_pt=size_pt, bold=is_bold, color_hex='000000')
        t_txt = etree.SubElement(r_txt, w_tag('t'))
        t_txt.text = h_text.upper() if h_level == 'heading1' else h_text

        r_tab = etree.SubElement(p_item, w_tag('r'))
        etree.SubElement(r_tab, w_tag('tab'))

        r_pg = etree.SubElement(p_item, w_tag('r'))
        set_run_font_and_size(r_pg, font_name=font_name, size_pt=size_pt, bold=is_bold, color_hex='000000')
        t_pg = etree.SubElement(r_pg, w_tag('t'))
        t_pg.text = str(est_page)

        elems.append(p_item)

    p_end = etree.Element(w_tag('p'))
    r_end = etree.SubElement(p_end, w_tag('r'))
    fc_end = etree.SubElement(r_end, w_tag('fldChar'))
    fc_end.set(w_tag('fldCharType'), 'end')
    elems.append(p_end)

    elems.append(make_page_break_paragraph())
    return elems

def build_page_number_xml(font_name: str, size_pt: float, align: str = 'right', is_header: bool = False) -> bytes:
    root_tag = 'hdr' if is_header else 'ftr'
    root = etree.Element(w_tag(root_tag), nsmap={'w': NAMESPACES['w']})
    p = etree.SubElement(root, w_tag('p'))
    set_paragraph_format(p, align=align, line_spacing=1.0, space_before_pt=0, space_after_pt=0, first_line_cm=0)

    r1 = etree.SubElement(p, w_tag('r'))
    set_run_font_and_size(r1, font_name=font_name, size_pt=size_pt)
    fc1 = etree.SubElement(r1, w_tag('fldChar'))
    fc1.set(w_tag('fldCharType'), 'begin')

    r2 = etree.SubElement(p, w_tag('r'))
    set_run_font_and_size(r2, font_name=font_name, size_pt=size_pt)
    instr = etree.SubElement(r2, w_tag('instrText'))
    instr.set(f"{XML_NS}space", "preserve")
    instr.text = " PAGE "

    r3 = etree.SubElement(p, w_tag('r'))
    set_run_font_and_size(r3, font_name=font_name, size_pt=size_pt)
    fc2 = etree.SubElement(r3, w_tag('fldChar'))
    fc2.set(w_tag('fldCharType'), 'separate')

    r4 = etree.SubElement(p, w_tag('r'))
    set_run_font_and_size(r4, font_name=font_name, size_pt=size_pt)
    t = etree.SubElement(r4, w_tag('t'))
    t.text = "1"

    r5 = etree.SubElement(p, w_tag('r'))
    set_run_font_and_size(r5, font_name=font_name, size_pt=size_pt)
    fc3 = etree.SubElement(r5, w_tag('fldChar'))
    fc3.set(w_tag('fldCharType'), 'end')

    return etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone='yes')

def inspect_docx_bytes(docx_bytes: bytes) -> dict:
    with zipfile.ZipFile(io.BytesIO(docx_bytes), 'r') as zin:
        xml_content = zin.read('word/document.xml')
    tree = etree.fromstring(xml_content)
    body = tree.find(w_tag('body'))
    paragraphs = body.findall(w_tag('p')) if body is not None else []
    tables = body.findall(w_tag('tbl')) if body is not None else []

    headings = []
    word_count = 0
    non_empty_p = 0
    for idx, p in enumerate(paragraphs):
        txt = get_paragraph_text(p)
        if txt:
            non_empty_p += 1
            word_count += len(txt.split())
        cls = classify_paragraph(p, idx, len(paragraphs))
        if cls in ('heading1', 'heading2', 'heading3') and txt:
            headings.append({'level': cls, 'text': txt[:100]})

    has_cover = detect_has_cover(paragraphs)
    has_toc = detect_has_toc(paragraphs)

    sectPr = body.find(w_tag('sectPr')) if body is not None else None
    current_margins = {'top': 2.54, 'left': 2.54, 'bottom': 2.54, 'right': 2.54}
    if sectPr is not None:
        pgMar = sectPr.find(w_tag('pgMar'))
        if pgMar is not None:
            for side in ('top', 'left', 'bottom', 'right'):
                val = pgMar.get(w_tag(side))
                if val and val.lstrip('-').isdigit():
                    current_margins[side] = round((int(val) / 1440.0) * 2.54, 2)

    title_guess = ""
    for p in paragraphs[:15]:
        t = get_paragraph_text(p)
        if len(t) > 10 and not BAB_REGEX.match(t):
            title_guess = t[:150]
            break

    return {
        'paragraph_count': non_empty_p,
        'word_count': word_count,
        'table_count': len(tables),
        'heading_count': len(headings),
        'headings': headings[:25],
        'has_cover': has_cover,
        'has_toc': has_toc,
        'current_margins_cm': current_margins,
        'title_guess': title_guess
    }

def format_docx_bytes(docx_bytes: bytes, config: dict) -> tuple[bytes, dict]:
    enabled = config.get('enabled_modules', {})
    do_margin = enabled.get('margin', True)
    do_font = enabled.get('font', True)
    do_size = enabled.get('font_size', True)
    do_align = enabled.get('alignment', True)
    do_spacing = enabled.get('line_spacing', True)
    do_para_spacing = enabled.get('paragraph_spacing', True)
    do_indent = enabled.get('indentation', True)
    do_headings = enabled.get('headings', True)
    do_page_numbers = enabled.get('page_numbers', True)
    do_cover = enabled.get('auto_cover', False)
    do_toc = enabled.get('auto_toc', False)
    do_tables = enabled.get('tables', True)
    do_clean_empty = enabled.get('clean_empty_lines', True)

    font_name = config.get('font_name', 'Times New Roman')
    font_size_body = float(config.get('font_size_body', 12))
    font_size_h1 = float(config.get('font_size_h1', 14))
    font_size_h2 = float(config.get('font_size_h2', 12))
    font_size_h3 = float(config.get('font_size_h3', 12))
    font_size_table = float(config.get('font_size_table', 10))

    align_body = config.get('alignment_body', 'both')
    align_h1 = config.get('alignment_h1', 'center')
    align_h2 = config.get('alignment_h2', 'left')

    line_spacing = float(config.get('line_spacing', 1.5))
    space_before_pt = float(config.get('space_before_pt', 0))
    space_after_pt = float(config.get('space_after_pt', 6))
    first_line_indent_cm = float(config.get('first_line_indent_cm', 1.27))

    page_break_bab = bool(config.get('page_break_bab', True))
    uppercase_bab = bool(config.get('uppercase_bab', True))
    force_black_text = bool(config.get('force_black_text', True))

    paper_size = config.get('paper_size', 'A4')
    margin_top_cm = float(config.get('margin_top_cm', 4.0))
    margin_left_cm = float(config.get('margin_left_cm', 4.0))
    margin_bottom_cm = float(config.get('margin_bottom_cm', 3.0))
    margin_right_cm = float(config.get('margin_right_cm', 3.0))

    page_num_pos = config.get('page_number_position', 'bottom_right')

    stats = {
        'paragraphs_formatted': 0,
        'headings_formatted': 0,
        'tables_formatted': 0,
        'empty_lines_removed': 0,
        'cover_added': False,
        'toc_added': False,
        'page_numbers_added': False,
        'margins_applied': f"{margin_top_cm}-{margin_left_cm}-{margin_bottom_cm}-{margin_right_cm} cm ({paper_size})"
    }

    in_mem = io.BytesIO(docx_bytes)
    with zipfile.ZipFile(in_mem, 'r') as zin:
        file_map = {name: zin.read(name) for name in zin.namelist()}

    doc_tree = etree.fromstring(file_map['word/document.xml'])
    body = doc_tree.find(w_tag('body'))
    if body is None:
        return docx_bytes, stats

    paragraphs = body.findall(w_tag('p'))

    if do_clean_empty:
        consecutive_empty = 0
        for p in list(paragraphs):
            txt = get_paragraph_text(p)
            has_br = len(p.xpath('.//w:br', namespaces=NAMESPACES)) > 0
            if not txt and not has_drawing_or_pict(p) and not has_br:
                consecutive_empty += 1
                if consecutive_empty >= 1:
                    body.remove(p)
                    stats['empty_lines_removed'] += 1
            else:
                consecutive_empty = 0
        paragraphs = body.findall(w_tag('p'))

    detected_headings = []
    first_h1_seen = False

    for idx, p in enumerate(paragraphs):
        cls = classify_paragraph(p, idx, len(paragraphs))
        txt = get_paragraph_text(p)

        if cls == 'empty':
            continue

        if cls == 'media':
            set_paragraph_format(p, align='center', first_line_cm=0, space_before_pt=6, space_after_pt=6)
            continue

        if cls == 'caption':
            set_paragraph_format(
                p,
                align='center',
                line_spacing=1.15 if do_spacing else None,
                space_before_pt=4 if do_para_spacing else None,
                space_after_pt=8 if do_para_spacing else None,
                first_line_cm=0 if do_indent else None
            )
            for r in p.findall(f'.//{w_tag("r")}'):
                set_run_font_and_size(
                    r, font_name=font_name, size_pt=max(10.0, font_size_body - 1),
                    italic=True, color_hex='000000' if force_black_text else None,
                    apply_font=do_font, apply_size=do_size
                )
            stats['paragraphs_formatted'] += 1
            continue

        if cls in ('heading1', 'heading2', 'heading3') and do_headings:
            est_pg = max(1, (idx // 18) + 1)
            detected_headings.append((cls, txt, est_pg))
            stats['headings_formatted'] += 1

            if cls == 'heading1':
                should_break = page_break_bab and first_h1_seen
                first_h1_seen = True
                set_paragraph_format(
                    p,
                    align=align_h1,
                    line_spacing=line_spacing if do_spacing else None,
                    space_before_pt=12,
                    space_after_pt=12,
                    first_line_cm=0,
                    left_indent_cm=0,
                    keep_next=True,
                    page_break_before=should_break
                )
                for r in p.findall(f'.//{w_tag("r")}'):
                    set_run_font_and_size(
                        r, font_name=font_name, size_pt=font_size_h1,
                        bold=True, color_hex='000000' if force_black_text else None,
                        apply_font=do_font, apply_size=True
                    )
                    if uppercase_bab:
                        for t_node in r.findall(w_tag('t')):
                            if t_node.text:
                                t_node.text = t_node.text.upper()

            elif cls == 'heading2':
                set_paragraph_format(
                    p,
                    align=align_h2,
                    line_spacing=line_spacing if do_spacing else None,
                    space_before_pt=10,
                    space_after_pt=4,
                    first_line_cm=0,
                    left_indent_cm=0,
                    keep_next=True
                )
                for r in p.findall(f'.//{w_tag("r")}'):
                    set_run_font_and_size(
                        r, font_name=font_name, size_pt=font_size_h2,
                        bold=True, color_hex='000000' if force_black_text else None,
                        apply_font=do_font, apply_size=True
                    )

            elif cls == 'heading3':
                set_paragraph_format(
                    p,
                    align=align_h2,
                    line_spacing=line_spacing if do_spacing else None,
                    space_before_pt=6,
                    space_after_pt=2,
                    first_line_cm=0,
                    left_indent_cm=0,
                    keep_next=True
                )
                for r in p.findall(f'.//{w_tag("r")}'):
                    set_run_font_and_size(
                        r, font_name=font_name, size_pt=font_size_h3,
                        bold=True, color_hex='000000' if force_black_text else None,
                        apply_font=do_font, apply_size=True
                    )
            continue

        if cls == 'list':
            set_paragraph_format(
                p,
                align=align_body if do_align else None,
                line_spacing=line_spacing if do_spacing else None,
                space_before_pt=space_before_pt if do_para_spacing else None,
                space_after_pt=max(2.0, space_after_pt / 2) if do_para_spacing else None
            )
            for r in p.findall(f'.//{w_tag("r")}'):
                set_run_font_and_size(
                    r, font_name=font_name, size_pt=font_size_body,
                    color_hex='000000' if force_black_text else None,
                    apply_font=do_font, apply_size=do_size
                )
            stats['paragraphs_formatted'] += 1
            continue

        set_paragraph_format(
            p,
            align=align_body if do_align else None,
            line_spacing=line_spacing if do_spacing else None,
            space_before_pt=space_before_pt if do_para_spacing else None,
            space_after_pt=space_after_pt if do_para_spacing else None,
            first_line_cm=first_line_indent_cm if do_indent else None,
            left_indent_cm=0 if do_indent else None
        )
        for r in p.findall(f'.//{w_tag("r")}'):
            set_run_font_and_size(
                r, font_name=font_name, size_pt=font_size_body,
                color_hex='000000' if force_black_text else None,
                apply_font=do_font, apply_size=do_size
            )
        stats['paragraphs_formatted'] += 1

    if do_tables:
        tables = body.findall(f'.//{w_tag("tbl")}')
        for tbl in tables:
            tblPr = tbl.find(w_tag('tblPr'))
            if tblPr is None:
                tblPr = etree.Element(w_tag('tblPr'))
                tbl.insert(0, tblPr)
            jc = ensure_child(tblPr, 'jc')
            jc.set(w_tag('val'), 'center')

            rows = tbl.findall(w_tag('tr'))
            for r_idx, row in enumerate(rows):
                for p in row.findall(f'.//{w_tag("p")}'):
                    set_paragraph_format(
                        p,
                        align='center' if r_idx == 0 else 'left',
                        line_spacing=1.15,
                        space_before_pt=2,
                        space_after_pt=2,
                        first_line_cm=0
                    )
                    for r in p.findall(f'.//{w_tag("r")}'):
                        set_run_font_and_size(
                            r, font_name=font_name, size_pt=font_size_table,
                            bold=True if r_idx == 0 else None,
                            color_hex='000000' if force_black_text else None,
                            apply_font=do_font, apply_size=do_size
                        )
            stats['tables_formatted'] += 1

    already_has_toc = detect_has_toc(paragraphs)
    if do_toc and not already_has_toc:
        toc_elems = build_toc_elements(detected_headings, font_name, font_size_body, line_spacing)
        for elem in reversed(toc_elems):
            body.insert(0, elem)
        stats['toc_added'] = True

    already_has_cover = detect_has_cover(paragraphs)
    force_cover = bool(config.get('force_cover', False))
    if do_cover and (not already_has_cover or force_cover):
        cover_data = config.get('cover_data', {})
        cover_elems = build_cover_elements(cover_data, font_name)
        for elem in reversed(cover_elems):
            body.insert(0, elem)
        stats['cover_added'] = True

    all_sectPrs = body.xpath('.//w:sectPr', namespaces=NAMESPACES)
    main_sectPr = body.find(w_tag('sectPr'))
    if main_sectPr is None:
        main_sectPr = etree.SubElement(body, w_tag('sectPr'))
        all_sectPrs.append(main_sectPr)

    if do_margin:
        w_cm, h_cm = PAGE_SIZES_CM.get(paper_size, PAGE_SIZES_CM['A4'])
        for sectPr in all_sectPrs:
            pgSz = ensure_child(sectPr, 'pgSz')
            pgSz.set(w_tag('w'), str(cm_to_twips(w_cm)))
            pgSz.set(w_tag('h'), str(cm_to_twips(h_cm)))

            pgMar = ensure_child(sectPr, 'pgMar')
            pgMar.set(w_tag('top'), str(cm_to_twips(margin_top_cm)))
            pgMar.set(w_tag('left'), str(cm_to_twips(margin_left_cm)))
            pgMar.set(w_tag('bottom'), str(cm_to_twips(margin_bottom_cm)))
            pgMar.set(w_tag('right'), str(cm_to_twips(margin_right_cm)))
            pgMar.set(w_tag('header'), str(cm_to_twips(1.25)))
            pgMar.set(w_tag('footer'), str(cm_to_twips(1.25)))
            pgMar.set(w_tag('gutter'), '0')

    if 'word/styles.xml' in file_map and (do_font or do_size):
        try:
            styles_tree = etree.fromstring(file_map['word/styles.xml'])
            for rFonts in styles_tree.xpath('.//w:rFonts', namespaces=NAMESPACES):
                if do_font:
                    rFonts.set(w_tag('ascii'), font_name)
                    rFonts.set(w_tag('hAnsi'), font_name)
                    rFonts.set(w_tag('cs'), font_name)
                    rFonts.set(w_tag('eastAsia'), font_name)
                    for attr in ['asciiTheme', 'hAnsiTheme', 'cstheme', 'eastAsiaTheme']:
                        if w_tag(attr) in rFonts.attrib:
                            del rFonts.attrib[w_tag(attr)]
            file_map['word/styles.xml'] = etree.tostring(styles_tree, xml_declaration=True, encoding='UTF-8', standalone='yes')
        except Exception:
            pass

    if do_page_numbers and page_num_pos != 'none':
        is_header = page_num_pos.startswith('top_')
        align_val = 'center' if page_num_pos.endswith('center') else 'right'
        part_filename = 'header_docformat.xml' if is_header else 'footer_docformat.xml'
        part_path = f'word/{part_filename}'
        rel_type = (
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header'
            if is_header else
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer'
        )
        content_type = (
            'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml'
            if is_header else
            'application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml'
        )
        rel_id = 'rIdDocFormatPgNum'

        file_map[part_path] = build_page_number_xml(font_name, max(10.0, font_size_body - 1), align=align_val, is_header=is_header)

        rels_path = 'word/_rels/document.xml.rels'
        if rels_path in file_map:
            rels_tree = etree.fromstring(file_map[rels_path])
            existing = [el for el in rels_tree if el.get('Id') == rel_id]
            for el in existing:
                rels_tree.remove(el)
            rel_ns = rels_tree.nsmap.get(None, 'http://schemas.openxmlformats.org/package/2006/relationships')
            new_rel = etree.SubElement(rels_tree, f"{{{rel_ns}}}Relationship")
            new_rel.set('Id', rel_id)
            new_rel.set('Type', rel_type)
            new_rel.set('Target', part_filename)
            file_map[rels_path] = etree.tostring(rels_tree, xml_declaration=True, encoding='UTF-8', standalone='yes')

        ct_path = '[Content_Types].xml'
        if ct_path in file_map:
            ct_tree = etree.fromstring(file_map[ct_path])
            ct_ns = ct_tree.nsmap.get(None, 'http://schemas.openxmlformats.org/package/2006/content-types')
            part_name_attr = f'/word/{part_filename}'
            already_ct = any(el.get('PartName') == part_name_attr for el in ct_tree)
            if not already_ct:
                ov = etree.SubElement(ct_tree, f"{{{ct_ns}}}Override")
                ov.set('PartName', part_name_attr)
                ov.set('ContentType', content_type)
                file_map[ct_path] = etree.tostring(ct_tree, xml_declaration=True, encoding='UTF-8', standalone='yes')

        ref_tag = 'headerReference' if is_header else 'footerReference'
        for sectPr in all_sectPrs:
            for old_ref in list(sectPr.findall(w_tag(ref_tag))):
                if old_ref.get(w_tag('type')) == 'default':
                    sectPr.remove(old_ref)
            ref_el = etree.Element(w_tag(ref_tag))
            ref_el.set(w_tag('type'), 'default')
            ref_el.set(f"{{{NAMESPACES['r']}}}id", rel_id)
            sectPr.insert(0, ref_el)

            if stats['cover_added']:
                ensure_child(sectPr, 'titlePg')

        stats['page_numbers_added'] = True

    file_map['word/document.xml'] = etree.tostring(doc_tree, xml_declaration=True, encoding='UTF-8', standalone='yes')

    out_mem = io.BytesIO()
    with zipfile.ZipFile(out_mem, 'w', zipfile.ZIP_DEFLATED) as zout:
        for name, data in file_map.items():
            zout.writestr(name, data)

    return out_mem.getvalue(), stats

def create_sample_messy_docx() -> bytes:
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

    root_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

    styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="22"/>
    </w:rPr>
  </w:style>
</w:styles>"""

    doc_root = etree.Element(w_tag('document'), nsmap={'w': NAMESPACES['w'], 'r': NAMESPACES['r']})
    body = etree.SubElement(doc_root, w_tag('body'))

    sample_paras = [
        ("Kata Pengantar", "Comic Sans MS", 16, "left", "#2563EB"),
        ("Puji syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa karena atas rahmat dan karunia-Nya dokumen laporan penelitian mengenai implementasi sistem otomatisasi tata letak dokumen akademik ini dapat diselesaikan tepat pada waktunya.", "Calibri", 11, "left", "#333333"),
        ("", "Calibri", 11, "left", "#000000"),
        ("", "Calibri", 11, "left", "#000000"),
        ("bab i pendahuluan", "Arial", 15, "left", "#DC2626"),
        ("1.1 Latar Belakang", "Verdana", 13, "right", "#1E40AF"),
        ("Dalam penyusunan karya tulis ilmiah seperti laporan praktikum, makalah perkuliahan, proposal penelitian, hingga skripsi, konsistensi format penulisan merupakan salah satu indikator penilaian utama. Banyak mahasiswa maupun praktisi menghabiskan waktu berjam-jam hanya untuk menyesuaikan margin 4-4-3-3, mengubah jenis huruf menjadi Times New Roman 12pt, merapikan rata kiri-kanan (justify), serta menyusun daftar isi secara manual.", "Calibri", 11, "left", "#111827"),
        ("Kesalahan umum yang sering ditemukan pada draf dokumen mentah meliputi penggunaan font yang bercampur aduk (seperti Calibri, Arial, dan Times New Roman dalam satu naskah), jarak antar paragraf yang tidak seragam, indentasi baris pertama yang dibuat menggunakan tombol spasi berulang-ulang, hingga bab baru yang tidak dimulai pada halaman baru.", "Arial", 10, "center", "#374151"),
        ("1.2 Rumusan Masalah", "Calibri", 12, "left", "#000000"),
        ("Berdasarkan uraian latar belakang di atas, maka rumusan masalah yang dibahas dalam laporan ini adalah bagaimana merancang bangun sistem perapi dokumen otomatis berbasis web yang mampu menstandardisasi struktur XML dokumen DOCX secara instan dan akurat sesuai pedoman penulisan ilmiah.", "Calibri", 11, "left", "#000000"),
        ("1.3 Tujuan Penulisan", "Calibri", 12, "left", "#000000"),
        ("Adapun tujuan dari penyusunan laporan ini meliputi otomatisasi pengaturan margin halaman, penyeragaman tipografi dan spasi baris, pendeteksian struktur BAB dan Sub-bab, pembuatan halaman sampul (cover) otomatis, serta penyusunan daftar isi dan nomor halaman secara terprogram.", "Calibri", 11, "left", "#000000"),
        ("bab ii tinjauan pustaka dan pembahasan", "Arial", 14, "left", "#7C3AED"),
        ("2.1 Standar Tata Tulis Ilmiah di Indonesia", "Calibri", 13, "left", "#000000"),
        ("Secara umum, pedoman penulisan karya ilmiah di berbagai perguruan tinggi Indonesia menerapkan aturan kertas berukuran A4 (21 x 29,7 cm) dengan batas tepi atas 4 cm, tepi kiri 4 cm (untuk ruang penjilidan), tepi bawah 3 cm, dan tepi kanan 3 cm. Huruf standar yang digunakan adalah Times New Roman ukuran 12 poin dengan jarak spasi 1,5 baris atau 2,0 baris untuk tugas akhir.", "Calibri", 11, "left", "#1F2937"),
        ("2.2 Analisis Perbandingan Format Dokumen", "Calibri", 13, "left", "#000000"),
        ("Tabel 2.1 Perbandingan Spesifikasi Format Dokumen Akademik", "Calibri", 11, "left", "#4B5563"),
    ]

    for text, f_name, f_size, align, col in sample_paras:
        p = etree.SubElement(body, w_tag('p'))
        set_paragraph_format(p, align=align, line_spacing=1.0, space_before_pt=0, space_after_pt=14, first_line_cm=0)
        if text:
            r = etree.SubElement(p, w_tag('r'))
            set_run_font_and_size(r, font_name=f_name, size_pt=f_size, color_hex=col)
            t = etree.SubElement(r, w_tag('t'))
            t.text = text

    tbl = etree.SubElement(body, w_tag('tbl'))
    rows_data = [
        ["Jenis Dokumen", "Margin (A-K-B-Ka)", "Font Utama", "Spasi Baris"],
        ["Skripsi / Tesis", "4 - 4 - 3 - 3 cm", "Times New Roman 12pt", "1.5 / 2.0"],
        ["Makalah Kuliah", "4 - 4 - 3 - 3 cm", "Times New Roman 12pt", "1.5"],
        ["Laporan Praktikum", "3 - 4 - 3 - 3 cm", "Arial / TNR 11-12pt", "1.5"]
    ]
    for r_data in rows_data:
        tr = etree.SubElement(tbl, w_tag('tr'))
        for cell_txt in r_data:
            tc = etree.SubElement(tr, w_tag('tc'))
            p = etree.SubElement(tc, w_tag('p'))
            r = etree.SubElement(p, w_tag('r'))
            set_run_font_and_size(r, font_name="Calibri", size_pt=11, color_hex="#1F2937")
            t = etree.SubElement(r, w_tag('t'))
            t.text = cell_txt

    closing_paras = [
        ("bab iii penutup", "Arial", 14, "left", "#059669"),
        ("3.1 Kesimpulan", "Calibri", 12, "left", "#000000"),
        ("Melalui pemanfaatan mesin pemroses OpenXML terstruktur, seluruh ketidakseragaman tipografi, perataan paragraf, margin halaman, struktur bab, hingga kelengkapan halaman sampul dan daftar isi dapat diselesaikan dalam hitungan milidetik tanpa merusak konten asli dokumen.", "Calibri", 11, "left", "#000000"),
        ("Daftar Pustaka", "Calibri", 14, "left", "#000000"),
        ("Badan Standar Nasional Pendidikan. (2024). Pedoman Tata Naskah Karya Ilmiah Perguruan Tinggi. Jakarta: Balai Pustaka.", "Calibri", 11, "left", "#000000"),
        ("Kowalski, E., & Ponytail, S. (2025). Modern Document Engineering & Typographic Systems. Bandung: ITB Press.", "Calibri", 11, "left", "#000000")
    ]

    for text, f_name, f_size, align, col in closing_paras:
        p = etree.SubElement(body, w_tag('p'))
        set_paragraph_format(p, align=align, line_spacing=1.0, space_before_pt=0, space_after_pt=10, first_line_cm=0)
        r = etree.SubElement(p, w_tag('r'))
        set_run_font_and_size(r, font_name=f_name, size_pt=f_size, color_hex=col)
        t = etree.SubElement(r, w_tag('t'))
        t.text = text

    sectPr = etree.SubElement(body, w_tag('sectPr'))
    pgSz = etree.SubElement(sectPr, w_tag('pgSz'))
    pgSz.set(w_tag('w'), str(cm_to_twips(21.59)))
    pgSz.set(w_tag('h'), str(cm_to_twips(27.94)))
    pgMar = etree.SubElement(sectPr, w_tag('pgMar'))
    for side in ('top', 'left', 'bottom', 'right'):
        pgMar.set(w_tag(side), str(cm_to_twips(2.54)))

    out = io.BytesIO()
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('[Content_Types].xml', content_types)
        zf.writestr('_rels/.rels', root_rels)
        zf.writestr('word/_rels/document.xml.rels', doc_rels)
        zf.writestr('word/styles.xml', styles_xml)
        zf.writestr('word/document.xml', etree.tostring(doc_root, xml_declaration=True, encoding='UTF-8', standalone='yes'))
    return out.getvalue()
