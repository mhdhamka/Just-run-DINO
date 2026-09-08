from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

# Game state (in-memory, single-player high score persistence)
game_state = {
    "high_score": 0
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/score', methods=['GET', 'POST'])
def handle_score():
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        new_score = int(data.get('score', 0))
        if new_score > game_state['high_score']:
            game_state['high_score'] = new_score
            return jsonify({"status": "new_record", "high_score": game_state['high_score']})
        return jsonify({"status": "saved", "high_score": game_state['high_score']})
    
    return jsonify(game_state)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=True)
