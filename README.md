# Just Run DINO! 🦖🚀

**Just Run DINO!** is an interactive, arcade-style runner game built with HTML5 Canvas, JavaScript, and a Flask backend. Take control of a multiverse-traveling T-Rex equipped with legendary gear (Iron Man suit, Thor's Mjolnir, Captain America's shield, and the Thanos Infinity Gauntlet) as you battle against cosmic threats like Galactus!

---

## Features

* **Multiple Characters & Gear:** Play as the ultimate Marvel T-Rex, a Stressed Developer, or a Space Explorer.
* **T-Rex Gear Cycling (Press `E`):** Switch your T-Rex's loadout on the fly:
  * 🔴 **Iron Man Suit** (Fires repulsor beams)
  * ⚡ **Thor Mjolnir** (Casts lightning)
  * 🛡️ **Captain America** (Throws vibranium shields)
  * 🟣 **Thanos Infinity Gauntlet** (Unleashes cosmic power beams)
* **Boss Fights:** Dodge and blast through towering cosmic enemies like Galactus.
* **Persistent High Scores:** Track your best runs with backend score integration.
* **Retro Aesthetics:** Styled with scanlines and vibrant arcade color palettes.

---

## Controls

* **`Space` / `Arrow Up`**: Jump
* **`E`**: Cycle T-Rex armor/gear (when playing as the Dino)
* **`F` / `Click`**: Fire weapon / attack enemies

---

## Project Structure

```text
├── app.py                # Flask backend & score API
├── static/
│   ├── css/
│   │   └── style.css     # Game UI and retro styling
│   └── js/
│       └── game.js       # Core game loop, rendering, and logic
└── templates/
    └── index.html        # Main menu and game canvas layout

```

---

## Getting Started

1. Clone or download the repository.
2. Install dependencies (if using Python Flask for score tracking):
```bash
pip install flask

```


3. Run the application:
```bash
python app.py

```


4. Open your browser and navigate to `http://127.0.0.1:5000` to start playing!

```
