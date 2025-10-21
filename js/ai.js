// AI玩家逻辑
class AI {
    constructor(player) {
        this.player = player;
    }

    // AI叫地主决策
    shouldBid(currentBid, bottomCards = null) {
        const cards = this.player.cards;
        let score = 0;

        // 统计牌力
        const valueCount = {};
        cards.forEach(card => {
            valueCount[card.numValue] = (valueCount[card.numValue] || 0) + 1;
        });

        // 统计2的数量
        const twoCount = valueCount[15] || 0;
        score += twoCount * 3;

        // 统计王的数量
        const jokerCount = (valueCount[16] || 0) + (valueCount[17] || 0);
        score += jokerCount * 4;

        // 统计炸弹
        const bombs = Object.values(valueCount).filter(count => count === 4).length;
        score += bombs * 6;

        // 统计三张
        const triples = Object.values(valueCount).filter(count => count === 3).length;
        score += triples * 2;

        // 统计对子
        const pairs = Object.values(valueCount).filter(count => count === 2).length;
        score += pairs * 1;

        // 根据分数决策
        if (score >= 15) return 3; // 强势叫地主
        if (score >= 10 && currentBid < 2) return 2; // 中等牌力叫2分
        if (score >= 7 && currentBid === 0) return 1; // 弱势叫1分
        return 0; // 不叫
    }

    // AI抢地主决策
    shouldGrab(currentBid) {
        const bidScore = this.shouldBid(0);
        return bidScore >= 12; // 只有强势牌才抢
    }

    // AI出牌决策
    playCards(lastCards, lastType) {
        // 如果没有上家出牌，主动出牌
        if (!lastCards || lastCards.length === 0) {
            return this.playActiveCards();
        }

        // 跟牌
        return this.playFollowCards(lastCards, lastType);
    }

    // 主动出牌
    playActiveCards() {
        const cards = this.player.cards;
        
        // 如果只剩一张牌，直接出
        if (cards.length === 1) {
            return cards;
        }

        // 优先出单张（最小的）
        const singles = this.findSingles();
        if (singles.length > 0) {
            return [singles[0]];
        }

        // 出对子
        const pairs = this.findPairs();
        if (pairs.length > 0) {
            return pairs[0];
        }

        // 出三张
        const triples = this.findTriples();
        if (triples.length > 0) {
            return triples[0];
        }

        // 出顺子
        const straight = this.findStraight();
        if (straight.length > 0) {
            return straight;
        }

        // 最后出最小的牌
        return [cards[0]];
    }

    // 跟牌
    playFollowCards(lastCards, lastType) {
        if (!lastType || lastType.type === CardType.TYPES.INVALID) {
            return null; // 不出
        }

        const cards = this.player.cards;

        // 如果是队友出的牌，并且不是最后几张，选择不出
        // （这里简化处理，实际需要判断队友关系）
        if (cards.length > 5 && Math.random() < 0.3) {
            return null;
        }

        // 根据牌型寻找合适的牌
        switch (lastType.type) {
            case CardType.TYPES.SINGLE:
                return this.findBeatSingle(lastType.value);
            case CardType.TYPES.PAIR:
                return this.findBeatPair(lastType.value);
            case CardType.TYPES.TRIPLE:
                return this.findBeatTriple(lastType.value);
            case CardType.TYPES.BOMB:
            case CardType.TYPES.JOKER_BOMB:
                return this.findBomb(lastType.value);
            case CardType.TYPES.STRAIGHT:
                return this.findBeatStraight(lastType.value, lastType.length);
            case CardType.TYPES.STRAIGHT_PAIR:
                return this.findBeatStraightPair(lastType.value, lastType.length);
            default:
                // 对于复杂牌型，使用炸弹或不出
                if (cards.length <= 3) {
                    const bomb = this.findBomb(0);
                    if (bomb) return bomb;
                }
                return null;
        }
    }

    // 查找单张
    findSingles() {
        const cards = this.player.cards;
        const valueCount = {};
        
        cards.forEach(card => {
            valueCount[card.numValue] = (valueCount[card.numValue] || 0) + 1;
        });

        return cards.filter(card => valueCount[card.numValue] === 1);
    }

