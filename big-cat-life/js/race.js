class Race {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.width = game.width;
        this.height = game.height;
        this.active = true;

        this.sections = [];
        this.distance = 2000;
        this.racers = [];
        this.cameraX = 0;

        this.battleActive = false;
        this.battleHp = 100;
        this.maxBattleHp = 100;

        this.raceLevel = 0; // 0=Qualifier, 1=Final
        this.setupRace();
    }

    setupRace() {
        // 1. Calculate Distance based on Level & Round
        const levelMult = 1 + (this.game.player.level * 0.25);
        const roundMult = (this.game.raceRound === 1) ? 1.5 : 1.0;
        const totalDist = Math.floor(4000 * levelMult * roundMult);
        const minSectionLen = 400;

        // 2. Generate Random Terrain Sections
        this.sections = [];
        let currentX = 0;
        const usedTypes = new Set();

        const startLen = 200 + Math.random() * 300;
        this.sections.push({ type: 'run', start: 0, end: startLen });
        usedTypes.add('run');
        currentX = startLen;

        while (currentX < totalDist) {
            const remaining = totalDist - currentX;

            if (remaining < minSectionLen + 200) {
                let finalType = 'run';
                if (usedTypes.size < 2) {
                    finalType = (Math.random() > 0.5) ? 'swim' : 'climb';
                } else {
                    finalType = Math.random() > 0.3 ? 'run' : (Math.random() > 0.5 ? 'swim' : 'climb');
                }

                this.sections.push({ type: finalType, start: currentX, end: totalDist + 800 });
                usedTypes.add(finalType);
                currentX = totalDist + 800; // Done
            } else {
                const len = minSectionLen + Math.random() * 600;

                const types = ['run', 'swim', 'climb'];
                const prevType = this.sections[this.sections.length - 1].type;
                let nextType = types[Math.floor(Math.random() * types.length)];

                if (nextType === prevType && Math.random() > 0.3) {
                    nextType = types[Math.floor(Math.random() * types.length)];
                }

                if (remaining < 2000 && usedTypes.size < 2 && currentX > totalDist * 0.6) {
                    const unused = types.filter(t => !usedTypes.has(t));
                    if (unused.length > 0) {
                        nextType = unused[Math.floor(Math.random() * unused.length)];
                    }
                }

                this.sections.push({ type: nextType, start: currentX, end: currentX + len });
                usedTypes.add(nextType);
                currentX += len;
            }
        }
        this.distance = totalDist;

        // 3. Setup Racers
        this.racers = [{
            isPlayer: true,
            cat: this.game.player,
            x: 0,
            y: 450 - 50,
            speed: 0,
            finished: false,
            color: this.game.player.getColor(),
            z: 10
        }];

        const cpuTypes = ['lion', 'jaguar', 'leopard', 'cheetah'].filter(t => t !== this.game.player.type);
        for (let i = 0; i < 3; i++) {
            const type = cpuTypes[i % cpuTypes.length];
            const cpuCat = new Cat(type);
            cpuCat.evolutionStage = this.game.player.evolutionStage;

            // Intelligent Stats Scaling based on Stat Caps
            // User Requirement: 
            // < 50% training -> Guaranteed Last (CPU > 50%)
            // 100% training -> Guaranteed First (CPU < 100%)
            // Variation in between.

            const caps = this.game.player.statCaps;

            const getCpuStat = (statName) => {
                const cap = caps[statName];
                // Base range: 60% to 90% of the Cap
                // This ensures minimum 0.6 > 0.5 (Player Loss at 50%)
                // And maximum 0.9 < 1.0 (Player Win at 100%)
                let factor = 0.6 + Math.random() * 0.3;

                // Archetype Weak/Strong Adjustments
                if (type === 'cheetah' && statName === 'run') factor += 0.1;
                if (type === 'jaguar' && statName === 'swim') factor += 0.1;
                if (type === 'leopard' && statName === 'climb') factor += 0.1;
                if (type === 'lion' && statName === 'strength') factor += 0.1;

                // Clamp to safe limits to ensure guarantees hold
                if (factor < 0.55) factor = 0.55;
                if (factor > 0.95) factor = 0.95;

                return cap * factor;
            };

            cpuCat.stats.run = getCpuStat('run');
            cpuCat.stats.swim = getCpuStat('swim');
            cpuCat.stats.climb = getCpuStat('climb');
            cpuCat.stats.strength = getCpuStat('strength');

            this.racers.push({
                isPlayer: false,
                cat: cpuCat,
                x: 0,
                y: 450 - 50,
                speed: 0,
                finished: false,
                color: cpuCat.getColor(),
                z: i
            });
        }

        // 4. Battle Config
        this.battleTriggered = false;
        const validSections = this.sections.filter(s => s.type === 'run' && s.end - s.start > 300);

        if (validSections.length > 0) {
            const sec = validSections[Math.floor(Math.random() * validSections.length)];
            this.battleDistance = sec.start + (sec.end - sec.start) * 0.5;
        } else {
            this.battleDistance = -1;
        }
    }

    update() {
        if (!this.active) return;
        if (this.battleActive) return;

        let allFinished = true;

        this.racers.forEach(r => {
            if (!r.finished) allFinished = false;

            // 1. Identify Terrain
            const currentSection = this.sections.find(s => r.x >= s.start && r.x < s.end) || this.sections[this.sections.length - 1];

            // 2. Determine Speed based on Terrain
            let statVal = 0;
            if (currentSection.type === 'swim') statVal = r.cat.stats.swim;
            else if (currentSection.type === 'climb') statVal = r.cat.stats.climb;
            else statVal = r.cat.stats.run;

            // 3. Move
            // Slow things down: /10 instead of /5
            let moveSpeed = (statVal / 10) + (Math.random() * 0.5);

            if (r.isPlayer) {
                moveSpeed *= (0.5 + (this.game.player.energy / 200));
            }

            r.x += moveSpeed;

            // 4. Triggers
            if (!r.finished && this.battleDistance > 0 && !this.battleTriggered && r.isPlayer && r.x >= this.battleDistance) {
                if (currentSection.type === 'run') {
                    this.startBattle();
                }
            }

            if (r.x >= this.distance) {
                if (!r.finished) {
                    r.finished = true;
                    if (r.isPlayer) {
                        this.finishRace(true);
                    }
                }
            }
        });

        const player = this.racers.find(r => r.isPlayer);
        if (player) {
            this.cameraX = player.x - 200;
            if (this.cameraX < 0) this.cameraX = 0;
        }
    }

    startBattle() {
        this.battleTriggered = true;
        this.battleActive = true;
        this.battleHp = 100 + (this.game.player.level * 20);
        this.maxBattleHp = this.battleHp;
    }

    handleClick() {
        if (!this.battleActive) return;
        const dmg = 5 + (this.game.player.stats.strength * 0.5);
        this.battleHp -= dmg;
        if (this.battleHp <= 0) {
            this.endBattle();
        }
    }

    endBattle() {
        this.battleActive = false;
        alert("PATH CLEARED! GO!");
    }

    finishRace(playerWon) {
        const player = this.racers.find(r => r.isPlayer);
        let rank = 1;
        this.racers.forEach(r => {
            if (!r.isPlayer && r.x > player.x) rank++;
        });

        let msg = "";
        let reward = 0;
        let pMoney = 0;

        if (this.game.raceRound === 0) {
            if (rank <= 2) {
                msg = `Qualifier Passed! Rank: ${rank}. Advance to Finals!`;
                this.game.raceRound = 1;
                reward = 200;
            } else {
                msg = `Qualifier Failed! Rank: ${rank}. Try Again.`;
                reward = 50;
            }
        } else {
            if (rank === 1) {
                msg = `CHAMPION! You won the League!`;
                reward = 1000;
                pMoney = 50;
                this.game.raceRound = 0;
            } else {
                msg = `Finals Finished. Rank: ${rank}.`;
                reward = 300;
                pMoney = 5;
                this.game.raceRound = 0;
            }
        }

        this.game.huntPoints += reward + pMoney;
        this.game.player.xp += 100 / rank;

        if (this.game.player.xp > 100 * this.game.player.level) {
            this.game.player.level++;
            this.game.player.xp = 0;
            alert(`LEVEL UP! Now Level ${this.game.player.level}`);
            this.game.player.checkEvolution();
        }

        setTimeout(() => {
            alert(`${msg} (+${reward + pMoney} Hunt Points)`);
            this.game.returnToHub();
        }, 500);
    }

    destroy() {
        this.active = false;
    }

    draw() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);

        this.sections.forEach(sec => {
            if (sec.end < this.cameraX || sec.start > this.cameraX + this.width + 100) return;

            if (sec.type === 'run') {
                this.ctx.fillStyle = '#d35400';
                this.ctx.fillRect(sec.start, 450, (sec.end - sec.start), 150);
                this.ctx.fillStyle = '#e67e22';
                this.ctx.fillRect(sec.start, 450, (sec.end - sec.start), 10);
            }
            else if (sec.type === 'swim') {
                const waterLevel = 470;
                this.ctx.fillStyle = '#3498db';
                this.ctx.fillRect(sec.start, waterLevel, (sec.end - sec.start), 150);
                this.ctx.fillStyle = '#d35400';
                this.ctx.fillRect(sec.start, 450, 10, 150);
                this.ctx.fillRect(sec.end - 10, 450, 10, 150);
            }
            else if (sec.type === 'climb') {
                const platHeight = 350;
                const stepCount = 5;
                const stepWidth = 40;
                const totalStepsW = stepCount * stepWidth;

                this.ctx.fillStyle = '#5d4037';
                for (let i = 0; i < stepCount; i++) {
                    const h = 450 - ((450 - platHeight) * ((i + 1) / stepCount));
                    this.ctx.fillRect(sec.start + (i * stepWidth), h, stepWidth, 450 - h + 150);
                }

                const platStart = sec.start + totalStepsW;
                const platEnd = sec.end - totalStepsW;
                this.ctx.fillRect(platStart, platHeight, platEnd - platStart, 450 - platHeight + 150);

                for (let i = 0; i < stepCount; i++) {
                    const h = 350 + ((450 - platHeight) * ((i) / stepCount));
                    this.ctx.fillRect(platEnd + (i * stepWidth), h, stepWidth, 450 - h + 150);
                }
            }
        });

        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.distance, 0, 50, this.height);
        this.ctx.fillStyle = 'black';
        for (let i = 0; i < this.height; i += 40) {
            this.ctx.fillRect(this.distance, i, 25, 20);
            this.ctx.fillRect(this.distance + 25, i + 20, 25, 20);
        }

        if (this.battleDistance > 0 && this.maxBattleHp > 0 && this.battleHp > 0) {
            this.drawBuffalo(this.ctx, this.battleDistance + 100, 300, 200, 150);
        }

        const sortedRacers = [...this.racers].sort((a, b) => a.z - b.z);

        sortedRacers.forEach(r => {
            const currentSection = this.sections.find(s => r.x >= s.start && r.x < s.end) || this.sections[this.sections.length - 1];

            let yBase = 400;

            if (currentSection.type === 'swim') {
                yBase = 430;
            }
            else if (currentSection.type === 'climb') {
                const stepsW = 200;
                const relX = r.x - currentSection.start;
                const remX = currentSection.end - r.x;

                const platH = 300;
                const groundH = 400;

                if (relX < stepsW) {
                    const pct = relX / stepsW;
                    yBase = groundH - ((groundH - platH) * pct);
                } else if (remX < stepsW) {
                    const pct = remX / stepsW;
                    yBase = groundH - ((groundH - platH) * pct);
                } else {
                    yBase = platH;
                }
            }

            r.y = yBase;

            if (r.cat && r.cat.draw) {
                r.cat.draw(this.ctx, r.x, r.y, 50, 50);
            } else {
                this.ctx.fillStyle = r.color;
                this.ctx.fillRect(r.x, r.y, 50, 50);
            }

            if (r.isPlayer) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText("YOU", r.x + 10, r.y - 15);
            }
        });

        this.ctx.restore();
        if (this.battleActive) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(200, 100, 400, 100);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px Arial';
            this.ctx.fillText("ATTACK THE HERD!", 250, 150);
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(250, 170, 300, 20);
            this.ctx.fillStyle = 'green';
            this.ctx.fillRect(250, 170, (this.battleHp / this.maxBattleHp) * 300, 20);
        }
    }

    drawBuffalo(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        const scale = w / 150;
        ctx.scale(scale, scale);

        const color = '#3e2723';
        ctx.strokeStyle = color;
        ctx.lineWidth = 12;
        ctx.lineCap = 'point';
        ctx.beginPath();
        ctx.moveTo(-50, -10);
        ctx.quadraticCurveTo(-85, 10, -80, 40);
        ctx.stroke();

        ctx.fillStyle = '#2a1917ff';
        ctx.beginPath();
        const tX = -80, tY = 40;
        ctx.moveTo(tX, tY);
        ctx.quadraticCurveTo(tX + 10, tY + 12, tX, tY + 25);
        ctx.quadraticCurveTo(tX - 10, tY + 12, tX, tY);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.fillRect(-60, 30, 20, 40);
        ctx.fillRect(-30, 30, 20, 40);
        ctx.fillRect(10, 30, 20, 40);
        ctx.fillRect(40, 30, 20, 40);

        ctx.fillStyle = color;
        this.fillRoundedRect(ctx, -70, -20, 140, 70, 10);

        ctx.beginPath();
        ctx.arc(60, -30, 38, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2a1917ff';
        ctx.beginPath();
        ctx.ellipse(80, -15, 20, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(55, -38, 3, 0, Math.PI * 2);
        ctx.arc(85, -38, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#635551ff';
        ctx.lineWidth = 12;
        ctx.lineCap = 'point';
        ctx.beginPath();
        ctx.moveTo(60 - 25, -45);
        ctx.quadraticCurveTo(60 - 65, -95, 60 - 35, -100);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(60 + 30, -45);
        ctx.quadraticCurveTo(60 + 70, -95, 60 + 35, -100);
        ctx.stroke();

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
}
