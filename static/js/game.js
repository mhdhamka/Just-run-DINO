document.addEventListener("DOMContentLoaded", () => {
    const menuOverlay = document.getElementById("menu-overlay");
    const startBtn = document.getElementById("start-btn");
    const charCards = document.querySelectorAll(".char-card");
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreboard = document.getElementById("scoreboard");
    const currentScoreEl = document.getElementById("current-score");
    const highScoreEl = document.getElementById("high-score");
    const sfxToggleBtn = document.getElementById("sfx-toggle-btn");
    const sfxIcon = document.getElementById("sfx-icon");
    const sfxLabel = document.getElementById("sfx-label");

    // Pause UI Elements
    const pauseBtn = document.getElementById("pause-btn");
    const pauseIcon = document.getElementById("pause-icon");
    const pauseLabel = document.getElementById("pause-label");
    const pauseOverlay = document.getElementById("pause-overlay");
    const resumeBtn = document.getElementById("resume-btn");
    const restartBtn = document.getElementById("restart-btn");
    const menuBtn = document.getElementById("menu-btn");
    const pauseCurrentScoreEl = document.getElementById("pause-current-score");
    const pauseDifficultyEl = document.getElementById("pause-difficulty");
    const pauseBuffCountEl = document.getElementById("pause-buff-count");

    // Difficulty & Power-Up UI Elements
    const diffBtns = document.querySelectorAll(".diff-btn");
    const diffBadge = document.getElementById("diff-badge");
    const powerupHud = document.getElementById("powerup-hud");

    // Weather UI Elements
    const weatherBadge = document.getElementById("weather-badge");
    const pauseWeatherEl = document.getElementById("pause-weather");

    // Combo UI Elements
    const comboBadge = document.getElementById("combo-badge");
    const pauseMaxComboEl = document.getElementById("pause-max-combo");

    // Keybind & Controls Remap UI Elements
    const keybindToggleBtn = document.getElementById("keybind-toggle-btn");
    const menuKeybindBtn = document.getElementById("menu-keybind-btn");
    const pauseKeybindBtn = document.getElementById("pause-keybind-btn");
    const keybindModal = document.getElementById("keybind-modal");
    const keybindGrid = document.getElementById("keybind-grid");
    const keybindResetBtn = document.getElementById("keybind-reset-btn");
    const keybindCloseBtn = document.getElementById("keybind-close-btn");
    const keybindStatusHint = document.getElementById("keybind-status-hint");
    const scorePopupAnchor = document.getElementById("score-popup-anchor");
    const controlsHintEl = document.querySelector(".controls-hint");

    let selectedCharacter = "dino"; 
    let dinoGearMode = "standard"; // Options: 'standard', 'ironman', 'thor', 'cap', 'thanos'
    let gameRunning = false;
    let isPaused = false;
    let score = 0;
    let visualScore = 0;
    let isNewRecordTriggered = false;
    let highScore = 0;
    let animationId;

    // --- Dynamic Screen Tint Engine ---
    let screenTint = {
        r: 0,
        g: 0,
        b: 0,
        currentAlpha: 0,
        vignetteColor: [0, 0, 0],
        currentVignetteAlpha: 0
    };

    function resetScreenTint() {
        screenTint.r = 0;
        screenTint.g = 0;
        screenTint.b = 0;
        screenTint.currentAlpha = 0;
        screenTint.vignetteColor = [0, 0, 0];
        screenTint.currentVignetteAlpha = 0;
    }

    // --- Advanced Particle Effect Engine ---
    let gameParticles = [];

    function spawnParticles({
        x, y,
        count = 10,
        color = '#ffffff',
        colors = null,
        minSpeed = 1.5, maxSpeed = 4.5,
        minSize = 2, maxSize = 4,
        gravity = 0.15,
        friction = 0.95,
        life = 25,
        angleMin = 0, angleMax = Math.PI * 2,
        shape = 'rect'
    }) {
        for (let i = 0; i < count; i++) {
            if (gameParticles.length > 250) gameParticles.shift(); // Hard cap for optimal 60fps
            const angle = Math.random() * (angleMax - angleMin) + angleMin;
            const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
            const chosenColor = colors ? colors[Math.floor(Math.random() * colors.length)] : color;
            const size = Math.random() * (maxSize - minSize) + minSize;
            const pLife = Math.floor(Math.random() * (life * 0.4) + life * 0.8);
            gameParticles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity,
                friction,
                size,
                color: chosenColor,
                life: pLife,
                maxLife: pLife,
                shape
            });
        }
    }

    function spawnRunParticles(x, y) {
        let colors = ['#94a3b8', '#cbd5e1'];
        if (selectedCharacter === 'dino') {
            if (dinoGearMode === 'ironman') colors = ['#38bdf8', '#fbbf24', '#f97316'];
            else if (dinoGearMode === 'thor') colors = ['#67e8f9', '#ffffff', '#fde047'];
            else if (dinoGearMode === 'cap') colors = ['#ef4444', '#ffffff', '#3b82f6'];
            else if (dinoGearMode === 'thanos') colors = ['#c084fc', '#a855f7', '#7c3aed'];
            else colors = ['#86efac', '#4ade80'];
        } else if (selectedCharacter === 'astronaut') {
            colors = ['#38bdf8', '#67e8f9', '#ffffff'];
        } else if (selectedCharacter === 'developer') {
            colors = ['#22c55e', '#15803d', '#4ade80'];
        }
        spawnParticles({
            x, y,
            count: 2,
            colors,
            minSpeed: 0.8, maxSpeed: 2.2,
            minSize: 1.5, maxSize: 3,
            gravity: -0.02,
            friction: 0.94,
            life: 18,
            angleMin: Math.PI * 0.85, angleMax: Math.PI * 1.15,
            shape: 'rect'
        });
    }

    function spawnJumpParticles(x, y) {
        spawnParticles({
            x, y,
            count: 10,
            colors: ['#cbd5e1', '#94a3b8', '#64748b', '#38bdf8'],
            minSpeed: 2.0, maxSpeed: 4.8,
            minSize: 2, maxSize: 3.5,
            gravity: 0.12,
            friction: 0.93,
            life: 22,
            angleMin: Math.PI * 0.65, angleMax: Math.PI * 1.35,
            shape: 'spark'
        });
    }

    function spawnLandParticles(x, y) {
        spawnParticles({
            x, y,
            count: 12,
            colors: ['#e2e8f0', '#94a3b8', '#38bdf8'],
            minSpeed: 2.5, maxSpeed: 5.5,
            minSize: 2, maxSize: 4,
            gravity: 0.18,
            friction: 0.91,
            life: 24,
            angleMin: Math.PI * 0.75, angleMax: Math.PI * 1.25,
            shape: 'dust'
        });
        spawnParticles({
            x, y,
            count: 12,
            colors: ['#e2e8f0', '#94a3b8', '#38bdf8'],
            minSpeed: 2.5, maxSpeed: 5.5,
            minSize: 2, maxSize: 4,
            gravity: 0.18,
            friction: 0.91,
            life: 24,
            angleMin: -Math.PI * 0.25, angleMax: Math.PI * 0.25,
            shape: 'dust'
        });
    }

    function spawnObstacleExplosion(x, y, hitType = 'hit') {
        let colors = ['#f87171', '#fbbf24', '#f97316', '#334155'];
        if (hitType === 'thanos' || hitType === 'thanos_beam') {
            colors = ['#c084fc', '#a855f7', '#7e22ce', '#38bdf8'];
        } else if (hitType === 'lightning' || hitType === 'thor') {
            colors = ['#fde047', '#facc15', '#67e8f9', '#ffffff'];
        } else if (hitType === 'nuke') {
            colors = ['#c084fc', '#f43f5e', '#fbbf24', '#38bdf8', '#ffffff'];
        } else if (hitType === 'shield_throw' || hitType === 'cap') {
            colors = ['#ef4444', '#3b82f6', '#ffffff'];
        }

        spawnParticles({
            x, y,
            count: 22,
            colors,
            minSpeed: 2.5, maxSpeed: 7.2,
            minSize: 2.5, maxSize: 5.5,
            gravity: 0.22,
            friction: 0.92,
            life: 36,
            shape: 'spark'
        });
    }

    function spawnProjectileTrail(p) {
        let color = '#38bdf8';
        if (p.type === 'lightning') color = '#facc15';
        else if (p.type === 'shield_throw') color = '#ef4444';
        else if (p.type === 'thanos_beam') color = '#c084fc';
        else if (p.type === 'laser') color = '#ef4444';
        else if (p.type === 'patch') color = '#22c55e';

        if (Math.random() < 0.75) {
            spawnParticles({
                x: p.x,
                y: p.y + (p.height ? p.height / 2 : 0),
                count: 1,
                color,
                minSpeed: 0.5, maxSpeed: 1.8,
                minSize: 1.5, maxSize: 3,
                gravity: 0.02,
                friction: 0.95,
                life: 12,
                angleMin: Math.PI * 0.9, angleMax: Math.PI * 1.1,
                shape: 'spark'
            });
        }
    }

    function spawnPowerUpPickupParticles(x, y, color = '#facc15') {
        spawnParticles({
            x, y,
            count: 25,
            colors: [color, '#ffffff', '#fde047'],
            minSpeed: 2.5, maxSpeed: 6.0,
            minSize: 2.5, maxSize: 4.5,
            gravity: 0.1,
            friction: 0.93,
            life: 30,
            shape: 'circle'
        });
    }

    function spawnComboMilestoneParticles(x, y, tierColor) {
        spawnParticles({
            x, y,
            count: 32,
            colors: [tierColor, '#ffffff', '#fde047', '#38bdf8'],
            minSpeed: 3.5, maxSpeed: 8.0,
            minSize: 3, maxSize: 6,
            gravity: 0.18,
            friction: 0.92,
            life: 42,
            angleMin: -Math.PI * 0.9, angleMax: -Math.PI * 0.1,
            shape: 'spark'
        });
    }

    function updateAndDrawParticles() {
        for (let i = gameParticles.length - 1; i >= 0; i--) {
            const p = gameParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= p.friction;
            p.life--;

            if (p.life <= 0) {
                gameParticles.splice(i, 1);
                continue;
            }

            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 4;

            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.shape === 'spark') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size * 0.8;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 0.8, p.y - p.vy * 0.8);
                ctx.stroke();
            } else {
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
            ctx.restore();
        }
    }

    // --- Combo Meter Engine ---
    let comboCount = 0;
    let maxCombo = 0;
    let comboTimer = 0;
    const comboMaxTime = 240; // ~4 seconds window to sustain combo streak
    let comboMultiplier = 1.0;
    let comboScalePulse = 1.0;

    const comboTiers = [
        { min: 0, mult: 1.0, name: "NORMAL", color: "#94a3b8", badgeClass: "" },
        { min: 3, mult: 1.25, name: "SWEET", color: "#4ade80", badgeClass: "combo-tier-1" },
        { min: 6, mult: 1.5, name: "SUPER", color: "#facc15", badgeClass: "combo-tier-2" },
        { min: 10, mult: 2.0, name: "HYPER", color: "#fb923c", badgeClass: "combo-tier-3" },
        { min: 15, mult: 3.0, name: "GODLIKE", color: "#c084fc", badgeClass: "combo-tier-4" }
    ];

    function getComboTier(streak) {
        for (let i = comboTiers.length - 1; i >= 0; i--) {
            if (streak >= comboTiers[i].min) {
                return { tier: i, ...comboTiers[i] };
            }
        }
        return { tier: 0, ...comboTiers[0] };
    }

    function updateComboUI() {
        if (comboBadge) {
            const tier = getComboTier(comboCount);
            comboBadge.innerText = `${comboCount}x (${comboMultiplier.toFixed(1)}x)`;
            comboBadge.className = `combo-tag ${comboCount > 0 ? (tier.badgeClass || 'combo-active') : ''}`;
        }
        if (pauseMaxComboEl) {
            const maxTier = getComboTier(maxCombo);
            pauseMaxComboEl.innerText = `${maxCombo}x ${maxCombo >= 3 ? '(' + maxTier.name + ')' : ''}`;
        }
    }

    function addCombo(points = 1, x = canvas.width / 2, y = 50, reason = '') {
        const prevTier = getComboTier(comboCount);
        comboCount += points;
        if (comboCount > maxCombo) maxCombo = comboCount;
        comboTimer = comboMaxTime;
        comboScalePulse = 1.45;

        const newTier = getComboTier(comboCount);
        comboMultiplier = newTier.mult;

        if (newTier.tier > prevTier.tier) {
            playSfx('combo_tier_up');
            spawnFloatingText(canvas.width / 2, 60, `🔥 ${newTier.name} COMBO! x${comboCount} [${newTier.mult}X]`, newTier.color);
            triggerScreenShake(4, 9);
            spawnComboMilestoneParticles(player.x + player.width / 2, player.y - 10, newTier.color);
        } else {
            playSfx('combo_up', '', comboCount);
            if (comboCount >= 2 && reason === 'DODGE') {
                spawnFloatingText(x, y, `COMBO +1!`, newTier.color);
            }
        }
        updateComboUI();
    }

    function breakCombo() {
        if (comboCount >= 3) {
            playSfx('combo_break');
            spawnFloatingText(player.x + 10, player.y - 25, "COMBO BROKEN!", "#ef4444");
        }
        comboCount = 0;
        comboTimer = 0;
        comboMultiplier = 1.0;
        updateComboUI();
    }

    function drawOnCanvasComboMeter() {
        if (comboCount < 2) return;

        const tier = getComboTier(comboCount);
        const meterW = 126;
        const meterH = 38;
        const meterX = canvas.width - meterW - 16;
        const meterY = 16;

        ctx.save();
        // Background card
        ctx.fillStyle = 'rgba(10, 14, 26, 0.82)';
        ctx.strokeStyle = tier.color;
        ctx.lineWidth = tier.tier >= 4 ? 2 : 1.5;
        ctx.shadowColor = tier.color;
        ctx.shadowBlur = tier.tier >= 4 ? 14 : 6;
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(meterX, meterY, meterW, meterH, 6);
        } else {
            ctx.rect(meterX, meterY, meterW, meterH);
        }
        ctx.fill();
        ctx.stroke();

        // Combo count with bounce pulse
        ctx.save();
        ctx.translate(meterX + 10, meterY + 16);
        ctx.scale(comboScalePulse, comboScalePulse);
        ctx.font = 'bold 11px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = tier.color;
        ctx.shadowBlur = 6;
        ctx.fillText(`${comboCount}x`, 0, 0);
        ctx.restore();

        // Tier multiplier badge
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillStyle = tier.color;
        ctx.textAlign = 'right';
        ctx.fillText(`${tier.name} [${tier.mult}X]`, meterX + meterW - 8, meterY + 16);

        // Timer decay progress bar
        const barX = meterX + 8;
        const barY = meterY + 24;
        const barW = meterW - 16;
        const barH = 5;
        const progress = Math.max(0, Math.min(1, comboTimer / comboMaxTime));

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(barX, barY, barW, barH);

        // Active progress fill
        ctx.fillStyle = tier.color;
        ctx.shadowColor = tier.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(barX, barY, barW * progress, barH);

        // Electric micro spark on Godlike tier bar
        if (tier.tier >= 4 && Math.random() < 0.35) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(barX + barW * progress - 2, barY - 1, 4, barH + 2);
        }

        ctx.restore();
    }

    // --- Dynamic Screen Tint System ---
    function updateAndDrawScreenTint(effectiveSpeed) {
        const weather = weatherTypes[currentWeatherIndex];
        let targetR = 0, targetG = 0, targetB = 0, targetAlpha = 0;
        let vigColor = [0, 0, 0];
        let targetVigAlpha = 0.15;

        // Base Weather Atmospheric Ambient Tint
        if (weather.id === 'rain') {
            targetR = 15; targetG = 23; targetB = 42; targetAlpha = 0.26;
            vigColor = [10, 20, 45];
            targetVigAlpha = 0.42;
        } else if (weather.id === 'snow') {
            targetR = 56; targetG = 189; targetB = 248; targetAlpha = 0.14;
            vigColor = [186, 230, 253];
            targetVigAlpha = 0.22;
        } else if (weather.id === 'sandstorm') {
            targetR = 234; targetG = 88; targetB = 12; targetAlpha = 0.18;
            vigColor = [180, 83, 9];
            targetVigAlpha = 0.35;
        } else if (weather.id === 'meteors') {
            targetR = 109; targetG = 40; targetB = 217; targetAlpha = 0.20;
            vigColor = [88, 28, 135];
            targetVigAlpha = 0.38;
        }

        // Overdrive Speed Edge Glow
        if (gameSpeed > 6.5) {
            const speedFactor = Math.min(1, (gameSpeed - 6.5) / 6);
            targetVigAlpha = Math.max(targetVigAlpha, 0.2 + speedFactor * 0.25);
            if (targetAlpha === 0) {
                targetR = 239; targetG = 68; targetB = 68;
                targetAlpha = speedFactor * 0.08;
            }
        }

        // Active Power-Up Atmosphere
        if (activeBuffs.shield) {
            targetR = 0; targetG = 229; targetB = 255;
            targetAlpha = Math.max(targetAlpha, 0.10);
            vigColor = [0, 229, 255];
            targetVigAlpha = Math.max(targetVigAlpha, 0.30);
        } else if (activeBuffs.slowmoTimer > 0) {
            targetR = 16; targetG = 185; targetB = 129;
            targetAlpha = Math.max(targetAlpha, 0.14);
            vigColor = [16, 185, 129];
            targetVigAlpha = Math.max(targetVigAlpha, 0.32);
        } else if (activeBuffs.doubleTimer > 0) {
            targetR = 245; targetG = 158; targetB = 11;
            targetAlpha = Math.max(targetAlpha, 0.12);
            vigColor = [245, 158, 11];
            targetVigAlpha = Math.max(targetVigAlpha, 0.28);
        }

        // Combo Fever Edge Aura (Tier 3 & Tier 4)
        if (comboCount >= 10) {
            const tier = getComboTier(comboCount);
            if (tier.tier >= 4) {
                const pulse = Math.sin(Date.now() / 140) * 0.08 + 0.14;
                targetR = 192; targetG = 132; targetB = 252;
                targetAlpha = Math.max(targetAlpha, pulse);
                vigColor = [192, 132, 252];
                targetVigAlpha = Math.max(targetVigAlpha, 0.40 + pulse);
            } else if (tier.tier === 3) {
                targetR = 251; targetG = 146; targetB = 60;
                targetAlpha = Math.max(targetAlpha, 0.10);
                vigColor = [251, 146, 60];
                targetVigAlpha = Math.max(targetVigAlpha, 0.26);
            }
        }

        // Smoothly interpolate current tint values
        screenTint.r += (targetR - screenTint.r) * 0.08;
        screenTint.g += (targetG - screenTint.g) * 0.08;
        screenTint.b += (targetB - screenTint.b) * 0.08;
        screenTint.currentAlpha += (targetAlpha - screenTint.currentAlpha) * 0.08;
        screenTint.vignetteColor[0] += (vigColor[0] - screenTint.vignetteColor[0]) * 0.08;
        screenTint.vignetteColor[1] += (vigColor[1] - screenTint.vignetteColor[1]) * 0.08;
        screenTint.vignetteColor[2] += (vigColor[2] - screenTint.vignetteColor[2]) * 0.08;
        screenTint.currentVignetteAlpha += (targetVigAlpha - screenTint.currentVignetteAlpha) * 0.08;

        // Draw Ambient Screen Wash Tint
        if (screenTint.currentAlpha > 0.01) {
            ctx.save();
            ctx.fillStyle = `rgba(${Math.round(screenTint.r)}, ${Math.round(screenTint.g)}, ${Math.round(screenTint.b)}, ${screenTint.currentAlpha.toFixed(3)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        // Draw Dynamic Radial Vignette
        if (screenTint.currentVignetteAlpha > 0.01) {
            ctx.save();
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const maxR = Math.sqrt(cx * cx + cy * cy);
            const vig = ctx.createRadialGradient(cx, cy, maxR * 0.42, cx, cy, maxR);
            vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vig.addColorStop(1, `rgba(${Math.round(screenTint.vignetteColor[0])}, ${Math.round(screenTint.vignetteColor[1])}, ${Math.round(screenTint.vignetteColor[2])}, ${screenTint.currentVignetteAlpha.toFixed(3)})`);
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }

    // --- Screen Shake Engine ---
    let screenShakeTime = 0;
    let screenShakeIntensity = 0;

    function triggerScreenShake(intensity = 6, duration = 12, heavyCss = false) {
        screenShakeIntensity = Math.max(screenShakeIntensity, intensity);
        screenShakeTime = Math.max(screenShakeTime, duration);
        if (heavyCss) {
            const container = document.querySelector(".game-container");
            if (container) {
                container.classList.remove("screen-shaking");
                void container.offsetWidth; // trigger reflow
                container.classList.add("screen-shaking");
                setTimeout(() => {
                    container.classList.remove("screen-shaking");
                }, 340);
            }
        }
    }

    // --- Dynamic Weather Engine Configuration ---
    const weatherTypes = [
        {
            id: 'clear',
            name: 'CLEAR SKY',
            icon: '☀️',
            badgeClass: '',
            skyOverlay: null,
            bannerColor: '#38bdf8',
            lightning: false
        },
        {
            id: 'rain',
            name: 'THUNDERSTORM',
            icon: '⛈️',
            badgeClass: 'weather-rain',
            skyOverlay: 'rgba(8, 14, 30, 0.42)',
            bannerColor: '#60a5fa',
            lightning: true
        },
        {
            id: 'snow',
            name: 'CYBER BLIZZARD',
            icon: '❄️',
            badgeClass: 'weather-snow',
            skyOverlay: 'rgba(186, 230, 253, 0.16)',
            bannerColor: '#93c5fd',
            lightning: false
        },
        {
            id: 'sandstorm',
            name: 'COSMIC DUST',
            icon: '🌪️',
            badgeClass: 'weather-sandstorm',
            skyOverlay: 'rgba(234, 88, 12, 0.22)',
            bannerColor: '#fb923c',
            lightning: false
        },
        {
            id: 'meteors',
            name: 'METEOR SHOWER',
            icon: '☄️',
            badgeClass: 'weather-meteors',
            skyOverlay: 'rgba(88, 28, 135, 0.25)',
            bannerColor: '#c084fc',
            lightning: false
        }
    ];

    let currentWeatherIndex = 0;
    let weatherTimer = 0;
    const weatherChangeInterval = 720; // ~12 seconds at 60fps
    let weatherParticles = [];
    let rainSplashes = [];
    let lightningFlash = 0;
    let nextLightningCountdown = 160;

    // --- Difficulty Level Configuration ---
    const difficultyConfig = {
        rookie: {
            id: 'rookie',
            name: 'ROOKIE',
            baseSpeed: 4.2,
            speedInc: 0.35,
            scoreInterval: 120,
            spawnMin: 70,
            spawnMax: 120,
            powerUpSpawnRate: 0.018,
            scoreMultiplier: 1.0,
            badgeClass: 'rookie'
        },
        avenger: {
            id: 'avenger',
            name: 'AVENGER',
            baseSpeed: 5.5,
            speedInc: 0.5,
            scoreInterval: 100,
            spawnMin: 55,
            spawnMax: 95,
            powerUpSpawnRate: 0.013,
            scoreMultiplier: 1.25,
            badgeClass: 'avenger'
        },
        thanos: {
            id: 'thanos',
            name: 'THANOS SNAP',
            baseSpeed: 7.2,
            speedInc: 0.7,
            scoreInterval: 80,
            spawnMin: 40,
            spawnMax: 70,
            powerUpSpawnRate: 0.009,
            scoreMultiplier: 2.0,
            badgeClass: 'thanos'
        }
    };

    let currentDiff = localStorage.getItem("just_run_dino_diff") || "avenger";
    if (!difficultyConfig[currentDiff]) currentDiff = "avenger";

    function updateDifficultyUI() {
        diffBtns.forEach(btn => {
            const diff = btn.getAttribute("data-diff");
            if (diff === currentDiff) {
                btn.classList.add("selected");
            } else {
                btn.classList.remove("selected");
            }
        });

        if (diffBadge) {
            const config = difficultyConfig[currentDiff];
            diffBadge.innerText = config.name;
            diffBadge.className = `diff-tag ${config.badgeClass}`;
        }
    }

    diffBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            getAudioContext();
            playSfx('select');
            currentDiff = btn.getAttribute("data-diff");
            localStorage.setItem("just_run_dino_diff", currentDiff);
            updateDifficultyUI();
        });
    });
    updateDifficultyUI();

    // --- Web Audio SFX Engine ---
    let sfxEnabled = localStorage.getItem("just_run_dino_sfx") !== "false";
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    function updateSfxUI() {
        if (!sfxToggleBtn) return;
        if (sfxEnabled) {
            sfxToggleBtn.classList.remove("muted");
            sfxToggleBtn.setAttribute("aria-pressed", "true");
            sfxToggleBtn.title = "Disable Sound Effects (Key 'M')";
            if (sfxIcon) sfxIcon.innerText = "🔊";
            if (sfxLabel) sfxLabel.innerText = "SFX ON";
        } else {
            sfxToggleBtn.classList.add("muted");
            sfxToggleBtn.setAttribute("aria-pressed", "false");
            sfxToggleBtn.title = "Enable Sound Effects (Key 'M')";
            if (sfxIcon) sfxIcon.innerText = "🔇";
            if (sfxLabel) sfxLabel.innerText = "SFX OFF";
        }
    }

    function toggleSfx() {
        sfxEnabled = !sfxEnabled;
        localStorage.setItem("just_run_dino_sfx", sfxEnabled ? "true" : "false");
        updateSfxUI();
        if (sfxEnabled) {
            playSfx('toggle_on');
        }
    }

    if (sfxToggleBtn) {
        sfxToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            getAudioContext();
            toggleSfx();
        });
    }
    updateSfxUI();

    function playSfx(type, subtype = '', param = null) {
        if (!sfxEnabled) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        try {
            if (type === 'jump') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(560, now + 0.12);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.13);
            } else if (type === 'shoot') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                if (subtype === 'repulsor') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(950, now);
                    osc.frequency.exponentialRampToValueAtTime(260, now + 0.15);
                    gain.gain.setValueAtTime(0.22, now);
                    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
                } else if (subtype === 'thor') {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.linearRampToValueAtTime(120, now + 0.18);
                    gain.gain.setValueAtTime(0.20, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                } else if (subtype === 'cap') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(580, now);
                    osc.frequency.exponentialRampToValueAtTime(320, now + 0.14);
                    gain.gain.setValueAtTime(0.22, now);
                    gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
                } else if (subtype === 'thanos_beam') {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(220, now);
                    osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);
                    gain.gain.setValueAtTime(0.26, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
                } else {
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(640, now);
                    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
                    gain.gain.setValueAtTime(0.18, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                }
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            } else if (type === 'hit') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(250, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);
                gain.gain.setValueAtTime(0.24, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === 'gear') {
                [523.25, 659.25, 783.99].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                    gain.gain.setValueAtTime(0.15, now + idx * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.1);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.05);
                    osc.stop(now + idx * 0.05 + 0.1);
                });
            } else if (type === 'score_milestone') {
                [987.77, 1318.51].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    gain.gain.setValueAtTime(0.14, now + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.16);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.18);
                });
            } else if (type === 'game_over') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(45, now + 0.38);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === 'select') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(480, now);
                osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.06);
            } else if (type === 'toggle_on') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
                gain.gain.setValueAtTime(0.14, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'pause') {
                [659.25, 440].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                    gain.gain.setValueAtTime(0.15, now + idx * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.1);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.06);
                    osc.stop(now + idx * 0.06 + 0.1);
                });
            } else if (type === 'resume') {
                [440, 659.25].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                    gain.gain.setValueAtTime(0.15, now + idx * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.1);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.06);
                    osc.stop(now + idx * 0.06 + 0.1);
                });
            } else if (type === 'powerup_shield') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                    gain.gain.setValueAtTime(0.18, now + idx * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.05);
                    osc.stop(now + idx * 0.05 + 0.12);
                });
            } else if (type === 'powerup_double') {
                [659.25, 830.61, 987.77].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                    gain.gain.setValueAtTime(0.14, now + idx * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.1);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.05);
                    osc.stop(now + idx * 0.05 + 0.1);
                });
            } else if (type === 'slowmo') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(140, now + 0.28);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            } else if (type === 'nuke') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.45);
            } else if (type === 'shield_break') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(420, now);
                osc.frequency.exponentialRampToValueAtTime(70, now + 0.2);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'thunder') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(95, now);
                osc.frequency.exponentialRampToValueAtTime(25, now + 0.55);
                gain.gain.setValueAtTime(0.32, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.6);
            } else if (type === 'weather_shift') {
                [330, 440, 554.37].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                    gain.gain.setValueAtTime(0.12, now + idx * 0.07);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.15);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.07);
                    osc.stop(now + idx * 0.07 + 0.15);
                });
            } else if (type === 'combo_up') {
                const streak = typeof param === 'number' ? param : 1;
                const baseFreq = Math.min(1250, 440 * Math.pow(1.045, Math.min(24, streak)));
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(baseFreq, now);
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.09);
            } else if (type === 'combo_tier_up') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                    gain.gain.setValueAtTime(0.18, now + idx * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.05);
                    osc.stop(now + idx * 0.05 + 0.12);
                });
            } else if (type === 'combo_break') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);
                gain.gain.setValueAtTime(0.14, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.24);
            } else if (type === 'debris_pop') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.07);
                gain.gain.setValueAtTime(0.14, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'keybind_set') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now);
                osc.frequency.setValueAtTime(880, now + 0.05);
                gain.gain.setValueAtTime(0.16, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'record_break') {
                [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                    gain.gain.setValueAtTime(0.18, now + idx * 0.07);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.07);
                    osc.stop(now + idx * 0.07 + 0.18);
                });
            }
        } catch (err) {
            console.warn("Audio playback error:", err);
        }
    }

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
            getAudioContext();
            playSfx('select');
            charCards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            selectedCharacter = card.getAttribute("data-char");
            updatePlayerDimensions();
            const container = document.querySelector(".game-container");
            if (container) {
                container.classList.remove("theme-developer", "theme-astronaut");
                if (selectedCharacter === 'developer') container.classList.add("theme-developer");
                if (selectedCharacter === 'astronaut') container.classList.add("theme-astronaut");
            }
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

    // ==========================================
    // KEYBOARD REMAPPING SYSTEM
    // ==========================================
    const KEYBIND_STORAGE_KEY = "just_run_dino_keybindings_v1";

    const DEFAULT_KEY_BINDINGS = {
        jump: { code: "Space", altCode: "ArrowUp", name: "JUMP / THRUST", desc: "Leap over hazards & obstacles", icon: "🦘" },
        fire: { code: "KeyF", altCode: "KeyX", name: "ATTACK / FIRE", desc: "Shoot hero weapon projectile", icon: "⚡" },
        gear: { code: "KeyE", altCode: null, name: "CYCLE SUIT", desc: "Switch Iron Man, Thor, Cap & Thanos suits", icon: "🛡️" },
        pause: { code: "KeyP", altCode: "Escape", name: "TACTICAL PAUSE", desc: "Freeze mission & view tactical stats", icon: "⏸️" },
        mute: { code: "KeyM", altCode: null, name: "MUTE AUDIO", desc: "Toggle sound effects synthesizer", icon: "🔊" }
    };

    let currentKeyBindings = JSON.parse(JSON.stringify(DEFAULT_KEY_BINDINGS));
    let listeningKeyAction = null;

    function formatKeyCode(code) {
        if (!code) return "NONE";
        if (code.startsWith("Key")) return code.replace("Key", "");
        if (code.startsWith("Digit")) return code.replace("Digit", "");
        if (code === "Space") return "SPACE";
        if (code === "ArrowUp") return "↑ UP";
        if (code === "ArrowDown") return "↓ DOWN";
        if (code === "ArrowLeft") return "← LEFT";
        if (code === "ArrowRight") return "→ RIGHT";
        if (code === "Escape") return "ESC";
        if (code === "Enter") return "ENTER";
        if (code === "ShiftLeft" || code === "ShiftRight") return "SHIFT";
        if (code === "ControlLeft" || code === "ControlRight") return "CTRL";
        if (code === "AltLeft" || code === "AltRight") return "ALT";
        if (code === "Tab") return "TAB";
        if (code === "Backspace") return "BACKSPACE";
        return code.toUpperCase();
    }

    function loadKeyBindings() {
        try {
            const saved = localStorage.getItem(KEYBIND_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.keys(DEFAULT_KEY_BINDINGS).forEach(act => {
                    if (parsed[act] && parsed[act].code) {
                        currentKeyBindings[act].code = parsed[act].code;
                    }
                });
            }
        } catch (e) {
            console.warn("Could not load key bindings:", e);
        }
    }

    function saveKeyBindings() {
        try {
            localStorage.setItem(KEYBIND_STORAGE_KEY, JSON.stringify(currentKeyBindings));
        } catch (e) {
            console.warn("Could not save key bindings:", e);
        }
    }

    function updateControlsHintUI() {
        if (controlsHintEl) {
            const jumpKey = formatKeyCode(currentKeyBindings.jump.code);
            const fireKey = formatKeyCode(currentKeyBindings.fire.code);
            const gearKey = formatKeyCode(currentKeyBindings.gear.code);
            const pauseKey = formatKeyCode(currentKeyBindings.pause.code);
            const muteKey = formatKeyCode(currentKeyBindings.mute.code);
            controlsHintEl.innerText = `JUMP: [${jumpKey}] • ATTACK: [${fireKey}] • SUIT: [${gearKey}] • PAUSE: [${pauseKey}] • MUTE: [${muteKey}]`;
        }
        if (resumeBtn) {
            const pauseKey = formatKeyCode(currentKeyBindings.pause.code);
            const span = resumeBtn.querySelector('span');
            if (span) span.innerText = `RESUME (${pauseKey})`;
        }
    }

    function renderKeybindsUI() {
        if (!keybindGrid) return;
        keybindGrid.innerHTML = '';

        Object.keys(currentKeyBindings).forEach(actionId => {
            const binding = currentKeyBindings[actionId];
            const item = document.createElement('div');
            item.className = 'keybind-item';

            const isListening = listeningKeyAction === actionId;
            const keyLabel = isListening ? 'PRESS KEY...' : `[ ${formatKeyCode(binding.code)} ]`;

            item.innerHTML = `
                <div class="keybind-info">
                    <span class="keybind-action-name">${binding.icon} ${binding.name}</span>
                    <span class="keybind-action-desc">${binding.desc}</span>
                </div>
                <button type="button" class="keybind-btn ${isListening ? 'listening' : ''}" data-action="${actionId}">
                    ${keyLabel}
                </button>
            `;

            const btn = item.querySelector('.keybind-btn');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                getAudioContext();
                if (listeningKeyAction === actionId) {
                    listeningKeyAction = null;
                    if (keybindStatusHint) keybindStatusHint.innerText = "Remapping cancelled.";
                } else {
                    listeningKeyAction = actionId;
                    if (keybindStatusHint) keybindStatusHint.innerText = `Press any keyboard key to bind to ${binding.name}...`;
                    playSfx('select');
                }
                renderKeybindsUI();
            });

            keybindGrid.appendChild(item);
        });

        updateControlsHintUI();
    }

    function openKeybindModal() {
        getAudioContext();
        playSfx('select');
        if (gameRunning && !isPaused) {
            togglePause();
        }
        listeningKeyAction = null;
        if (keybindStatusHint) keybindStatusHint.innerText = "Click on any action key button, then press your desired key.";
        renderKeybindsUI();
        if (keybindModal) keybindModal.classList.remove('hidden');
    }

    function closeKeybindModal() {
        getAudioContext();
        playSfx('select');
        listeningKeyAction = null;
        if (keybindModal) keybindModal.classList.add('hidden');
        saveKeyBindings();
        updateControlsHintUI();
    }

    function resetDefaultKeyBindings() {
        getAudioContext();
        currentKeyBindings = JSON.parse(JSON.stringify(DEFAULT_KEY_BINDINGS));
        saveKeyBindings();
        listeningKeyAction = null;
        if (keybindStatusHint) keybindStatusHint.innerText = "All keyboard controls restored to factory defaults.";
        playSfx('debris_pop');
        renderKeybindsUI();
    }

    loadKeyBindings();
    updateControlsHintUI();

    if (keybindToggleBtn) keybindToggleBtn.addEventListener('click', openKeybindModal);
    if (menuKeybindBtn) menuKeybindBtn.addEventListener('click', openKeybindModal);
    if (pauseKeybindBtn) pauseKeybindBtn.addEventListener('click', openKeybindModal);
    if (keybindResetBtn) keybindResetBtn.addEventListener('click', resetDefaultKeyBindings);
    if (keybindCloseBtn) keybindCloseBtn.addEventListener('click', closeKeybindModal);
    if (keybindModal) {
        keybindModal.addEventListener('click', (e) => {
            if (e.target === keybindModal) closeKeybindModal();
        });
    }

    // ==========================================
    // ANIMATED SCORE UPDATE ENGINE
    // ==========================================
    function addScore(points) {
        if (points <= 0) return;
        const prevScore = score;
        score += points;

        // Check difficulty speed milestone
        const diffCfg = difficultyConfig[currentDiff] || difficultyConfig.avenger;
        if (Math.floor(score / diffCfg.scoreInterval) > Math.floor(prevScore / diffCfg.scoreInterval)) {
            gameSpeed += diffCfg.speedInc;
            playSfx('score_milestone');
        }

        // Animate score bump
        if (currentScoreEl) {
            currentScoreEl.classList.remove('score-bump');
            void currentScoreEl.offsetWidth; // Trigger reflow
            currentScoreEl.classList.add('score-bump');
            setTimeout(() => {
                if (currentScoreEl) currentScoreEl.classList.remove('score-bump');
            }, 220);
        }

        // Spawn floating score pill
        if (scorePopupAnchor) {
            const pill = document.createElement('div');
            pill.className = 'score-gain-pill';
            pill.innerText = `+${points}`;
            scorePopupAnchor.appendChild(pill);
            setTimeout(() => {
                if (pill && pill.parentNode) pill.parentNode.removeChild(pill);
            }, 650);
        }
    }

    // ==========================================
    // DYNAMIC PARALLAX BACKGROUND ENGINE
    // ==========================================
    let bgDistance = 0;

    function generateWindowPattern(cols, rows) {
        const pattern = [];
        const colors = ['#38bdf8', '#facc15', '#f472b6', '#e2e8f0', '#67e8f9'];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() < 0.65) {
                    pattern.push({
                        col: c,
                        row: r,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        blinkOffset: Math.random() * 10
                    });
                }
            }
        }
        return pattern;
    }

    // Procedural distant skyline (2200px loop) with Avengers / Stark Tower
    const distantSkylineBuildings = [
        { x: 40, width: 70, height: 110, type: 'standard', antenna: true },
        { x: 130, width: 85, height: 145, type: 'standard', antenna: false },
        { x: 235, width: 125, height: 195, type: 'stark_tower', antenna: true }, // Iconic Avengers / Stark Tower
        { x: 385, width: 65, height: 100, type: 'standard', antenna: false },
        { x: 465, width: 90, height: 135, type: 'spire', antenna: true },
        { x: 575, width: 110, height: 160, type: 'standard', antenna: false },
        { x: 705, width: 75, height: 115, type: 'standard', antenna: true },
        { x: 800, width: 95, height: 140, type: 'helipad', antenna: false },
        { x: 915, width: 80, height: 125, type: 'standard', antenna: true },
        { x: 1015, width: 115, height: 175, type: 'spire', antenna: true },
        { x: 1150, width: 70, height: 95, type: 'standard', antenna: false },
        { x: 1240, width: 100, height: 150, type: 'standard', antenna: true },
        { x: 1365, width: 130, height: 185, type: 'stark_tower', antenna: true },
        { x: 1515, width: 80, height: 120, type: 'standard', antenna: false },
        { x: 1615, width: 95, height: 145, type: 'helipad', antenna: true },
        { x: 1730, width: 70, height: 105, type: 'standard', antenna: false },
        { x: 1820, width: 105, height: 165, type: 'spire', antenna: true },
        { x: 1945, width: 85, height: 130, type: 'standard', antenna: false },
        { x: 2050, width: 110, height: 155, type: 'standard', antenna: true }
    ];
    const SKYLINE_LOOP_WIDTH = 2200;

    // Procedural midground cyber buildings with window matrices & holographic billboards (1750px loop)
    const midgroundBuildings = [
        { x: 20, width: 105, height: 85, billboard: 'STARK', color: '#38bdf8', windows: generateWindowPattern(4, 5) },
        { x: 145, width: 80, height: 65, billboard: null, color: null, windows: generateWindowPattern(3, 4) },
        { x: 245, width: 125, height: 100, billboard: 'AVENGERS', color: '#facc15', windows: generateWindowPattern(5, 6) },
        { x: 390, width: 95, height: 75, billboard: null, color: null, windows: generateWindowPattern(4, 4) },
        { x: 505, width: 115, height: 90, billboard: 'S.H.I.E.L.D.', color: '#60a5fa', windows: generateWindowPattern(4, 5) },
        { x: 640, width: 85, height: 70, billboard: null, color: null, windows: generateWindowPattern(3, 4) },
        { x: 745, width: 130, height: 105, billboard: 'QUANTUM', color: '#c084fc', windows: generateWindowPattern(5, 6) },
        { x: 895, width: 90, height: 80, billboard: null, color: null, windows: generateWindowPattern(3, 5) },
        { x: 1005, width: 110, height: 92, billboard: 'STARK', color: '#38bdf8', windows: generateWindowPattern(4, 5) },
        { x: 1135, width: 85, height: 68, billboard: null, color: null, windows: generateWindowPattern(3, 4) },
        { x: 1240, width: 120, height: 98, billboard: 'AVENGERS', color: '#facc15', windows: generateWindowPattern(5, 6) },
        { x: 1380, width: 90, height: 72, billboard: null, color: null, windows: generateWindowPattern(3, 4) },
        { x: 1490, width: 125, height: 102, billboard: 'QUANTUM', color: '#c084fc', windows: generateWindowPattern(5, 6) },
        { x: 1635, width: 85, height: 75, billboard: null, color: null, windows: generateWindowPattern(3, 4) }
    ];
    const MIDGROUND_LOOP_WIDTH = 1750;

    // Parallax upper clouds
    const bgClouds = [
        { x: 80, y: 35, width: 95, height: 22, speed: 0.12, opacity: 0.18 },
        { x: 260, y: 55, width: 125, height: 26, speed: 0.18, opacity: 0.22 },
        { x: 480, y: 25, width: 85, height: 20, speed: 0.10, opacity: 0.16 },
        { x: 690, y: 65, width: 140, height: 30, speed: 0.22, opacity: 0.25 },
        { x: 920, y: 40, width: 105, height: 24, speed: 0.15, opacity: 0.20 }
    ];

    function resetDynamicBackground() {
        bgDistance = 0;
    }

    function drawDynamicBackground(effectiveSpeed, groundY, playerHeight) {
        bgDistance += effectiveSpeed;
        const groundLineY = groundY + playerHeight;

        // 1. Dynamic Atmospheric Sky Gradient (Transitions with distance / time)
        const cycle = (bgDistance * 0.00035) % (Math.PI * 2);
        const blendA = (Math.sin(cycle) + 1) / 2;
        const blendB = (Math.cos(cycle) + 1) / 2;

        let skyGrad = ctx.createLinearGradient(0, 0, 0, groundLineY);
        if (selectedCharacter === 'astronaut') {
            skyGrad.addColorStop(0, '#040410');
            skyGrad.addColorStop(0.5, '#0b0b2b');
            skyGrad.addColorStop(1, '#160d33');
        } else if (selectedCharacter === 'developer') {
            skyGrad.addColorStop(0, '#010502');
            skyGrad.addColorStop(0.6, '#031407');
            skyGrad.addColorStop(1, '#06260d');
        } else {
            const r1 = Math.round(7 + blendA * 12);
            const g1 = Math.round(11 + blendB * 6);
            const b1 = Math.round(24 + blendA * 18);
            const r2 = Math.round(24 + blendB * 45);
            const g2 = Math.round(16 + blendB * 14);
            const b2 = Math.round(48 + blendA * 22);
            const r3 = Math.round(42 + blendB * 55);
            const g3 = Math.round(22 + blendA * 18);
            const b3 = Math.round(74 + blendB * 10);
            skyGrad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
            skyGrad.addColorStop(0.55, `rgb(${r2}, ${g2}, ${b2})`);
            skyGrad.addColorStop(1, `rgb(${r3}, ${g3}, ${b3})`);
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Celestial Body (Moon, Ringed Gas Giant, or Cyber Sun)
        drawCelestialBody(groundLineY);

        // 3. Parallax Twinkling Stars
        drawParallaxStars(effectiveSpeed);

        // 4. Parallax High Clouds
        drawParallaxClouds(effectiveSpeed);

        // 5. Distant Skyline Layer (with Stark / Avengers Tower)
        drawDistantSkyline(groundLineY);

        // 6. Midground Cyber City Layer (Windows + Holographic Billboards)
        drawMidgroundCity(groundLineY);

        // 7. Ground Tech Runway Lines
        drawGroundTechRunway(groundLineY);
    }

    function drawCelestialBody(groundLineY) {
        ctx.save();
        const moonX = canvas.width * 0.78 - ((bgDistance * 0.02) % (canvas.width + 160));
        const moonY = 65;

        if (selectedCharacter === 'astronaut') {
            // Ringed Cosmic Gas Giant
            const rad = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 36);
            rad.addColorStop(0, '#7dd3fc');
            rad.addColorStop(0.6, '#1e3a8a');
            rad.addColorStop(1, '#0f172a');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
            ctx.fill();

            // Inclined Planetary Rings
            ctx.save();
            ctx.translate(moonX, moonY);
            ctx.rotate(-22 * Math.PI / 180);
            ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(0, 0, 58, 14, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, 68, 18, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else if (selectedCharacter === 'developer') {
            // Digital Cyber Sun with HUD Crosshairs
            ctx.strokeStyle = 'rgba(0, 255, 102, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(moonX, moonY, 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(0, 255, 102, 0.3)';
            ctx.beginPath();
            ctx.arc(moonX, moonY, 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#00ff66';
            ctx.fillRect(moonX - 2, moonY - 2, 4, 4);
        } else {
            // Glowing Cyber Moon with soft corona
            const glow = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, 55);
            glow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
            glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.12)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(moonX, moonY, 55, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f8fafc';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(moonX, moonY, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Subtle lunar craters
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(moonX - 8, moonY - 4, 5, 0, Math.PI * 2);
            ctx.arc(moonX + 6, moonY + 7, 4, 0, Math.PI * 2);
            ctx.arc(moonX + 5, moonY - 9, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawParallaxStars(effectiveSpeed) {
        ctx.save();
        const now = Date.now();
        stars.forEach(star => {
            star.x -= star.speed * (effectiveSpeed * 0.12) + 0.1;
            if (star.x < 0) star.x = canvas.width + 10;

            const twinkle = 0.4 + 0.6 * Math.sin(now / 240 + star.size * 4);
            ctx.globalAlpha = twinkle;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        ctx.restore();
    }

    function drawParallaxClouds(effectiveSpeed) {
        ctx.save();
        bgClouds.forEach(c => {
            c.x -= c.speed * (effectiveSpeed * 0.22) + 0.14;
            if (c.x + c.width < 0) c.x = canvas.width + 20;

            ctx.globalAlpha = c.opacity;
            ctx.fillStyle = selectedCharacter === 'developer' ? '#064e3b' : '#334155';
            ctx.beginPath();
            ctx.roundRect(c.x, c.y, c.width, c.height, 12);
            ctx.fill();
        });
        ctx.restore();
    }

    function drawDistantSkyline(groundLineY) {
        ctx.save();
        const scrollX = (bgDistance * 0.10) % SKYLINE_LOOP_WIDTH;
        const now = Date.now();
        const beaconOn = Math.sin(now / 220) > 0;

        // Loop twice to ensure seamless wrap across wide screens
        for (let loop = 0; loop < 2; loop++) {
            const loopOffset = loop * SKYLINE_LOOP_WIDTH - scrollX;
            for (const b of distantSkylineBuildings) {
                const screenX = loopOffset + b.x;
                if (screenX + b.width < 0 || screenX > canvas.width) continue;

                const topY = groundLineY - b.height;

                // Base Silhouette
                ctx.fillStyle = '#0b1120';
                ctx.fillRect(screenX, topY, b.width, b.height);

                // Top edge highlight
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(screenX, topY);
                ctx.lineTo(screenX + b.width, topY);
                ctx.stroke();

                // Avengers / Stark Tower Signature Features
                if (b.type === 'stark_tower') {
                    // Cantilevered landing platform
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(screenX - 22, topY + 35, 26, 6);
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(screenX - 20, topY + 36, 4, 3); // Landing beacon

                    // Illuminated Cyan Avengers "A" Emblem
                    ctx.save();
                    const logoX = screenX + b.width / 2 + 5;
                    const logoY = topY + 45;
                    ctx.shadowColor = '#00e5ff';
                    ctx.shadowBlur = 12;
                    ctx.strokeStyle = '#00e5ff';
                    ctx.lineWidth = 2.5;

                    // Circular ring
                    ctx.beginPath();
                    ctx.arc(logoX, logoY, 13, 0, Math.PI * 2);
                    ctx.stroke();

                    // Bold "A" with extended right leg
                    ctx.beginPath();
                    ctx.moveTo(logoX, logoY - 9);
                    ctx.lineTo(logoX - 6, logoY + 8);
                    ctx.moveTo(logoX, logoY - 9);
                    ctx.lineTo(logoX + 9, logoY + 11);
                    ctx.moveTo(logoX - 4, logoY + 2);
                    ctx.lineTo(logoX + 5, logoY + 2);
                    ctx.stroke();
                    ctx.restore();

                    // Spire & Blinking Aviation Beacon
                    ctx.strokeStyle = '#334155';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(screenX + b.width / 2, topY);
                    ctx.lineTo(screenX + b.width / 2, topY - 18);
                    ctx.stroke();

                    if (beaconOn) {
                        ctx.fillStyle = '#ef4444';
                        ctx.shadowColor = '#ef4444';
                        ctx.shadowBlur = 8;
                        ctx.beginPath();
                        ctx.arc(screenX + b.width / 2, topY - 19, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                } else if (b.antenna) {
                    // Standard Antenna Spire
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(screenX + b.width / 2, topY);
                    ctx.lineTo(screenX + b.width / 2, topY - 12);
                    ctx.stroke();

                    if (beaconOn) {
                        ctx.fillStyle = '#38bdf8';
                        ctx.fillRect(screenX + b.width / 2 - 1, topY - 13, 2, 2);
                    }
                }
            }
        }
        ctx.restore();
    }

    function drawMidgroundCity(groundLineY) {
        ctx.save();
        const scrollX = (bgDistance * 0.28) % MIDGROUND_LOOP_WIDTH;
        const now = Date.now();

        for (let loop = 0; loop < 2; loop++) {
            const loopOffset = loop * MIDGROUND_LOOP_WIDTH - scrollX;
            for (const b of midgroundBuildings) {
                const screenX = loopOffset + b.x;
                if (screenX + b.width < 0 || screenX > canvas.width) continue;

                const topY = groundLineY - b.height;

                // Cyber Building Block
                ctx.fillStyle = '#0a0f1d';
                ctx.fillRect(screenX, topY, b.width, b.height);

                // Top Accent Line
                ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
                ctx.fillRect(screenX, topY, b.width, 2);

                // Window Matrix
                b.windows.forEach(win => {
                    const wx = screenX + 10 + win.col * 18;
                    const wy = topY + 10 + win.row * 14;
                    if (wx + 6 < screenX + b.width && wy + 6 < groundLineY) {
                        const alpha = 0.65 + 0.35 * Math.sin(now / 800 + win.blinkOffset);
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = win.color;
                        ctx.fillRect(wx, wy, 4, 5);
                    }
                });
                ctx.globalAlpha = 1.0;

                // Holographic Rooftop Billboard
                if (b.billboard) {
                    const bbW = 74;
                    const bbH = 16;
                    const bbX = screenX + b.width / 2 - bbW / 2;
                    const bbY = topY - 22;

                    // Billboard mounting struts
                    ctx.strokeStyle = '#334155';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(bbX + 12, topY);
                    ctx.lineTo(bbX + 12, bbY + bbH);
                    ctx.moveTo(bbX + bbW - 12, topY);
                    ctx.lineTo(bbX + bbW - 12, bbY + bbH);
                    ctx.stroke();

                    // Upward holographic searchlight beams
                    ctx.fillStyle = b.color;
                    ctx.globalAlpha = 0.08;
                    ctx.beginPath();
                    ctx.moveTo(bbX + 5, bbY);
                    ctx.lineTo(bbX - 10, bbY - 45);
                    ctx.lineTo(bbX + 25, bbY - 45);
                    ctx.closePath();
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(bbX + bbW - 5, bbY);
                    ctx.lineTo(bbX + bbW - 25, bbY - 45);
                    ctx.lineTo(bbX + bbW + 10, bbY - 45);
                    ctx.closePath();
                    ctx.fill();
                    ctx.globalAlpha = 1.0;

                    // Hologram frame & text
                    ctx.fillStyle = 'rgba(10, 15, 29, 0.9)';
                    ctx.fillRect(bbX, bbY, bbW, bbH);
                    ctx.strokeStyle = b.color;
                    ctx.shadowColor = b.color;
                    ctx.shadowBlur = 8;
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(bbX, bbY, bbW, bbH);

                    ctx.font = 'bold 8px "Press Start 2P", monospace';
                    ctx.fillStyle = b.color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(b.billboard, bbX + bbW / 2, bbY + bbH / 2 + 1);
                    ctx.shadowBlur = 0;
                }
            }
        }
        ctx.restore();
    }

    function drawGroundTechRunway(groundLineY) {
        ctx.save();
        // Fill lower ground block with dark cyber runway
        ctx.fillStyle = '#080c16';
        ctx.fillRect(0, groundLineY, canvas.width, canvas.height - groundLineY);

        // Tech runway dashed center line
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([18, 22]);
        ctx.lineDashOffset = -(bgDistance * 1.0);
        ctx.beginPath();
        ctx.moveTo(0, groundLineY + 12);
        ctx.lineTo(canvas.width, groundLineY + 12);
        ctx.stroke();
        ctx.setLineDash([]);

        // Lower runway speed markers
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 32]);
        ctx.lineDashOffset = -(bgDistance * 1.0);
        ctx.beginPath();
        ctx.moveTo(0, groundLineY + 24);
        ctx.lineTo(canvas.width, groundLineY + 24);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    let obstacles = [];
    let projectiles = [];
    let gameSpeed = 5;
    let spawnTimer = 0;
    let stars = Array.from({ length: 45 }, () => ({
        x: Math.random() * 1000,
        y: Math.random() * 300,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 1.5 + 0.5
    }));

    // --- Power-Up System State ---
    let powerUps = [];
    let activeBuffs = {
        shield: false,
        shieldTimer: 0,
        slowmoTimer: 0,
        doubleTimer: 0,
        invincibleTimer: 0
    };
    let floatingTexts = [];
    let screenFlash = 0;

    function spawnFloatingText(x, y, text, color) {
        floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            opacity: 1.0,
            vy: -1.2
        });
    }

    function updatePowerUpHud() {
        if (!powerupHud) return;
        let pills = [];
        if (activeBuffs.shield) {
            const secs = Math.ceil(activeBuffs.shieldTimer / 60);
            pills.push(`<div class="powerup-pill shield"><span>🛡️</span><span>SHIELD (${secs}s)</span></div>`);
        }
        if (activeBuffs.slowmoTimer > 0) {
            const secs = Math.ceil(activeBuffs.slowmoTimer / 60);
            pills.push(`<div class="powerup-pill slowmo"><span>⏳</span><span>SLOW-MO (${secs}s)</span></div>`);
        }
        if (activeBuffs.doubleTimer > 0) {
            const secs = Math.ceil(activeBuffs.doubleTimer / 60);
            pills.push(`<div class="powerup-pill double"><span>⭐</span><span>2X PTS (${secs}s)</span></div>`);
        }
        powerupHud.innerHTML = pills.join('');
    }

    // --- Weather Engine Functions ---
    function initWeatherParticles(weatherId) {
        weatherParticles = [];
        rainSplashes = [];
        const w = canvas.width || 800;
        const h = canvas.height || 300;

        if (weatherId === 'rain') {
            for (let i = 0; i < 70; i++) {
                weatherParticles.push({
                    x: Math.random() * (w + 100),
                    y: Math.random() * h,
                    length: Math.random() * 12 + 10,
                    speed: Math.random() * 5 + 11,
                    opacity: Math.random() * 0.45 + 0.4
                });
            }
            nextLightningCountdown = Math.floor(Math.random() * 180 + 120);
        } else if (weatherId === 'snow') {
            for (let i = 0; i < 55; i++) {
                weatherParticles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    radius: Math.random() * 2.5 + 1.2,
                    speedY: Math.random() * 1.5 + 0.8,
                    swingSpeed: Math.random() * 0.04 + 0.02,
                    swingOffset: Math.random() * Math.PI * 2,
                    opacity: Math.random() * 0.5 + 0.5
                });
            }
        } else if (weatherId === 'sandstorm') {
            for (let i = 0; i < 60; i++) {
                weatherParticles.push({
                    x: Math.random() * w,
                    y: Math.random() * (h - 40),
                    size: Math.random() * 3 + 2,
                    speedX: Math.random() * 4 + 7,
                    color: Math.random() < 0.5 ? '#f97316' : '#fbbf24',
                    opacity: Math.random() * 0.5 + 0.4
                });
            }
        } else if (weatherId === 'meteors') {
            for (let i = 0; i < 5; i++) {
                weatherParticles.push({
                    x: Math.random() * (w + 250) + 50,
                    y: Math.random() * (h * 0.4) - 60,
                    length: Math.random() * 60 + 35,
                    speed: Math.random() * 7 + 13,
                    glow: Math.random() < 0.5 ? '#c084fc' : '#38bdf8'
                });
            }
        }
    }

    function updateWeatherUI() {
        const w = weatherTypes[currentWeatherIndex];
        if (weatherBadge) {
            weatherBadge.innerText = `${w.icon} ${w.name}`;
            weatherBadge.className = `weather-tag ${w.badgeClass}`;
        }
        if (pauseWeatherEl) {
            pauseWeatherEl.innerText = `${w.icon} ${w.name}`;
        }
    }

    function changeWeather(idx) {
        currentWeatherIndex = idx;
        const w = weatherTypes[currentWeatherIndex];
        initWeatherParticles(w.id);
        updateWeatherUI();
        spawnFloatingText(canvas.width / 2, 45, `${w.icon} WEATHER: ${w.name}`, w.bannerColor);
        playSfx('weather_shift');
        if (w.id === 'rain') {
            nextLightningCountdown = 40; // early dramatic lightning burst
        }
    }

    function updateAndDrawWeather(effectiveSpeed, groundY) {
        const weather = weatherTypes[currentWeatherIndex];

        // 1. Atmospheric Sky Overlay Tint
        if (weather.skyOverlay) {
            ctx.save();
            ctx.fillStyle = weather.skyOverlay;
            ctx.fillRect(-20, -20, canvas.width + 40, canvas.height + 40);
            ctx.restore();
        }

        // 2. Weather Particles
        if (weather.id === 'rain') {
            ctx.save();
            ctx.strokeStyle = '#93c5fd';
            ctx.lineWidth = 1.5;
            weatherParticles.forEach(p => {
                p.x -= effectiveSpeed * 0.5 + 3;
                p.y += p.speed;

                if (p.y >= groundY + player.height) {
                    if (Math.random() < 0.35) {
                        rainSplashes.push({
                            x: p.x,
                            y: groundY + player.height,
                            radius: 1,
                            maxRadius: Math.random() * 4 + 3,
                            alpha: 0.8
                        });
                    }
                    p.y = -10;
                    p.x = Math.random() * (canvas.width + 120);
                }
                if (p.x < -20) p.x = canvas.width + 20;

                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - 3, p.y + p.length);
                ctx.stroke();
            });

            // Draw rain ripples on ground
            for (let s = rainSplashes.length - 1; s >= 0; s--) {
                const splash = rainSplashes[s];
                splash.radius += 0.45;
                splash.alpha -= 0.06;
                if (splash.alpha <= 0 || splash.radius >= splash.maxRadius) {
                    rainSplashes.splice(s, 1);
                    continue;
                }
                ctx.globalAlpha = splash.alpha;
                ctx.strokeStyle = '#60a5fa';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(splash.x, splash.y, splash.radius * 2, splash.radius * 0.6, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();

            // Thunderstorm Lightning Flash & Rumble
            nextLightningCountdown--;
            if (nextLightningCountdown <= 0) {
                lightningFlash = 0.85;
                triggerScreenShake(8, 14);
                playSfx('thunder');
                nextLightningCountdown = Math.floor(Math.random() * 240 + 160);
            }

        } else if (weather.id === 'snow') {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            weatherParticles.forEach(p => {
                p.swingOffset += p.swingSpeed;
                p.x -= effectiveSpeed * 0.3 + 1 + Math.sin(p.swingOffset) * 0.6;
                p.y += p.speedY;

                if (p.y > groundY + player.height) {
                    p.y = -5;
                    p.x = Math.random() * canvas.width;
                }
                if (p.x < 0) p.x = canvas.width;

                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();

        } else if (weather.id === 'sandstorm') {
            ctx.save();
            weatherParticles.forEach(p => {
                p.x -= effectiveSpeed * 1.3 + p.speedX;
                p.y += (Math.random() - 0.5) * 1.8;

                if (p.x < -20) {
                    p.x = canvas.width + 20;
                    p.y = Math.random() * (groundY + player.height - 10);
                }

                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 4;
                ctx.fillRect(p.x, p.y, p.size * 2, p.size * 0.8);
            });
            ctx.restore();

        } else if (weather.id === 'meteors') {
            ctx.save();
            weatherParticles.forEach(m => {
                m.x -= m.speed;
                m.y += m.speed * 0.52;

                if (m.x < -150 || m.y > groundY + 20) {
                    m.x = canvas.width + Math.random() * 250 + 50;
                    m.y = Math.random() * (canvas.height * 0.45) - 60;
                    m.speed = Math.random() * 7 + 13;
                }

                const tailGrad = ctx.createLinearGradient(m.x, m.y, m.x + m.length, m.y - m.length * 0.52);
                tailGrad.addColorStop(0, '#ffffff');
                tailGrad.addColorStop(0.3, m.glow);
                tailGrad.addColorStop(1, 'transparent');

                ctx.strokeStyle = tailGrad;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                ctx.lineTo(m.x + m.length, m.y - m.length * 0.52);
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = m.glow;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(m.x, m.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        // 3. Lightning Flash Overlay
        if (lightningFlash > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.7, lightningFlash)})`;
            ctx.fillRect(-20, -20, canvas.width + 40, canvas.height + 40);
            ctx.restore();
            lightningFlash -= 0.08;
        }
    }

    function togglePause() {
        if (!gameRunning) return;
        getAudioContext();
        isPaused = !isPaused;

        if (isPaused) {
            cancelAnimationFrame(animationId);
            pauseOverlay.classList.remove("hidden");
            pauseBtn.classList.add("paused");
            if (pauseIcon) pauseIcon.innerText = "▶";
            if (pauseLabel) pauseLabel.innerText = "RESUME";

            if (pauseCurrentScoreEl) pauseCurrentScoreEl.innerText = String(score).padStart(5, '0');
            if (pauseDifficultyEl) pauseDifficultyEl.innerText = difficultyConfig[currentDiff].name;
            if (pauseWeatherEl) {
                const w = weatherTypes[currentWeatherIndex];
                pauseWeatherEl.innerText = `${w.icon} ${w.name}`;
            }
            if (pauseBuffCountEl) {
                const count = (activeBuffs.shield ? 1 : 0) + (activeBuffs.slowmoTimer > 0 ? 1 : 0) + (activeBuffs.doubleTimer > 0 ? 1 : 0);
                pauseBuffCountEl.innerText = count > 0 ? `${count} ACTIVE` : 'NONE';
            }
            if (pauseMaxComboEl) {
                const maxTier = getComboTier(maxCombo);
                pauseMaxComboEl.innerText = `${maxCombo}x ${maxCombo >= 3 ? '(' + maxTier.name + ')' : ''}`;
            }
            playSfx('pause');
        } else {
            pauseOverlay.classList.add("hidden");
            pauseBtn.classList.remove("paused");
            if (pauseIcon) pauseIcon.innerText = "⏸";
            if (pauseLabel) pauseLabel.innerText = "PAUSE";
            playSfx('resume');
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    function returnToMenu() {
        isPaused = false;
        gameRunning = false;
        cancelAnimationFrame(animationId);
        pauseOverlay.classList.add("hidden");
        pauseBtn.classList.add("hidden");
        powerupHud.classList.add("hidden");
        canvas.classList.add("hidden");
        scoreboard.classList.add("hidden");
        if (comboBadge) comboBadge.classList.add("hidden");
        menuOverlay.classList.remove("hidden");
        playSfx('select');
    }

    if (pauseBtn) {
        pauseBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            togglePause();
        });
    }

    if (resumeBtn) {
        resumeBtn.addEventListener("click", () => {
            if (isPaused) togglePause();
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener("click", () => {
            if (isPaused) {
                isPaused = false;
                pauseOverlay.classList.add("hidden");
                pauseBtn.classList.remove("paused");
                if (pauseIcon) pauseIcon.innerText = "⏸";
                if (pauseLabel) pauseLabel.innerText = "PAUSE";
            }
            resetGame();
            gameRunning = true;
            animationId = requestAnimationFrame(gameLoop);
            playSfx('select');
        });
    }

    if (menuBtn) {
        menuBtn.addEventListener("click", () => {
            returnToMenu();
        });
    }

    startBtn.addEventListener("click", () => {
        getAudioContext();
        playSfx('select');
        menuOverlay.classList.add("hidden");
        pauseOverlay.classList.add("hidden");
        canvas.classList.remove("hidden");
        scoreboard.classList.remove("hidden");
        pauseBtn.classList.remove("hidden");
        powerupHud.classList.remove("hidden");
        
        resizeCanvas();
        resetGame();
        gameRunning = true;
        isPaused = false;
        animationId = requestAnimationFrame(gameLoop);
    });

    // Controls: Space/Up jumps. Key 'E' cycles Marvel gear! Key 'F' / Click attacks. Key 'M' toggles sound. Key 'P' or 'Escape' pauses.
    function triggerAction(isSecondary = false) {
        if (!gameRunning || isPaused) return;
        getAudioContext();

        if (selectedCharacter === 'dino' && isSecondary) {
            if (dinoGearMode === 'ironman') {
                projectiles.push({ x: player.x + player.width, y: player.y + 15, width: 18, height: 5, speed: 14, type: 'repulsor' });
                playSfx('shoot', 'repulsor');
                triggerScreenShake(3, 6);
            } else if (dinoGearMode === 'thor') {
                projectiles.push({ x: player.x + player.width, y: player.y + 10, width: 22, height: 8, speed: 12, type: 'lightning' });
                playSfx('shoot', 'thor');
                triggerScreenShake(5, 10);
            } else if (dinoGearMode === 'cap') {
                projectiles.push({ x: player.x + player.width, y: player.y + 12, width: 16, height: 16, speed: 11, type: 'shield_throw' });
                playSfx('shoot', 'cap');
                triggerScreenShake(3, 7);
            } else if (dinoGearMode === 'thanos') {
                projectiles.push({ x: player.x + player.width, y: player.y + 5, width: 25, height: 12, speed: 13, type: 'thanos_beam' });
                playSfx('shoot', 'thanos_beam');
                triggerScreenShake(6, 12);
            } else {
                playSfx('jump');
            }
        } else if (selectedCharacter === 'astronaut' && isSecondary) {
            projectiles.push({ x: player.x + player.width, y: player.y + player.height / 2 - 2, width: 15, height: 4, speed: 12, type: 'laser' });
            playSfx('shoot', 'laser');
            triggerScreenShake(2, 5);
        } else if (selectedCharacter === 'developer' && isSecondary) {
            projectiles.push({ x: player.x + player.width, y: player.y + player.height / 2 - 2, width: 14, height: 6, speed: 10, type: 'patch' });
            playSfx('shoot', 'patch');
            triggerScreenShake(2, 5);
        } else {
            if (!player.isJumping) {
                player.vy = player.jumpPower;
                player.isJumping = true;
                playSfx('jump');
                spawnJumpParticles(player.x + 12, player.y + player.height);
            }
        }
    }

    window.addEventListener("keydown", (e) => {
        getAudioContext();

        // If Keybind Remap Modal is actively listening for key input
        if (listeningKeyAction) {
            e.preventDefault();
            if (e.code === "Escape") {
                listeningKeyAction = null;
                if (keybindStatusHint) keybindStatusHint.innerText = "Key remapping cancelled.";
                renderKeybindsUI();
                return;
            }
            currentKeyBindings[listeningKeyAction].code = e.code;
            const assignedName = currentKeyBindings[listeningKeyAction].name;
            const keyName = formatKeyCode(e.code);
            listeningKeyAction = null;
            saveKeyBindings();
            if (keybindStatusHint) keybindStatusHint.innerText = `Bound [${keyName}] to ${assignedName}!`;
            playSfx('keybind_set');
            renderKeybindsUI();
            return;
        }

        // Tactical Pause / Resume Check
        const pauseBinding = currentKeyBindings.pause;
        if (e.code === pauseBinding.code || (pauseBinding.altCode && e.code === pauseBinding.altCode)) {
            e.preventDefault();
            togglePause();
            return;
        }

        if (isPaused) return;

        // Jump / Thrust Action Check
        const jumpBinding = currentKeyBindings.jump;
        if (e.code === jumpBinding.code || (jumpBinding.altCode && e.code === jumpBinding.altCode)) {
            e.preventDefault();
            triggerAction(false);
            return;
        }

        // Fire / Weapon Attack Check
        const fireBinding = currentKeyBindings.fire;
        if (e.code === fireBinding.code || (fireBinding.altCode && e.code === fireBinding.altCode)) {
            e.preventDefault();
            triggerAction(true);
            return;
        }

        // Audio SFX Toggle Check
        const muteBinding = currentKeyBindings.mute;
        if (e.code === muteBinding.code || (muteBinding.altCode && e.code === muteBinding.altCode)) {
            e.preventDefault();
            toggleSfx();
            return;
        }

        // Marvel Suit Cycle Check
        const gearBinding = currentKeyBindings.gear;
        if (e.code === gearBinding.code && selectedCharacter === 'dino') {
            e.preventDefault();
            // Cycle Marvel Power Gear: Standard -> Iron Man -> Thor -> Captain America -> Thanos
            if (dinoGearMode === 'standard') dinoGearMode = 'ironman';
            else if (dinoGearMode === 'ironman') dinoGearMode = 'thor';
            else if (dinoGearMode === 'thor') dinoGearMode = 'cap';
            else if (dinoGearMode === 'cap') dinoGearMode = 'thanos';
            else dinoGearMode = 'standard';
            playSfx('gear');
            return;
        }
    });

    canvas.addEventListener("click", () => {
        if (!gameRunning || isPaused) return;
        triggerAction(true);
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
        powerUps = [];
        floatingTexts = [];
        gameParticles = [];
        screenFlash = 0;
        screenShakeTime = 0;
        screenShakeIntensity = 0;
        lightningFlash = 0;
        weatherTimer = 0;
        currentWeatherIndex = 0;
        comboCount = 0;
        comboTimer = 0;
        comboMultiplier = 1.0;
        comboScalePulse = 1.0;
        resetScreenTint();
        updateComboUI();
        initWeatherParticles(weatherTypes[0].id);
        updateWeatherUI();
        activeBuffs = {
            shield: false,
            shieldTimer: 0,
            slowmoTimer: 0,
            doubleTimer: 0,
            invincibleTimer: 0
        };
        score = 0;
        visualScore = 0;
        isNewRecordTriggered = false;
        if (currentScoreEl) currentScoreEl.innerText = "00000";
        if (highScoreEl) highScoreEl.classList.remove("new-record");
        resetDynamicBackground();
        const cfg = difficultyConfig[currentDiff] || difficultyConfig.avenger;
        gameSpeed = cfg.baseSpeed;
        spawnTimer = 0;
        updateDifficultyUI();
        updatePowerUpHud();
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

    // --- Power-Up Visuals & Floating Texts ---
    function drawPowerUp(pu) {
        ctx.save();
        const bobY = pu.y + Math.sin(pu.bobOffset) * 6;
        ctx.translate(pu.x, bobY);

        // Glowing shield / power aura
        ctx.shadowColor = pu.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(12, 16, 28, 0.9)';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = pu.color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Emoji / Symbol
        ctx.font = '14px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.icon, 0, 1);

        ctx.restore();
    }

    function drawFloatingTexts() {
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.y += ft.vy;
            ft.opacity -= 0.02;
            if (ft.opacity <= 0) {
                floatingTexts.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = ft.opacity;
            ctx.font = 'bold 11px "Press Start 2P", monospace';
            ctx.fillStyle = ft.color;
            ctx.shadowColor = ft.color;
            ctx.shadowBlur = 8;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    function gameLoop() {
        if (!gameRunning || isPaused) return;

        const diffCfg = difficultyConfig[currentDiff] || difficultyConfig.avenger;
        const theme = characterConfig[selectedCharacter];
        const groundY = getGroundY();

        // Update buff timers
        if (activeBuffs.shieldTimer > 0) {
            activeBuffs.shieldTimer--;
            if (activeBuffs.shieldTimer <= 0) {
                activeBuffs.shield = false;
            }
        }
        if (activeBuffs.slowmoTimer > 0) activeBuffs.slowmoTimer--;
        if (activeBuffs.doubleTimer > 0) activeBuffs.doubleTimer--;
        if (activeBuffs.invincibleTimer > 0) activeBuffs.invincibleTimer--;
        updatePowerUpHud();

        // Time Warp slows down obstacle velocity by 50%
        const effectiveSpeed = activeBuffs.slowmoTimer > 0 ? gameSpeed * 0.5 : gameSpeed;

        // Dynamic Weather Timer Ticking
        weatherTimer++;
        if (weatherTimer > weatherChangeInterval) {
            weatherTimer = 0;
            currentWeatherIndex = (currentWeatherIndex + 1) % weatherTypes.length;
            changeWeather(currentWeatherIndex);
        }

        // Camera Screen Shake Offset Calculation
        let shakeX = 0;
        let shakeY = 0;
        if (screenShakeTime > 0) {
            shakeX = (Math.random() - 0.5) * screenShakeIntensity * 2;
            shakeY = (Math.random() - 0.5) * screenShakeIntensity * 2;
            screenShakeTime--;
            screenShakeIntensity *= 0.91;
            if (screenShakeTime <= 0) screenShakeIntensity = 0;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Draw Multi-layered Parallax Dynamic Background (Procedural Skyline, Stark Tower, Billboards, Nebula)
        drawDynamicBackground(effectiveSpeed, groundY, player.height);

        // Draw Dynamic Weather Particles & Atmospheric Sky Tint
        updateAndDrawWeather(effectiveSpeed, groundY);

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
            if (player.vy > 7) {
                triggerScreenShake(3, 6);
                spawnLandParticles(player.x + player.width / 2, groundY + player.height);
            }
            player.y = groundY;
            player.vy = 0;
            player.isJumping = false;
        }

        // Emit footstep running dust / exhaust particles
        if (!player.isJumping && Math.random() < 0.4) {
            spawnRunParticles(player.x + 8, groundY + player.height - 2);
        }

        // Draw Player with invincibility / shield effects
        drawPlayer(player.x, player.y);

        // Player Shield / Invincible Forcefield Rendering
        if (activeBuffs.shield || activeBuffs.invincibleTimer > 0) {
            ctx.save();
            const shieldPulse = Math.sin(Date.now() / 90) * 3;
            const isInvincibleGrace = activeBuffs.invincibleTimer > 0;
            const shieldColor = isInvincibleGrace ? '#f59e0b' : '#00e5ff';
            
            ctx.strokeStyle = shieldColor;
            ctx.shadowColor = shieldColor;
            ctx.shadowBlur = 16;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(
                player.x + player.width / 2,
                player.y + player.height / 2,
                player.width / 2 + 10 + shieldPulse,
                player.height / 2 + 10 + shieldPulse,
                0, 0, Math.PI * 2
            );
            ctx.stroke();

            // Orbiting shield spark
            const angle = Date.now() / 220;
            const orbX = player.x + player.width / 2 + Math.cos(angle) * (player.width / 2 + 12);
            const orbY = player.y + player.height / 2 + Math.sin(angle) * (player.height / 2 + 12);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(orbX, orbY, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // --- Render Projectiles / Attack Effects ---
        for (let l = projectiles.length - 1; l >= 0; l--) {
            let p = projectiles[l];
            p.x += p.speed;
            spawnProjectileTrail(p);

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
                    const pts = Math.round(30 * diffCfg.scoreMultiplier * (activeBuffs.doubleTimer > 0 ? 2 : 1) * comboMultiplier);
                    addScore(pts);
                    addCombo(1, obs.x, obs.y, 'HIT');
                    spawnObstacleExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, p.type);
                    spawnFloatingText(obs.x, obs.y - 10, `+${pts}`, "#facc15");
                    playSfx('hit');
                    playSfx('debris_pop');
                    triggerScreenShake(5, 10);
                    break;
                }
            }

            if (p.x > canvas.width) projectiles.splice(l, 1);
        }

        // --- Spawn Power-Ups ---
        if (powerUps.length < 2 && Math.random() < diffCfg.powerUpSpawnRate) {
            const types = [
                { type: 'shield', icon: '🛡️', color: '#00e5ff', name: 'SHIELD' },
                { type: 'nuke', icon: '⚡', color: '#a855f7', name: 'MEGA BLAST' },
                { type: 'slowmo', icon: '⏳', color: '#10b981', name: 'TIME WARP' },
                { type: 'double', icon: '⭐', color: '#f59e0b', name: '2X SCORE' }
            ];
            const pick = types[Math.floor(Math.random() * types.length)];
            const puY = Math.random() < 0.45 ? groundY - 18 : groundY - 65;
            powerUps.push({
                x: canvas.width + 20,
                y: puY,
                radius: 16,
                bobOffset: Math.random() * Math.PI * 2,
                ...pick
            });
        }

        // --- Move & Draw Power-Ups & Collect ---
        for (let u = powerUps.length - 1; u >= 0; u--) {
            let pu = powerUps[u];
            pu.x -= effectiveSpeed;
            pu.bobOffset += 0.06;
            drawPowerUp(pu);

            const bobY = pu.y + Math.sin(pu.bobOffset) * 6;
            if (player.x < pu.x + pu.radius && player.x + player.width > pu.x - pu.radius &&
                player.y < bobY + pu.radius && player.y + player.height > bobY - pu.radius) {
                
                powerUps.splice(u, 1);
                spawnPowerUpPickupParticles(pu.x, bobY, pu.color);
                if (pu.type === 'shield') {
                    activeBuffs.shield = true;
                    activeBuffs.shieldTimer = 900; // 15 sec
                    spawnFloatingText(player.x + 10, player.y - 15, "🛡️ SHIELD READY!", "#00e5ff");
                    playSfx('powerup_shield');
                } else if (pu.type === 'nuke') {
                    screenFlash = 0.9;
                    const bonus = Math.round(100 * diffCfg.scoreMultiplier * comboMultiplier);
                    addScore(bonus);
                    for (const obs of obstacles) {
                        spawnObstacleExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, 'nuke');
                    }
                    if (obstacles.length > 0) {
                        addCombo(obstacles.length, player.x, player.y, 'NUKE');
                    }
                    obstacles = [];
                    spawnFloatingText(player.x + 10, player.y - 15, `⚡ MEGA BLAST! +${bonus}`, "#a855f7");
                    playSfx('nuke');
                    playSfx('debris_pop');
                    triggerScreenShake(14, 24, true);
                } else if (pu.type === 'slowmo') {
                    activeBuffs.slowmoTimer = 480; // 8 sec
                    spawnFloatingText(player.x + 10, player.y - 15, "⏳ TIME WARP! 50% SPEED", "#10b981");
                    playSfx('slowmo');
                } else if (pu.type === 'double') {
                    activeBuffs.doubleTimer = 600; // 10 sec
                    spawnFloatingText(player.x + 10, player.y - 15, "⭐ 2X SCORE OVERDRIVE!", "#f59e0b");
                    playSfx('powerup_double');
                }
                updatePowerUpHud();
                continue;
            }

            if (pu.x + pu.radius < 0) {
                powerUps.splice(u, 1);
            }
        }

        // --- Spawn Obstacles (Scaled by Difficulty) ---
        spawnTimer++;
        const targetSpawn = Math.random() * (diffCfg.spawnMax - diffCfg.spawnMin) + diffCfg.spawnMin;
        if (spawnTimer > targetSpawn) {
            obstacles.push({
                x: canvas.width,
                y: groundY + 2,
                width: 30,
                height: 35,
                comboScored: false
            });
            spawnTimer = 0;
        }

        // --- Move & Collide Obstacles ---
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= effectiveSpeed;

            drawObstacle(obs);

            // Collision detection
            if (player.x < obs.x + obs.width && player.x + player.width > obs.x && player.y < obs.y + obs.height && player.y + player.height > obs.y) {
                if (activeBuffs.invincibleTimer > 0) {
                    // Safe grace window, pass through
                } else if (activeBuffs.shield) {
                    // Shield protects the player!
                    activeBuffs.shield = false;
                    activeBuffs.shieldTimer = 0;
                    activeBuffs.invincibleTimer = 80; // ~1.3s grace
                    screenFlash = 0.5;
                    obstacles.splice(i, 1);
                    spawnObstacleExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, 'shield_break');
                    spawnFloatingText(player.x + 10, player.y - 15, "🛡️ SHIELD ABSORBED HIT!", "#00e5ff");
                    playSfx('shield_break');
                    triggerScreenShake(9, 16, true);
                    breakCombo();
                    updatePowerUpHud();
                    continue;
                } else {
                    breakCombo();
                    gameOver();
                    return;
                }
            }

            // Obstacle cleared player safely without collision -> Increment combo!
            if (!obs.comboScored && obs.x + obs.width < player.x) {
                obs.comboScored = true;
                addCombo(1, player.x + player.width / 2, player.y - 12, 'DODGE');
            }

            // Obstacle cleared canvas edge
            if (obs.x + obs.width < 0) {
                obstacles.splice(i, 1);
                const pts = Math.round(10 * diffCfg.scoreMultiplier * (activeBuffs.doubleTimer > 0 ? 2 : 1) * comboMultiplier);
                const oldScore = score;
                addScore(pts);
                if (Math.floor(score / diffCfg.scoreInterval) > Math.floor(oldScore / diffCfg.scoreInterval)) {
                    gameSpeed += diffCfg.speedInc;
                    playSfx('score_milestone');
                }
            }
        }

        // Combo Timer Decay & Animation
        if (comboCount > 0) {
            comboTimer--;
            if (comboTimer <= 0) {
                breakCombo();
            }
        }
        if (comboScalePulse > 1.0) {
            comboScalePulse = Math.max(1.0, comboScalePulse - 0.035);
        }

        // Draw Dynamic Particle System
        updateAndDrawParticles();

        // Draw Dynamic Screen Tint & Edge Vignette
        updateAndDrawScreenTint(effectiveSpeed);

        // Draw On-Canvas Combo Meter HUD
        drawOnCanvasComboMeter();

        // Draw Floating Point/Buff Texts
        drawFloatingTexts();

        // Draw Screen Flash Overlay (for Nuke & Shield breaks)
        if (screenFlash > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.5, screenFlash)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            screenFlash -= 0.04;
        }

        ctx.restore(); // Restore camera screen shake transform

        // Smooth Rolling Visual Score Interpolation
        if (visualScore < score) {
            const diff = score - visualScore;
            const step = Math.max(1, Math.ceil(diff * 0.16));
            visualScore += step;
            if (visualScore > score) visualScore = score;
            if (currentScoreEl) currentScoreEl.innerText = String(visualScore).padStart(5, '0');
        } else if (visualScore > score) {
            visualScore = score;
            if (currentScoreEl) currentScoreEl.innerText = String(visualScore).padStart(5, '0');
        }

        // Live High Score Record Celebration Alert
        if (score > highScore && highScore > 0) {
            if (!isNewRecordTriggered) {
                isNewRecordTriggered = true;
                if (highScoreEl) highScoreEl.classList.add('new-record');
                playSfx('record_break');
                spawnFloatingText(player.x + player.width / 2, player.y - 25, "👑 NEW RECORD!", "#facc15");
                spawnParticles({
                    x: player.x + player.width / 2,
                    y: player.y,
                    count: 24,
                    colors: ['#facc15', '#fde047', '#fbbf24', '#ffffff', '#38bdf8'],
                    minSpeed: 3, maxSpeed: 7,
                    minSize: 2, maxSize: 5,
                    gravity: 0.15,
                    friction: 0.94,
                    life: 35,
                    shape: 'spark'
                });
            }
            if (highScoreEl) highScoreEl.innerText = String(score).padStart(5, '0');
        }

        animationId = requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        gameRunning = false;
        isPaused = false;
        cancelAnimationFrame(animationId);
        triggerScreenShake(16, 28, true);
        visualScore = score;
        if (currentScoreEl) currentScoreEl.innerText = String(score).padStart(5, '0');
        if (pauseBtn) pauseBtn.classList.add("hidden");
        if (powerupHud) powerupHud.classList.add("hidden");
        if (comboBadge) comboBadge.classList.add("hidden");
        playSfx('game_over');

        fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: score })
        })
        .then(res => res.json())
        .then(data => {
            highScore = data.high_score;
            highScoreEl.innerText = String(highScore).padStart(5, '0');
            
            const maxTier = getComboTier(maxCombo);
            const comboInfo = maxCombo > 0 ? ` Max Combo: ${maxCombo}x (${maxTier.name}).` : '';
            menuOverlay.querySelector("h1").innerText = "SYSTEM CRASH";
            menuOverlay.querySelector("p").innerText = `Protocol ${difficultyConfig[currentDiff].name} - Final Score: ${score}.${comboInfo} Re-initialize protocol and try again!`;
            startBtn.innerHTML = "<span>REBOOT GAME</span>";
            menuOverlay.classList.remove("hidden");
        });
    }
});