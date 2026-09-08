from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Simple in-memory storage for the high score 
game_state = {
    "high_score": 0
}

@app.route('/')
def index():
    # Renders the main frontend page
    return render_template('index.html')

@app.route('/api/score', methods=['GET'])
def get_high_score():
    return jsonify(game_state)

@app.route('/api/score', methods=['POST'])
def update_score():
    data = request.get_json()
    new_score = data.get('score', 0)
    
    if new_score > game_state["high_score"]:
        game_state["high_score"] = new_score
        return jsonify({"status": "new_record", "high_score": game_state["high_score"]})
    
    return jsonify({"status": "saved", "high_score": game_state["high_score"]})

if __name__ == '__main__':
    app.run(debug=True, port=5000)