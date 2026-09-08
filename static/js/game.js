document.addEventListener("DOMContentLoaded", () => {
    const menuOverlay = document.getElementById("menu-overlay");
    const startBtn = document.getElementById("start-btn");
    const charCards = document.querySelectorAll(".char-card");
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreboard = document.getElementById("scoreboard");
    const currentScoreEl = document.getElementById("current-score");
    const highScoreEl = document.getElementById("high-score");

    let selectedCharacter = "dino"; 
    let dinoGearMode = "standard"; // Options: 'standard', 'ironman', 'thor', 'cap', 'thanos'
    let gameRunning = false;
    let score = 0;
    let highScore = 0;
    let animationId;

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width || 1000;
        canvas.height = rect.height || 400;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const characterConfig = {
        dino: { groundColor: "#22c55e", skyColor: "#38bdf8" },
        developer: { groundColor: "#00ff66", bgGradient: ["#051105", "#010501"] },
        astronaut: { groundColor: "#3b82f6", bgGradient: ["#0a0a23", "#02020f"] }
    };

    fetch('/api/score')
        .then(res => res.json())
        .then(data => {
            highScore = data.high_score;
            highScoreEl.innerText = String(highScore).padStart(5, '0');
        });

    charCards.forEach(card => {
        card.addEventListener("click", () => {
            charCards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            selectedCharacter = card.getAttribute("data-char");
            updatePlayerDimensions();
        });
    });

    let player = {
        x: 60,
        y: 0,
        width: 62,
        height: 48,
        vy: 0,
        gravity: 0.5,
        jumpPower: -10,
        isJumping: false
    };

    function updatePlayerDimensions() {
        if (selectedCharacter === 'dino') {
            player.width = 62;
            player.height = 48;
        } else if (selectedCharacter === 'developer') {
            player.width = 42;
            player.height = 38;
        } else {
            player.width = 45;
            player.height = 35;
        }
    }
    updatePlayerDimensions();

    let obstacles = [];
    let projectiles = [];
    let gameSpeed = 5;
    let spawnTimer = 0;

    startBtn.addEventListener("click", () => {
        menuOverlay.classList.add("hidden");
        canvas.classList.remove("hidden");
        scoreboard.classList.remove("hidden");
        
        resizeCanvas();
        resetGame();
        gameRunning = true;
        animationId = requestAnimationFrame(gameLoop);
    });

    // Controls: Space/Up jumps. Key 'E' cycles Marvel gear! Key 'F' / Click attacks.
    function triggerAction(isSecondary = false) {
        if (!gameRunning) return;

        if (selectedCharacter === 'dino' && isSecondary) {
            if (dinoGearMode === 'ironman') {
                projectiles.push({ x: player.x + player.width, y: player.y + 15, width: 18, height: 5, speed: 14, type: 'repulsor' });
            } else if (dinoGearMode === 'thor') {
                projectiles.push({ x: player.x + player.width, y: player.y + 10, width: 22, height: 8, speed: 12, type: 'lightning' });
            } else if (dinoGearMode === 'cap') {
                projectiles.push({ x: player.x + player.width, y: player.y + 12, width: 16, height: 16, speed: 11, type: 'shield_throw' });
            } else if (dinoGearMode === 'thanos') {
                projectiles.push({ x: player.x + player.width, y: player.y + 5, width: 25, height: 12, speed: 13, type: 'thanos_beam' });
            }
        } else if (selectedCharacter === 'astronaut' && isSecondary) {
            projectiles.push({ x: player.x + player.width, y: player.y + player.height / 2 - 2, width: 15, height: 4, speed: 12, type: 'laser' });
        } else if (selectedCharacter === 'developer' && isSecondary) {
            projectiles.push({ x: player.x + player.width, y: player.y + player.height / 2 - 2, width: 14, height: 6, speed: 10, type: 'patch' });
        } else {
            if (!player.isJumping) {
                player.vy = player.jumpPower;
                player.isJumping = true;
            }
        }
    }

    window.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "ArrowUp") {
            e.preventDefault();
            triggerAction(false);
        } else if (e.code === "KeyF" || e.code === "KeyX") {
            e.preventDefault();
            triggerAction(true);
        } else if (e.code === "KeyE" && selectedCharacter === 'dino') {
            // Cycle Marvel Power Gear: Standard -> Iron Man -> Thor -> Captain America -> Thanos
            if (dinoGearMode === 'standard') dinoGearMode = 'ironman';
            else if (dinoGearMode === 'ironman') dinoGearMode = 'thor';
            else if (dinoGearMode === 'thor') dinoGearMode = 'cap';
            else if (dinoGearMode === 'cap') dinoGearMode = 'thanos';
            else dinoGearMode = 'standard';
        }
    });

    canvas.addEventListener("click", () => {
        if (selectedCharacter === 'dino') {
            triggerAction(true);
        } else {
            triggerAction(true);
        }
    });

    function getGroundY() {
        return canvas.height - 70;
    }

    function resetGame() {
        updatePlayerDimensions();
        const groundY = getGroundY();
        player.y = groundY - player.height;
        player.vy = 0;
        player.isJumping = false;
        obstacles = [];
        projectiles = [];
        score = 0;
        gameSpeed = 5;
        spawnTimer = 0;
    }

    // --- Custom Vector Drawings ---
    function drawPlayer(x, y) {
        ctx.save();
        ctx.translate(x, y);

        if (selectedCharacter === 'dino') {
            if (dinoGearMode === 'ironman') {
                ctx.fillStyle = '#dc2626'; // Red armor
                ctx.fillRect(0, 20, 18, 10);
                ctx.fillRect(14, 14, 32, 24);
                ctx.fillRect(36, 2, 24, 18);
                ctx.fillStyle = '#fbbf24'; // Gold faceplate & core
                ctx.fillRect(48, 5, 10, 10);
                ctx.fillRect(26, 22, 6, 6);
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(27, 23, 4, 4);
                const legOffset = player.isJumping ? 4 : Math.sin(Date.now() / 65) * 8;
                ctx.fillStyle = '#991b1b';
                ctx.fillRect(20, 38, 8, 12 + legOffset);
                ctx.fillRect(34, 38, 8, 12 - legOffset);

            } else if (dinoGearMode === 'thor') {
                // --- THOR T-REX (With Red Cape & Mjolnir Hammer) ---
                ctx.fillStyle = '#b91c1c'; // Flowing red cape
                ctx.fillRect(10, 16, 12, 18);
                ctx.fillStyle = '#1e293b'; // Asgardian armor body
                ctx.fillRect(14, 14, 32, 24);
                ctx.fillRect(36, 2, 22, 18); // Head with winged helmet
                ctx.fillStyle = '#fbbf24'; // Wings on helmet
                ctx.fillRect(34, 4, 4, 8);

                // Mjolnir Hammer in hand!
                ctx.fillStyle = '#64748b'; // Hammer head
                ctx.fillRect(54, 14, 10, 8);
                ctx.fillStyle = '#78350f'; // Handle
                ctx.fillRect(52, 20, 3, 8);

                const legOffset = player.isJumping ? 4 : Math.sin(Date.now() / 65) * 8;
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(20, 38, 8, 12 + legOffset);
                ctx.fillRect(34, 38, 8, 12 - legOffset);

            } else if (dinoGearMode === 'cap') {
                // --- CAPTAIN AMERICA T-REX (Vibranium Shield & Helmet) ---
                ctx.fillStyle = '#1d4ed8'; // Blue suit body
                ctx.fillRect(0, 20, 18, 10);
                ctx.fillRect(14, 14, 32, 24);
                ctx.fillRect(36, 2, 22, 18); // Helmet with 'A'
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(46, 6, 4, 6);   // 'A' symbol

                // Iconic Circular Shield
                ctx.fillStyle = '#dc2626'; // Outer red ring
                ctx.beginPath();
                ctx.arc(55, 22, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff'; // White ring
                ctx.beginPath();
                ctx.arc(55, 22, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#1d4ed8'; // Blue center with star
                ctx.beginPath();
                ctx.arc(55, 22, 4, 0, Math.PI * 2);
                ctx.fill();

                const legOffset = player.isJumping ? 4 : Math.sin(Date.now() / 65) * 8;
                ctx.fillStyle = '#1d4ed8';
                ctx.fillRect(20, 38, 8, 12 + legOffset);
                ctx.fillRect(34, 38, 8, 12 - legOffset);

            } else if (dinoGearMode === 'thanos') {
                // --- THANOS INFINITY GAUNTLET T-REX ---
                ctx.fillStyle = '#7e22ce'; // Titan purple armor
                ctx.fillRect(0, 20, 18, 10);
                ctx.fillRect(14, 14, 32, 24);
                ctx.fillRect(36, 2, 22, 18);

                // Gold Infinity Gauntlet with Glowing Stones
                ctx.fillStyle = '#f59e0b'; // Gold gauntlet glove
                ctx.fillRect(50, 16, 12, 12);
                // Glowing Infinity Stones (Blue, Red, Purple, Green, Yellow, Orange)
                ctx.fillStyle = '#38bdf8'; ctx.fillRect(52, 18, 2, 2);
                ctx.fillStyle = '#ef4444'; ctx.fillRect(56, 18, 2, 2);
                ctx.fillStyle = '#10b981'; ctx.fillRect(60, 18, 2, 2);

                const legOffset = player.isJumping ? 4 : Math.sin(Date.now() / 65) * 8;
                ctx.fillStyle = '#581c87';
                ctx.fillRect(20, 38, 8, 12 + legOffset);
                ctx.fillRect(34, 38, 8, 12 - legOffset);

            } else {
                // Standard T-Rex
                ctx.fillStyle = '#15803d';
                ctx.fillRect(0, 20, 18, 10);
                ctx.fillRect(14, 14, 32, 24);
                ctx.fillRect(36, 2, 22, 18);
                const legOffset = player.isJumping ? 4 : Math.sin(Date.now() / 65) * 8;
                ctx.fillRect(20, 38, 8, 12 + legOffset);
                ctx.fillRect(34, 38, 8, 12 - legOffset);
            }

        } else if (selectedCharacter === 'developer') {
            ctx.fillStyle = '#374151';
            ctx.fillRect(6, 12, 22, 14);
            ctx.fillStyle = '#00ff66';
            ctx.fillRect(8, 4, 18, 10);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(14, -6, 10, 10);
            const legOffset = player.isJumping ? 2 : Math.sin(Date.now() / 70) * 6;
            ctx.fillStyle = '#6b7280';
            ctx.fillRect(10, 26, 4, 10 + legOffset);
            ctx.fillRect(20, 26, 4, 10 - legOffset);

        } else if (selectedCharacter === 'astronaut') {
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(0, 12);
            ctx.lineTo(player.width, player.height / 2);
            ctx.lineTo(0, player.height - 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(player.width - 16, player.height / 2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f97316';
            ctx.fillRect(-10 + Math.sin(Date.now() / 30) * 3, 12, 10, 12);
        }

        ctx.restore();
    }

    function drawObstacle(obs) {
        ctx.save();
        ctx.translate(obs.x, obs.y);

        if (selectedCharacter === 'dino') {
            // --- GALACTUS BOSS ENEMY (The Devourer of Worlds) ---
            ctx.fillStyle = '#7f1d1d'; // Deep crimson armor
            ctx.fillRect(2, 0, 24, 34);
            // Galactus Iconic Purple Helmet Fins
            ctx.fillStyle = '#7e22ce';
            ctx.fillRect(0, -10, 8, 14);
            ctx.fillRect(20, -10, 8, 14);
            // Glowing Cosmic Eyes
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(8, 6, 4, 3);
            ctx.fillRect(16, 6, 4, 3);
        } else if (selectedCharacter === 'developer') {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(4, 10, 14, 14);
            ctx.fillStyle = '#fff';
            ctx.fillRect(6, 12, 3, 3);
            ctx.fillRect(12, 12, 3, 3);
        } else if (selectedCharacter === 'astronaut') {
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(15, 15, 14, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function gameLoop() {
        if (!gameRunning) return;

        const theme = characterConfig[selectedCharacter];
        const groundY = getGroundY();

        if (selectedCharacter === 'dino') {
            ctx.fillStyle = theme.skyColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            let bgGrad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 50, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height));
            bgGrad.addColorStop(0, theme.bgGradient[0]);
            bgGrad.addColorStop(1, theme.bgGradient[1]);
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (selectedCharacter === 'astronaut') {
            ctx.fillStyle = '#ffffff';
            stars.forEach(star => {
                star.x -= star.speed * (gameSpeed * 0.4);
                if (star.x < 0) star.x = canvas.width;
                ctx.fillRect(star.x, star.y, star.size, star.size);
            });
        }

        ctx.strokeStyle = theme.groundColor;
        ctx.shadowColor = theme.groundColor;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, groundY + player.height);
        ctx.lineTo(canvas.width, groundY + player.height);
        ctx.stroke();
        ctx.shadowBlur = 0;

        player.vy += player.gravity;
        player.y += player.vy;

        if (player.y > groundY) {
            player.y = groundY;
            player.vy = 0;
            player.isJumping = false;
        }

        drawPlayer(player.x, player.y);

        // Render projectiles / weapons attack effects
        for (let l = projectiles.length - 1; l >= 0; l--) {
            let p = projectiles[l];
            p.x += p.speed;

            if (p.type === 'repulsor') {
                ctx.fillStyle = '#38bdf8'; // Iron Man blue beam
                ctx.fillRect(p.x, p.y, p.width, p.height);
            } else if (p.type === 'lightning') {
                ctx.fillStyle = '#facc15'; // Thor lightning spark
                ctx.fillRect(p.x, p.y, p.width, p.height);
            } else if (p.type === 'shield_throw') {
                ctx.fillStyle = '#dc2626'; // Captain America spinning shield
                ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
            } else if (p.type === 'thanos_beam') {
                ctx.fillStyle = '#a855f7'; // Thanos Infinity power beam
                ctx.fillRect(p.x, p.y, p.width, p.height);
            } else {
                ctx.fillStyle = '#00ff66';
                ctx.fillRect(p.x, p.y, p.width, p.height);
            }

            for (let o = obstacles.length - 1; o >= 0; o--) {
                let obs = obstacles[o];
                if (p.x < obs.x + obs.width && p.x + p.width > obs.x && p.y < obs.y + obs.height && p.y + p.height > obs.y) {
                    projectiles.splice(l, 1);
                    obstacles.splice(o, 1);
                    score += 30; // Massive score boost for defeating Galactus minions!
                    break;
                }
            }

            if (p.x > canvas.width) projectiles.splice(l, 1);
        }

        spawnTimer++;
        if (spawnTimer > Math.random() * 55 + 65) {
            obstacles.push({
                x: canvas.width,
                y: groundY + 2,
                width: 30,
                height: 35
            });
            spawnTimer = 0;
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= gameSpeed;

            drawObstacle(obs);

            if (player.x < obs.x + obs.width && player.x + player.width > obs.x && player.y < obs.y + obs.height && player.y + player.height > obs.y) {
                gameOver();
                return;
            }

            if (obs.x + obs.width < 0) {
                obstacles.splice(i, 1);
                score += 10;
                if (score % 100 === 0) gameSpeed += 0.5;
            }
        }

        currentScoreEl.innerText = String(score).padStart(5, '0');
        animationId = requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        gameRunning = false;
        cancelAnimationFrame(animationId);

        fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: score })
        })
        .then(res => res.json())
        .then(data => {
            highScore = data.high_score;
            highScoreEl.innerText = String(highScore).padStart(5, '0');
            
            menuOverlay.querySelector("h1").innerText = "SYSTEM CRASH";
            menuOverlay.querySelector("p").innerText = `Final Score: ${score}. Re-initialize protocol and try again!`;
            startBtn.innerText = "Reboot Game";
            menuOverlay.classList.remove("hidden");
        });
    }
});