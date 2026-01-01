class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.state = 'MENU'; // MENU, HUB, TRAIN, RACE, SHOP
        this.player = null;
        this.huntPoints = 0; // Unified Currency

        this.ui = {
            menu: document.getElementById('main-menu'),
            hub: document.getElementById('hub-overlay'),
            train: document.getElementById('train-selection'),
            shop: document.getElementById('shop-ui'),
            race: document.getElementById('race-ui'),
            exitBtn: document.getElementById('exit-btn'),
            catSelection: document.getElementById('cat-selection'),
        };

        this.minigame = null; // Active minigame instance

        this.raceRound = 0; // 0: Qualifier, 1: Final
        this.keys = {};
        this.init();
    }

    init() {
        this.setupInputs();
        this.setupEventListeners();
        this.renderCatSelection();
        this.loop();
    }

    setupInputs() {
        // centralized input management
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.state === 'PLAYING' && this.minigame && this.minigame.handleClick) {
                this.minigame.handleClick(e);
            }
        });
    }

    setupEventListeners() {
        // Menu Buttons
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });

        // Exit button - forceful reset
        this.ui.exitBtn.addEventListener('click', () => {
            console.log("Forced Exit clicked");
            this.returnToHub();
        });

        // Hub Buttons
        document.querySelectorAll('.hub-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'train') this.showTrainingMenu();
                if (action === 'race') this.showRaceMenu();
                if (action === 'shop') this.showShop();
            });
        });

        // Train Buttons
        document.querySelectorAll('.train-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.startTraining(type);
            });
        });

        // Race Selection
        document.getElementById('start-race-btn').addEventListener('click', () => {
            this.startRace();
        });

        // Back Buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.returnToHub();
            });
        });
    }

    renderCatSelection() {
        const cats = [
            { id: 'lion', name: 'Lion', desc: 'Strength Class' },
            { id: 'jaguar', name: 'Jaguar', desc: 'Swimmer Class' },
            { id: 'leopard', name: 'Leopard', desc: 'Mobility Class' },
            { id: 'cheetah', name: 'Cheetah', desc: 'Speed Class' }
        ];

        this.ui.catSelection.innerHTML = '';
        cats.forEach(c => {
            const card = document.createElement('div');
            card.className = 'cat-card';
            card.innerHTML = `<h3>${c.name}</h3><p>${c.desc}</p>`;
            card.onclick = () => {
                document.querySelectorAll('.cat-card').forEach(x => x.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCatType = c.id;
                document.getElementById('start-game-btn').classList.remove('hidden');
            };
            this.ui.catSelection.appendChild(card);
        });
    }

    startGame() {
        if (!this.selectedCatType) return;
        this.player = new Cat(this.selectedCatType);
        this.switchState('HUB');
    }

    switchState(newState) {
        console.log(`Switching state from ${this.state} to ${newState}`);
        this.state = newState;

        // UI Reset: Strict hide all
        // Re-query to prevent stale references
        const allScreens = document.querySelectorAll('.screen');
        const exitBtn = document.getElementById('exit-btn');
        const startBtn = document.getElementById('start-game-btn');

        allScreens.forEach(s => s.classList.add('hidden'));
        if (exitBtn) exitBtn.classList.add('hidden');
        // startBtn handling is special (only in Menu)

        // Show specific UI
        if (newState === 'MENU') {
            if (this.ui.menu) this.ui.menu.classList.remove('hidden');
        } else if (newState === 'HUB') {
            if (this.ui.hub) this.ui.hub.classList.remove('hidden');
        } else if (newState === 'TRAIN_SELECT') {
            if (this.ui.train) this.ui.train.classList.remove('hidden');
        } else if (newState === 'SHOP') {
            if (this.ui.shop) this.ui.shop.classList.remove('hidden');
        } else if (newState === 'RACE_SELECT') {
            if (this.ui.race) this.ui.race.classList.remove('hidden');
        } else if (newState === 'PLAYING') {
            if (exitBtn) exitBtn.classList.remove('hidden');
        }

        this.updateUI();
    }

    updateUI() {
        if (!this.player) return;

        // Update Stat Bars
        const stats = ['run', 'strength', 'swim', 'climb'];
        stats.forEach(s => {
            const val = this.player.stats[s];
            const max = this.player.statCaps[s];
            const pct = (val / max) * 100;
            const bar = document.getElementById(`bar-${s}`);
            if (bar) bar.style.width = `${pct}%`;
        });

        document.getElementById('stat-level').innerText = this.player.level;
        document.getElementById('currency-display').innerText = `${this.huntPoints} Hunt Points`;
        document.getElementById('energy-display').innerText = `${Math.round(this.player.energy)}%`;
    }

    showTrainingMenu() {
        this.switchState('TRAIN_SELECT');
    }

    showRaceMenu() {
        const title = this.raceRound === 0 ? "AMATEUR QUALIFIER" : "AMATEUR FINALS";
        const desc = this.raceRound === 0 ? "Top 2 Advance" : "Win to become Champion";
        document.querySelector('#race-ui h2').innerText = title;
        document.querySelector('#league-info h3').innerText = desc;
        this.switchState('RACE_SELECT');
    }

    showShop() {
        this.switchState('SHOP');
    }

    startTraining(type) {
        // COMPLETE RESET of any existing minigame
        if (this.minigame) {
            this.minigame = null;
        }

        console.log("Starting training:", type);
        this.switchState('PLAYING');

        // Small delay to ensure state switch happened before logic runs
        requestAnimationFrame(() => {
            try {
                this.minigame = new Minigame(this, type);
            } catch (e) {
                console.error("Error creating minigame", e);
                this.returnToHub();
            }
        });
    }

    startRace() {
        if (this.minigame) {
            this.minigame = null;
        }
        if (this.player.energy < 50) {
            alert("Too tired to race! You need at least 50% Energy.");
            return;
        }
        console.log("Starting Race");
        this.switchState('PLAYING');

        requestAnimationFrame(() => {
            this.minigame = new Race(this);
        });
    }

    returnToHub() {
        console.log("Returning to Hub...");
        if (this.minigame && this.minigame.destroy) {
            this.minigame.destroy();
        }
        this.minigame = null;

        // Clear inputs
        this.keys = {};

        this.switchState('HUB');
    }

    // Shop method
    buyItem(item) {
        if (!this.player) return;

        if (item === 'liver') {
            if (this.huntPoints >= 15) {
                this.huntPoints -= 15;
                this.player.energy += 50;
                if (this.player.energy > this.player.maxEnergy) this.player.energy = this.player.maxEnergy;
                alert("Bought Liver! Energy Restored.");
            } else {
                alert("Not enough Hunt Points!");
            }
        } else if (item === 'muscle_milk') {
            if (this.huntPoints >= 200) {
                this.huntPoints -= 200;
                this.player.level++;
                this.player.checkEvolution();
                alert("Bought Milk! Level Up!");
            } else {
                alert("Not enough Hunt Points! (Need 200)");
            }
        }
        this.updateUI();
    }

    loop() {
        try {
            // Safety Reset of Transform (Critical for switching between Race and Hub)
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.width, this.height);

            if (this.state === 'HUB') {
                this.drawHubBackground();
                if (this.player) this.player.draw(this.ctx, 350, 350, 100, 100);
            } else if (this.state === 'PLAYING') {
                // If minigame exists, run it
                if (this.minigame) {
                    this.minigame.update();
                    this.minigame.draw();
                } else {
                    // Minigame loading or error state - show loading text
                    this.ctx.fillStyle = 'black';
                    this.ctx.fillText("Loading Event...", 350, 300);
                }
            }
        } catch (e) {
            console.error("Game Loop Crash:", e);
            // Attempt auto-recovery
            this.returnToHub();
        }

        // Keep loop alive
        requestAnimationFrame(() => this.loop());
    }

    drawHubBackground() {
        // Placeholder background
        this.ctx.fillStyle = '#87CEEB'; // Sky
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#e6c229'; // Sand/Ground
        this.ctx.fillRect(0, 450, this.width, 150);

        // Sun
        this.ctx.fillStyle = '#f39c12';
        this.ctx.beginPath();
        this.ctx.arc(700, 100, 50, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

// Global wrapper
Game.prototype.shop = {
    buy: function (item) {
        window.game.buyItem(item);
    }
};

const game = new Game();
window.game = game; 
