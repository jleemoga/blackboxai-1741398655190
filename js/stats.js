class GameStats {
    constructor() {
        this.stats = {
            gamesPlayed: 0,
            winRate: 0,
            avgRounds: 0,
            avgGroupSize: 0,
            choiceFrequency: {
                press: 0,
                dontPress: 0
            },
            recentGames: []
        };

        // Maximum number of recent games to store
        this.maxRecentGames = 10;

        // Initialize local storage
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem('gameStats')) {
            localStorage.setItem('gameStats', JSON.stringify(this.stats));
        } else {
            this.stats = JSON.parse(localStorage.getItem('gameStats'));
        }
    }

    updateStats(gameResult) {
        // Update games played
        this.stats.gamesPlayed++;

        // Update win rate
        const wins = this.stats.recentGames.filter(game => game.outcome === 'win').length;
        this.stats.winRate = (wins / this.stats.gamesPlayed) * 100;

        // Update average rounds
        const totalRounds = this.stats.recentGames.reduce((sum, game) => sum + game.rounds, 0);
        this.stats.avgRounds = totalRounds / this.stats.recentGames.length;

        // Update choice frequency
        if (gameResult.choice === 'press') {
            this.stats.choiceFrequency.press++;
        } else {
            this.stats.choiceFrequency.dontPress++;
        }

        // Add to recent games
        this.addRecentGame(gameResult);

        // Save to local storage
        this.saveStats();
    }

    addRecentGame(gameResult) {
        const game = {
            date: new Date().toISOString(),
            rounds: gameResult.rounds,
            outcome: gameResult.outcome,
            finalGroupSize: gameResult.finalGroupSize
        };

        this.stats.recentGames.unshift(game);

        // Keep only the most recent games
        if (this.stats.recentGames.length > this.maxRecentGames) {
            this.stats.recentGames.pop();
        }

        // Update average group size
        const totalGroupSize = this.stats.recentGames.reduce((sum, game) => sum + game.finalGroupSize, 0);
        this.stats.avgGroupSize = totalGroupSize / this.stats.recentGames.length;
    }

    saveStats() {
        localStorage.setItem('gameStats', JSON.stringify(this.stats));
    }

    getStats() {
        return this.stats;
    }

    resetStats() {
        this.stats = {
            gamesPlayed: 0,
            winRate: 0,
            avgRounds: 0,
            avgGroupSize: 0,
            choiceFrequency: {
                press: 0,
                dontPress: 0
            },
            recentGames: []
        };
        this.saveStats();
    }

    displayStats() {
        // Create stats overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50';
        
        const totalChoices = this.stats.choiceFrequency.press + this.stats.choiceFrequency.dontPress;
        const pressPercentage = totalChoices > 0 
            ? ((this.stats.choiceFrequency.press / totalChoices) * 100).toFixed(1) 
            : 0;
        const dontPressPercentage = totalChoices > 0 
            ? ((this.stats.choiceFrequency.dontPress / totalChoices) * 100).toFixed(1) 
            : 0;

        overlay.innerHTML = `
            <div class="bg-gray-800 p-8 rounded-lg max-w-2xl w-full mx-4">
                <h2 class="text-3xl font-bold mb-6 text-center">Player Statistics</h2>
                
                <!-- Main Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <h3 class="text-gray-400 text-sm mb-1">Games Played</h3>
                        <p class="text-2xl font-bold">${this.stats.gamesPlayed}</p>
                    </div>
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <h3 class="text-gray-400 text-sm mb-1">Win Rate</h3>
                        <p class="text-2xl font-bold">${this.stats.winRate.toFixed(1)}%</p>
                    </div>
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <h3 class="text-gray-400 text-sm mb-1">Avg. Rounds Survived</h3>
                        <p class="text-2xl font-bold">${this.stats.avgRounds.toFixed(1)}</p>
                    </div>
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <h3 class="text-gray-400 text-sm mb-1">Avg. Final Group Size</h3>
                        <p class="text-2xl font-bold">${this.stats.avgGroupSize.toFixed(1)}</p>
                    </div>
                </div>

                <!-- Choice Distribution -->
                <div class="bg-gray-700 p-4 rounded-lg mb-8">
                    <h3 class="text-gray-400 text-sm mb-3">Choice Distribution</h3>
                    <div class="flex items-center gap-4">
                        <div class="flex-1">
                            <div class="flex justify-between mb-1">
                                <span>Press</span>
                                <span>${pressPercentage}%</span>
                            </div>
                            <div class="h-2 bg-gray-600 rounded-full">
                                <div class="h-full bg-blue-600 rounded-full" 
                                     style="width: ${pressPercentage}%"></div>
                            </div>
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between mb-1">
                                <span>Don't Press</span>
                                <span>${dontPressPercentage}%</span>
                            </div>
                            <div class="h-2 bg-gray-600 rounded-full">
                                <div class="h-full bg-red-600 rounded-full" 
                                     style="width: ${dontPressPercentage}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Games -->
                <div class="bg-gray-700 p-4 rounded-lg">
                    <h3 class="text-gray-400 text-sm mb-3">Recent Games</h3>
                    <div class="space-y-2">
                        ${this.stats.recentGames.map(game => `
                            <div class="flex justify-between items-center p-2 bg-gray-600 rounded">
                                <span>${new Date(game.date).toLocaleDateString()}</span>
                                <span>Rounds: ${game.rounds}</span>
                                <span class="${game.outcome === 'win' ? 'text-green-400' : 'text-red-400'}">
                                    ${game.outcome.charAt(0).toUpperCase() + game.outcome.slice(1)}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Close Button -->
                <div class="text-center mt-6">
                    <button id="close-stats" 
                            class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-full">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Handle close button
        document.getElementById('close-stats').addEventListener('click', () => {
            overlay.remove();
        });
    }
}

// Initialize stats when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gameStats = new GameStats();
});
