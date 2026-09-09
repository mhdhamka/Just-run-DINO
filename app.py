from flask import Flask, render_template, jsonify, request, send_from_directory
import os

app = Flask(__name__, template_folder='templates', static_folder='static')

high_score = 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory('.', 'manifest.json')

@app.route('/api/score', methods=['GET', 'POST'])
def handle_score():
    global high_score
    if request.method == 'POST':
        data = request.get_json()
        score = data.get('score', 0)
        if score > high_score:
            high_score = score
            return jsonify({'status': 'new_record', 'high_score': high_score})
        return jsonify({'status': 'ok', 'high_score': high_score})
    return jsonify({'high_score': high_score})

@app.route('/favicon.ico')
def favicon():
    return ('', 204)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=False)