    // 查找能打过的单张
    findBeatSingle(value) {
        const cards = this.player.cards;
        const biggerCards = cards.filter(card => card.numValue > value);
        
        if (biggerCards.length === 0) {
            // 没有更大的单张，考虑出炸弹
            return this.findBomb(0);
        }

        // 出最小的能打过的牌
        return [biggerCards[0]];
    }

    // 查找对子
    findPairs() {
        const cards = this.player.cards;
        const valueCount = {};
        
        cards.forEach(card => {
            if (!valueCount[card.numValue]) {
                valueCount[card.numValue] = [];
            }
            valueCount[card.numValue].push(card);
        });

        const pairs = [];
        for (let value in valueCount) {
            if (valueCount[value].length >= 2) {
                pairs.push(valueCount[value].slice(0, 2));
            }
        }

        return pairs;
    }

    // 查找能打过的对子
    findBeatPair(value) {
        const pairs = this.findPairs();
        const biggerPairs = pairs.filter(pair => pair[0].numValue > value);
        
        if (biggerPairs.length === 0) {
            return this.findBomb(0);
        }

        return biggerPairs[0];
    }

    // 查找三张
    findTriples() {
        const cards = this.player.cards;
        const valueCount = {};
        
        cards.forEach(card => {
            if (!valueCount[card.numValue]) {
                valueCount[card.numValue] = [];
            }
            valueCount[card.numValue].push(card);
        });

        const triples = [];
        for (let value in valueCount) {
            if (valueCount[value].length >= 3) {
                triples.push(valueCount[value].slice(0, 3));
            }
        }

        return triples;
    }

    // 查找能打过的三张
    findBeatTriple(value) {
        const triples = this.findTriples();
        const biggerTriples = triples.filter(triple => triple[0].numValue > value);
        
        if (biggerTriples.length === 0) {
            return this.findBomb(0);
        }

        return biggerTriples[0];
    }

    // 查找炸弹
    findBomb(minValue) {
        const cards = this.player.cards;
        const valueCount = {};
        
        cards.forEach(card => {
            if (!valueCount[card.numValue]) {
                valueCount[card.numValue] = [];
            }
            valueCount[card.numValue].push(card);
        });

        // 查找普通炸弹
        for (let value in valueCount) {
            if (valueCount[value].length === 4 && Number(value) > minValue) {
                return valueCount[value];
            }
        }

        // 查找王炸
        if (valueCount[16] && valueCount[17]) {
            return [valueCount[16][0], valueCount[17][0]];
        }

        return null;
    }

    // 查找顺子
    findStraight() {
        const cards = this.player.cards;
        const values = [...new Set(cards.map(c => c.numValue))].sort((a, b) => a - b);
        
        // 顺子不能包含2和王
        const validValues = values.filter(v => v <= 14);
        
        for (let len = 5; len <= validValues.length; len++) {
            for (let i = 0; i <= validValues.length - len; i++) {
                const subValues = validValues.slice(i, i + len);
                if (this.isConsecutive(subValues)) {
                    return subValues.map(v => cards.find(c => c.numValue === v));
                }
            }
        }

        return [];
    }

    // 查找能打过的顺子
    findBeatStraight(value, length) {
        const cards = this.player.cards;
        const values = [...new Set(cards.map(c => c.numValue))].sort((a, b) => a - b);
        const validValues = values.filter(v => v <= 14);
        
        for (let i = 0; i <= validValues.length - length; i++) {
            const subValues = validValues.slice(i, i + length);
            if (this.isConsecutive(subValues) && subValues[0] > value) {
                return subValues.map(v => cards.find(c => c.numValue === v));
            }
        }

        return this.findBomb(0);
    }

    // 查找能打过的连对
    findBeatStraightPair(value, length) {
        // 简化处理，直接出炸弹或不出
        if (this.player.cards.length <= 4) {
            return this.findBomb(0);
        }
        return null;
    }

    // 检查是否连续
    isConsecutive(arr) {
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] !== arr[i - 1] + 1) return false;
        }
        return true;
    }
}
