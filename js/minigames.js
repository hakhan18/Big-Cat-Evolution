class Minigame {
    constructor(game, type) {
        this.game = game;
        this.type = type;
        this.ctx = game.ctx;
        this.width = game.width;
        this.height = game.height;
        this.score = 0;
        this.active = true;
        this.timer = 0;

        // Physics & State
        this.gravity = 0.6;
        this.playerY = 400;
        this.playerX = 100;
        this.velocityY = 0;
        this.isJumping = false;

        this.obstacles = [];
        this.coins = [];
        this.platforms = [];
        this.monkeys = [];

        this.gameSpeed = 5;

        // Input state helpers
        this.lastSpacePressed = false;

        if (type === 'speed') this.setupSpeed();
        if (type === 'strength') this.setupStrength();
        if (type === 'swim') this.setupSwim();
        if (type === 'climb') this.setupClimb();
    }

    destroy() {
        this.active = false;
        // No local listeners to remove now!
    }

    // Called by Game.keys
    checkInput() {
        const spacePressed = this.game.keys['Space'] || this.game.keys['ArrowUp'];
        const leftPressed = this.game.keys['ArrowLeft'];
        const rightPressed = this.game.keys['ArrowRight'];

        if (spacePressed) {
            if (this.type === 'speed' && !this.isJumping && !this.lastSpacePressed) {
                this.velocityY = -12;
                this.isJumping = true;
            }
            // Vertical Swim (Up is handled by space/up check generally, but let's be specific)
            if (this.type === 'swim') {
                this.velocityY -= 0.5;
            }
            if (this.type === 'climb' && this.jumps < this.maxJumps && !this.lastSpacePressed) {
                this.velocityY = -15;
                this.isJumping = true;
                this.jumps++;
            }
        }

        // Swim Down (Independent of space)
        if (this.type === 'swim' && this.game.keys['ArrowDown']) {
            this.velocityY += 0.5;
        }

        // Horizontal for Climb AND Swim
        if (this.type === 'climb' || this.type === 'swim') {
            if (leftPressed) this.playerX -= 5;
            if (rightPressed) this.playerX += 5;
        }

        this.lastSpacePressed = spacePressed;
    }

    handleClick(e) {
        if (this.type === 'strength') {
            this.attackDummy();
        }
    }

    update() {
        if (!this.active) return;

        // Energy Drain: Slight decrease over time
        if (this.game.player.energy > 0) {
            this.game.player.energy -= 0.02; // ~1.2 per second
            if (this.game.player.energy < 0) this.game.player.energy = 0;
        }

        this.checkInput();

        if (this.type === 'speed') this.updateSpeed();
        if (this.type === 'strength') this.updateStrength();
        if (this.type === 'swim') this.updateSwim();
        if (this.type === 'climb') this.updateClimb();

        if (this.type !== 'strength') {
            this.checkCollisions();
        }
    }

    draw() {
        if (this.type === 'speed') this.drawSpeed();
        if (this.type === 'strength') this.drawStrength();
        if (this.type === 'swim') this.drawSwim();
        if (this.type === 'climb') this.drawClimb();

        this.drawUI();
    }

    drawUI() {
        // UI: Score & Progress
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(0, 0, this.width, 60);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 35);

        // Stat Progress Logic
        let statName = '';
        if (this.type === 'speed') statName = 'run';
        if (this.type === 'strength') statName = 'strength';
        if (this.type === 'swim') statName = 'swim';
        if (this.type === 'climb') statName = 'climb';

        if (statName) {
            const val = this.game.player.stats[statName];
            const max = this.game.player.statCaps[statName];

            this.ctx.fillText(`${statName.toUpperCase()} LVL: ${Math.floor(val)}/${max}`, 120, 35);

            // Level Up Bar
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(400, 15, 200, 20);
            this.ctx.fillStyle = '#00ff00';
            const pct = (val / max) * 200;
            this.ctx.fillRect(400, 15, pct, 20);
        }
    }

    // ================= SPEED =================
    setupSpeed() {
        this.obstacles = [];
        this.coins = [];
        this.gameSpeed = 6 + (this.game.player.stats.run * 0.1);
        this.groundY = 450;
        this.playerY = this.groundY - 50;
        this.spawnTimer = 0;
        this.nextSpawnTime = 100;
    }

    updateSpeed() {
        this.gameSpeed += 0.001; // Minimal Progressive Speed
        this.playerY += this.velocityY;
        this.velocityY += this.gravity;

        if (this.playerY > this.groundY - 50) {
            this.playerY = this.groundY - 50;
            this.velocityY = 0;
            this.isJumping = false;
        }

        this.spawnTimer++;
        if (this.spawnTimer > this.nextSpawnTime) {
            this.spawnTimer = 0;
            this.nextSpawnTime = 60 + Math.random() * 80; // Varied: 1s to 2.5s gaps
            const isBuffalo = Math.random() > 0.7;
            this.obstacles.push({
                x: this.width,
                y: this.groundY - (isBuffalo ? 60 : 40),
                w: isBuffalo ? 80 : 40,
                h: isBuffalo ? 60 : 40,
                type: isBuffalo ? 'buffalo' : 'bush'
            });
            if (Math.random() > 0.5) {
                this.coins.push({
                    x: this.width + 200,
                    y: this.groundY - 40,
                    w: 30, h: 30
                });
            }
        }

        this.obstacles.forEach(o => o.x -= this.gameSpeed);
        this.coins.forEach(c => c.x -= this.gameSpeed);
        this.obstacles = this.obstacles.filter(o => o.x > -100);
        this.coins = this.coins.filter(c => c.x > -100);
    }

    drawSpeed() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#e67e22';
        this.ctx.fillRect(0, 450, this.width, 150);
        this.game.player.draw(this.ctx, this.playerX, this.playerY, 50, 50);

        this.obstacles.forEach(o => {
            if (o.type === 'buffalo') {
                this.drawBuffalo(this.ctx, o.x, o.y, o.w, o.h);
            } else {
                // Bush
                this.ctx.fillStyle = '#7f857bff';
                this.fillRoundedRect(this.ctx, o.x, o.y, o.w, o.h, 10);
            }
        });

        this.coins.forEach(c => {
            this.drawAntelope(this.ctx, c.x, c.y, c.w, c.h);
        });
    }

    drawBuffalo(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        const scale = w / 80;
        ctx.scale(scale, scale);

        const color = '#3e2723';
        // Tail
        ctx.strokeStyle = color;
        ctx.lineWidth = 8; // Thicker
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-30, -5);
        ctx.quadraticCurveTo(-50, 5, -45, 20);
        ctx.stroke();

        // Tail Tuft
        ctx.fillStyle = 'rgba(30, 10, 10, 1)'; // Dark
        ctx.beginPath();
        const bTx = -45, bTy = 20;
        ctx.moveTo(bTx, bTy);
        ctx.quadraticCurveTo(bTx + 6, bTy + 6, bTx, bTy + 16);
        ctx.quadraticCurveTo(bTx - 6, bTy + 6, bTx, bTy);
        ctx.fill();

        // Legs
        ctx.fillStyle = color;
        ctx.fillRect(-35, 15, 10, 20);
        ctx.fillRect(-15, 15, 10, 20);
        ctx.fillRect(10, 15, 10, 20);
        ctx.fillRect(25, 15, 10, 20);

        // Body
        ctx.fillStyle = color;
        this.fillRoundedRect(ctx, -40, -10, 85, 40, 10);

        // Head
        ctx.beginPath();
        ctx.arc(35, -15, 22, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = 'rgba(49, 15, 15, 1)';
        ctx.beginPath();
        ctx.ellipse(50, -5, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(30, -22, 3, 0, Math.PI * 2); // Increased separation
        ctx.arc(50, -22, 3, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.strokeStyle = '#a1887f'; // Darker/thicker
        ctx.lineWidth = 12; // Thicker
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Raised start (-25), Angled out (Control X wider, End X wider)
        ctx.moveTo(35 - 25, -25);
        ctx.quadraticCurveTo(35 - 55, -60, 35 - 25, -65); // Tip angled out more
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(35 + 25, -25);
        ctx.quadraticCurveTo(35 + 55, -60, 35 + 25, -65);
        ctx.stroke();

        ctx.restore();
    }

    drawAntelope(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        const scale = w / 40;
        ctx.scale(scale, scale);

        const color = '#a1887f';
        // Legs
        ctx.fillStyle = color;
        ctx.fillRect(-12, 5, 4, 15);
        ctx.fillRect(-4, 5, 4, 15);
        ctx.fillRect(4, 5, 4, 15);
        ctx.fillRect(10, 5, 4, 15);

        // Body
        ctx.fillStyle = color;
        this.fillRoundedRect(ctx, -15, -5, 30, 18, 5);

        // Head
        ctx.beginPath();
        ctx.arc(15, -10, 12, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#8d6e63'; // Slightly darker skin shade
        ctx.beginPath();
        ctx.ellipse(22, -6, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (Dots, far apart)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(13, -14, 1, 0, Math.PI * 2);
        ctx.arc(24, -14, 1, 0, Math.PI * 2);
        ctx.fill();

        // Horns (Thicker, darker, less angled out)
        ctx.strokeStyle = '#2d1b17';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(15 - 5, -18);
        ctx.lineTo(15 - 7, -35); // Less angled out
        ctx.moveTo(15 + 5, -18);
        ctx.lineTo(15 + 7, -35);
        ctx.stroke();

        ctx.restore();
    }

    // ================= STRENGTH =================
    setupStrength() {
        this.dummyHp = 100;
        this.maxDummyHp = 100;
        this.timeLeft = 300;
        this.hits = 0;
    }

    updateStrength() {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
            this.endMinigame();
        }
    }

    attackDummy() {
        if (!this.active) return;
        this.hits++;
        this.dummyHp -= 10 + (this.game.player.stats.strength * 0.5);
        if (this.dummyHp <= 0) {
            this.score += 1;
            this.game.player.train('strength', 1);
            this.dummyHp = this.maxDummyHp;

            // Progressive Difficulty: Less time back per cycle
            // Base 20. Decrease by 1 every 5 hits (1 cycle = ~5-10 hits depending on strength)
            // Or simpler: count clears via score?
            const cycle = this.score / 5;
            const bonusTime = Math.max(5, 20 - (cycle * 2));

            this.timeLeft += bonusTime;
            console.log(`Dummy destroyed! Bonus: ${bonusTime}s`);
        }
    }

    drawStrength() {
        this.ctx.fillStyle = '#f39c12';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.game.player.draw(this.ctx, 200, 300, 100, 100);

        // Zebra Dummy
        this.drawZebra(this.ctx, 500, 300, 120, 120, this.hits % 5 === 0);

        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(500, 250, 120, 10);
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(500, 250, (this.dummyHp / this.maxDummyHp) * 120, 10);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Time: ${(this.timeLeft / 60).toFixed(1)}`, 400, 100);
        this.ctx.fillText(`Click/Tap to Attack!`, 400, 520);
    }

    drawZebra(ctx, x, y, w, h, isHit) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        const scale = w / 100;
        ctx.scale(scale, scale);

        if (isHit) ctx.translate(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);

        const baseColor = isHit ? '#ffcdd2' : 'white';

        // Tail
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 8; // Thicker
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-30, -5);
        ctx.quadraticCurveTo(-50, 5, -45, 20);
        ctx.stroke();

        // Tail Tuft
        ctx.fillStyle = 'black';
        ctx.beginPath();
        const zTx = -45, zTy = 20;
        ctx.moveTo(zTx, zTy);
        ctx.quadraticCurveTo(zTx + 6, zTy + 6, zTx, zTy + 16);
        ctx.quadraticCurveTo(zTx - 6, zTy + 6, zTx, zTy);
        ctx.fill();

        // Legs
        ctx.fillStyle = baseColor;
        ctx.fillRect(-35, 35, 10, 25);
        ctx.fillRect(-15, 35, 10, 25);
        ctx.fillRect(10, 35, 10, 25);
        ctx.fillRect(25, 35, 10, 25);
        // Hooves/Stripes on legs
        ctx.fillStyle = 'black';
        ctx.fillRect(-35, 50, 10, 5);
        ctx.fillRect(-15, 50, 10, 5);
        ctx.fillRect(10, 50, 10, 5);
        ctx.fillRect(25, 50, 10, 5);

        // Body
        ctx.fillStyle = baseColor;
        this.fillRoundedRect(ctx, -40, -10, 80, 50, 10);

        // Stripes on body
        ctx.fillStyle = 'black';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(-30 + (i * 15), -10, 6, 50);
        }

        // Head
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(35, -25, 30, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#000000ff';
        ctx.beginPath();
        ctx.ellipse(50, -15, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.ellipse(20, -50, 8, 15, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(50, -50, 8, 15, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // Stripes on head
        ctx.fillStyle = 'black';
        ctx.fillRect(35 - 16, -50, 4, 30);
        ctx.fillRect(35 + 0, -50, 4, 30);
        ctx.fillRect(35 + 16, -50, 4, 30);

        // Eyes (Two eyes)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(35, -30, 3, 0, Math.PI * 2);
        ctx.arc(55, -30, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    fillRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        ctx.fill();
    }

    // ================= SWIM =================
    setupSwim() {
        this.obstacles = [];
        this.coins = [];
        this.gameSpeed = 4 + (this.game.player.stats.swim * 0.1);
        this.playerY = 300;
        this.spawnTimer = 0;
        this.gravity = 0.3;
        this.velocityY = 0;
    }

    updateSwim() {
        this.gameSpeed += 0.001; // Minimal Progressive Speed
        this.playerY += this.velocityY;

        // Drag instead of gravity for swim
        this.velocityY *= 0.95;

        if (this.playerY < 0) this.playerY = 0;
        if (this.playerY > this.height - 50) this.playerY = this.height - 50;
        this.spawnTimer++;
        if (this.spawnTimer > 120) {
            this.spawnTimer = 0;
            const topOrBottom = Math.random() > 0.5;
            this.obstacles.push({
                x: this.width,
                y: topOrBottom ? 0 : this.height - 200,
                w: 60, h: 200, type: 'tree'
            });
            this.coins.push({
                x: this.width + 100,
                y: Math.random() * (this.height - 100),
                w: 20, h: 20
            });
        }
        this.obstacles.forEach(o => o.x -= this.gameSpeed);
        this.coins.forEach(c => c.x -= this.gameSpeed);
        this.obstacles = this.obstacles.filter(o => o.x > -100);
        this.coins = this.coins.filter(c => c.x > -100);
    }

    drawSwim() {
        this.ctx.fillStyle = '#3498db'; // Water
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Bubbles in background
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.arc(100 + i * 150, (this.timer + i * 100) % 600, 10, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.timer++;

        this.game.player.draw(this.ctx, this.playerX, this.playerY, 50, 50);

        // Seaweed/Obstacles
        this.ctx.fillStyle = '#1b5e20';
        this.obstacles.forEach(o => {
            this.fillRoundedRect(this.ctx, o.x, o.y, o.w, o.h, 15);
        });

        // Fish Collectibles
        this.coins.forEach(c => {
            this.drawFish(this.ctx, c.x, c.y, c.w, c.h);
        });
    }

    drawFish(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.fillStyle = '#ff7043'; // Orange fish

        // Body (Ellipse-like)
        ctx.beginPath();
        ctx.scale(1.5, 0.8);
        ctx.arc(0, 0, w / 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset for tail
        ctx.translate(x + w / 2, y + h / 2);

        // Tail
        ctx.beginPath();
        ctx.moveTo(-w / 2, 0);
        ctx.lineTo(-w, -h / 2);
        ctx.lineTo(-w, h / 2);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(w / 4, -h / 8, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ================= CLIMB =================
    setupClimb() {
        this.platforms = [];
        this.monkeys = [];

        // Spawn initial platforms
        this.platforms.push({ x: 100, y: 500, w: 200, h: 20 });
        this.platforms.push({ x: 400, y: 400, w: 200, h: 20 });
        this.platforms.push({ x: 200, y: 300, w: 200, h: 20 });

        this.playerX = 150; // Align with first platform
        this.playerY = 450; // Slightly above

        this.velocityY = 0;
        this.gravity = 0.6;
        this.gameSpeed = 1 + (this.game.player.stats.climb * 0.05); // Slower start
        this.spawnTimer = 0;

        // Double Jump Logic
        this.jumps = 0;
        this.maxJumps = 2;
    }

    updateClimb() {
        // Move World Down (Player technically stays or moves up relative to screen?)
        // Actually, player jumps UP, so platforms should move down to simulate camera moving up?
        // Or is it static screen?
        // Duck Life climb usually involves jumping between falling obstacles or static screen?
        // Let's assume auto-scrolling DOWN (simulating player goes UP) 

        this.platforms.forEach(p => p.y += this.gameSpeed);
        this.monkeys.forEach(m => m.y += this.gameSpeed);

        this.gameSpeed += 0.001; // Minimal Progressive Speed

        this.playerY += this.velocityY;
        this.velocityY += this.gravity;

        // Input Horizontal
        const leftPressed = this.game.keys['ArrowLeft'];
        const rightPressed = this.game.keys['ArrowRight'];
        if (leftPressed) this.playerX -= 5;
        if (rightPressed) this.playerX += 5;

        // Collision with Platforms
        let onPlatform = false;
        this.platforms.forEach(p => {
            // Check if feet are falling onto platform
            // player size 50x50
            if (this.velocityY > 0 && // falling
                this.playerY + 50 >= p.y && // feet below top
                this.playerY + 50 <= p.y + p.h + 20 && // feet inside heavy tolerance
                this.playerX + 40 > p.x &&
                this.playerX + 10 < p.x + p.w) { // horizontal overlap with tolerance

                this.playerY = p.y - 50;
                this.velocityY = 0;
                this.isJumping = false;
                onPlatform = true;
                this.jumps = 0; // Reset double jump
            }
        });

        // Fail condition
        if (this.playerY > this.height) {
            this.endMinigame();
        }

        // Spawn new platforms at TOP
        this.spawnTimer++;
        // TIGHTER GAP: Target 150px vertical distance
        const spawnThreshold = 150 / this.gameSpeed;

        if (this.spawnTimer > spawnThreshold) {
            this.spawnTimer = 0;
            this.platforms.push({
                x: Math.random() * (this.width - 200),
                y: -50,
                w: 120 + Math.random() * 100, // Slightly wider platforms too
                h: 20
            });
            if (Math.random() > 0.5) {
                this.monkeys.push({
                    x: Math.random() * (this.width - 50),
                    y: -80,
                    w: 30, h: 30
                });
            }
        }
    }

    drawClimb() {
        this.ctx.fillStyle = '#263238'; // Dark jungle
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Platforms (Vines/Branches)
        this.ctx.fillStyle = '#4e342e';
        this.platforms.forEach(p => {
            this.fillRoundedRect(this.ctx, p.x, p.y, p.w, p.h, 5);
        });

        // Monkeys
        this.monkeys.forEach(m => {
            this.drawMonkey(this.ctx, m.x, m.y, m.w, m.h);
        });

        this.game.player.draw(this.ctx, this.playerX, this.playerY, 50, 50);
    }

    drawMonkey(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);

        ctx.fillStyle = '#795548'; // Brown
        // Body/Head
        ctx.beginPath();
        ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.arc(-w / 2, -w / 4, w / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w / 2, -w / 4, w / 4, 0, Math.PI * 2);
        ctx.fill();

        // Face (lighter shade)
        ctx.fillStyle = '#d7ccc8';
        ctx.beginPath();
        ctx.arc(0, w / 8, w / 3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-w / 6, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w / 6, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ================= COMMON =================
    checkCollisions() {
        this.coins.forEach((c, index) => {
            if (this.checkRectCollision(
                { x: this.playerX, y: this.playerY, w: 50, h: 50 },
                { x: c.x, y: c.y, w: c.w, h: c.h }
            )) {
                this.score++;
                this.coins.splice(index, 1);
                if (this.type === 'speed') this.game.player.train('run', 1);
                if (this.type === 'swim') this.game.player.train('swim', 1);
            }
        });

        this.obstacles.forEach(o => {
            if (this.checkRectCollision(
                { x: this.playerX, y: this.playerY, w: 50, h: 50 },
                { x: o.x, y: o.y, w: o.w, h: o.h }
            )) {
                this.endMinigame();
            }
        });

        if (this.type === 'climb') {
            this.monkeys.forEach((m, index) => {
                if (this.checkRectCollision(
                    { x: this.playerX, y: this.playerY, w: 50, h: 50 },
                    { x: m.x, y: m.y, w: m.w, h: m.h }
                )) {
                    this.score++;
                    this.monkeys.splice(index, 1);
                    this.game.player.train('climb', 1);
                }
            });
        }
    }

    checkRectCollision(r1, r2) {
        return r1.x < r2.x + r2.w &&
            r1.x + r1.w > r2.x &&
            r1.y < r2.y + r2.h &&
            r1.y + r1.h > r2.y;
    }

    endMinigame() {
        this.active = false;
        this.game.huntPoints += this.score;
        alert(`Training Complete! Score: ${this.score}. +${this.score} Hunt Points.`);
        this.game.returnToHub();
    }
}
