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

    // Victory Protocol UI Elements
    const victoryModal = document.getElementById("victory-modal");
    const victoryHeroBanner = document.getElementById("victory-hero-banner");
    const victoryFinalScoreEl = document.getElementById("victory-final-score");
    const victoryMaxComboEl = document.getElementById("victory-max-combo");
    const victoryDiffEl = document.getElementById("victory-diff");
    const victoryRankEl = document.getElementById("victory-rank");
    const victoryContinueBtn = document.getElementById("victory-continue-btn");
    const victoryReplayBtn = document.getElementById("victory-replay-btn");
    const victoryMenuBtn = document.getElementById("victory-menu-btn");
    const victoryLaunchBtn = document.getElementById("victory-launch-btn");

    // Death Replay Flight Recorder UI Elements
    const deathReplayHud = document.getElementById("death-replay-hud");
    const replayLaunchBtn = document.getElementById("replay-launch-btn");
    const replayTimecodeEl = document.getElementById("replay-timecode");
    const replayStatusTagEl = document.getElementById("replay-status-tag");
    const replayRewindBtn = document.getElementById("replay-rewind-btn");
    const replayToggleBtn = document.getElementById("replay-toggle-btn");
    const replaySpeedBtn = document.getElementById("replay-speed-btn");
    const replayExitBtn = document.getElementById("replay-exit-btn");

    // Energon / Overdrive & Boss Threat UI Elements
    const energonHud = document.getElementById("energon-hud");
    const energonBarFill = document.getElementById("energon-bar-fill");
    const energonStatus = document.getElementById("energon-status");
    const bossWarningEl = document.getElementById("boss-warning");

    // Mobile Touch Action UI Elements
    const mobileControlsBar = document.getElementById("mobile-controls-bar");
    const touchJumpBtn = document.getElementById("touch-jump-btn");
    const touchSuitBtn = document.getElementById("touch-suit-btn");
    const touchAttackBtn = document.getElementById("touch-attack-btn");

    let selectedCharacter = "dino"; 
    let dinoGearMode = "standard"; // Options: 'standard', 'ironman', 'thor', 'cap', 'thanos'
    let astronautFormMode = "rocket"; // Options: 'rocket' (flight), 'optimus' (ground vehicle), 'bumblebee' (ground vehicle)
    let developerFormMode = "standard"; // Options: 'standard', 'ultron', 'vision'
    let jumpKeyHeld = false; // Tracks sustained thrust input for true-flight forms
    let gameRunning = false;
    let isPaused = false;
    let score = 0;
    let visualScore = 0;
    let isNewRecordTriggered = false;
    let highScore = 0;
    let animationId;

    // Victory State Engine
    const victoryTargets = {
        rookie: 400,
        avenger: 800,
        thanos: 1500
    };
    let hasTriggeredVictoryInRun = false;
    let isVictoryCelebrationActive = false;
    let victoryCelebrationTimer = 0;
    let isOverdriveMode = false;
    let victoryCelebrationParticles = [];

    // Death Sequence State Engine
    let isDying = false;
    let deathSequenceTimer = 0;
    const deathDuration = 85; // ~1.4 seconds of dramatic slow-mo tumble & impact before crash menu
    let deathPlayerState = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rotation: 0,
        rotSpeed: 0,
        bounceCount: 0,
        cause: ''
    };

    // Death Replay Flight Recorder Buffer Engine
    const MAX_REPLAY_FRAMES = 240; // ~4 seconds of high-fidelity 60 FPS recording
    let deathReplayBuffer = [];
    let savedDeathReplay = null;
    let fatalImpactData = null;
    let isReplaying = false;
    let replayFrameIndex = 0;
    let replaySpeed = 0.4;
    let replayPaused = false;
    let replayRafId = null;

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
            if (astronautFormMode === 'optimus') colors = ['#dc2626', '#2563eb', '#94a3b8'];
            else if (astronautFormMode === 'bumblebee') colors = ['#facc15', '#1e293b', '#fde047'];
            else colors = ['#38bdf8', '#67e8f9', '#ffffff'];
        } else if (selectedCharacter === 'developer') {
            if (developerFormMode === 'ultron') colors = ['#94a3b8', '#dc2626', '#475569'];
            else if (developerFormMode === 'vision') colors = ['#facc15', '#a855f7', '#22c55e'];
            else colors = ['#22c55e', '#15803d', '#4ade80'];
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
        else if (p.type === 'optimus_blast') color = '#2563eb';
        else if (p.type === 'bee_blast') color = '#facc15';
        else if (p.type === 'ultron_drone') color = '#ef4444';
        else if (p.type === 'vision_beam') color = '#a855f7';

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
            } else if (type === 'death_shatter') {
                // Heavy catastrophic impact crunch + deep rumble
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sawtooth';
                osc1.frequency.setValueAtTime(160, now);
                osc1.frequency.exponentialRampToValueAtTime(25, now + 0.45);
                gain1.gain.setValueAtTime(0.35, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.45);

                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'square';
                osc2.frequency.setValueAtTime(80, now);
                osc2.frequency.exponentialRampToValueAtTime(15, now + 0.55);
                gain2.gain.setValueAtTime(0.3, now);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now);
                osc2.stop(now + 0.55);
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
            } else if (type === 'victory') {
                // Triumphant 8-note Avengers victory fanfare
                const fanfareNotes = [
                    { f: 523.25, t: 0.00, d: 0.22 },
                    { f: 659.25, t: 0.12, d: 0.22 },
                    { f: 783.99, t: 0.24, d: 0.22 },
                    { f: 1046.50, t: 0.36, d: 0.40 },
                    { f: 880.00, t: 0.60, d: 0.20 },
                    { f: 1046.50, t: 0.72, d: 0.20 },
                    { f: 1318.51, t: 0.86, d: 0.24 },
                    { f: 1567.98, t: 1.02, d: 0.60 }
                ];
                fanfareNotes.forEach(n => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(n.f, now + n.t);
                    gain.gain.setValueAtTime(0.22, now + n.t);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + n.t);
                    osc.stop(now + n.t + n.d);
                });
            } else if (type === 'death_rewind') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.26);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            } else if (type === 'replay_beep') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            }
        } catch (err) {
            console.warn("Audio playback error:", err);
        }
    }

    function getPlayerBaseX() {
        // Responsive base X stance: on mobile/compact screens, ~22% of canvas width (min 75px, max 130px);
        // on desktop/wide screens, ~26% of canvas width (min 160px, max 280px).
        // This reserves a clear horizon of ~74-78% ahead for hazards, while granting
        // ample rear battlefield space (~22-26%) to see and evade active chasers from behind!
        const width = canvas && canvas.width ? canvas.width : 1000;
        const isMobile = width < 640;
        const minX = isMobile ? 75 : 160;
        const maxX = isMobile ? 130 : 280;
        return Math.max(minX, Math.min(maxX, Math.round(width * (isMobile ? 0.22 : 0.26))));
    }

    let player = {
        x: 120,
        baseX: 120,
        targetX: 120,
        y: 0,
        width: 62,
        height: 48,
        vy: 0,
        gravity: 0.5,
        jumpPower: -10,
        isJumping: false
    };

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width || 1000;
        canvas.height = rect.height || 400;
        if (player) {
            player.baseX = getPlayerBaseX();
            if (!gameRunning) {
                player.x = player.baseX;
                player.targetX = player.baseX;
            }
        }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const characterConfig = {
        dino: { groundColor: "#22c55e", skyColor: "#38bdf8" },
        developer: { groundColor: "#00ff66", bgGradient: ["#051105", "#010501"] },
        astronaut: { groundColor: "#3b82f6", bgGradient: ["#0a0a23", "#02020f"] }
    };

    // ==========================================
    // TRANSFORMATION / FORM ENGINE
    // ==========================================
    // Every playable character has a cycle of forms (pressing the gear/transform
    // key steps through them). Each entry defines: display info, whether the
    // form has true vertical flight, movement/hitbox modifiers, and its ranged
    // attack (fired with the fire key).
    const formConfig = {
        dino: {
            cycle: ['standard', 'ironman', 'thor', 'cap', 'thanos'],
            forms: {
                standard: { label: 'Standard T-Rex', flight: false, widthMod: 1, heightMod: 1, jumpMod: 1 },
                ironman: { label: 'Iron Man Suit', flight: true, widthMod: 1, heightMod: 1, jumpMod: 1, projectile: 'repulsor' },
                thor: { label: 'Thor Mjolnir', flight: false, widthMod: 1, heightMod: 1, jumpMod: 1.05, projectile: 'lightning' },
                cap: { label: 'Captain America', flight: false, widthMod: 1, heightMod: 1, jumpMod: 1, projectile: 'shield_throw' },
                thanos: { label: 'Thanos Gauntlet', flight: false, widthMod: 1.05, heightMod: 1, jumpMod: 0.95, projectile: 'thanos_beam' }
            }
        },
        astronaut: {
            cycle: ['rocket', 'optimus', 'bumblebee'],
            forms: {
                rocket: { label: 'Rocket Flight', flight: true, widthMod: 1, heightMod: 1, jumpMod: 1, projectile: 'laser' },
                optimus: { label: 'Optimus Prime (Truck Mode)', flight: false, widthMod: 1.35, heightMod: 1.25, jumpMod: 0.75, projectile: 'optimus_blast' },
                bumblebee: { label: 'Bumblebee (Car Mode)', flight: false, widthMod: 1.05, heightMod: 0.68, jumpMod: 1.35, projectile: 'bee_blast' }
            }
        },
        developer: {
            cycle: ['standard', 'ultron', 'vision'],
            forms: {
                standard: { label: 'Stressed Developer', flight: false, widthMod: 1, heightMod: 1, jumpMod: 1, projectile: 'patch' },
                ultron: { label: 'Ultron Protocol', flight: false, widthMod: 1.1, heightMod: 1.1, jumpMod: 0.95, projectile: 'ultron_drone' },
                vision: { label: 'Vision Android', flight: false, widthMod: 1, heightMod: 1, jumpMod: 1.1, projectile: 'vision_beam' }
            }
        }
    };

    // ==========================================
    // BOSS THREAT CONFIGURATION
    // ==========================================
    // Maps each playable character to its persistent chaser nemesis. Doomsday
    // hunts the Dino; Megatron hunts the Astronaut/Transformer and Developer
    // lines. Galactus is a separate, character-agnostic cosmic threat that
    // joins the run later (see GALACTUS_UNLOCK_SCORE).
    const bossConfig = {
        dino: { id: 'doomsday', name: 'DOOMSDAY', icon: '🧟', color: '#dc2626', attackName: 'GROUND SLAM' },
        astronaut: { id: 'megatron', name: 'MEGATRON', icon: '🤖', color: '#7f1d1d', attackName: 'PLASMA BARRAGE' },
        developer: { id: 'megatron', name: 'MEGATRON', icon: '🤖', color: '#7f1d1d', attackName: 'PLASMA BARRAGE' }
    };

    // Returns the current form key for whichever character is selected
    function getCurrentFormMode() {
        if (selectedCharacter === 'dino') return dinoGearMode;
        if (selectedCharacter === 'astronaut') return astronautFormMode;
        if (selectedCharacter === 'developer') return developerFormMode;
        return 'standard';
    }

    function setCurrentFormMode(mode) {
        if (selectedCharacter === 'dino') dinoGearMode = mode;
        else if (selectedCharacter === 'astronaut') astronautFormMode = mode;
        else if (selectedCharacter === 'developer') developerFormMode = mode;
    }

    // Returns the formConfig entry for the currently active character+form
    function getActiveFormDef() {
        const charCfg = formConfig[selectedCharacter];
        if (!charCfg) return { flight: false, widthMod: 1, heightMod: 1, jumpMod: 1 };
        return charCfg.forms[getCurrentFormMode()] || charCfg.forms[charCfg.cycle[0]];
    }

    function isFlightFormActive() {
        return !!getActiveFormDef().flight;
    }

    // Cycles the current character to its next transformation
    function cycleCurrentForm() {
        const charCfg = formConfig[selectedCharacter];
        if (!charCfg) return;
        const idx = charCfg.cycle.indexOf(getCurrentFormMode());
        const nextMode = charCfg.cycle[(idx + 1) % charCfg.cycle.length];
        setCurrentFormMode(nextMode);
        updatePlayerDimensions();
        updateGearBindingDescription();
        return nextMode;
    }

    // Keeps the "CYCLE SUIT" keybind description in sync with the selected hero
    function updateGearBindingDescription() {
        const charCfg = formConfig[selectedCharacter];
        if (!charCfg || !currentKeyBindings || !currentKeyBindings.gear) return;
        const names = charCfg.cycle.map(m => charCfg.forms[m].label);
        currentKeyBindings.gear.desc = `Switch: ${names.join(' → ')}`;
        updateControlsHintUI();
        if (keybindModal && !keybindModal.classList.contains('hidden')) renderKeybindsUI();
    }

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
            updateGearBindingDescription();
            const container = document.querySelector(".game-container");
            if (container) {
                container.classList.remove("theme-developer", "theme-astronaut");
                if (selectedCharacter === 'developer') container.classList.add("theme-developer");
                if (selectedCharacter === 'astronaut') container.classList.add("theme-astronaut");
            }
        });
    });

    const initBaseX = getPlayerBaseX();
    player.x = initBaseX;
    player.baseX = initBaseX;
    player.targetX = initBaseX;

    function updatePlayerDimensions() {
        let baseWidth, baseHeight;
        if (selectedCharacter === 'dino') {
            baseWidth = 62;
            baseHeight = 48;
        } else if (selectedCharacter === 'developer') {
            baseWidth = 42;
            baseHeight = 38;
        } else {
            baseWidth = 45;
            baseHeight = 35;
        }

        const formDef = getActiveFormDef();
        const wasJumping = player.isJumping;
        const groundY = getGroundY();
        const prevBottom = player.y + player.height;

        player.width = Math.round(baseWidth * (formDef.widthMod || 1));
        player.height = Math.round(baseHeight * (formDef.heightMod || 1));
        player.jumpPower = -10 * (formDef.jumpMod || 1);
        // Flight forms fall more gently since altitude is player-controlled
        player.gravity = formDef.flight ? 0.28 : 0.5;

        // Keep the player's feet planted on the ground when transforming mid-run
        // instead of letting a height change clip through the floor or float.
        if (player.y !== undefined) {
            if (!wasJumping) {
                player.y = groundY - player.height;
            } else {
                player.y = prevBottom - player.height;
            }
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
            controlsHintEl.innerText = `JUMP: [${jumpKey}] • ATTACK: [${fireKey}] • SUIT: [${gearKey}] • PAUSE: [${pauseKey}] • MUTE: [${muteKey}] • OVERDRIVE: [${gearKey}] WHEN FULL`;
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
    updateGearBindingDescription();
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

        // Check Victory Protocol Mission Milestone
        const targetScore = victoryTargets[currentDiff] || 800;
        if (score >= targetScore && !hasTriggeredVictoryInRun && !isOverdriveMode) {
            triggerVictoryCelebration(false);
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

    // ==========================================
    // ENERGON / OVERDRIVE METER STATE
    // ==========================================
    const ENERGON_MAX = 100;
    const OVERDRIVE_DURATION = 600; // 10 seconds @ 60fps
    let energonMeter = 0;
    let overdriveActive = false;
    let overdriveTimer = 0;

    // ==========================================
    // MULTI-ALTITUDE TRANSITION PORTAL STATE
    // ==========================================
    const PORTAL_FLIGHT_DURATION = 300; // 5 seconds of granted flight/vehicle-swap window
    let portals = [];
    let portalSpawnTimer = 0;
    let temporaryFlightOverride = 0; // frames of granted flight remaining, from portals

    // ==========================================
    // DANGER CLOSE / SKILL COMBO STATE
    // ==========================================
    const DANGER_CLOSE_MARGIN = 16; // px vertical clearance counted as a near-miss
    let dangerCloseStreak = 0;

    // ==========================================
    // INTERACTIVE CHASER BOSS THREAT STATE
    // ==========================================
    const BOSS_UNLOCK_SCORE = 150;     // primary chaser (Doomsday / Megatron) unlocks here
    const GALACTUS_UNLOCK_SCORE = 500; // Galactus cosmic threat joins at this score
    let activeBoss = null;   // primary ground-level chaser (Doomsday / Megatron)
    let galactusBoss = null; // background cosmic ultimate threat
    let bossHazards = [];    // shockwaves / plasma bolts / cosmic debris spawned by bosses
    let bossIntroPlayed = false;
    let galactusIntroPlayed = false;

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

    // ==========================================
    // ENERGON / OVERDRIVE METER ENGINE
    // ==========================================
    function addEnergon(amount) {
        if (overdriveActive) return;
        const wasFull = energonMeter >= ENERGON_MAX;
        energonMeter = Math.min(ENERGON_MAX, energonMeter + amount);
        updateEnergonUI();
        if (!wasFull && energonMeter >= ENERGON_MAX) {
            spawnFloatingText(player.x + player.width / 2, player.y - 30, "⚡ OVERDRIVE READY!", "#fde047");
            playSfx('gear');
            triggerScreenShake(3, 8);
        }
    }

    function updateEnergonUI() {
        if (!energonHud) return;
        const pct = Math.round((energonMeter / ENERGON_MAX) * 100);
        if (energonBarFill) {
            energonBarFill.style.width = `${pct}%`;
            energonBarFill.classList.toggle('full', energonMeter >= ENERGON_MAX && !overdriveActive);
        }
        if (energonStatus) {
            if (overdriveActive) {
                energonStatus.innerText = `OVERDRIVE ${Math.max(0, Math.ceil(overdriveTimer / 60))}s`;
            } else if (energonMeter >= ENERGON_MAX) {
                energonStatus.innerText = 'READY (E)';
            } else {
                energonStatus.innerText = `${pct}%`;
            }
        }
        energonHud.classList.toggle('overdrive-active', overdriveActive);
        if (touchSuitBtn) {
            const labelEl = touchSuitBtn.querySelector('.touch-label');
            if (labelEl) {
                if (overdriveActive) {
                    labelEl.innerText = "OVERDRIVE";
                } else if (energonMeter >= ENERGON_MAX) {
                    labelEl.innerText = "OVERDRIVE!";
                } else {
                    labelEl.innerText = "SUIT";
                }
            }
            touchSuitBtn.classList.toggle('overdrive-ready', energonMeter >= ENERGON_MAX && !overdriveActive);
        }
    }

    // Triggered by pressing the transform ("gear") key once the meter is full.
    // Grants 10 seconds of invincibility + auto-shredding of anything the
    // player touches, with a neon particle trail.
    function triggerOverdrive() {
        if (overdriveActive || energonMeter < ENERGON_MAX) return;
        overdriveActive = true;
        overdriveTimer = OVERDRIVE_DURATION;
        energonMeter = 0;
        screenFlash = 0.7;
        triggerScreenShake(10, 20, true);
        playSfx('nuke');
        playSfx('gear');
        spawnFloatingText(player.x + player.width / 2, player.y - 30, "🚀 ENERGON OVERDRIVE!", "#fde047");
        spawnParticles({
            x: player.x + player.width / 2, y: player.y + player.height / 2,
            count: 40, colors: ['#fde047', '#facc15', '#38bdf8', '#ffffff'],
            minSpeed: 3, maxSpeed: 8, minSize: 2, maxSize: 5,
            gravity: 0.05, friction: 0.93, life: 40, shape: 'spark'
        });
        updateEnergonUI();
    }

    function updateOverdriveTimer() {
        if (!overdriveActive) {
            updateEnergonUI();
            return;
        }
        overdriveTimer--;
        if (Math.random() < 0.8) {
            spawnParticles({
                x: player.x + player.width / 2, y: player.y + player.height / 2,
                count: 2, colors: ['#fde047', '#38bdf8', '#ffffff'],
                minSpeed: 1, maxSpeed: 3, minSize: 1.5, maxSize: 3.5,
                gravity: 0, friction: 0.9, life: 18, shape: 'spark'
            });
        }
        if (overdriveTimer <= 0) {
            overdriveActive = false;
            overdriveTimer = 0;
            spawnFloatingText(player.x + player.width / 2, player.y - 20, "OVERDRIVE ENDED", "#94a3b8");
        }
        updateEnergonUI();
    }

    // Draws the player's neon overdrive aura while the ultimate state is active.
    function drawOverdriveAura() {
        if (!overdriveActive) return;
        ctx.save();
        const pulse = Math.sin(Date.now() / 70) * 4;
        ctx.strokeStyle = '#fde047';
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 22;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(
            player.x + player.width / 2,
            player.y + player.height / 2,
            player.width / 2 + 14 + pulse,
            player.height / 2 + 14 + pulse,
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
    }

    // ==========================================
    // MULTI-ALTITUDE TRANSITION PORTAL ENGINE
    // ==========================================
    // Glowing tracking rings drift in from the right. Flying through a "high"
    // ring grants a temporary flight/altitude window (useful for dodging
    // ground hazards or boss ground-slams); a "low" ring grants the same
    // window framed as a ground-vehicle speed boost. Both work for every
    // character/form, letting non-flight forms borrow a flight window.
    function maybeSpawnPortal(groundY) {
        portalSpawnTimer++;
        const targetInterval = 520 + Math.random() * 260; // roughly every 9-13 seconds
        if (portalSpawnTimer < targetInterval || portals.length > 0) return;
        portalSpawnTimer = 0;

        const isHighRing = Math.random() < 0.55;
        const ringY = isHighRing ? (40 + Math.random() * 40) : (groundY - 40);
        portals.push({
            x: canvas.width + 60,
            y: ringY,
            radius: 30,
            spin: 0,
            highRing: isHighRing,
            passed: false
        });
    }

    function updateAndDrawPortals(effectiveSpeed) {
        for (let i = portals.length - 1; i >= 0; i--) {
            const portal = portals[i];
            portal.x -= effectiveSpeed;
            portal.spin += 0.08;

            ctx.save();
            ctx.translate(portal.x, portal.y);
            ctx.rotate(portal.spin);
            const glowColor = portal.highRing ? '#38bdf8' : '#c084fc';
            ctx.strokeStyle = glowColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 18;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.ellipse(0, 0, portal.radius, portal.radius * 0.42, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.ellipse(0, 0, portal.radius * 0.7, portal.radius * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            const playerCx = player.x + player.width / 2;
            const playerCy = player.y + player.height / 2;
            const dx = playerCx - portal.x;
            const dy = playerCy - portal.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (!portal.passed && dist < portal.radius * 0.85) {
                portal.passed = true;
                temporaryFlightOverride = PORTAL_FLIGHT_DURATION;
                addScore(15);
                addEnergon(6);
                spawnFloatingText(portal.x, portal.y - 20, portal.highRing ? "🌐 AIRSPACE MODE!" : "🌐 GROUND BOOST MODE!", glowColor);
                spawnPowerUpPickupParticles(portal.x, portal.y, glowColor);
                playSfx('powerup_shield');
                triggerScreenShake(3, 8);
            }

            if (portal.x + portal.radius < 0) portals.splice(i, 1);
        }
    }

    // ==========================================
    // INTERACTIVE CHASER BOSS THREAT ENGINE
    // ==========================================
    // Doomsday / Megatron: persistent nemesis hugging the left edge just
    // behind the player, cycling chasing -> telegraph -> attack -> recover.
    function maybeSpawnPrimaryBoss(groundY) {
        if (activeBoss || score < BOSS_UNLOCK_SCORE) return;
        const cfg = bossConfig[selectedCharacter] || bossConfig.dino;
        activeBoss = {
            id: cfg.id,
            name: cfg.name,
            color: cfg.color,
            attackName: cfg.attackName,
            x: -90,
            y: groundY - 60,
            width: 84,
            height: 66,
            bobOffset: 0,
            state: 'chasing',      // chasing -> telegraph -> attacking -> recover
            stateTimer: 220 + Math.random() * 140,
            telegraphAlpha: 0
        };
        if (!bossIntroPlayed) {
            bossIntroPlayed = true;
            spawnFloatingText(canvas.width / 2, 80, `⚠️ ${cfg.name} IS HUNTING YOU!`, '#f87171');
            playSfx('combo_break');
            triggerScreenShake(8, 18, true);
        }
    }

    function updateAndDrawPrimaryBoss(groundY) {
        if (!activeBoss) return;
        const boss = activeBoss;
        boss.bobOffset += 0.05;

        // Dynamic pursuit positioning: Boss pursues menacingly behind the player in the rear threat zone
        // Calculates a stalking distance so the boss is clearly visible chasing the hero
        const pursuitGap = Math.max(50, Math.min(160, Math.round(player.x * 0.62)));
        let targetBossX = player.x - pursuitGap - boss.width;

        // When telegraphing, the boss lunges/stomps forward closer
        if (boss.state === 'telegraph') {
            targetBossX += 32;
        } else if (boss.state === 'attacking') {
            targetBossX += 44;
        } else if (boss.state === 'recover') {
            targetBossX -= 26;
        }

        // Clamp so boss stays visible on canvas and never passes player
        const minBossX = canvas.width < 640 ? -25 : 10;
        const maxBossX = player.x - 65;
        targetBossX = Math.max(minBossX, Math.min(maxBossX, targetBossX));

        boss.x += (targetBossX - boss.x) * 0.05;
        boss.y = groundY - boss.height + Math.sin(boss.bobOffset) * 4;

        boss.stateTimer--;
        if (boss.state === 'chasing' && boss.stateTimer <= 0) {
            boss.state = 'telegraph';
            boss.stateTimer = 46;
            playSfx('shoot', boss.id === 'doomsday' ? 'thor' : 'laser');
        } else if (boss.state === 'telegraph' && boss.stateTimer <= 0) {
            launchBossAttack(boss, groundY);
            boss.state = 'attacking';
            boss.stateTimer = 20;
        } else if (boss.state === 'attacking' && boss.stateTimer <= 0) {
            boss.state = 'recover';
            boss.stateTimer = 90 + Math.random() * 60;
        } else if (boss.state === 'recover' && boss.stateTimer <= 0) {
            boss.state = 'chasing';
            boss.stateTimer = 220 + Math.random() * 160;
        }

        boss.telegraphAlpha = boss.state === 'telegraph' ? Math.abs(Math.sin(Date.now() / 60)) : 0;

        drawBossSprite(boss);

        // Visual threat targeting laser / telegraph line from boss to player
        if (boss.state === 'telegraph') {
            ctx.save();
            ctx.strokeStyle = boss.color;
            ctx.setLineDash([8, 6]);
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.35 + boss.telegraphAlpha * 0.45;
            ctx.beginPath();
            ctx.moveTo(boss.x + boss.width, boss.y + boss.height * 0.6);
            ctx.lineTo(player.x, boss.id === 'megatron' ? player.y + player.height * 0.5 : groundY);
            ctx.stroke();
            ctx.restore();
        }

        if (bossWarningEl) {
            if (boss.state === 'telegraph') {
                bossWarningEl.classList.remove('hidden');
                bossWarningEl.innerText = `⚠️ ${boss.name}: ${boss.attackName} INCOMING!`;
            } else if (!(galactusBoss && galactusBoss.state === 'telegraph')) {
                bossWarningEl.classList.add('hidden');
            }
        }
    }

    function drawBossSprite(boss) {
        ctx.save();
        ctx.translate(boss.x, boss.y);

        if (boss.state === 'telegraph') {
            ctx.save();
            ctx.globalAlpha = 0.25 + boss.telegraphAlpha * 0.35;
            ctx.fillStyle = boss.color;
            ctx.shadowColor = boss.color;
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.ellipse(boss.width / 2, boss.height + 4, boss.width * 0.7, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.shadowColor = boss.color;
        ctx.shadowBlur = 16;

        if (boss.id === 'doomsday') {
            // Hulking crimson-grey brute silhouette
            ctx.fillStyle = '#57534e';
            ctx.fillRect(10, 10, boss.width - 20, boss.height - 14);
            ctx.fillStyle = boss.color;
            ctx.fillRect(4, 22, 12, 30);
            ctx.fillRect(boss.width - 16, 22, 12, 30);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(22, 24, 8, 5);
            ctx.fillRect(boss.width - 34, 24, 8, 5);
            ctx.fillStyle = '#1c1917';
            for (let s = 0; s < 4; s++) {
                ctx.fillRect(14 + s * 12, 6, 6, 10);
            }
        } else {
            // Angular mechanical Megatron-style chassis
            ctx.fillStyle = '#3f3f46';
            ctx.fillRect(8, 14, boss.width - 16, boss.height - 20);
            ctx.fillStyle = boss.color;
            ctx.fillRect(0, 26, 14, 14);
            ctx.fillRect(boss.width - 14, 26, 14, 14);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(boss.width / 2, 24, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(boss.width / 2 - 3, 4, 6, 20);
        }

        ctx.restore();
    }

    function launchBossAttack(boss, groundY) {
        if (boss.id === 'doomsday') {
            // Ground Slam: fast-travelling shockwave hugging the floor that
            // requires a precisely-timed jump.
            bossHazards.push({
                type: 'shockwave',
                x: boss.x + boss.width,
                y: groundY - 14,
                width: 26,
                height: 18,
                vx: 13,
                color: '#dc2626'
            });
            triggerScreenShake(9, 16, true);
            playSfx('hit');
        } else {
            // Plasma Barrage: a ground-level bolt (jump it) and a flight-altitude
            // bolt (only a real threat while airborne — shift altitude to dodge).
            bossHazards.push({
                type: 'plasma', x: boss.x + boss.width, y: groundY - 26,
                width: 22, height: 10, vx: 11, color: '#ef4444'
            });
            bossHazards.push({
                type: 'plasma', x: boss.x + boss.width, y: 50,
                width: 22, height: 10, vx: 11, color: '#f97316'
            });
            playSfx('shoot', 'laser');
        }
    }

    // Galactus: a towering cosmic entity looming in the far background that
    // joins once the run reaches GALACTUS_UNLOCK_SCORE, periodically raining
    // celestial debris the player must dodge or shoot down.
    function maybeSpawnGalactus() {
        if (galactusBoss || score < GALACTUS_UNLOCK_SCORE) return;
        galactusBoss = {
            phase: Math.random() * Math.PI * 2,
            state: 'looming',       // looming -> telegraph -> recover
            stateTimer: 260 + Math.random() * 180
        };
        if (!galactusIntroPlayed) {
            galactusIntroPlayed = true;
            spawnFloatingText(canvas.width / 2, 100, "☄️ GALACTUS HAS ARRIVED!", "#c084fc");
            playSfx('nuke');
            triggerScreenShake(12, 26, true);
        }
    }

    function updateAndDrawGalactus(groundY) {
        if (!galactusBoss) return;
        const g = galactusBoss;
        g.phase += 0.01;
        g.stateTimer--;

        // Towering cosmic silhouette looming far in the background
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(g.phase) * 0.08;
        ctx.fillStyle = '#4c1d95';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 40;
        const gx = canvas.width - 130;
        ctx.beginPath();
        ctx.moveTo(gx, groundY + 4);
        ctx.lineTo(gx - 60, groundY + 4);
        ctx.lineTo(gx - 34, groundY - 190);
        ctx.lineTo(gx - 4, groundY - 240);
        ctx.lineTo(gx + 26, groundY - 190);
        ctx.lineTo(gx + 60, groundY + 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(gx - 4, groundY - 180, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (g.state === 'looming' && g.stateTimer <= 0) {
            g.state = 'telegraph';
            g.stateTimer = 60;
            playSfx('weather_shift');
        } else if (g.state === 'telegraph' && g.stateTimer <= 0) {
            launchGalactusAttack();
            g.state = 'recover';
            g.stateTimer = 320 + Math.random() * 200;
        } else if (g.state === 'recover' && g.stateTimer <= 0) {
            g.state = 'looming';
            g.stateTimer = 260 + Math.random() * 180;
        }

        if (g.state === 'telegraph') {
            ctx.save();
            ctx.globalAlpha = Math.abs(Math.sin(Date.now() / 80)) * 0.35;
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            if (bossWarningEl) {
                bossWarningEl.classList.remove('hidden');
                bossWarningEl.innerText = "☄️ GALACTUS: CELESTIAL DEBRIS INCOMING!";
            }
        }
    }

    function launchGalactusAttack() {
        const debrisCount = 3;
        for (let i = 0; i < debrisCount; i++) {
            bossHazards.push({
                type: 'debris',
                x: canvas.width - 100 + i * 40,
                y: -20 - i * 30,
                width: 22,
                height: 22,
                vx: -1.5,
                vy: 6 + Math.random() * 2,
                color: '#c084fc',
                spin: 0
            });
        }
        triggerScreenShake(14, 26, true);
    }

    // Shockwaves, plasma bolts, and cosmic debris all live in one array so
    // they share collision handling with the overdrive / shield systems.
    function updateAndDrawBossHazards() {
        for (let i = bossHazards.length - 1; i >= 0; i--) {
            const hz = bossHazards[i];
            hz.x += (hz.vx || 0);
            hz.y += (hz.vy || 0);
            if (hz.spin !== undefined) hz.spin += 0.15;

            ctx.save();
            ctx.translate(hz.x, hz.y);
            if (hz.spin !== undefined) ctx.rotate(hz.spin);
            ctx.fillStyle = hz.color;
            ctx.shadowColor = hz.color;
            ctx.shadowBlur = 14;
            if (hz.type === 'shockwave') {
                ctx.fillRect(-hz.width / 2, -hz.height / 2, hz.width, hz.height);
                ctx.globalAlpha = 0.4;
                ctx.fillRect(-hz.width, -4, hz.width * 2, 8);
            } else if (hz.type === 'debris') {
                ctx.beginPath();
                ctx.moveTo(0, -hz.height / 2);
                ctx.lineTo(hz.width / 2, hz.height / 2);
                ctx.lineTo(-hz.width / 2, hz.height / 2);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillRect(-hz.width / 2, -hz.height / 2, hz.width, hz.height);
            }
            ctx.restore();

            const hitX = hz.x - hz.width / 2, hitY = hz.y - hz.height / 2;
            if (player.x < hitX + hz.width && player.x + player.width > hitX &&
                player.y < hitY + hz.height && player.y + player.height > hitY) {
                resolveHazardHit(i, hz);
                continue;
            }

            if (hz.x < -60 || hz.x > canvas.width + 60 || hz.y > canvas.height + 60) {
                bossHazards.splice(i, 1);
            }
        }
    }

    function resolveHazardHit(index, hz) {
        if (overdriveActive || activeBuffs.invincibleTimer > 0) {
            bossHazards.splice(index, 1);
            spawnObstacleExplosion(hz.x, hz.y, 'nuke');
            if (overdriveActive) {
                addScore(20);
                addCombo(1, hz.x, hz.y, 'HIT');
            }
            return;
        }
        if (activeBuffs.shield) {
            activeBuffs.shield = false;
            activeBuffs.shieldTimer = 0;
            activeBuffs.invincibleTimer = 80;
            bossHazards.splice(index, 1);
            spawnObstacleExplosion(hz.x, hz.y, 'shield_break');
            spawnFloatingText(player.x + 10, player.y - 15, "🛡️ SHIELD ABSORBED HIT!", "#00e5ff");
            playSfx('shield_break');
            triggerScreenShake(9, 16, true);
            breakCombo();
            updatePowerUpHud();
            return;
        }
        const hazardType = hz.type === 'shockwave' ? 'BOSS SHOCKWAVE' : 'NEMESIS IMPACT';
        const hitX = hz.x || player.x;
        const hitY = hz.y || player.y;
        bossHazards.splice(index, 1);
        breakCombo();
        startDeathSequence(hazardType, hitX, hitY, null);
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
            if (mobileControlsBar) mobileControlsBar.classList.add("hidden");
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
            if (mobileControlsBar) mobileControlsBar.classList.remove("hidden");
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
        if (mobileControlsBar) mobileControlsBar.classList.add("hidden");
        pauseOverlay.classList.add("hidden");
        pauseBtn.classList.add("hidden");
        powerupHud.classList.add("hidden");
        canvas.classList.add("hidden");
        scoreboard.classList.add("hidden");
        if (comboBadge) comboBadge.classList.add("hidden");
        if (energonHud) energonHud.classList.add("hidden");
        if (bossWarningEl) bossWarningEl.classList.add("hidden");
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
            if (mobileControlsBar) mobileControlsBar.classList.remove("hidden");
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

    // --- Death Replay Button Listeners ---
    if (replayLaunchBtn) {
        replayLaunchBtn.addEventListener("click", () => {
            getAudioContext();
            startDeathReplay();
        });
    }

    if (replayRewindBtn) {
        replayRewindBtn.addEventListener("click", () => {
            rewindDeathReplay();
        });
    }

    if (replayToggleBtn) {
        replayToggleBtn.addEventListener("click", () => {
            toggleDeathReplayPause();
        });
    }

    if (replaySpeedBtn) {
        replaySpeedBtn.addEventListener("click", () => {
            cycleDeathReplaySpeed();
        });
    }

    if (replayExitBtn) {
        replayExitBtn.addEventListener("click", () => {
            exitDeathReplay();
        });
    }

    // --- Victory Protocol Button Listeners ---
    if (victoryLaunchBtn) {
        victoryLaunchBtn.addEventListener("click", () => {
            getAudioContext();
            playSfx('select');
            triggerVictoryCelebration(true);
        });
    }

    if (victoryContinueBtn) {
        victoryContinueBtn.addEventListener("click", () => {
            if (victoryModal) victoryModal.classList.add("hidden");
            isOverdriveMode = true;
            playSfx('select');
            spawnFloatingText(player.x + 20, player.y - 20, "🚀 OVERDRIVE ACTIVATED!", "#facc15");
            if (!gameRunning) {
                gameRunning = true;
                animationId = requestAnimationFrame(gameLoop);
            }
        });
    }

    if (victoryReplayBtn) {
        victoryReplayBtn.addEventListener("click", () => {
            if (victoryModal) victoryModal.classList.add("hidden");
            playSfx('select');
            triggerVictoryCelebration(true);
        });
    }

    if (victoryMenuBtn) {
        victoryMenuBtn.addEventListener("click", () => {
            if (victoryModal) victoryModal.classList.add("hidden");
            returnToMenu();
        });
    }

    startBtn.addEventListener("click", () => {
        getAudioContext();
        playSfx('select');
        menuOverlay.classList.add("hidden");
        pauseOverlay.classList.add("hidden");
        if (victoryModal) victoryModal.classList.add("hidden");
        if (deathReplayHud) deathReplayHud.classList.add("hidden");
        canvas.classList.remove("hidden");
        scoreboard.classList.remove("hidden");
        pauseBtn.classList.remove("hidden");
        powerupHud.classList.remove("hidden");
        if (energonHud) energonHud.classList.remove("hidden");
        if (mobileControlsBar) mobileControlsBar.classList.remove("hidden");

        resizeCanvas();
        resetGame();
        gameRunning = true;
        isPaused = false;
        animationId = requestAnimationFrame(gameLoop);
    });

    // Fires the currently active form's ranged attack. Each form config entry
    // owns a `projectile` type; the shape/behavior of that type lives in the
    // projectile draw/update loop and spawnProjectileTrail().
    function fireFormWeapon() {
        const formDef = getActiveFormDef();
        const type = formDef.projectile;
        if (!type) return;

        const baseX = player.x + player.width;
        const midY = player.y + player.height / 2;

        if (type === 'repulsor') {
            projectiles.push({ x: baseX, y: player.y + 15, width: 18, height: 5, speed: 14, type });
            playSfx('shoot', 'repulsor'); triggerScreenShake(3, 6);
        } else if (type === 'lightning') {
            projectiles.push({ x: baseX, y: player.y + 10, width: 22, height: 8, speed: 12, type });
            playSfx('shoot', 'thor'); triggerScreenShake(5, 10);
        } else if (type === 'shield_throw') {
            projectiles.push({ x: baseX, y: player.y + 12, width: 16, height: 16, speed: 11, type });
            playSfx('shoot', 'cap'); triggerScreenShake(3, 7);
        } else if (type === 'thanos_beam') {
            projectiles.push({ x: baseX, y: player.y + 5, width: 25, height: 12, speed: 13, type });
            playSfx('shoot', 'thanos_beam'); triggerScreenShake(6, 12);
        } else if (type === 'laser') {
            projectiles.push({ x: baseX, y: midY - 2, width: 15, height: 4, speed: 12, type });
            playSfx('shoot', 'laser'); triggerScreenShake(2, 5);
        } else if (type === 'optimus_blast') {
            // Optimus Prime: single heavy cannon shot
            projectiles.push({ x: baseX, y: midY - 3, width: 22, height: 8, speed: 11, type });
            playSfx('shoot'); triggerScreenShake(5, 9);
        } else if (type === 'bee_blast') {
            // Bumblebee: twin rapid plasma shots
            projectiles.push({ x: baseX, y: midY - 8, width: 12, height: 4, speed: 15, type });
            projectiles.push({ x: baseX, y: midY + 4, width: 12, height: 4, speed: 15, type });
            playSfx('shoot'); triggerScreenShake(2, 4);
        } else if (type === 'patch') {
            projectiles.push({ x: baseX, y: midY - 2, width: 14, height: 6, speed: 10, type });
            playSfx('shoot', 'patch'); triggerScreenShake(2, 5);
        } else if (type === 'ultron_drone') {
            // Ultron: spread pair of drone missiles
            projectiles.push({ x: baseX, y: midY - 9, width: 13, height: 5, speed: 12, type });
            projectiles.push({ x: baseX, y: midY + 5, width: 13, height: 5, speed: 12, type });
            playSfx('shoot'); triggerScreenShake(3, 7);
        } else if (type === 'vision_beam') {
            // Vision: piercing mind-stone beam that punches through multiple obstacles
            projectiles.push({ x: baseX, y: midY - 4, width: 26, height: 8, speed: 13, type, pierce: true });
            playSfx('shoot'); triggerScreenShake(3, 8);
        }
    }

    // Controls: Space/Up jumps (hold for thrust in flight forms). Key 'E' cycles
    // transformations. Key 'F' / Click attacks. Key 'M' toggles sound. Key 'P' / Escape pauses.
    function triggerAction(isSecondary = false) {
        if (!gameRunning || isPaused) return;
        getAudioContext();

        if (isSecondary) {
            fireFormWeapon();
            return;
        }

        jumpKeyHeld = true;
        if (isFlightFormActive()) {
            // Flight forms: a tap gives an initial upward kick; holding the key
            // (handled in the physics step) sustains altitude.
            if (!player.isJumping) {
                playSfx('jump');
                spawnJumpParticles(player.x + 12, player.y + player.height);
            }
            player.isJumping = true;
        } else if (!player.isJumping) {
            player.vy = player.jumpPower;
            player.isJumping = true;
            playSfx('jump');
            spawnJumpParticles(player.x + 12, player.y + player.height);
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

        // Transformation Cycle Check (works for every character's form tree)
        const gearBinding = currentKeyBindings.gear;
        if (e.code === gearBinding.code || (gearBinding.altCode && e.code === gearBinding.altCode)) {
            e.preventDefault();
            triggerSuitOrOverdrive();
            return;
        }
    });

    function triggerSuitOrOverdrive() {
        if (!gameRunning || isPaused) return;
        getAudioContext();
        // A full Energon meter reroutes into triggering the Overdrive Ultimate State
        if (energonMeter >= ENERGON_MAX && !overdriveActive) {
            triggerOverdrive();
            return;
        }
        const nextMode = cycleCurrentForm();
        const charCfg = formConfig[selectedCharacter];
        const label = charCfg ? charCfg.forms[nextMode].label : nextMode;
        playSfx('gear');
        spawnFloatingText(player.x + player.width / 2, player.y - 18, `⚡ ${label.toUpperCase()}`, "#38bdf8");
        triggerScreenShake(3, 8);
    }

    window.addEventListener("keyup", (e) => {
        const jumpBinding = currentKeyBindings.jump;
        if (e.code === jumpBinding.code || (jumpBinding.altCode && e.code === jumpBinding.altCode)) {
            jumpKeyHeld = false;
        }
    });

    // ==========================================
    // MOBILE TOUCH & DUAL-ZONE CANVAS CONTROLS
    // ==========================================
    // Supports intuitive two-handed mobile gameplay:
    // Left half screen touch/hold = Jump / Thruster Flight
    // Right half screen touch = Fire Active Weapon / Attack
    canvas.addEventListener("touchstart", (e) => {
        if (!gameRunning || isPaused) return;
        e.preventDefault();
        getAudioContext();
        const rect = canvas.getBoundingClientRect();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchX = touch.clientX - rect.left;
            if (touchX < rect.width * 0.5) {
                jumpKeyHeld = true;
                triggerAction(false);
            } else {
                triggerAction(true);
            }
        }
    }, { passive: false });

    canvas.addEventListener("touchend", (e) => {
        if (!gameRunning || isPaused) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        let leftTouchStillActive = false;
        for (let i = 0; i < e.targetTouches.length; i++) {
            const touch = e.targetTouches[i];
            if (touch.clientX - rect.left < rect.width * 0.5) {
                leftTouchStillActive = true;
                break;
            }
        }
        if (!leftTouchStillActive) {
            jumpKeyHeld = false;
        }
    }, { passive: false });

    canvas.addEventListener("touchcancel", () => {
        jumpKeyHeld = false;
    });

    // Dual-zone mouse click fallback (left half jumps, right half shoots)
    canvas.addEventListener("click", (e) => {
        if (!gameRunning || isPaused) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX < rect.width * 0.5) {
            triggerAction(false);
        } else {
            triggerAction(true);
        }
    });

    // On-screen mobile tactical action buttons
    if (touchJumpBtn) {
        touchJumpBtn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            touchJumpBtn.classList.add("active");
            jumpKeyHeld = true;
            triggerAction(false);
        }, { passive: false });

        touchJumpBtn.addEventListener("touchend", (e) => {
            e.preventDefault();
            touchJumpBtn.classList.remove("active");
            jumpKeyHeld = false;
        }, { passive: false });

        touchJumpBtn.addEventListener("touchcancel", () => {
            touchJumpBtn.classList.remove("active");
            jumpKeyHeld = false;
        });

        touchJumpBtn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            touchJumpBtn.classList.add("active");
            jumpKeyHeld = true;
            triggerAction(false);
        });

        window.addEventListener("mouseup", () => {
            if (touchJumpBtn) touchJumpBtn.classList.remove("active");
        });
    }

    if (touchSuitBtn) {
        const handleSuit = (e) => {
            e.preventDefault();
            touchSuitBtn.classList.add("active");
            triggerSuitOrOverdrive();
            setTimeout(() => {
                if (touchSuitBtn) touchSuitBtn.classList.remove("active");
            }, 150);
        };
        touchSuitBtn.addEventListener("touchstart", handleSuit, { passive: false });
        touchSuitBtn.addEventListener("click", handleSuit);
    }

    if (touchAttackBtn) {
        const handleAttack = (e) => {
            e.preventDefault();
            touchAttackBtn.classList.add("active");
            triggerAction(true);
            setTimeout(() => {
                if (touchAttackBtn) touchAttackBtn.classList.remove("active");
            }, 150);
        };
        touchAttackBtn.addEventListener("touchstart", handleAttack, { passive: false });
        touchAttackBtn.addEventListener("click", handleAttack);
    }

    if (energonHud) {
        energonHud.addEventListener("click", () => {
            if (energonMeter >= ENERGON_MAX && !overdriveActive) {
                triggerOverdrive();
            }
        });
    }

    function getGroundY() {
        return canvas.height - 70;
    }

    function resetGame() {
        updatePlayerDimensions();
        const groundY = getGroundY();
        player.baseX = getPlayerBaseX();
        player.x = player.baseX;
        player.targetX = player.baseX;
        player.y = groundY - player.height;
        player.vy = 0;
        player.isJumping = false;
        jumpKeyHeld = false;
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
        hasTriggeredVictoryInRun = false;
        isVictoryCelebrationActive = false;
        victoryCelebrationTimer = 0;
        isOverdriveMode = false;
        victoryCelebrationParticles = [];
        isDying = false;
        deathSequenceTimer = 0;
        deathReplayBuffer = [];
        if (replayLaunchBtn) replayLaunchBtn.classList.add("hidden");
        if (victoryModal) victoryModal.classList.add("hidden");
        if (deathReplayHud) deathReplayHud.classList.add("hidden");

        // Reset Energon/Overdrive, Portals, Danger Close, and Boss Threat state
        energonMeter = 0;
        overdriveActive = false;
        overdriveTimer = 0;
        portals = [];
        portalSpawnTimer = 0;
        temporaryFlightOverride = 0;
        dangerCloseStreak = 0;
        activeBoss = null;
        galactusBoss = null;
        bossHazards = [];
        bossIntroPlayed = false;
        galactusIntroPlayed = false;
        if (bossWarningEl) bossWarningEl.classList.add("hidden");
        updateEnergonUI();

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
    function drawPlayer(x, y, charOverride = null, gearOverride = null, pose = 'normal') {
        ctx.save();
        ctx.translate(x, y);

        // Death Animation Ragdoll/Tumble Transform
        if (pose === 'death' && deathPlayerState) {
            ctx.translate(player.width / 2, player.height / 2);
            ctx.rotate(deathPlayerState.rotation);
            ctx.translate(-player.width / 2, -player.height / 2);
            if (Math.random() < 0.35) {
                ctx.translate((Math.random() - 0.5) * 4, 0); // Glitch jitter
            }
        }

        const char = charOverride || selectedCharacter;
        // Resolve the active form for whichever character is being drawn (falls back
        // to the currently selected character's own mode if no override is passed).
        let gear = gearOverride;
        if (!gear) {
            if (char === 'dino') gear = dinoGearMode;
            else if (char === 'astronaut') gear = astronautFormMode;
            else if (char === 'developer') gear = developerFormMode;
        }

        // Overdrive golden hero aura
        if (isOverdriveMode && pose !== 'victory') {
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 18;
        }

        if (char === 'dino') {
            if (gear === 'ironman') {
                ctx.fillStyle = '#dc2626'; // Red armor
                ctx.fillRect(0, 20, 18, 10);
                ctx.fillRect(14, 14, 32, 24);
                ctx.fillRect(36, 2, 24, 18);
                ctx.fillStyle = '#fbbf24'; // Gold faceplate & core
                ctx.fillRect(48, 5, 10, 10);
                ctx.fillRect(26, 22, 6, 6);
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(27, 23, 4, 4);
                const legOffset = (player.isJumping || pose === 'victory') ? 4 : Math.sin(Date.now() / 65) * 8;
                ctx.fillStyle = '#991b1b';
                ctx.fillRect(20, 38, 8, 12 + legOffset);
                ctx.fillRect(34, 38, 8, 12 - legOffset);

                // Victory Pose Jet Thrusters & Chest Unibeam
                if (pose === 'victory') {
                    // Boots Jet Exhaust Flames
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(21, 52, 6, 18 + Math.sin(Date.now() / 25) * 6);
                    ctx.fillRect(35, 52, 6, 18 + Math.cos(Date.now() / 25) * 6);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(22, 52, 4, 10);
                    ctx.fillRect(36, 52, 4, 10);

                    // Massive Skyward Arc Reactor Unibeam
                    ctx.save();
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
                    ctx.shadowColor = '#38bdf8';
                    ctx.shadowBlur = 24;
                    ctx.fillRect(27, -250, 6, 270);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(28, -250, 4, 270);
                    // Pulsing shockwave rings going up
                    const ringY = (Date.now() / 3) % 250;
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(30, 20 - ringY, 14, 5, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }

            } else if (gear === 'thor') {
                // --- THOR T-REX (With Red Cape & Mjolnir Hammer) ---
                ctx.fillStyle = '#b91c1c'; // Flowing red cape
                ctx.fillRect(10, 16, 12, 18);
                ctx.fillStyle = '#1e293b'; // Asgardian armor body
                ctx.fillRect(14, 14, 32, 24);
                ctx.fillRect(36, 2, 22, 18); // Head with winged helmet
                ctx.fillStyle = '#fbbf24'; // Wings on helmet
                ctx.fillRect(34, 4, 4, 8);

                // Mjolnir Hammer in hand!
                if (pose === 'victory') {
                    ctx.fillStyle = '#78350f'; // Handle
                    ctx.fillRect(52, -4, 4, 18);
                    ctx.fillStyle = '#94a3b8'; // Hammer head raised high
                    ctx.shadowColor = '#facc15';
                    ctx.shadowBlur = 20;
                    ctx.fillRect(48, -14, 14, 10);
                    ctx.shadowBlur = 0;
                } else {
                    ctx.fillStyle = '#64748b'; // Hammer head
                    ctx.fillRect(54, 14, 10, 8);
                    ctx.fillStyle = '#78350f'; // Handle
                    ctx.fillRect(52, 20, 3, 8);
                }

                const legOffset = (player.isJumping || pose === 'victory') ? 4 : Math.sin(Date.now() / 65) * 8;
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(20, 38, 8, 12 + legOffset);
                ctx.fillRect(34, 38, 8, 12 - legOffset);

            } else if (gear === 'cap') {
                // --- CAPTAIN AMERICA T-REX (Vibranium Shield & Helmet) ---
                ctx.fillStyle = '#1d4ed8'; // Blue suit body
                ctx.fillRect(0, 20, 18, 10);
                ctx.fillRect(14, 14, 32, 24);
                ctx.fillRect(36, 2, 22, 18); // Helmet with 'A'
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(46, 6, 4, 6);   // 'A' symbol

                if (pose === 'victory') {
                    // Shield orbiting around Dino
                    const orbitAngle = Date.now() / 150;
                    const shX = 30 + Math.cos(orbitAngle) * 35;
                    const shY = 22 + Math.sin(orbitAngle) * 14;
                    ctx.save();
                    ctx.shadowColor = '#3b82f6';
                    ctx.shadowBlur = 18;
                    ctx.fillStyle = '#dc2626';
                    ctx.beginPath(); ctx.arc(shX, shY, 11, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath(); ctx.arc(shX, shY, 8, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#1d4ed8';
                    ctx.beginPath(); ctx.arc(shX, shY, 5, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(shX - 2, shY - 2, 4, 4);
                    ctx.restore();
                } else {
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
                }

                const legOffset = (player.isJumping || pose === 'victory') ? 4 : Math.sin(Date.now() / 65) * 8;
                ctx.fillStyle = '#1d4ed8';
                ctx.fillRect(20, 38, 8, 12 + legOffset);
                ctx.fillRect(34, 38, 8, 12 - legOffset);

            } else if (gear === 'thanos') {
                // --- THANOS INFINITY GAUNTLET T-REX ---
                ctx.fillStyle = '#7e22ce'; // Titan purple armor
                ctx.fillRect(0, 20, 18, 10);
                ctx.fillRect(14, 14, 32, 24);
                ctx.fillRect(36, 2, 22, 18);

                // Gold Infinity Gauntlet with Glowing Stones
                const gauntletY = pose === 'victory' ? 6 : 16;
                ctx.fillStyle = '#f59e0b'; // Gold gauntlet glove
                ctx.fillRect(50, gauntletY, 12, 12);
                
                // Glowing Infinity Stones
                const colors = ['#38bdf8', '#ef4444', '#10b981', '#facc15', '#a855f7', '#fb923c'];
                colors.forEach((col, idx) => {
                    ctx.fillStyle = col;
                    ctx.fillRect(51 + (idx % 3) * 4, gauntletY + (idx < 3 ? 2 : 7), 3, 3);
                });

                if (pose === 'victory') {
                    // Cosmic Rainbow Shockwave Flare
                    ctx.save();
                    const pulse = (Math.sin(Date.now() / 80) + 1) * 6;
                    ctx.strokeStyle = '#c084fc';
                    ctx.shadowColor = '#c084fc';
                    ctx.shadowBlur = 20;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(56, gauntletY + 6, 16 + pulse, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }

                const legOffset = (player.isJumping || pose === 'victory') ? 4 : Math.sin(Date.now() / 65) * 8;
                ctx.fillStyle = '#581c87';
                ctx.fillRect(20, 38, 8, 12 + legOffset);
                ctx.fillRect(34, 38, 8, 12 - legOffset);

            } else {
                // Standard T-Rex
                ctx.fillStyle = '#15803d';
                ctx.fillRect(0, 20, 18, 10);
                ctx.fillRect(14, 14, 32, 24);
                ctx.fillRect(36, 2, 22, 18);
                const legOffset = (player.isJumping || pose === 'victory') ? 4 : Math.sin(Date.now() / 65) * 8;
                ctx.fillRect(20, 38, 8, 12 + legOffset);
                ctx.fillRect(34, 38, 8, 12 - legOffset);

                if (pose === 'victory') {
                    // Golden Crown on Dinosaur head!
                    ctx.fillStyle = '#facc15';
                    ctx.shadowColor = '#facc15';
                    ctx.shadowBlur = 12;
                    ctx.fillRect(40, -4, 16, 6);
                    ctx.fillRect(38, -8, 4, 5);
                    ctx.fillRect(46, -10, 4, 7);
                    ctx.fillRect(54, -8, 4, 5);
                    ctx.shadowBlur = 0;
                }
            }

        } else if (char === 'developer') {
            if (gear === 'ultron') {
                // --- ULTRON PROTOCOL (Menacing chrome/red robotic drone body) ---
                ctx.fillStyle = '#475569'; // Gunmetal torso
                ctx.fillRect(4, 12, player.width - 8, player.height - 16);
                ctx.fillStyle = '#94a3b8'; // Plated head
                ctx.fillRect(10, -4, player.width - 20, 16);
                ctx.fillStyle = '#ef4444'; // Glowing red optic sensor
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 8;
                ctx.fillRect(14, 2, player.width - 28, 4);
                ctx.shadowBlur = 0;
                const legOffset = (player.isJumping || pose === 'victory') ? 2 : Math.sin(Date.now() / 70) * 5;
                ctx.fillStyle = '#334155';
                ctx.fillRect(10, player.height - 8, 5, 10 + legOffset);
                ctx.fillRect(player.width - 15, player.height - 8, 5, 10 - legOffset);
                if (pose === 'victory') {
                    // Hovering repulsor thrusters underfoot
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
                    ctx.beginPath(); ctx.ellipse(12, player.height + 14, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.ellipse(player.width - 13, player.height + 14, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
                }
            } else if (gear === 'vision') {
                // --- VISION ANDROID (Crimson/gold synthezoid with Mind Stone) ---
                ctx.fillStyle = '#dc2626'; // Crimson synthetic body
                ctx.fillRect(6, 10, player.width - 12, player.height - 14);
                ctx.fillStyle = '#166534'; // Deep green cape-cowl
                ctx.fillRect(2, 6, 6, player.height - 6);
                ctx.fillStyle = '#facc15'; // Golden faceplate & cape trim
                ctx.fillRect(10, -4, player.width - 20, 14);
                ctx.fillStyle = '#a855f7'; // Glowing Mind Stone
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(player.width / 2, 2, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                const legOffset = (player.isJumping || pose === 'victory') ? 2 : Math.sin(Date.now() / 70) * 5;
                ctx.fillStyle = '#166534';
                ctx.fillRect(10, player.height - 8, 5, 10 + legOffset);
                ctx.fillRect(player.width - 15, player.height - 8, 5, 10 - legOffset);
                if (pose === 'victory' || player.isJumping) {
                    // Subtle phase-through translucency while airborne
                    ctx.globalAlpha *= 0.85;
                }
            } else {
                // --- STRESSED DEVELOPER (Standard) ---
                ctx.fillStyle = '#374151';
                ctx.fillRect(6, 12, 22, 14);
                ctx.fillStyle = '#00ff66';
                ctx.fillRect(8, 4, 18, 10);
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(14, -6, 10, 10);
                const legOffset = (player.isJumping || pose === 'victory') ? 2 : Math.sin(Date.now() / 70) * 6;
                ctx.fillStyle = '#6b7280';
                ctx.fillRect(10, 26, 4, 10 + legOffset);
                ctx.fillRect(20, 26, 4, 10 - legOffset);

                if (pose === 'victory') {
                    // Raising coffee mug
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(30, 2, 8, 10);
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(32, 4, 4, 2);
                }
            }

        } else if (char === 'astronaut') {
            if (gear === 'optimus') {
                // --- OPTIMUS PRIME TRUCK MODE (Boxy red/blue rig, ground vehicle) ---
                ctx.fillStyle = '#1d4ed8'; // Blue cab
                ctx.fillRect(0, 4, player.width * 0.55, player.height - 6);
                ctx.fillStyle = '#dc2626'; // Red trailer/flame body
                ctx.fillRect(player.width * 0.5, player.height * 0.25, player.width * 0.5, player.height * 0.6);
                ctx.fillStyle = '#94a3b8'; // Chrome grille & windshield
                ctx.fillRect(2, player.height * 0.35, player.width * 0.18, player.height * 0.3);
                ctx.fillStyle = '#facc15'; // Headlights
                ctx.fillRect(1, player.height - 10, 4, 4);
                ctx.fillStyle = '#0f172a'; // Wheels
                ctx.beginPath(); ctx.arc(10, player.height + 2, 6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(player.width - 12, player.height + 2, 6, 0, Math.PI * 2); ctx.fill();
                if (pose === 'victory') {
                    ctx.fillStyle = 'rgba(29, 78, 216, 0.5)';
                    ctx.shadowColor = '#3b82f6';
                    ctx.shadowBlur = 16;
                    ctx.fillRect(player.width * 0.3, -18, 6, 24);
                    ctx.shadowBlur = 0;
                }
            } else if (gear === 'bumblebee') {
                // --- BUMBLEBEE CAR MODE (Low, agile yellow/black roadster) ---
                ctx.fillStyle = '#facc15'; // Yellow body
                ctx.beginPath();
                ctx.moveTo(0, player.height);
                ctx.lineTo(4, player.height * 0.3);
                ctx.lineTo(player.width * 0.7, 2);
                ctx.lineTo(player.width, player.height * 0.4);
                ctx.lineTo(player.width, player.height);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#1e293b'; // Racing stripes
                ctx.fillRect(player.width * 0.2, 0, 6, player.height);
                ctx.fillStyle = '#38bdf8'; // Windshield
                ctx.fillRect(player.width * 0.45, player.height * 0.1, player.width * 0.25, player.height * 0.35);
                ctx.fillStyle = '#0f172a'; // Wheels
                ctx.beginPath(); ctx.arc(8, player.height + 1, 5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(player.width - 9, player.height + 1, 5, 0, Math.PI * 2); ctx.fill();
                if (pose === 'victory') {
                    ctx.fillStyle = 'rgba(250, 204, 21, 0.5)';
                    ctx.shadowColor = '#facc15';
                    ctx.shadowBlur = 14;
                    ctx.fillRect(-10, player.height * 0.4, 10, 6);
                    ctx.shadowBlur = 0;
                }
            } else {
                // --- SPACE EXPLORER / ROCKET FLIGHT MODE (Standard, true vertical flight) ---
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
                const flameStretch = player.isJumping ? 6 : 0;
                ctx.fillStyle = '#f97316';
                ctx.fillRect(-10 - flameStretch + Math.sin(Date.now() / 30) * 3, 12, 10 + flameStretch, 12);

                if (pose === 'victory') {
                    // Glowing mission flag
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(20, -16, 3, 28);
                    ctx.fillStyle = '#3b82f6';
                    ctx.fillRect(23, -16, 18, 12);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '7px "Press Start 2P", monospace';
                    ctx.fillText('A', 26, -7);
                }
            }
        }

        if (pose === 'death') {
            // Electrical short-circuit sparks
            ctx.strokeStyle = Math.random() > 0.5 ? '#38bdf8' : '#facc15';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const arcX = 8 + Math.random() * (player.width - 16);
            const arcY = 8 + Math.random() * (player.height - 16);
            ctx.moveTo(arcX, arcY);
            ctx.lineTo(arcX + (Math.random() - 0.5) * 14, arcY + (Math.random() - 0.5) * 14);
            ctx.lineTo(arcX + (Math.random() - 0.5) * 20, arcY + (Math.random() - 0.5) * 20);
            ctx.stroke();

            // Flashing damage tint
            ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
            ctx.fillRect(0, 0, player.width, player.height);
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

    function drawStaticGround(groundY, theme) {
        ctx.strokeStyle = theme.groundColor;
        ctx.shadowColor = theme.groundColor;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, groundY + player.height);
        ctx.lineTo(canvas.width, groundY + player.height);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // --- Death Replay Black Box Recorder ---
    function recordDeathReplayFrame() {
        if (!gameRunning || isPaused || isDying || isReplaying) return;
        const frame = {
            player: {
                x: player.x,
                y: player.y,
                width: player.width,
                height: player.height,
                isJumping: player.isJumping
            },
            obstacles: obstacles.map(o => ({
                x: o.x,
                y: o.y,
                width: o.width,
                height: o.height,
                isAir: o.isAir
            })),
            bossHazards: bossHazards.map(b => ({
                x: b.x,
                y: b.y,
                width: b.width || 16,
                height: b.height || 16,
                color: b.color || '#ef4444'
            })),
            score: score,
            speed: gameSpeed
        };
        deathReplayBuffer.push(frame);
        if (deathReplayBuffer.length > MAX_REPLAY_FRAMES) {
            deathReplayBuffer.shift();
        }
    }

    // --- Dramatic Death Animation Sequence Engine ---
    function startDeathSequence(cause, impactX, impactY, obstacleRef) {
        if (isDying) return;
        isDying = true;
        deathSequenceTimer = 0;

        // Save death replay snapshot buffer
        savedDeathReplay = deathReplayBuffer.slice();
        if (replayLaunchBtn) replayLaunchBtn.classList.remove("hidden");

        // Initial launch trajectory for the ragdoll death tumble
        deathPlayerState = {
            x: player.x,
            y: player.y,
            vx: -3.8 - Math.random() * 2.5,
            vy: -8.5 - Math.random() * 2.0,
            rotation: 0,
            rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.18 + Math.random() * 0.12),
            bounceCount: 0,
            cause: cause || 'CRITICAL IMPACT'
        };

        // Screen fx & audio crunch
        triggerScreenShake(18, 30, true);
        screenFlash = 0.8;
        playSfx('death_shatter');

        // High intensity shrapnel & explosion debris
        spawnObstacleExplosion(impactX || (player.x + player.width / 2), impactY || (player.y + player.height / 2), 'nuke');
        spawnFloatingText(player.x + 20, player.y - 20, "CRITICAL FAILURE!", "#ef4444");

        // Extra debris shards flying out
        for (let i = 0; i < 22; i++) {
            gameParticles.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.8) * 12,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.4 ? '#ef4444' : '#facc15',
                alpha: 1.0,
                decay: 0.025,
                gravity: 0.35,
                shape: 'spark'
            });
        }
    }

    function updateAndDrawDeathSequence() {
        deathSequenceTimer++;
        const groundY = getGroundY();
        const theme = characterConfig[selectedCharacter];

        // Screen shake decay during death
        let shakeX = (Math.random() - 0.5) * screenShakeIntensity * 2;
        let shakeY = (Math.random() - 0.5) * screenShakeIntensity * 2;
        screenShakeIntensity *= 0.92;

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Draw background, ground, etc. in frozen / slow-mo state
        drawDynamicBackground(0.4, groundY, player.height);
        drawStaticGround(groundY, theme);

        // Draw static frozen obstacles
        for (let obs of obstacles) {
            drawObstacle(obs);
        }

        // Apply physics to dying player
        deathPlayerState.x += deathPlayerState.vx;
        deathPlayerState.y += deathPlayerState.vy;
        deathPlayerState.vy += 0.45; // Gravity
        deathPlayerState.rotation += deathPlayerState.rotSpeed;

        // Ground bounce collision
        if (deathPlayerState.y + player.height >= groundY) {
            deathPlayerState.y = groundY - player.height;
            if (deathPlayerState.bounceCount < 2) {
                deathPlayerState.bounceCount++;
                deathPlayerState.vy = -deathPlayerState.vy * 0.4;
                deathPlayerState.vx *= 0.65;
                deathPlayerState.rotSpeed *= 0.6;
                triggerScreenShake(8, 12);
                playSfx('footstep');
                // Ground impact sparks
                for (let i = 0; i < 12; i++) {
                    gameParticles.push({
                        x: deathPlayerState.x + player.width / 2,
                        y: groundY,
                        vx: (Math.random() - 0.5) * 6,
                        vy: -Math.random() * 4,
                        size: 2 + Math.random() * 3,
                        color: '#facc15',
                        alpha: 1.0,
                        decay: 0.04,
                        gravity: 0.22,
                        shape: 'spark'
                    });
                }
            } else {
                deathPlayerState.vy = 0;
                deathPlayerState.vx *= 0.85;
                deathPlayerState.rotSpeed *= 0.8;
            }
        }

        // Trailing smoke & electrical short-circuit sparks from player during tumble
        if (deathSequenceTimer % 2 === 0) {
            gameParticles.push({
                x: deathPlayerState.x + player.width / 2 + (Math.random() - 0.5) * 16,
                y: deathPlayerState.y + player.height / 2 + (Math.random() - 0.5) * 16,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -1 - Math.random() * 1.5,
                size: 4 + Math.random() * 6,
                color: Math.random() > 0.4 ? '#475569' : '#facc15',
                alpha: 0.7,
                decay: 0.025,
                gravity: -0.02,
                shape: 'circle'
            });
        }

        // Draw player in death ragdoll/tumble pose
        drawPlayer(deathPlayerState.x, deathPlayerState.y, null, null, 'death');

        // Draw particle explosions
        updateAndDrawParticles();
        drawFloatingTexts();

        // Screen Flash Overlay on lethal impact
        if (screenFlash > 0) {
            ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(0.65, screenFlash)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            screenFlash -= 0.035;
        }

        // Deep crimson cinematic slow-mo vignette pulse
        const deathVignette = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.height * 0.2,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.75
        );
        deathVignette.addColorStop(0, 'rgba(239, 68, 68, 0)');
        deathVignette.addColorStop(1, `rgba(185, 28, 28, ${Math.min(0.55, deathSequenceTimer * 0.008)})`);
        ctx.fillStyle = deathVignette;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // "CRITICAL IMPACT" Warning Banner in center screen during final phase
        if (deathSequenceTimer > 28) {
            ctx.save();
            ctx.font = '14px "Press Start 2P", monospace';
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 14;
            ctx.textAlign = 'center';
            ctx.fillText("CRITICAL FAILURE", canvas.width / 2, canvas.height * 0.38);
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillStyle = '#facc15';
            ctx.fillText(deathPlayerState.cause.toUpperCase(), canvas.width / 2, canvas.height * 0.38 + 24);
            ctx.restore();
        }

        ctx.restore();

        // Transition to Game Over screen once the animation completes
        if (deathSequenceTimer >= deathDuration) {
            isDying = false;
            gameOver();
        }
    }

    // --- Victory Protocol Fireworks & Celebration Engine ---
    function spawnVictoryFireworksBurst(x, y) {
        const colors = ['#facc15', '#38bdf8', '#f43f5e', '#a855f7', '#22c55e', '#ffffff'];
        const burstColor = colors[Math.floor(Math.random() * colors.length)];
        const count = 30 + Math.floor(Math.random() * 15);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 6;
            victoryCelebrationParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: 3 + Math.random() * 5,
                color: burstColor,
                alpha: 1.0,
                decay: 0.012 + Math.random() * 0.01,
                gravity: 0.07,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                type: Math.random() > 0.4 ? 'star' : 'confetti'
            });
        }
        playSfx('debris_pop');
    }

    function triggerVictoryCelebration(isManual = false) {
        getAudioContext();
        hasTriggeredVictoryInRun = true;
        isVictoryCelebrationActive = true;
        victoryCelebrationTimer = 0;
        victoryCelebrationParticles = [];
        playSfx('victory');
        triggerScreenShake(8, 16);
        screenFlash = 0.5;

        menuOverlay.classList.add("hidden");
        pauseOverlay.classList.add("hidden");
        if (victoryModal) victoryModal.classList.add("hidden");
        if (deathReplayHud) deathReplayHud.classList.add("hidden");
        if (mobileControlsBar) mobileControlsBar.classList.remove("hidden");
        if (pauseBtn) pauseBtn.classList.remove("hidden");

        const groundY = getGroundY();
        player.baseX = getPlayerBaseX();
        player.x = player.baseX;
        player.targetX = player.baseX;
        player.y = groundY - player.height;

        spawnFloatingText(player.x + player.width / 2, player.y - 35, "★ MISSION ACCOMPLISHED! ★", "#facc15");
        spawnVictoryFireworksBurst(player.x + 80, 100);
        spawnVictoryFireworksBurst(player.x - 40, 140);
        spawnVictoryFireworksBurst(canvas.width * 0.7, 80);

        if (!gameRunning) {
            gameRunning = true;
            isPaused = false;
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    function updateAndDrawVictoryCelebration() {
        ctx.save();

        // Golden celebratory god rays / radial glow
        const victoryGlow = ctx.createRadialGradient(
            player.x + player.width / 2, player.y, 20,
            player.x + player.width / 2, player.y, canvas.width * 0.6
        );
        victoryGlow.addColorStop(0, 'rgba(250, 204, 21, 0.22)');
        victoryGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
        victoryGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = victoryGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw fireworks particles
        for (let i = victoryCelebrationParticles.length - 1; i >= 0; i--) {
            const p = victoryCelebrationParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0.08;
            p.vx *= 0.98;
            p.alpha -= p.decay || 0.015;
            p.rotation += p.rotSpeed || 0.05;

            if (p.alpha <= 0) {
                victoryCelebrationParticles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;

            if (p.type === 'star') {
                ctx.beginPath();
                for (let s = 0; s < 5; s++) {
                    ctx.lineTo(Math.cos((18 + s * 72) * Math.PI / 180) * p.size,
                               -Math.sin((18 + s * 72) * Math.PI / 180) * p.size);
                    ctx.lineTo(Math.cos((54 + s * 72) * Math.PI / 180) * (p.size * 0.5),
                               -Math.sin((54 + s * 72) * Math.PI / 180) * (p.size * 0.5));
                }
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.8);
            }
            ctx.restore();
        }

        // Floating Celebratory Banner at top of screen
        const bannerY = Math.min(60, 20 + victoryCelebrationTimer * 0.6);
        ctx.fillStyle = 'rgba(15, 15, 22, 0.88)';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 16;
        
        const bannerW = Math.min(canvas.width * 0.75, 460);
        const bannerX = (canvas.width - bannerW) / 2;
        ctx.fillRect(bannerX, bannerY, bannerW, 36);
        ctx.strokeRect(bannerX, bannerY, bannerW, 36);
        ctx.shadowBlur = 0;

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'center';
        ctx.fillText("★ VICTORY PROTOCOL ACHIEVED! ★", canvas.width / 2, bannerY + 22);

        ctx.restore();
    }

    function openVictoryModal() {
        if (!victoryModal) return;
        
        const charName = selectedCharacter === 'dino' ? 'T-REX DINO' : (selectedCharacter === 'developer' ? 'CYBER DEV' : 'SPACE EXPLORER');
        const formKey = selectedCharacter === 'dino' ? dinoGearMode : (selectedCharacter === 'developer' ? developerFormMode : astronautFormMode);
        const formInfo = formConfig[selectedCharacter] ? formConfig[selectedCharacter].forms[formKey] : null;
        const formTitle = formInfo ? formInfo.label.toUpperCase() : formKey.toUpperCase();

        if (victoryHeroBanner) {
            victoryHeroBanner.innerHTML = `
                <div class="hero-victory-pill">
                    <span class="hero-badge-tag">${charName}</span>
                    <span class="hero-suit-tag">⚡ ${formTitle}</span>
                </div>
            `;
        }

        if (victoryFinalScoreEl) victoryFinalScoreEl.innerText = String(score).padStart(5, '0');
        if (victoryMaxComboEl) victoryMaxComboEl.innerText = `${maxCombo}x`;
        if (victoryDiffEl) victoryDiffEl.innerText = difficultyConfig[currentDiff].name;
        
        let rank = "A-TIER";
        if (score >= 2000 || maxCombo >= 20) rank = "GODLIKE";
        else if (score >= 1200 || maxCombo >= 14) rank = "S-TIER";
        else if (score >= 800 || maxCombo >= 8) rank = "AVENGER";
        if (victoryRankEl) victoryRankEl.innerText = rank;

        if (pauseBtn) pauseBtn.classList.add("hidden");
        if (mobileControlsBar) mobileControlsBar.classList.add("hidden");
        victoryModal.classList.remove("hidden");
    }

    // --- Death Replay Flight Recorder Controls ---
    function startDeathReplay() {
        if (!savedDeathReplay || savedDeathReplay.length === 0) return;
        isReplaying = true;
        replayFrameIndex = 0;
        replayPaused = false;
        menuOverlay.classList.add("hidden");
        pauseOverlay.classList.add("hidden");
        if (victoryModal) victoryModal.classList.add("hidden");
        if (deathReplayHud) deathReplayHud.classList.remove("hidden");
        if (mobileControlsBar) mobileControlsBar.classList.add("hidden");
        playSfx('death_rewind');
        if (replayToggleBtn) replayToggleBtn.innerText = "⏸ PAUSE";
        runDeathReplayLoop();
    }

    function rewindDeathReplay() {
        replayFrameIndex = 0;
        replayPaused = false;
        playSfx('death_rewind');
        if (replayToggleBtn) replayToggleBtn.innerText = "⏸ PAUSE";
    }

    function toggleDeathReplayPause() {
        replayPaused = !replayPaused;
        playSfx('select');
        if (replayToggleBtn) replayToggleBtn.innerText = replayPaused ? "▶ PLAY" : "⏸ PAUSE";
    }

    function cycleDeathReplaySpeed() {
        const speeds = [0.2, 0.4, 1.0];
        const idx = speeds.indexOf(replaySpeed);
        replaySpeed = speeds[(idx + 1) % speeds.length];
        playSfx('select');
        if (replaySpeedBtn) replaySpeedBtn.innerText = `${replaySpeed}x SPEED`;
    }

    function exitDeathReplay() {
        isReplaying = false;
        if (replayRafId) cancelAnimationFrame(replayRafId);
        if (deathReplayHud) deathReplayHud.classList.add("hidden");
        menuOverlay.classList.remove("hidden");
    }

    function runDeathReplayLoop() {
        if (!isReplaying) return;

        if (!replayPaused && savedDeathReplay && savedDeathReplay.length > 0) {
            replayFrameIndex += replaySpeed;
            if (replayFrameIndex >= savedDeathReplay.length - 1) {
                replayFrameIndex = savedDeathReplay.length - 1;
                replayPaused = true;
                if (replayToggleBtn) replayToggleBtn.innerText = "▶ PLAY";
            }
        }

        const currentFrame = savedDeathReplay[Math.floor(replayFrameIndex)] || savedDeathReplay[0];
        const groundY = getGroundY();
        const theme = characterConfig[selectedCharacter];

        // Draw background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawDynamicBackground(0.5, groundY, player.height);
        drawStaticGround(groundY, theme);

        if (currentFrame) {
            // Draw obstacles from snapshot
            for (let obs of currentFrame.obstacles) {
                drawObstacle(obs);
            }
            // Draw boss hazards
            for (let b of currentFrame.bossHazards) {
                ctx.save();
                ctx.fillStyle = b.color || '#ef4444';
                ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
                ctx.restore();
            }

            // Draw player
            const p = currentFrame.player;
            const isFatalFrame = Math.floor(replayFrameIndex) >= savedDeathReplay.length - 4;
            drawPlayer(p.x, p.y, null, null, isFatalFrame ? 'death' : 'normal');

            // Draw targeting reticle at fatal impact frame
            if (isFatalFrame) {
                ctx.save();
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 28, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#ef4444';
                ctx.font = '9px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText("FATAL HIT", p.x + p.width / 2, p.y - 12);
                ctx.restore();
            }

            // Update Timecode
            if (replayTimecodeEl) {
                const remainingSec = Math.max(0, (savedDeathReplay.length - 1 - replayFrameIndex) / 60);
                replayTimecodeEl.innerText = `T-${remainingSec.toFixed(2)}s / IMPACT`;
            }
        }

        // CRT Scanline Overlay for Death Replay
        ctx.save();
        ctx.fillStyle = 'rgba(18, 18, 24, 0.15)';
        for (let y = 0; y < canvas.height; y += 4) {
            ctx.fillRect(0, y, canvas.width, 1);
        }
        ctx.restore();

        replayRafId = requestAnimationFrame(runDeathReplayLoop);
    }

    function gameLoop() {
        if (!gameRunning || isPaused) return;

        // If dying, execute the death animation sequence
        if (isDying) {
            updateAndDrawDeathSequence();
            animationId = requestAnimationFrame(gameLoop);
            return;
        }

        // Record black box flight recorder frame
        recordDeathReplayFrame();

        // Victory celebration ticking and fireworks
        if (isVictoryCelebrationActive) {
            victoryCelebrationTimer++;
            if (victoryCelebrationTimer % 14 === 0) {
                spawnVictoryFireworksBurst(
                    Math.random() * (canvas.width - 100) + 50,
                    Math.random() * (canvas.height * 0.45) + 40
                );
            }
        }

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

        // Energon Overdrive countdown + Boss Threat spawn checks
        updateOverdriveTimer();
        maybeSpawnPrimaryBoss(groundY);
        maybeSpawnGalactus();

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

        // Boss Threat Engine: background cosmic looming + ground-level chaser
        updateAndDrawGalactus(groundY);
        updateAndDrawPrimaryBoss(groundY);

        ctx.strokeStyle = theme.groundColor;
        ctx.shadowColor = theme.groundColor;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, groundY + player.height);
        ctx.lineTo(canvas.width, groundY + player.height);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Dynamic Forward Stance & Kinetic World Traversal
        // Adjusts the player's horizontal positioning so they actively surge forward
        // into the world rather than remaining locked statically against the screen edge.
        // Provides ample rear maneuver space to observe and evade active chasers behind.
        const flightActive = isFlightFormActive() || temporaryFlightOverride > 0;
        if (temporaryFlightOverride > 0) temporaryFlightOverride--;
        const FLIGHT_CEILING = 12; // highest the player can thrust to (px from canvas top)
        const FLIGHT_THRUST = -0.9; // per-frame acceleration while thrust key is held

        player.baseX = getPlayerBaseX();
        let targetPlayerX = player.baseX;

        // 1. Kinetic speed surge: higher running speeds press the character into a forward sprint lead
        const speedLead = Math.min(55, Math.max(0, (effectiveSpeed - 6) * 5.5));
        targetPlayerX += speedLead;

        // 2. Flight / thruster aerodynamic propulsion
        if (flightActive && player.isJumping) {
            targetPlayerX += 18;
        }

        // 3. Energon Overdrive warp surge
        if (overdriveActive) {
            targetPlayerX += 45;
        }

        // 4. Evasive instinct: when chaser boss telegraphs an attack from behind, pull forward
        if (activeBoss && activeBoss.state === 'telegraph') {
            targetPlayerX += 28;
        }

        player.targetX = targetPlayerX;
        player.x += (player.targetX - player.x) * 0.08;

        if (flightActive && player.isJumping) {
            // True vertical flight: hold jump to thrust up, release to glide down.
            if (jumpKeyHeld) {
                player.vy += FLIGHT_THRUST;
                if (player.vy < -8) player.vy = -8;
                if (Math.random() < 0.6) spawnJumpParticles(player.x + player.width / 2, player.y + player.height);
            } else {
                player.vy += player.gravity;
                if (player.vy > 6) player.vy = 6;
            }
            player.y += player.vy;

            if (player.y < FLIGHT_CEILING) {
                player.y = FLIGHT_CEILING;
                player.vy = 0;
            }
        } else {
            player.vy += player.gravity;
            player.y += player.vy;
        }

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
        // Flight forms trail thruster exhaust while airborne
        if (flightActive && player.isJumping && Math.random() < 0.5) {
            spawnRunParticles(player.x + 4, player.y + player.height * 0.6);
        }

        // Draw Player with invincibility / shield effects / victory pose
        const currentPose = isVictoryCelebrationActive ? 'victory' : 'normal';
        drawPlayer(player.x, player.y, null, null, currentPose);

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

        // Energon Overdrive neon aura
        drawOverdriveAura();

        // Boss hazards (shockwaves / plasma bolts / cosmic debris) + portals
        updateAndDrawBossHazards();
        maybeSpawnPortal(groundY);
        updateAndDrawPortals(effectiveSpeed);

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
            } else if (p.type === 'optimus_blast') {
                ctx.fillStyle = '#2563eb'; // Optimus Prime cannon shot
                ctx.fillRect(p.x, p.y, p.width, p.height);
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(p.x, p.y - 2, p.width * 0.4, 2);
            } else if (p.type === 'bee_blast') {
                ctx.fillStyle = '#facc15'; // Bumblebee twin plasma bolts
                ctx.fillRect(p.x, p.y, p.width, p.height);
            } else if (p.type === 'ultron_drone') {
                ctx.fillStyle = '#94a3b8'; // Ultron drone missile
                ctx.fillRect(p.x, p.y, p.width, p.height);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(p.x + p.width - 4, p.y + 1, 3, p.height - 2);
            } else if (p.type === 'vision_beam') {
                ctx.fillStyle = 'rgba(168, 85, 247, 0.85)'; // Vision mind-stone beam
                ctx.fillRect(p.x, p.y, p.width, p.height);
                ctx.fillStyle = '#facc15';
                ctx.fillRect(p.x + p.width / 2 - 3, p.y + p.height / 2 - 3, 6, 6);
            } else {
                ctx.fillStyle = '#00ff66';
                ctx.fillRect(p.x, p.y, p.width, p.height);
            }

            for (let o = obstacles.length - 1; o >= 0; o--) {
                let obs = obstacles[o];
                if (p.x < obs.x + obs.width && p.x + p.width > obs.x && p.y < obs.y + obs.height && p.y + p.height > obs.y) {
                    if (!p.pierce) projectiles.splice(l, 1);
                    obstacles.splice(o, 1);
                    const pts = Math.round(30 * diffCfg.scoreMultiplier * (activeBuffs.doubleTimer > 0 ? 2 : 1) * comboMultiplier);
                    addScore(pts);
                    addCombo(1, obs.x, obs.y, 'HIT');
                    spawnObstacleExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, p.type);
                    spawnFloatingText(obs.x, obs.y - 10, `+${pts}`, "#facc15");
                    playSfx('hit');
                    playSfx('debris_pop');
                    triggerScreenShake(5, 10);
                    // Piercing beams keep traveling and can hit more obstacles this frame;
                    // non-piercing projectiles despawn on first hit.
                    if (!p.pierce) break;
                }
            }

            // Piercing/ranged attacks can also blast down boss hazards
            // (shockwaves, plasma bolts, Galactus debris) before they connect.
            for (let h = bossHazards.length - 1; h >= 0; h--) {
                const hz = bossHazards[h];
                const hitX = hz.x - hz.width / 2, hitY = hz.y - hz.height / 2;
                if (p.x < hitX + hz.width && p.x + p.width > hitX && p.y < hitY + hz.height && p.y + p.height > hitY) {
                    if (!p.pierce) projectiles.splice(l, 1);
                    bossHazards.splice(h, 1);
                    const pts = Math.round(40 * diffCfg.scoreMultiplier * (activeBuffs.doubleTimer > 0 ? 2 : 1) * comboMultiplier);
                    addScore(pts);
                    addCombo(1, hz.x, hz.y, 'HIT');
                    addEnergon(8);
                    spawnObstacleExplosion(hz.x, hz.y, p.type);
                    spawnFloatingText(hz.x, hz.y - 10, `+${pts}`, "#facc15");
                    playSfx('hit');
                    triggerScreenShake(5, 10);
                    if (!p.pierce) break;
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
                { type: 'double', icon: '⭐', color: '#f59e0b', name: '2X SCORE' },
                { type: 'energon', icon: '🔋', color: '#fde047', name: 'ENERGON NODE' }
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
                } else if (pu.type === 'energon') {
                    addEnergon(35);
                    spawnFloatingText(player.x + 10, player.y - 15, "🔋 ENERGON +35%!", "#fde047");
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

            // Track the closest vertical clearance seen while this obstacle is
            // near the player, used for the Danger Close near-miss bonus below.
            if (obs.x < player.x + player.width + 40 && obs.x + obs.width > player.x - 40) {
                const gap = player.isJumping ? Math.abs((player.y + player.height) - obs.y) : Infinity;
                if (obs.minGapSeen === undefined || gap < obs.minGapSeen) obs.minGapSeen = gap;
            }

            // Collision detection
            if (player.x < obs.x + obs.width && player.x + player.width > obs.x && player.y < obs.y + obs.height && player.y + player.height > obs.y) {
                if (overdriveActive) {
                    // Overdrive Ultimate State: auto-shred anything touched
                    obstacles.splice(i, 1);
                    const pts = Math.round(20 * diffCfg.scoreMultiplier * (activeBuffs.doubleTimer > 0 ? 2 : 1));
                    addScore(pts);
                    addCombo(1, obs.x, obs.y, 'HIT');
                    spawnObstacleExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, 'nuke');
                    playSfx('debris_pop');
                    continue;
                } else if (activeBuffs.invincibleTimer > 0) {
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
                    startDeathSequence('OBSTACLE IMPACT', obs.x + obs.width / 2, obs.y + obs.height / 2, obs);
                    return;
                }
            }

            // Obstacle cleared player safely without collision -> Increment combo!
            // A tight vertical clearance ("Danger Close") earns a bigger bonus.
            if (!obs.comboScored && obs.x + obs.width < player.x) {
                obs.comboScored = true;
                const isDangerClose = obs.minGapSeen !== undefined && obs.minGapSeen < DANGER_CLOSE_MARGIN;
                if (isDangerClose) {
                    dangerCloseStreak++;
                    const bonus = Math.round(15 * diffCfg.scoreMultiplier * comboMultiplier);
                    addScore(bonus);
                    addEnergon(10);
                    addCombo(2, player.x + player.width / 2, player.y - 20, 'DANGER');
                    spawnFloatingText(player.x + player.width / 2, player.y - 32, `⭐ DANGER CLOSE! +${bonus}`, "#fb923c");
                    triggerScreenShake(3, 6);
                } else {
                    dangerCloseStreak = 0;
                    addCombo(1, player.x + player.width / 2, player.y - 12, 'DODGE');
                    addEnergon(3);
                }
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

        // Victory Protocol Celebration Overlay & Fireworks
        if (isVictoryCelebrationActive) {
            updateAndDrawVictoryCelebration();
            if (victoryCelebrationTimer >= 180) {
                isVictoryCelebrationActive = false;
                openVictoryModal();
            }
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
        isDying = false;
        cancelAnimationFrame(animationId);
        triggerScreenShake(16, 28, true);
        visualScore = score;
        if (currentScoreEl) currentScoreEl.innerText = String(score).padStart(5, '0');
        if (pauseBtn) pauseBtn.classList.add("hidden");
        if (powerupHud) powerupHud.classList.add("hidden");
        if (comboBadge) comboBadge.classList.add("hidden");
        if (energonHud) energonHud.classList.add("hidden");
        if (bossWarningEl) bossWarningEl.classList.add("hidden");
        if (mobileControlsBar) mobileControlsBar.classList.add("hidden");
        if (savedDeathReplay && savedDeathReplay.length > 0 && replayLaunchBtn) {
            replayLaunchBtn.classList.remove("hidden");
        }
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