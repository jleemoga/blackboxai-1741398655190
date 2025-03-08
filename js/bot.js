class BotPlayer {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.isBot = true;
        this.isEliminated = false;
        this.stats = {
            pressFrequency: 0,
            roundsSurvived: 0,
            gamesPlayed: 0,
            wins: 0
        };
        
        // Decision-making weights
        this.weights = {
            basePressProbability: 0.38, // 62% chance to not press in first round
            majorityBias: 0.6, // 60% chance to follow majority from previous round
            randomnessFactor: 0.1 // Add some randomness to decisions
        };

        this.lastRoundMajority = null; // Track majority choice from previous round
    }

    makeDecision(gameState) {
        if (gameState.currentRound === 1) {
            return this.makeFirstRoundDecision();
        }
        return this.makeWeightedDecision(gameState);
    }

    makeFirstRoundDecision() {
        // First round: 38% press, 62% don't press (as per global statistics)
        return Math.random() < this.weights.basePressProbability;
    }

    makeWeightedDecision(gameState) {
        let pressProbability = this.weights.basePressProbability;

        // Analyze previous round results if available
        if (this.lastRoundMajority !== null) {
            // 60/40 bias toward majority choice from previous round
            pressProbability = this.lastRoundMajority ? 
                this.weights.majorityBias : // 60% chance to press if majority pressed
                1 - this.weights.majorityBias; // 40% chance to press if majority didn't press
        }

        // Analyze current round choices if some players have already decided
        const currentChoices = Array.from(gameState.choices.values());
        if (currentChoices.length > 0) {
            const pressCount = currentChoices.filter(c => c).length;
            const currentPressRatio = pressCount / currentChoices.length;
            
            // Slightly adjust probability based on current round trends
            pressProbability = (pressProbability + currentPressRatio) / 2;
        }

        // Add small random variation (-5% to +5%)
        pressProbability += (Math.random() - 0.5) * this.weights.randomnessFactor;

        // Ensure probability stays within 0-1 range
        pressProbability = Math.max(0, Math.min(1, pressProbability));

        // Make final decision
        const decision = Math.random() < pressProbability;
        
        // Log bot's decision-making process if in development mode
        if (window.gameDebug) {
            console.log(`[Bot ${this.name}] Decision process:`, {
                baseProbability: this.weights.basePressProbability,
                lastRoundMajority: this.lastRoundMajority,
                currentRoundTrend: currentChoices.length > 0 ? currentPressRatio : 'N/A',
                finalProbability: pressProbability,
                decision: decision ? 'Press' : "Don't Press"
            });
        }

        return decision;
    }

    updateLastRoundMajority(majorityPressed) {
        this.lastRoundMajority = majorityPressed;
    }

    updateStats(roundResult) {
        if (roundResult.survived) {
            this.stats.roundsSurvived++;
        }
        if (roundResult.choice) {
            this.stats.pressFrequency++;
        }
    }

    getDelayedDecisionTime() {
        // Return a random delay between 1-15 seconds for bot decisions
        return Math.floor(Math.random() * 14000) + 1000;
    }

    generateBotName() {
        const prefixes = ['Bot', 'AI', 'CPU', 'NPC', 'Agent'];
        const adjectives = ['Smart', 'Quick', 'Clever', 'Wise', 'Sharp'];
        const numbers = Math.floor(Math.random() * 999) + 1;

        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];

        return `${prefix}_${adjective}${numbers}`;
    }

    static createBot(id) {
        const bot = new BotPlayer(id, null);
        bot.name = bot.generateBotName();
        return bot;
    }
}

class BotManager {
    constructor() {
        this.bots = new Map();
        this.globalStats = {
            totalGames: 0,
            averagePressRate: 0,
            averageSurvivalRounds: 0
        };
    }

    createBot() {
        const botId = 'bot-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const bot = BotPlayer.createBot(botId);
        this.bots.set(botId, bot);
        return bot;
    }

    createBots(count) {
        const bots = [];
        for (let i = 0; i < count; i++) {
            bots.push(this.createBot());
        }
        return bots;
    }

    getBotById(id) {
        return this.bots.get(id);
    }

    updateBotStats(botId, roundResult) {
        const bot = this.getBotById(botId);
        if (bot) {
            bot.updateStats(roundResult);
        }
    }

    getGlobalStats() {
        let totalPressRate = 0;
        let totalSurvivalRounds = 0;
        const botCount = this.bots.size;

        this.bots.forEach(bot => {
            totalPressRate += bot.stats.pressFrequency / bot.stats.gamesPlayed;
            totalSurvivalRounds += bot.stats.roundsSurvived / bot.stats.gamesPlayed;
        });

        return {
            averagePressRate: totalPressRate / botCount,
            averageSurvivalRounds: totalSurvivalRounds / botCount,
            totalGames: this.globalStats.totalGames
        };
    }

    resetBotStats() {
        this.bots.forEach(bot => {
            bot.stats = {
                pressFrequency: 0,
                roundsSurvived: 0,
                gamesPlayed: 0,
                wins: 0
            };
        });
        
        this.globalStats = {
            totalGames: 0,
            averagePressRate: 0,
            averageSurvivalRounds: 0
        };
    }
}

// Initialize bot manager when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.botManager = new BotManager();
});
