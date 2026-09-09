<div align="center">

# Just Run DINO! 🦖🚀🤖

**Just Run DINO!** is an action-packed, arcade-style offline runner game built with HTML5 Canvas, JavaScript, and a Flask/Node backend. Choose your champion from a multiverse of heroes, transform into legendary suits or vehicles on the fly, dodge active chaser bosses, and blast your way through high-intensity obstacles!

[Live Demo](https://just-run-dino.onrender.com/) · [Report Bug](https://github.com/mhdhamka/Just-run-DINO/issues) · [Request Feature](https://github.com/mhdhamka/Just-run-DINO/issues)

[![Flask](https://img.shields.io/badge/Flask-Backend-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![HTML Canvas](https://img.shields.io/badge/HTML-Canvas-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## Core Features & Character Classes

* **Expanded Roster & Transformations:** Play as unique character classes, each with distinct transformation trees:
  * 🦖 **Dino:** Cycle through Iron Man (repulsor blasts + **true vertical flight mode**), Captain America (shield throw), Thor (lightning strikes), and Thanos (cosmic beam).
  * 🚀 **Astronaut / Transformer:** Start as an Astronaut or Rocket Ship, and transform into **Optimus Prime** or **Bumblebee** to drive on the ground or take flight in the skies.
  * 💻 **Developer:** Code your way through obstacles or transform into **Ultron** and **Vision** with custom cyber-projectile attacks.
* **Interactive Chaser Boss Threats:** 
  * 🦖 **Doomsday:** Relentlessly chases the Dino from behind, periodically slamming the ground to launch shockwaves you must time your jumps against.
  * 🤖 **Megatron:** Actively hunts down the Astronaut/Transformers, firing precise plasma beams that require ducking or altitude shifts.
* **Advanced Arcade Systems:**
  * ⚡ **Energon / Overdrive Meter:** Fill your gauge by collecting energy nodes or pulling off close dodges to trigger a 10-second neon **Overdrive Ultimate State** with full invincibility and auto-shredding power.
  * 🌐 **Multi-Altitude Portals:** Fly through tracking rings to seamlessly transition between ground-vehicle driving modes and high-altitude airspace flight.
  * ⭐ **"Danger Close" Skill Combos:** Get rewarded with high-risk score multipliers for near-miss obstacle dodges and precision skill-shots.
* **Q-of-L & Legacy Engines:** Includes a **Death Replay Flight Recorder**, dynamic weather engine, power-up suite (Shields, Slow-Mo, Double Score, Sector Nukes), and retro arcade scanline styling.

---

## Controls & Inputs

### Desktop (Keyboard)
* **`Space` / `Arrow Up`**: Jump / Fly upward
* **`F` / `Click`**: Fire weapon / Attack obstacles
* **`E` / `Transform Key`**: Cycle armor / Transform vehicle modes / Trigger Overdrive when full
* **`P`**: Pause game
* **`M`**: Toggle Sound Effects (SFX)

### Mobile & Touch Screen Integration
* **Right Half of Canvas / Screen**: Tap to trigger secondary attacks, fire weapons, or interact.
* **Left Half of Canvas / Screen**: Tap to jump or ascend during flight modes.
* **On-Screen HUD Buttons**: Full touch support for pausing, toggling audio, cycling gear, and navigating replay frames.

---

## Project Structure

```text
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── static/
│   ├── css/
│   │   └── style.css           # Game UI and retro styling
│   └── js/
│       ├── character.js        # Character definitions and logic
│       └── game.js             # Core game loop, rendering, and logic
├── templates/
│   └── index.html              # Main menu and game canvas layout
├── .gitignore                  # Git ignore file
├── app.py                      # Flask backend & score API
├── metadata.json               # Project metadata configuration
├── package.json                # Node.js dependencies configuration
├── Procfile                    # Heroku process configuration
├── README.md                   # Project documentation
├── requirements.txt            # Python dependencies
└── server.js                   # Node.js server setup

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


