class GameUI {
    constructor() {
        console.log('[UI] Initializing...');
        this.elements = {};
        // Initialize elements immediately if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }

    setupElements() {
        console.log('[UI] Setting up elements...');
        this.elements = {
            roundNumber: document.getElementById('round-number'),
            playersRemaining: document.getElementById('players-remaining'),
            timeLeft: document.getElementById('time-left'),
            playerList: document.getElementById('player-list'),
            pressButton: document.getElementById('press-button'),
            dontPressButton: document.getElementById('dont-press-button'),
            choiceStatus: document.getElementById('choice-status')
        };

        // Auto-start countdown timer
        this.autoStartTimer = null;
    }

    showAutoStartCountdown(seconds) {
        console.log('[UI] Starting auto-start countdown:', seconds);
        
        // Create or update countdown overlay
        let overlay = document.getElementById('auto-start-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'auto-start-overlay';
            overlay.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 z-50';
            document.body.appendChild(overlay);
        }

        const updateCountdown = (timeLeft) => {
            overlay.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-clock mr-3"></i>
                    <div>
                        <p class="font-bold">Game starting in</p>
                        <p class="text-2xl">${timeLeft} seconds</p>
                    </div>
                </div>
            `;
        };

        // Clear any existing timer
        if (this.autoStartTimer) {
            clearInterval(this.autoStartTimer);
        }

        // Start countdown
        let timeLeft = seconds;
        updateCountdown(timeLeft);

        this.autoStartTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(this.autoStartTimer);
                overlay.remove();
            } else {
                updateCountdown(timeLeft);
            }
        }, 1000);
    }

    updateGameState(state) {
        console.log('[UI] Updating game state...');
        
        // Update round number
        if (this.elements.roundNumber) {
            this.elements.roundNumber.textContent = state.currentRound;
        }

        // Update players remaining
        if (this.elements.playersRemaining) {
            const remainingCount = state.players.filter(p => !p.isEliminated).length;
            this.elements.playersRemaining.textContent = remainingCount;
        }

        // Update time left
        if (this.elements.timeLeft) {
            this.elements.timeLeft.textContent = state.timeRemaining;
        }

        // Update player list
        if (this.elements.playerList) {
            this.updatePlayerList(state);
        }

        // Update button states
        if (state.isActive && state.roundInProgress) {
            if (this.elements.pressButton) {
                this.elements.pressButton.disabled = false;
                this.elements.pressButton.classList.remove('disabled');
            }
            if (this.elements.dontPressButton) {
                this.elements.dontPressButton.disabled = false;
                this.elements.dontPressButton.classList.remove('disabled');
            }
        } else {
            if (this.elements.pressButton) {
                this.elements.pressButton.disabled = true;
                this.elements.pressButton.classList.add('disabled');
            }
            if (this.elements.dontPressButton) {
                this.elements.dontPressButton.disabled = true;
                this.elements.dontPressButton.classList.add('disabled');
            }
        }

        // Update round type indicator
        if (state.isDeciderRound) {
            document.body.classList.add('decider-round');
            if (this.elements.roundNumber) {
                this.elements.roundNumber.parentElement.classList.add('decider');
            }
        } else {
            document.body.classList.remove('decider-round');
            if (this.elements.roundNumber) {
                this.elements.roundNumber.parentElement.classList.remove('decider');
            }
        }
    }

    updatePlayerList(state) {
        const playerList = this.elements.playerList;
        if (!playerList) return;

        // Clear existing list
        playerList.innerHTML = '';

        // Add all players
        state.players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = `p-3 rounded-lg ${player.isEliminated ? 'bg-red-900' : 'bg-gray-700'} flex items-center justify-between`;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'flex items-center';
            
            // Add appropriate icon based on player type
            const icon = document.createElement('i');
            if (player.name === 'The Decider') {
                icon.className = 'fas fa-balance-scale mr-2';
            } else if (player.isBot) {
                icon.className = 'fas fa-robot mr-2';
            } else {
                icon.className = 'fas fa-user mr-2';
            }
            nameSpan.appendChild(icon);
            
            const nameText = document.createTextNode(player.name);
            nameSpan.appendChild(nameText);
            
            playerElement.appendChild(nameSpan);
            
            // Add choice indicator if player has made a choice
            if (state.choices.has(player.id)) {
                const choice = state.choices.get(player.id);
                const choiceIcon = document.createElement('i');
                choiceIcon.className = choice ? 'fas fa-check text-green-500' : 'fas fa-times text-red-500';
                playerElement.appendChild(choiceIcon);
            }
            
            playerList.appendChild(playerElement);
        });

        // Add The Decider if it's the decider round
        if (state.isDeciderRound && state.decider) {
            const deciderElement = document.createElement('div');
            deciderElement.className = 'p-3 rounded-lg bg-purple-900 flex items-center justify-between';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'flex items-center';
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-balance-scale mr-2';
            nameSpan.appendChild(icon);
            
            const nameText = document.createTextNode('The Decider');
            nameSpan.appendChild(nameText);
            
            deciderElement.appendChild(nameSpan);
            
            // Add choice indicator if The Decider has made a choice
            if (state.choices.has(state.decider.id)) {
                const choice = state.choices.get(state.decider.id);
                const choiceIcon = document.createElement('i');
                choiceIcon.className = choice ? 'fas fa-check text-green-500' : 'fas fa-times text-red-500';
                deciderElement.appendChild(choiceIcon);
            }
            
            playerList.appendChild(deciderElement);
        }
    }

    showChoice(didPress) {
        if (this.elements.choiceStatus) {
            this.elements.choiceStatus.textContent = `Your choice: ${didPress ? 'Press' : "Don't Press"}`;
            this.elements.choiceStatus.classList.remove('hidden');
        }
    }

    showRoundResults(results) {
        // Create results overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50';
        
        let content;
        if (results.isDeciderRound) {
            content = `
                <div class="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4 text-center">
                    <h2 class="text-3xl font-bold mb-4">The Decider's Choice</h2>
                    <p class="text-xl mb-4">The Decider chose to ${results.deciderChoice ? 'Press' : "Don't Press"}</p>
                    <p class="text-lg mb-6">${results.winners} player(s) matched The Decider's choice</p>
                </div>
            `;
        } else {
            const total = results.pressCount + results.dontPressCount;
            const pressPercent = ((results.pressCount / total) * 100).toFixed(1);
            const dontPressPercent = ((results.dontPressCount / total) * 100).toFixed(1);
            
            content = `
                <div class="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4 text-center">
                    <h2 class="text-3xl font-bold mb-4">Round Results</h2>
                    ${results.isTie ? 
                        '<p class="text-2xl mb-6 text-yellow-400">Tie! All players advance</p>' :
                        `<p class="text-2xl mb-6">${results.majorityPressed ? 'Press' : "Don't Press"} wins!</p>`
                    }
                    <div class="space-y-4">
                        <div>
                            <p class="text-lg">Pressed: ${results.pressCount} (${pressPercent}%)</p>
                            <div class="h-2 bg-gray-700 rounded-full mt-2">
                                <div class="h-full bg-blue-600 rounded-full" style="width: ${pressPercent}%"></div>
                            </div>
                        </div>
                        <div>
                            <p class="text-lg">Didn't Press: ${results.dontPressCount} (${dontPressPercent}%)</p>
                            <div class="h-2 bg-gray-700 rounded-full mt-2">
                                <div class="h-full bg-red-600 rounded-full" style="width: ${dontPressPercent}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        overlay.innerHTML = content;
        document.body.appendChild(overlay);

        // Remove overlay after delay
        setTimeout(() => {
            overlay.remove();
        }, 3000);
    }

    showGameOver(winner) {
        // Clear any existing auto-start timer
        if (this.autoStartTimer) {
            clearInterval(this.autoStartTimer);
            const autoStartOverlay = document.getElementById('auto-start-overlay');
            if (autoStartOverlay) {
                autoStartOverlay.remove();
            }
        }

        // Create game over overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50';
        
        let content;
        if (!winner) {
            content = `
                <div class="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4 text-center">
                    <h2 class="text-3xl font-bold mb-4">Game Over</h2>
                    <p class="text-xl mb-6">No winners this time!</p>
                    <button onclick="window.game.resetGame()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full">
                        Play Again
                    </button>
                </div>
            `;
        } else if (Array.isArray(winner)) {
            content = `
                <div class="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4 text-center">
                    <h2 class="text-3xl font-bold mb-4">Co-Champions!</h2>
                    <p class="text-xl mb-6">${winner.map(w => w.name).join(' and ')} win!</p>
                    <button onclick="window.game.resetGame()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full">
                        Play Again
                    </button>
                </div>
            `;
        } else {
            content = `
                <div class="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4 text-center">
                    <h2 class="text-3xl font-bold mb-4">Winner!</h2>
                    <p class="text-xl mb-6">${winner.name} wins!</p>
                    <button onclick="window.game.resetGame()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full">
                        Play Again
                    </button>
                </div>
            `;
        }
        
        overlay.innerHTML = content;
        document.body.appendChild(overlay);
    }
}

// Initialize UI when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[UI] Creating UI instance...');
        window.gameUI = new GameUI();
    });
} else {
    console.log('[UI] Creating UI instance...');
    window.gameUI = new GameUI();
}
