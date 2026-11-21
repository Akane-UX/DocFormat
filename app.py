import io
import json
import os
from datetime import datetime
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import docx_engine

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

DOCUMENT_PRESETS = {
    'makalah': {
        'id': 'makalah',
        'name': 'Makalah Akademik',
        'badge': 'Populer',
        'description': 'Standar makalah perkuliahan & seminar: Margin 4-4-3-3, Times New Roman 12pt, spasi 1.5, rata kiri-kanan.',
        'config': {
            'paper_size': 'A4',
            'margin_preset': '4-4-3-3',
            'margin_top_cm': 4.0,
            'margin_left_cm': 4.0,
            'margin_bottom_cm': 3.0,
            'margin_right_cm': 3.0,
            'font_name': 'Times New Roman',
            'font_size_body': 12,
            'font_size_h1': 14,
            'font_size_h2': 12,
            'font_size_h3': 12,
            'font_size_table': 10,
            'alignment_body': 'both',
            'alignment_h1': 'center',
            'alignment_h2': 'left',
            'line_spacing': 1.5,
            'space_before_pt': 0,
            'space_after_pt': 6,
            'first_line_indent_cm': 1.27,
            'page_break_bab': True,
            'uppercase_bab': True,
            'force_black_text': True,
            'page_number_position': 'bottom_right'
        }
    },
    'laporan_praktikum': {
        'id': 'laporan_praktikum',
        'name': 'Laporan Praktikum / Resmi',
        'badge': 'Standar Lab',
        'description': 'Format laporan praktikum & proyek teknis: Margin 4-4-3-3, Times New Roman 12pt, spasi 1.5, tabel rapi.',
        'config': {
            'paper_size': 'A4',
            'margin_preset': '4-4-3-3',
            'margin_top_cm': 4.0,
            'margin_left_cm': 4.0,
            'margin_bottom_cm': 3.0,
            'margin_right_cm': 3.0,
            'font_name': 'Times New Roman',
            'font_size_body': 12,
            'font_size_h1': 14,
            'font_size_h2': 12,
            'font_size_h3': 12,
            'font_size_table': 10,
            'alignment_body': 'both',
            'alignment_h1': 'center',
            'alignment_h2': 'left',
            'line_spacing': 1.5,
            'space_before_pt': 0,
            'space_after_pt': 6,
            'first_line_indent_cm': 1.27,
            'page_break_bab': True,
            'uppercase_bab': True,
            'force_black_text': True,
            'page_number_position': 'bottom_center'
        }
    },
    'skripsi_tesis': {
        'id': 'skripsi_tesis',
        'name': 'Skripsi / Tugas Akhir / Tesis',
        'badge': 'Akademik Ketat',
        'description': 'Format tugas akhir perguruan tinggi: Margin 4-4-3-3, Times New Roman 12pt, spasi 2.0 (double), indentasi 1.27 cm.',
        'config': {
            'paper_size': 'A4',
            'margin_preset': '4-4-3-3',
            'margin_top_cm': 4.0,
            'margin_left_cm': 4.0,
            'margin_bottom_cm': 3.0,
            'margin_right_cm': 3.0,
            'font_name': 'Times New Roman',
            'font_size_body': 12,
            'font_size_h1': 14,
            'font_size_h2': 12,
            'font_size_h3': 12,
            'font_size_table': 10,
            'alignment_body': 'both',
            'alignment_h1': 'center',
            'alignment_h2': 'left',
            'line_spacing': 2.0,
            'space_before_pt': 0,
            'space_after_pt': 0,
            'first_line_indent_cm': 1.27,
            'page_break_bab': True,
            'uppercase_bab': True,
            'force_black_text': True,
            'page_number_position': 'top_right'
        }
    },
    'proposal': {
        'id': 'proposal',
        'name': 'Proposal Penelitian / PKM',
        'badge': 'Ringkas',
        'description': 'Standar proposal kegiatan atau PKM: Margin 3-4-3-3 (Atas 3, Kiri 4, Bawah 3, Kanan 3), spasi 1.15.',
        'config': {
            'paper_size': 'A4',
            'margin_preset': '3-4-3-3',
            'margin_top_cm': 3.0,
            'margin_left_cm': 4.0,
            'margin_bottom_cm': 3.0,
            'margin_right_cm': 3.0,
            'font_name': 'Times New Roman',
            'font_size_body': 12,
            'font_size_h1': 13,
            'font_size_h2': 12,
            'font_size_h3': 12,
            'font_size_table': 10,
            'alignment_body': 'both',
            'alignment_h1': 'center',
            'alignment_h2': 'left',
            'line_spacing': 1.15,
            'space_before_pt': 0,
            'space_after_pt': 6,
            'first_line_indent_cm': 1.27,
            'page_break_bab': False,
            'uppercase_bab': True,
            'force_black_text': True,
            'page_number_position': 'bottom_right'
        }
    },
    'jurnal_artikel': {
        'id': 'jurnal_artikel',
        'name': 'Artikel Ilmiah / Paper',
        'badge': 'Modern',
        'description': 'Tata letak paper ilmiah padat: Margin merata 2.54 cm (Normal), spasi 1.15, Times New Roman 11pt.',
        'config': {
            'paper_size': 'A4',
            'margin_preset': '2.54-all',
            'margin_top_cm': 2.54,
            'margin_left_cm': 2.54,
            'margin_bottom_cm': 2.54,
            'margin_right_cm': 2.54,
            'font_name': 'Times New Roman',
            'font_size_body': 11,
            'font_size_h1': 12,
            'font_size_h2': 11,
            'font_size_h3': 11,
            'font_size_table': 9,
            'alignment_body': 'both',
            'alignment_h1': 'left',
            'alignment_h2': 'left',
            'line_spacing': 1.15,
            'space_before_pt': 0,
            'space_after_pt': 4,
            'first_line_indent_cm': 1.0,
            'page_break_bab': False,
            'uppercase_bab': True,
            'force_black_text': True,
            'page_number_position': 'bottom_center'
        }
    },
    'laporan_kantor': {
        'id': 'laporan_kantor',
        'name': 'Laporan Korporat / Dinas',
        'badge': 'Bisnis',
        'description': 'Format dokumen bisnis & instansi modern: Font Arial 11pt, margin 3-3-3-3 cm, spasi 1.15.',
        'config': {
            'paper_size': 'A4',
            'margin_preset': '3-3-3-3',
            'margin_top_cm': 3.0,
            'margin_left_cm': 3.0,
            'margin_bottom_cm': 3.0,
            'margin_right_cm': 3.0,
            'font_name': 'Arial',
            'font_size_body': 11,
            'font_size_h1': 13,
            'font_size_h2': 12,
            'font_size_h3': 11,
            'font_size_table': 10,
            'alignment_body': 'both',
            'alignment_h1': 'left',
            'alignment_h2': 'left',
            'line_spacing': 1.15,
            'space_before_pt': 0,
            'space_after_pt': 6,
            'first_line_indent_cm': 0.0,
            'page_break_bab': True,
            'uppercase_bab': True,
            'force_black_text': True,
            'page_number_position': 'bottom_right'
        }
    }
}

