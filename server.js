import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory score persistence
const gameState = {
  high_score: 0
};

// API routes
app.get('/api/score', (req, res) => {
  res.json(gameState);
});

app.post('/api/score', (req, res) => {
  const newScore = Number(req.body?.score) || 0;
  if (newScore > gameState.high_score) {
    gameState.high_score = newScore;
    return res.json({ status: 'new_record', high_score: gameState.high_score });
  }
  return res.json({ status: 'saved', high_score: gameState.high_score });
});

// Static assets
app.use('/static', express.static(path.join(__dirname, 'static')));

// Main frontend page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Catch-all route to serve the game index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
