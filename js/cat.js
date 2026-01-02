class Cat {
    constructor(type) {
        this.type = type; // 'lion', 'jaguar', 'leopard', 'cheetah'
        this.name = type.charAt(0).toUpperCase() + type.slice(1);
        this.level = 1;
        this.xp = 0;
        this.evolutionStage = 0; // 0: Baby, 1: Teen, 2: Adult

        // Base stats (Speed, Strength, Swim, Climb)
        this.stats = {
            run: 10,
            strength: 10,
            swim: 10,
            climb: 10
        };

        // Stat Level Caps (increases with evolution)
        this.statCaps = {
            run: 50, // Starts at 50, increases to 100, then 150
            strength: 50,
            swim: 50,
            climb: 50
        };

        this.energy = 100;
        this.maxEnergy = 100;

        this.applyArchetypeBonuses();
    }

    applyArchetypeBonuses() {
        // Apply bonuses based on type
        switch (this.type) {
            case 'lion':
                this.stats.strength += 10;
                break;
            case 'cheetah':
                this.stats.run += 10;
                break;
            case 'jaguar':
                this.stats.swim += 10;
                break;
            case 'leopard':
                this.stats.climb += 10;
                break;
        }
    }

    checkEvolution() {
        // Evolve at level 2 and level 3
        if (this.level >= 2 && this.evolutionStage === 0) {
            this.evolve();
        } else if (this.level >= 3 && this.evolutionStage === 1) {
            this.evolve();
        }

        // Cap level
        if (this.level > 3) this.level = 3;
    }

    evolve() {
        this.evolutionStage++;
        // Raise caps
        const increase = 50;
        this.statCaps.run += increase;
        this.statCaps.strength += increase;
        this.statCaps.swim += increase;
        this.statCaps.climb += increase;

        console.log(`${this.name} evolved to stage ${this.evolutionStage}!`);
        alert(`${this.name} is Evolving! Stage ${this.evolutionStage + 1}`);
        return true;
    }

    train(stat, amount) {
        if (this.stats[stat] < this.statCaps[stat]) {
            // Increased value: +1 per coin/action is good baseline. 
            // Previous 0.2 was too slow visually.
            this.stats[stat] += amount;
            if (this.stats[stat] > this.statCaps[stat]) this.stats[stat] = this.statCaps[stat];
        }
    }

    // Procedural Cartoon Drawing - Maturation System
    draw(ctx, x, y, width, height) {
        ctx.save();
        ctx.translate(x, y);

        // VIRTUAL 100x100 COORDINATE SYSTEM
        const scale = width / 100;
        ctx.scale(scale, scale);

        // Pivot to center of 100x100 block
        ctx.translate(50, 50);

        const color = this.getColor();
        const spotColor = 'rgba(0,0,0,0.3)';

        const stage = this.evolutionStage;

        // Stage 0 (Baby) uses EXACT original coordinates
        let bodyW, bodyH, headR, legW, legH, hX, hY;

        if (stage === 0) {
            bodyW = 75; bodyH = 45; headR = 30; legW = 8; legH = 20; hX = 20; hY = -25;

            // 1. Body
            ctx.fillStyle = color;
            this.fillRoundedRect(ctx, -45, -15, bodyW, bodyH, 12);

            // 2. Head
            if (this.type === 'lion') {
                ctx.fillStyle = '#973c00ff';
                ctx.beginPath();
                ctx.arc(hX, hY, headR + 10, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(hX, hY, headR, 0, Math.PI * 2);
            ctx.fill();

            // 3. Archetype Features
            if (this.type === 'cheetah' || this.type === 'leopard' || this.type === 'jaguar') {
                ctx.fillStyle = spotColor;
                const spotSize = (this.type === 'jaguar') ? 3 : 2;
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.arc(-30 + (i * 15), 5, spotSize, 0, Math.PI * 2);
                    ctx.arc(-37 + (i * 15), 15, spotSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (this.type === 'cheetah') {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(hX + 2, hY - 2.5, 2, 8);
                    ctx.fillRect(hX + 20, hY - 2.5, 2, 8);
                }
            }

            // 4. Ears
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(hX - 20, hY - 25, 12, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(hX + 20, hY - 25, 12, 0, Math.PI * 2); ctx.fill();

            // 5. Eyes
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(hX, hY - 3, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(hX + 22, hY - 3, 3, 0, Math.PI * 2); ctx.fill();

            // 6. Nose
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.moveTo(hX + 15, hY + 8);
            ctx.lineTo(hX + 11, hY + 3);
            ctx.lineTo(hX + 20, hY + 3);
            ctx.fill();

            // 7. Legs
            ctx.fillStyle = color;
            this.fillRoundedRect(ctx, hX - 16, 20, 8, 20, 4);
            this.fillRoundedRect(ctx, hX - 1, 20, 8, 20, 4);
            this.fillRoundedRect(ctx, -40, 20, 8, 20, 4);
            this.fillRoundedRect(ctx, -25, 20, 8, 20, 4);

            // 8. Tail (Curving UP for baby)
            ctx.strokeStyle = color;
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-40, 5);
            ctx.quadraticCurveTo(-60, -45, -50, -75); // Raised end more
            ctx.stroke();

            // Lion Tuft (Baby)
            if (this.type === 'lion') {
                ctx.fillStyle = '#973c00ff'; // Mane color
                ctx.beginPath();
                const lTx = -50, lTy = -75;
                ctx.moveTo(lTx, lTy); // Tip (bottom connection)
                // Upward Teardrop (Candle flame shape)
                // Doubled size as requested (was 8, 20)
                const tW = 16;
                const tH = 40;
                ctx.quadraticCurveTo(lTx + tW, lTy - tH * 0.4, lTx, lTy - tH); // Up to point
                ctx.quadraticCurveTo(lTx - tW, lTy - tH * 0.4, lTx, lTy); // Back to tip
                ctx.fill();
            }

        } else {
            // Maturation for stage 1 & 2
            bodyW = 75 + (stage * 25);
            bodyH = 45 + (stage * 10);
            headR = 30 + (stage * 0.5);
            // Thickened legs - Lions grow much sturdier
            const legGrowth = this.type === 'lion' ? 10 : 4;
            legW = 8 + (stage * legGrowth);
            legH = 20 + (stage * 20);
            hX = (bodyW / 2) - 15;
            hY = -25 - (stage * 5);

            // 1. Body
            ctx.fillStyle = color;
            this.fillRoundedRect(ctx, -bodyW / 2 - 10, -bodyH / 2 + 5, bodyW, bodyH, 12);

            // 2. Head
            // 7. Legs
            ctx.fillStyle = color;
            const frontX = hX - 15;
            this.fillRoundedRect(ctx, frontX - legW - 5, bodyH / 2 - 10, legW, legH, 4);
            this.fillRoundedRect(ctx, frontX, bodyH / 2 - 10, legW, legH, 4);
            this.fillRoundedRect(ctx, -bodyW / 2 - 5, bodyH / 2 - 10, legW, legH, 4);
            this.fillRoundedRect(ctx, -bodyW / 2 + legW + 3, bodyH / 2 - 10, legW, legH, 4);

            if (this.type === 'lion') {
                ctx.fillStyle = '#7d3200ff';
                const maneSize = headR + 10 + (stage * 10);
                ctx.beginPath(); ctx.arc(hX, hY, maneSize, 0, Math.PI * 2); ctx.fill();
            }

            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(hX, hY, headR, 0, Math.PI * 2); ctx.fill();

            // 3. Spots
            if (this.type === 'leopard' || this.type === 'jaguar' || this.type === 'cheetah') {
                ctx.fillStyle = spotColor;
                const spotSize = (this.type === 'jaguar') ? 3 + stage : 2 + stage;
                const startX = -bodyW / 2 + 5;
                for (let i = 0; i < 8 + stage * 2; i++) {
                    const xPos = startX + (i * 12);
                    if (xPos > hX - headR * 0.5) break;
                    ctx.beginPath(); ctx.arc(xPos, -5, spotSize, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(xPos - 5, 5, spotSize, 0, Math.PI * 2); ctx.fill();
                    if (stage === 2) {
                        ctx.beginPath(); ctx.arc(xPos + 3, 15, spotSize, 0, Math.PI * 2); ctx.fill();
                    }
                }

            }

            // 4. Ears
            ctx.fillStyle = color;
            const earSize = 7 + stage * 2;
            const earSep = headR * 0.7;
            ctx.beginPath(); ctx.arc(hX - earSep, hY - headR * 0.8, earSize, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(hX + earSep, hY - headR * 0.8, earSize, 0, Math.PI * 2); ctx.fill();

            // 5. Eyes
            ctx.fillStyle = 'black';
            const eyeR = 3.5 + stage * 0.1;
            const eyeXSep = headR * 0.45;
            const featureOffX = headR * 0.2;
            ctx.beginPath(); ctx.arc(hX - eyeXSep + featureOffX, hY - 3, eyeR, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(hX + eyeXSep + featureOffX, hY - 3, eyeR, 0, Math.PI * 2); ctx.fill();

            // Cheetah Tears (Drawn on top of muzzle)
            if (this.type === 'cheetah') {
                ctx.fillStyle = 'black';
                const eyeXSep = headR * 0.45;
                const featureOffX = headR * 0.2;
                const tearXLeft = hX - eyeXSep + featureOffX;
                const tearXRight = hX + eyeXSep + featureOffX;
                const tearY = hY - 3;
                const tearLen = 12 + stage; // More dynamic growth
                ctx.fillRect(tearXLeft - 1, tearY, 2, tearLen);
                ctx.fillRect(tearXRight - 1, tearY, 2, tearLen);
            }

            // 6. Nose
            const nX = hX + headR * 0.45;
            const growthMult = (this.type === 'cheetah') ? 1 : 2;
            const nSize = 6 + stage * growthMult;
            const nHeight = 5 + stage * growthMult;
            const nDrop = stage * 3;
            // Muzzle
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(nX - 5, hY + headR * 0.4 + nDrop - 4, nSize * 1.7, 0, Math.PI * 2); ctx.fill();
            // Nose
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.moveTo(nX, hY + headR * 0.4 + nDrop);
            ctx.lineTo(nX - nSize - 2, hY + headR * 0.4 - nHeight + nDrop);
            ctx.lineTo(nX + nSize - 2, hY + headR * 0.4 - nHeight + nDrop);
            ctx.fill();

            // 8. Tail (Restored hook, rotated CCW to be lower)
            ctx.strokeStyle = color;
            ctx.lineWidth = 10 + stage * 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-bodyW / 2 - 5, 5);
            // Lowered posture: rotated CCW around the base
            const tStage = stage - 1; // Stage 1 and 2 only reachable here
            const ctrlX = -bodyW / 2 - 80 - tStage * 20;
            const ctrlY = 20 + tStage * 15;
            const endX = -bodyW / 2 - 40 - tStage * 15;
            const endY = -45 - tStage * 20; // Raised by 15 more
            ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
            ctx.stroke();

            // Lion Tuft (Adult)
            if (this.type === 'lion') {
                ctx.fillStyle = '#7d3200ff'; // Mane color
                ctx.beginPath();
                // Upward Teardrop (flame)
                // Doubled size.
                const tW = 16 + stage * 6;
                const tH = 40 + stage * 10;
                ctx.moveTo(endX, endY);
                ctx.quadraticCurveTo(endX + tW, endY - tH * 0.4, endX, endY - tH);
                ctx.quadraticCurveTo(endX - tW, endY - tH * 0.4, endX, endY);
                ctx.fill();
            }
        }

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

    getColor() {
        switch (this.type) {
            case 'lion': return '#f1c40f'; // Gold
            case 'jaguar': return '#2c293cff'; // Deep Orange
            case 'leopard': return '#b36f00ff'; // Yellow/Orange
            case 'cheetah': return '#fbc531'; // Light Yellow
            default: return 'white';
        }
    }
}