# Menyajikan halaman utama aplikasi
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# Mengembalikan daftar preset format dokumen
@app.route('/api/presets', methods=['GET'])
def get_presets():
    return jsonify({'presets': list(DOCUMENT_PRESETS.values())})

# Menghasilkan dan mengirim file DOCX contoh yang berantakan
@app.route('/api/sample', methods=['GET'])
def get_sample():
    sample_bytes = docx_engine.create_sample_messy_docx()
    return send_file(
        io.BytesIO(sample_bytes),
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        as_attachment=True,
        download_name='Contoh_Draft_Laporan_Berantakan.docx'
    )

# Menerima file DOCX dan mengembalikan ringkasan struktur dokumen
@app.route('/api/inspect', methods=['POST'])
def inspect_document():
    if 'file' not in request.files:
        return jsonify({'error': 'File DOCX tidak ditemukan'}), 400
    f = request.files['file']
    if not f.filename.lower().endswith('.docx'):
        return jsonify({'error': 'Harap unggah file dengan ekstensi .docx'}), 400
    try:
        raw_bytes = f.read()
        info = docx_engine.inspect_docx_bytes(raw_bytes)
        info['filename'] = f.filename
        info['size_kb'] = round(len(raw_bytes) / 1024.0, 1)
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': f'Gagal membaca struktur DOCX: {str(e)}'}), 400

# Memformat file DOCX sesuai konfigurasi dan mengirim hasilnya
@app.route('/api/format', methods=['POST'])
def format_document():
    if 'file' not in request.files:
        return jsonify({'error': 'File DOCX belum diunggah'}), 400
    f = request.files['file']
    config_raw = request.form.get('config', '{}')
    try:
        config = json.loads(config_raw)
    except Exception:
        config = {}

    try:
        raw_bytes = f.read()
        formatted_bytes, stats = docx_engine.format_docx_bytes(raw_bytes, config)
        base_name = os.path.splitext(f.filename)[0]
        out_filename = f"{base_name}_Rapi_DocFormat.docx"

        response = send_file(
            io.BytesIO(formatted_bytes),
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=out_filename
        )
        response.headers['X-Format-Stats'] = json.dumps(stats)
        response.headers['Access-Control-Expose-Headers'] = 'X-Format-Stats, Content-Disposition'
        return response
    except Exception as e:
        return jsonify({'error': f'Gagal memformat dokumen: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8090))
    app.run(host='0.0.0.0', port=port, debug=False)
