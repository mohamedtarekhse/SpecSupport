import os
import json
import sqlite3
import numpy as np
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from sentence_transformers import SentenceTransformer

app = Flask(__name__, static_folder='static')
CORS(app)

DB_PATH = 'database.db'

# Load embedding model locally (downloads on first run, then works entirely offline)
print("Loading embedding model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded.")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS standards_knowledge (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            standard_code TEXT,
            standard_name TEXT,
            section TEXT,
            clause TEXT,
            content TEXT,
            embedding_json TEXT
        )
    ''')
    # FTS5 table for fast keyword search (BM25)
    c.execute('''
        CREATE VIRTUAL TABLE IF NOT EXISTS standards_fts USING fts5(
            content,
            standard_code,
            standard_name,
            content=standards_knowledge,
            content_rowid=id
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS hyde_cache (
            query TEXT PRIMARY KEY,
            hyde_context TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Config table
    c.execute('''
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def get_config():
    conn = get_db()
    rows = conn.execute('SELECT key, value FROM config').fetchall()
    conn.close()
    return {r['key']: r['value'] for r in rows}

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# -----------------
# ROUTES
# -----------------

@app.route('/')
def serve_index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api/admin/config', methods=['GET', 'POST'])
def manage_config():
    if request.method == 'GET':
        cfg = get_config()
        return jsonify({"config": cfg})
    
    data = request.json
    conn = get_db()
    c = conn.cursor()
    for k, v in data.items():
        if v is not None:
            c.execute('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', (k, str(v)))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/admin/ingest', methods=['POST'])
def ingest():
    data = request.json
    content = data.get('content')
    if not content:
        return jsonify({"error": "Missing content"}), 400
        
    # Generate embedding locally
    embedding = model.encode(content).tolist()
    
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        INSERT INTO standards_knowledge (standard_code, standard_name, section, clause, content, embedding_json)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data.get('standard_code'), data.get('standard_name'), data.get('section'), data.get('clause'), content, json.dumps(embedding)))
    row_id = c.lastrowid
    
    # Update FTS table
    c.execute('''
        INSERT INTO standards_fts (rowid, content, standard_code, standard_name)
        VALUES (?, ?, ?, ?)
    ''', (row_id, content, data.get('standard_code'), data.get('standard_name')))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})

def ask_groq(messages, api_key):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": "llama-3.1-70b-versatile", "messages": messages, "temperature": 0.2}
    r = requests.post(url, json=payload, headers=headers)
    if r.status_code != 200:
        raise Exception(f"Groq API Error: {r.text}")
    return r.json()

def generate_hyde(question, api_key):
    messages = [
        {"role": "system", "content": "You are an expert engineering inspector. Write a brief, factual paragraph containing the exact technical answer to the following question. Do not explain, just state the facts and criteria."},
        {"role": "user", "content": question}
    ]
    r = ask_groq(messages, api_key)
    return r['choices'][0]['message']['content']

@app.route('/api/ask', methods=['POST'])
def ask():
    data = request.json
    question = data.get('question')
    std_filter = data.get('standard_filter', 'ALL')
    
    cfg = get_config()
    api_key = cfg.get('groq_api_key')
    if not api_key:
        return jsonify({"error": "Groq API key not configured. Open Admin Panel to set it."}), 400

    conn = get_db()
    
    # 1. HyDE
    hyde_row = conn.execute('SELECT hyde_context FROM hyde_cache WHERE query = ?', (question,)).fetchone()
    if hyde_row:
        hyde_context = hyde_row['hyde_context']
    else:
        try:
            hyde_context = generate_hyde(question, api_key)
            conn.execute('INSERT OR REPLACE INTO hyde_cache (query, hyde_context) VALUES (?, ?)', (question, hyde_context))
            conn.commit()
        except Exception as e:
            hyde_context = question # Fallback
            print("HyDE Error:", e)

    # 2. Embeddings & Search
    search_vector = model.encode(hyde_context).tolist()
    
    # FTS Search
    if std_filter == 'ALL':
        fts_rows = conn.execute('SELECT rowid FROM standards_fts WHERE standards_fts MATCH ? LIMIT 15', (question.replace('"', ''),)).fetchall()
    else:
        fts_rows = conn.execute('SELECT rowid FROM standards_fts WHERE standards_fts MATCH ? AND standard_code = ? LIMIT 15', (question.replace('"', ''), std_filter)).fetchall()
        
    fts_ids = [r['rowid'] for r in fts_rows]

    # Vector Search
    query = 'SELECT id, standard_code, clause, content, embedding_json FROM standards_knowledge'
    params = []
    if std_filter != 'ALL':
        query += ' WHERE standard_code = ?'
        params.append(std_filter)
        
    all_rows = conn.execute(query, params).fetchall()
    
    results = []
    for r in all_rows:
        emb = json.loads(r['embedding_json'])
        sim = cosine_similarity(search_vector, emb)
        
        # Boost if in FTS
        if r['id'] in fts_ids:
            sim += 0.15
            
        results.append({
            'score': float(sim),
            'content': r['content'],
            'source': f"{r['standard_code']} - {r['clause']}"
        })
        
    results.sort(key=lambda x: x['score'], reverse=True)
    top_results = results[:5]
    
    context_text = "\\n\\n".join([f"[{r['source']}]: {r['content']}" for r in top_results])
    
    system_prompt = f"""You are 'Inspecta', an AI Assistant for QA/QC and Engineering Standards.
Always answer using this exact format:
**Direct Answer:** (1-2 sentences with the bottom line)
**Explanation:** (Details)

Use this context:
{context_text}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question}
    ]
    
    try:
        r = ask_groq(messages, api_key)
        answer = r['choices'][0]['message']['content']
        sources = list(set([r['source'] for r in top_results]))
        
        return jsonify({
            "answer": answer,
            "sources": sources,
            "model_used": "llama-3.1-70b-versatile (LocaSpec)"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting LocaSpec on http://localhost:5000")
    app.run(port=5000, debug=True)
