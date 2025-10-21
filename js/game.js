// 游戏主逻辑
class Game {
    static PHASES = {
        INIT: 'init',           // 初始化
        DEALING: 'dealing',     // 发牌
        BIDDING: 'bidding',     // 叫地主
        GRABBING: 'grabbing',   // 抢地主
        PLAYING: 'playing',     // 出牌
        GAME_OVER: 'game_over'  // 游戏结束
    };

    constructor() {
        this.players = [
            new Player('我', true),           // 玩家
            new Player('电脑玩家1', false),    // 上家
            new Player('电脑玩家2', false)     // 下家
        ];
        this.currentPlayerIndex = 0;
        this.deck = [];
        this.bottomCards = [];
        this.phase = Game.PHASES.INIT;
        this.lastPlayedCards = null;
        this.lastPlayedType = null;
        this.lastPlayedPlayerIndex = -1;
        this.passCount = 0;
        this.bidScore = 0;
        this.currentBidPlayerIndex = -1;
        this.landlordIndex = -1;
        this.multiple = 1; // 倍数
        this.bidCount = 0; // 叫地主计数
        this.grabCount = 0; // 抢地主计数
        this.lastGrabPlayerIndex = -1; // 最后一个抢地主的人

        // AI实例
        this.aiPlayers = [
            null,
            new AI(this.players[1]),
            new AI(this.players[2])
        ];
    }

    // 开始新游戏
    startNewGame() {
        this.reset();
        this.phase = Game.PHASES.DEALING;
        this.dealCards();
    }

    // 重置游戏
    reset() {
        this.players.forEach(player => player.reset());
        this.currentPlayerIndex = Math.floor(Math.random() * 3); // 随机起始玩家
        this.deck = [];
        this.bottomCards = [];
        this.lastPlayedCards = null;
        this.lastPlayedType = null;
        this.lastPlayedPlayerIndex = -1;
        this.passCount = 0;
        this.bidScore = 0;
        this.currentBidPlayerIndex = -1;
        this.landlordIndex = -1;
        this.multiple = 1;
        this.bidCount = 0;
        this.grabCount = 0;
        this.lastGrabPlayerIndex = -1;
    }

    // 发牌
    dealCards() {
        // 创建并洗牌
        this.deck = Card.shuffle(Card.createDeck());
        
        // 发牌：每人17张，留3张底牌
        for (let i = 0; i < 51; i++) {
            const playerIndex = i % 3;
            this.players[playerIndex].receiveCards([this.deck[i]]);
        }
        
        // 底牌
        this.bottomCards = this.deck.slice(51, 54);
        
        this.phase = Game.PHASES.BIDDING;
    }

    // 叫地主
    bid(playerIndex, score) {
        if (this.phase !== Game.PHASES.BIDDING) {
            return false;
        }

        const player = this.players[playerIndex];
        
        // 记录玩家的叫分
        if (score > 0) {
            if (score > this.bidScore) {
                this.bidScore = score;
                this.currentBidPlayerIndex = playerIndex;
            }
            player.bid(score);
        } else {
            player.bid(0); // 不叫
        }

        this.bidCount++;

        // 如果叫3分，直接确定地主
        if (score === 3) {
            this.setLandlord(playerIndex);
            return true;
        }

        // 下一个玩家
        const nextIndex = (playerIndex + 1) % 3;
        this.currentPlayerIndex = nextIndex;
        
        // 检查是否所有人都叫过了（转了一圈）
        if (this.bidCount >= 3) {
            if (this.bidScore === 0) {
                // 所有人都不叫，重新发牌
                this.startNewGame();
                return false;
            } else {
                // 有人叫了分，进入抢地主阶段
                this.phase = Game.PHASES.GRABBING;
                // 从第一个玩家开始，所有人都可以抢（包括叫地主的人）
                this.currentPlayerIndex = 0;
                this.grabCount = 0;
                this.lastGrabPlayerIndex = -1;
            }
        }

        return true;
    }

    // 抢地主
    grab(playerIndex, shouldGrab) {
        if (this.phase !== Game.PHASES.GRABBING) {
            return false;
        }

        if (shouldGrab) {
            // 有人抢地主，记录下来
            this.lastGrabPlayerIndex = playerIndex;
            this.multiple *= 2;
        }

        this.grabCount++;

        // 下一个玩家
        const nextIndex = (playerIndex + 1) % 3;
        this.currentPlayerIndex = nextIndex;
        
        // 所有人都做出决定后（转了一圈），确定地主
        if (this.grabCount >= 3) {
            // 如果有人抢了，最后一个抢的人是地主
            if (this.lastGrabPlayerIndex !== -1) {
                this.setLandlord(this.lastGrabPlayerIndex);
            } else {
                // 没人抢，叫地主的人是地主
                this.setLandlord(this.currentBidPlayerIndex);
            }
            return true;
        }

        return false;
    }

