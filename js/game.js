class Game {
    constructor(config = {}) {
        console.log('[Game] Initializing...');
        
        // Development configuration
        this.devConfig = {
            isDevelopment: config.isDevelopment || false,
            playerCount: config.playerCount || 50,
            roundTime: config.roundTime || 30,
            botFillDelay: config.botFillDelay || 200,
            roundEndDelay: config.roundEndDelay || 3000,
            minHumanPlayers: config.minHumanPlayers || 1,
            quickBotDecisions: config.quickBotDecisions || false
        };

        this.state = {
            isActive: false,
            currentRound: 1,
            timeRemaining: this.devConfig.roundTime,
            players: [],
            humanPlayer: null,
            choices: new Map(),
            timer: null,
            isDeciderRound: false,
            decider: null,
            playerChoice: null,
            roundInProgress: false
        };

        this.config = {
            maxPlayers: this.devConfig.playerCount,
            roundTime: this.devConfig.roundTime,
            minHumanPlayers: this.devConfig.minHumanPlayers,
            botFillDelay: this.devConfig.botFillDelay,
            roundEndDelay: this.devConfig.roundEndDelay,
            autoStartEnabled: false,
            autoStartTime: 60
        };

        // Auto-start timer
        this.autoStartTimer = null;

        // Bind methods
        this.startGame = this.startGame.bind(this);
        this.resetGame = this.resetGame.bind(this);
        this.toggleBots = this.toggleBots.bind(this);
        this.makeChoice = this.makeChoice.bind(this);
        this.updateConfig = this.updateConfig.bind(this);
        this.checkAutoStart = this.checkAutoStart.bind(this);

        // Initialize immediately if DOM is ready, otherwise wait for DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }

        if (this.devConfig.isDevelopment) {
            console.log('[Dev] Development mode enabled');
            console.log('[Dev] Configuration:', this.devConfig);
        }
    }

    initialize() {
        console.log('[Game] Setting up components...');
        try {
            // Create human player
            this.state.humanPlayer = {
                id: 'human-' + Date.now(),
                name: 'You',
                isBot: false,
                isEliminated: false
            };
            this.state.players.push(this.state.humanPlayer);

            // Initialize event listeners
            this.setupEventListeners();

            // Auto-fill with bots
            this.fillWithBots();

            // Set up auto-start if enabled
            if (this.config.autoStartEnabled) {
                console.log(`[Game] Auto-start enabled, waiting ${this.config.autoStartTime} seconds...`);
                if (this.autoStartTimer) {
                    clearTimeout(this.autoStartTimer);
                }
                this.autoStartTimer = setTimeout(() => {
                    this.checkAutoStart();
                }, this.config.autoStartTime * 1000);

                // Show countdown in UI
                if (window.gameUI) {
                    window.gameUI.showAutoStartCountdown(this.config.autoStartTime);
                }
            }

            // Initialize configuration UI
            this.initializeConfigUI();

            console.log('[Game] Initialization complete');
        } catch (error) {
            console.error('[Game] Initialization error:', error);
            this.showError('Failed to initialize game components');
        }
    }

    initializeConfigUI() {
        // Set initial values in configuration modal
        const playerCountInput = document.getElementById('player-count');
        const minHumanPlayersInput = document.getElementById('min-human-players');
        const autoStartTimeInput = document.getElementById('auto-start-time');
        const autoStartEnabledInput = document.getElementById('auto-start-enabled');

        if (playerCountInput) {
            playerCountInput.value = this.config.maxPlayers;
        }
        if (minHumanPlayersInput) {
            minHumanPlayersInput.value = this.config.minHumanPlayers;
        }
        if (autoStartTimeInput) {
            autoStartTimeInput.value = this.config.autoStartTime;
        }
        if (autoStartEnabledInput) {
            autoStartEnabledInput.checked = this.config.autoStartEnabled;
        }
    }

    setupEventListeners() {
        console.log('[Game] Setting up event listeners...');
        try {
            // Direct click handler for Start Game button
            document.querySelector('#start-game').onclick = (e) => {
                console.log('[Game] Start button clicked!');
                e.preventDefault();
                this.startGame();
            };

            // Add other event listeners
            document.querySelector('#reset-game').onclick = (e) => {
                e.preventDefault();
                this.resetGame();
            };
            document.querySelector('#toggle-bots').onclick = (e) => {
                e.preventDefault();
                this.toggleBots();
            };
            document.querySelector('#press-button').onclick = (e) => {
                e.preventDefault();
                this.makeChoice(true);
            };
            document.querySelector('#dont-press-button').onclick = (e) => {
                e.preventDefault();
                this.makeChoice(false);
            };

            // Configuration modal handlers
            document.querySelector('#show-config').onclick = (e) => {
                e.preventDefault();
                console.log('[Game] Opening configuration modal');
                
                // Get input elements
                const playerCountInput = document.getElementById('player-count');
                const minHumanPlayersInput = document.getElementById('min-human-players');
                const autoStartTimeInput = document.getElementById('auto-start-time');
                const autoStartEnabledInput = document.getElementById('auto-start-enabled');
                
                // Set up input handlers for number fields
                const setupNumberInput = (input, min, max) => {
                    // Focus handler to select all text
                    input.addEventListener('focus', (e) => {
                        e.target.select();
                    });
                    
                    // Input handler to validate numbers
                    input.addEventListener('input', (e) => {
                        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                        if (value === '') {
                            value = min.toString();
                        } else {
                            value = Math.min(Math.max(parseInt(value), min), max).toString();
                        }
                        e.target.value = value;
                    });
                };

                // Set initial values and handlers
                if (playerCountInput) {
                    playerCountInput.value = this.config.maxPlayers.toString();
                    setupNumberInput(playerCountInput, 3, 100);
                }
                if (minHumanPlayersInput) {
                    minHumanPlayersInput.value = this.config.minHumanPlayers.toString();
                    setupNumberInput(minHumanPlayersInput, 1, 50);
                }
                if (autoStartTimeInput) {
                    autoStartTimeInput.value = this.config.autoStartTime.toString();
                    setupNumberInput(autoStartTimeInput, 10, 300);
                }
                if (autoStartEnabledInput) {
                    autoStartEnabledInput.checked = this.config.autoStartEnabled;
                }
                
                document.getElementById('config-modal').classList.remove('hidden');
            };

            document.querySelector('#cancel-config').onclick = (e) => {
                e.preventDefault();
                console.log('[Game] Closing configuration modal');
                document.getElementById('config-modal').classList.add('hidden');
            };

            document.querySelector('#save-config').onclick = (e) => {
                e.preventDefault();
                console.log('[Game] Saving configuration');
                const config = {
                    playerCount: parseInt(document.getElementById('player-count').value),
                    minHumanPlayers: parseInt(document.getElementById('min-human-players').value),
                    autoStartTime: parseInt(document.getElementById('auto-start-time').value),
                    autoStartEnabled: document.getElementById('auto-start-enabled').checked
                };
                this.updateConfig(config);
            };

            // Statistics handler
            document.querySelector('#show-stats').onclick = (e) => {
                e.preventDefault();
                console.log('[Game] Showing statistics');
                if (window.gameStats) {
                    window.gameStats.displayStats();
                }
            };

            console.log('[Game] Event listeners set up successfully');
        } catch (error) {
            console.error('[Game] Error setting up event listeners:', error);
        }
    }

    updateConfig(newConfig) {
        console.log('[Game] Updating configuration:', newConfig);
        
        // Validate and update configuration
        this.config.maxPlayers = Math.min(Math.max(3, newConfig.playerCount), 100);
        this.config.minHumanPlayers = Math.min(Math.max(1, newConfig.minHumanPlayers), this.config.maxPlayers);
        this.config.autoStartTime = Math.min(Math.max(10, newConfig.autoStartTime), 300);
        this.config.autoStartEnabled = newConfig.autoStartEnabled;

        // Update error message element
        const errorAlert = document.getElementById('error-alert');
        const errorMessage = document.getElementById('error-message');

        // Show configuration update message
        if (errorAlert && errorMessage) {
            errorMessage.textContent = 'Game settings updated successfully';
            errorAlert.classList.remove('bg-red-600');
            errorAlert.classList.add('bg-green-600');
            errorAlert.classList.remove('hidden');
            setTimeout(() => {
                errorAlert.classList.add('hidden');
            }, 3000);
        }

        // Reset the game with new configuration
        this.resetGame();
    }

    checkAutoStart() {
        if (!this.config.autoStartEnabled || this.state.isActive) {
            return;
        }

        const humanPlayers = 1; // For now, we only have one human player
        if (humanPlayers >= this.config.minHumanPlayers) {
            console.log('[Game] Auto-start conditions met, starting game...');
            this.startGame();
        }
    }

    startGame() {
        console.log('[Game] Starting game...');
        
        // Clear any existing auto-start timer
        if (this.autoStartTimer) {
            clearTimeout(this.autoStartTimer);
            this.autoStartTimer = null;
        }

        if (this.state.players.length >= this.config.minHumanPlayers) {
            this.state.isActive = true;
            this.state.roundInProgress = false;
            this.state.currentRound = 1;
            this.state.timeRemaining = this.config.roundTime;
            this.state.choices.clear();
            this.state.playerChoice = null;
            this.state.isDeciderRound = false;
            this.state.decider = null;
            
            // Clear any existing timer
            if (this.state.timer) {
                clearInterval(this.state.timer);
                this.state.timer = null;
            }

            // Enable game buttons
            const pressButton = document.querySelector('#press-button');
            const dontPressButton = document.querySelector('#dont-press-button');
            if (pressButton) {
                pressButton.disabled = false;
                pressButton.classList.remove('disabled');
            }
            if (dontPressButton) {
                dontPressButton.disabled = false;
                dontPressButton.classList.remove('disabled');
            }

            // Update UI before starting the round
            if (window.gameUI) {
                window.gameUI.updateGameState(this.state);
            }

            // Start the first round after a short delay
            setTimeout(() => {
                this.startRound();
            }, 1000);

            console.log('[Game] Game started successfully');
        } else {
            console.log('[Game] Not enough players to start');
        }
    }

    startRound() {
        if (this.state.roundInProgress) return;
        
        console.log(`[Game] Starting round ${this.state.currentRound}`);
        
        this.state.roundInProgress = true;
        this.state.timeRemaining = this.config.roundTime;
        this.state.choices.clear();
        this.state.playerChoice = null;
        
        // Clear any existing timer
        if (this.state.timer) {
            clearInterval(this.state.timer);
        }
        
        // Start timer
        this.state.timer = setInterval(() => {
            if (this.state.timeRemaining > 0) {
                this.state.timeRemaining--;
                console.log(`[Game] Time remaining: ${this.state.timeRemaining}`);
                
                if (window.gameUI) {
                    window.gameUI.updateGameState(this.state);
                }
                
                if (this.shouldEndRound()) {
                    this.endRound();
                }
            } else {
                this.endRound();
            }
        }, 1000);

        // If it's the decider round, create The Decider
        if (this.state.isDeciderRound && !this.state.decider) {
            this.createDecider();
        }

        // Schedule bot choices
        this.scheduleBotChoices();
    }

    createDecider() {
        this.state.decider = {
            id: 'decider-' + Date.now(),
            name: 'The Decider',
            isBot: true,
            isEliminated: false
        };
        console.log('[Game] The Decider has entered the game');
    }

    shouldEndRound() {
        if (this.state.timeRemaining <= 0) return true;
        
        const activePlayers = this.state.players.filter(p => !p.isEliminated).length;
        const choicesMade = this.state.choices.size;
        
        // In decider round, we need the decider's choice too
        if (this.state.isDeciderRound) {
            return choicesMade === activePlayers + 1; // +1 for the decider
        }
        
        return choicesMade === activePlayers;
    }

    makeChoice(didPress) {
        if (!this.state.isActive || !this.state.roundInProgress) {
            console.log('[Game] Cannot make choice - game not active or round not in progress');
            return;
        }

        const player = this.state.humanPlayer;
        if (!player.isEliminated) {
            console.log(`[Game] Player chose: ${didPress ? 'Press' : "Don't Press"}`);
            this.state.choices.set(player.id, didPress);
            this.state.playerChoice = didPress;
            
            // Disable buttons after choice
            const pressButton = document.querySelector('#press-button');
            const dontPressButton = document.querySelector('#dont-press-button');
            if (pressButton) {
                pressButton.disabled = true;
                pressButton.classList.add('disabled');
            }
            if (dontPressButton) {
                dontPressButton.disabled = true;
                dontPressButton.classList.add('disabled');
            }
            
            if (window.gameUI) {
                window.gameUI.showChoice(didPress);
                window.gameUI.updateGameState(this.state);
            }

            if (this.shouldEndRound()) {
                this.endRound();
            }
        }
    }

    fillWithBots() {
        const botsNeeded = this.config.maxPlayers - this.state.players.length;
        let botsAdded = 0;

        const addBot = () => {
            if (botsAdded < botsNeeded) {
                const botId = 'bot-' + Date.now() + '-' + botsAdded;
                const botNumber = botsAdded + 1;
                const bot = {
                    id: botId,
                    name: `Bot ${botNumber}`,
                    isBot: true,
                    isEliminated: false
                };
                
                this.state.players.push(bot);
                botsAdded++;

                if (window.gameUI) {
                    window.gameUI.updateGameState(this.state);
                }

                if (botsAdded < botsNeeded) {
                    setTimeout(addBot, this.config.botFillDelay);
                }
            }
        };

        addBot();
    }

    scheduleBotChoices() {
        const activeBots = this.state.players.filter(p => p.isBot && !p.isEliminated);
        console.log(`[Game] Scheduling choices for ${activeBots.length} bots`);
        
        // Schedule The Decider's choice if it's the decider round
        if (this.state.isDeciderRound && this.state.decider) {
            const deciderDelay = this.devConfig.quickBotDecisions ? 1000 : Math.random() * 10000 + 5000;
            setTimeout(() => {
                if (this.state.roundInProgress) {
                    const deciderChoice = Math.random() > 0.5;
                    console.log(`[Game] The Decider chose: ${deciderChoice ? 'Press' : "Don't Press"}`);
                    this.state.choices.set(this.state.decider.id, deciderChoice);
                    
                    if (window.gameUI) {
                        window.gameUI.updateGameState(this.state);
                    }
                    
                    if (this.shouldEndRound()) {
                        this.endRound();
                    }
                }
            }, deciderDelay);
        }
        
        // Schedule regular bot choices
        activeBots.forEach(bot => {
            const delay = this.devConfig.quickBotDecisions ? 
                Math.random() * 2000 + 1000 : // 1-3 seconds in dev mode
                Math.random() * 10000 + 5000; // 5-15 seconds in normal mode
            
            setTimeout(() => {
                if (this.state.roundInProgress && !bot.isEliminated) {
                    let choice;
                    if (this.state.currentRound === 1) {
                        choice = Math.random() > 0.62;
                    } else {
                        const previousChoices = Array.from(this.state.choices.values());
                        const pressCount = previousChoices.filter(c => c).length;
                        const majorityPressed = pressCount > previousChoices.length / 2;
                        choice = Math.random() < (majorityPressed ? 0.6 : 0.4);
                    }
                    
                    console.log(`[Game] Bot ${bot.name} chose: ${choice ? 'Press' : "Don't Press"}`);
                    this.state.choices.set(bot.id, choice);
                    
                    if (window.gameUI) {
                        window.gameUI.updateGameState(this.state);
                    }
                    
                    if (this.shouldEndRound()) {
                        this.endRound();
                    }
                }
            }, delay);
        });
    }

    endRound() {
        if (!this.state.roundInProgress) return;
        
        console.log(`[Game] Ending round ${this.state.currentRound}`);
        
        clearInterval(this.state.timer);
        this.state.roundInProgress = false;
        
        // Force choices for players who didn't make a decision
        this.state.players.forEach(player => {
            if (!player.isEliminated && !this.state.choices.has(player.id)) {
                this.state.choices.set(player.id, false);
                console.log(`[Game] ${player.name} didn't choose - defaulting to Don't Press`);
            }
        });

        // Handle decider round differently
        if (this.state.isDeciderRound) {
            this.handleDeciderRoundEnd();
            return;
        }
        
        // Count choices for regular rounds
        let pressCount = 0;
        let dontPressCount = 0;
        
        this.state.choices.forEach(choice => {
            if (choice) pressCount++;
            else dontPressCount++;
        });

        const majorityPressed = pressCount > dontPressCount;
        const isTie = pressCount === dontPressCount;

        console.log(`[Game] Round results: Press=${pressCount}, Don't Press=${dontPressCount}, Tie=${isTie}`);

        if (window.gameUI) {
            window.gameUI.showRoundResults({
                pressCount,
                dontPressCount,
                isTie,
                majorityPressed
            });
        }

        if (!isTie) {
            this.state.players.forEach(player => {
                if (!player.isEliminated) {
                    const playerChoice = this.state.choices.get(player.id);
                    if (playerChoice !== majorityPressed) {
                        player.isEliminated = true;
                        console.log(`[Game] ${player.name} eliminated!`);
                    }
                }
            });
        }

        if (window.gameUI) {
            window.gameUI.updateGameState(this.state);
        }

        const remainingPlayers = this.state.players.filter(p => !p.isEliminated).length;
        console.log(`[Game] Players remaining: ${remainingPlayers}`);
        
        if (remainingPlayers === 2) {
            setTimeout(() => this.triggerDeciderRound(), this.config.roundEndDelay);
        } else if (remainingPlayers === 1) {
            const winner = this.state.players.find(p => !p.isEliminated);
            if (window.gameUI) {
                window.gameUI.showGameOver(winner);
            }
        } else if (remainingPlayers > 2) {
            setTimeout(() => {
                this.state.currentRound++;
                this.state.playerChoice = null;
                this.startRound();
            }, this.config.roundEndDelay);
        } else {
            if (window.gameUI) {
                window.gameUI.showGameOver(null);
            }
        }
    }

    handleDeciderRoundEnd() {
        console.log('[Game] Handling decider round end');
        
        const deciderChoice = this.state.choices.get(this.state.decider.id);
        const finalists = this.state.players.filter(p => !p.isEliminated);
        const winners = finalists.filter(p => 
            this.state.choices.get(p.id) === deciderChoice
        );

        console.log(`[Game] The Decider chose: ${deciderChoice ? 'Press' : "Don't Press"}`);
        console.log(`[Game] Winners matching The Decider: ${winners.length}`);

        if (window.gameUI) {
            window.gameUI.showRoundResults({
                deciderChoice,
                winners: winners.length,
                isDeciderRound: true
            });
            
            if (winners.length > 0) {
                window.gameUI.showGameOver(winners.length === 1 ? winners[0] : winners);
            } else {
                window.gameUI.showGameOver(null);
            }
        }
    }

    triggerDeciderRound() {
        console.log('[Game] Starting decider round!');
        this.state.isDeciderRound = true;
        this.state.currentRound++;
        this.startRound();
    }

    resetGame() {
        console.log('[Game] Resetting game...');
        
        // Clear all timers
        if (this.state.timer) {
            clearInterval(this.state.timer);
        }
        if (this.autoStartTimer) {
            clearTimeout(this.autoStartTimer);
        }
        this.state = {
            isActive: false,
            currentRound: 1,
            timeRemaining: this.config.roundTime,
            players: [],
            humanPlayer: null,
            choices: new Map(),
            timer: null,
            isDeciderRound: false,
            decider: null,
            playerChoice: null,
            roundInProgress: false
        };
        this.initialize();
        if (window.gameUI) {
            window.gameUI.updateGameState(this.state);
        }
    }

    toggleBots() {
        console.log('[Game] Bot behavior toggled');
        // Implementation for bot behavior toggle will be added later
    }

    showError(message) {
        const errorAlert = document.getElementById('error-alert');
        const errorMessage = document.getElementById('error-message');
        
        if (errorAlert && errorMessage) {
            errorMessage.textContent = message;
            errorAlert.classList.remove('bg-green-600');
            errorAlert.classList.add('bg-red-600');
            errorAlert.classList.remove('hidden');
            setTimeout(() => {
                errorAlert.classList.add('hidden');
            }, 3000);
        }
    }
}

// Initialize game when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[Game] Creating game instance...');
        // Create game instance with development configuration
        window.game = new Game({
            isDevelopment: true,  // Enable development mode
            playerCount: 10,      // Reduce player count for faster testing
            roundTime: 10,        // Shorter rounds
            botFillDelay: 100,    // Faster bot filling
            roundEndDelay: 1500,  // Shorter delay between rounds
            quickBotDecisions: true  // Bots make decisions faster
        });
    });
} else {
    console.log('[Game] Creating game instance...');
    window.game = new Game({
        isDevelopment: true,
        playerCount: 10,
        roundTime: 10,
        botFillDelay: 100,
        roundEndDelay: 1500,
        quickBotDecisions: true
    });
}