    // 设置地主
    setLandlord(playerIndex) {
        this.landlordIndex = playerIndex;
        const landlord = this.players[playerIndex];
        
        // 设置角色
        landlord.setRole(Player.ROLES.LANDLORD);
        landlord.receiveCards(this.bottomCards);
        
        for (let i = 0; i < 3; i++) {
            if (i !== playerIndex) {
                this.players[i].setRole(Player.ROLES.FARMER);
            }
        }

        // 地主先出牌
        this.currentPlayerIndex = playerIndex;
        this.phase = Game.PHASES.PLAYING;
        this.lastPlayedCards = null;
        this.lastPlayedType = null;
        this.lastPlayedPlayerIndex = -1;
        this.passCount = 0;
    }

    // 出牌
    playCards(playerIndex, cards) {
        if (this.phase !== Game.PHASES.PLAYING) {
            return false;
        }

        if (playerIndex !== this.currentPlayerIndex) {
            return false;
        }

        const player = this.players[playerIndex];

        // 如果没有选牌，表示不出（过）
        if (!cards || cards.length === 0) {
            return this.pass(playerIndex);
        }

        // 分析牌型
        const cardType = CardType.analyzeType(cards);
        
        if (cardType.type === CardType.TYPES.INVALID) {
            return false; // 无效牌型
        }

        // 检查是否能压过上家的牌
        if (this.lastPlayedCards && this.lastPlayedCards.length > 0) {
            if (!CardType.canBeat(cards, this.lastPlayedCards)) {
                return false; // 压不过
            }
        }

        // 出牌
        player.playCards(cards);
        this.lastPlayedCards = cards;
        this.lastPlayedType = cardType;
        this.lastPlayedPlayerIndex = playerIndex;
        this.passCount = 0;

        // 检查是否炸弹，增加倍数
        if (cardType.type === CardType.TYPES.BOMB) {
            this.multiple *= 2;
        } else if (cardType.type === CardType.TYPES.JOKER_BOMB) {
            this.multiple *= 4;
        }

        // 检查是否获胜
        if (player.getCardCount() === 0) {
            this.gameOver(playerIndex);
            return true;
        }

        // 下一个玩家
        this.currentPlayerIndex = (playerIndex + 1) % 3;
        return true;
    }

    // 不出（过）
    pass(playerIndex) {
        if (this.lastPlayedPlayerIndex === playerIndex) {
            return false; // 上次是自己出的牌，不能过
        }

        this.passCount++;
        
        // 如果其他两个玩家都过了，当前玩家重新出牌
        if (this.passCount >= 2) {
            this.lastPlayedCards = null;
            this.lastPlayedType = null;
            this.passCount = 0;
            // 重要：轮到最后出牌的人继续出牌
            this.currentPlayerIndex = this.lastPlayedPlayerIndex;
        } else {
            this.currentPlayerIndex = (playerIndex + 1) % 3;
        }

        return true;
    }

    // 检查所有玩家是否都不叫
    allPlayersPassed() {
        return this.players.every(p => p.bidScore === 0);
    }

    // 游戏结束
    gameOver(winnerIndex) {
        this.phase = Game.PHASES.GAME_OVER;
        const winner = this.players[winnerIndex];
        
        // 计算得分
        let baseScore = this.bidScore;
        let finalScore = baseScore * this.multiple;

        return {
            winner: winner,
            isLandlordWin: winner.isLandlord(),
            baseScore: baseScore,
            multiple: this.multiple,
            finalScore: finalScore
        };
    }

    // 获取当前玩家
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // 获取玩家（人类）
    getHumanPlayer() {
        return this.players[0];
    }

    // AI自动决策
    aiAction() {
        const currentPlayer = this.getCurrentPlayer();
        
        if (currentPlayer.isHuman) {
            return null; // 人类玩家，不自动
        }

        const ai = this.aiPlayers[this.currentPlayerIndex];

        switch (this.phase) {
            case Game.PHASES.BIDDING: {
                const score = ai.shouldBid(this.bidScore);
                return { action: 'bid', score: score };
            }
            
            case Game.PHASES.GRABBING: {
                const shouldGrab = ai.shouldGrab(this.bidScore);
                return { action: 'grab', shouldGrab: shouldGrab };
            }
            
            case Game.PHASES.PLAYING: {
                const cards = ai.playCards(this.lastPlayedCards, this.lastPlayedType);
                return { action: 'play', cards: cards };
            }
            
            default:
                return null;
        }
    }

    // 提示出牌
    getHint() {
        const player = this.getHumanPlayer();
        const ai = new AI(player);
        
        return ai.playCards(this.lastPlayedCards, this.lastPlayedType);
    }
}
