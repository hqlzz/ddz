// 牌型判断类
class CardType {
    static TYPES = {
        INVALID: 'invalid',           // 无效牌型
        SINGLE: 'single',             // 单张
        PAIR: 'pair',                 // 对子
        TRIPLE: 'triple',             // 三张
        TRIPLE_WITH_ONE: 'triple_one', // 三带一
        TRIPLE_WITH_PAIR: 'triple_pair', // 三带对
        STRAIGHT: 'straight',         // 顺子
        STRAIGHT_PAIR: 'straight_pair', // 连对
        STRAIGHT_TRIPLE: 'straight_triple', // 飞机
        STRAIGHT_TRIPLE_WITH_ONE: 'straight_triple_one', // 飞机带单
        STRAIGHT_TRIPLE_WITH_PAIR: 'straight_triple_pair', // 飞机带对
        BOMB: 'bomb',                 // 炸弹
        FOUR_WITH_TWO: 'four_two',    // 四带二
        FOUR_WITH_PAIRS: 'four_pairs', // 四带两对
        JOKER_BOMB: 'joker_bomb'      // 王炸
    };

    // 分析牌型
    static analyzeType(cards) {
        if (!cards || cards.length === 0) {
            return { type: CardType.TYPES.INVALID };
        }

        const sortedCards = Card.sort(cards);
        const count = cards.length;

        // 统计每个数值的牌数
        const valueCount = {};
        sortedCards.forEach(card => {
            valueCount[card.numValue] = (valueCount[card.numValue] || 0) + 1;
        });

        const values = Object.keys(valueCount).map(Number).sort((a, b) => a - b);
        const counts = Object.values(valueCount).sort((a, b) => b - a);

        // 王炸
        if (count === 2 && cards.some(c => c.value === 'small') && 
            cards.some(c => c.value === 'big')) {
            return { type: CardType.TYPES.JOKER_BOMB, value: 17, length: 2 };
        }

        // 单张
        if (count === 1) {
            return { type: CardType.TYPES.SINGLE, value: sortedCards[0].numValue, length: 1 };
        }

        // 对子
        if (count === 2 && counts[0] === 2) {
            return { type: CardType.TYPES.PAIR, value: values[0], length: 1 };
        }

        // 三张
        if (count === 3 && counts[0] === 3) {
            return { type: CardType.TYPES.TRIPLE, value: values[0], length: 1 };
        }

        // 炸弹
        if (count === 4 && counts[0] === 4) {
            return { type: CardType.TYPES.BOMB, value: values[0], length: 1 };
        }

        // 三带一
        if (count === 4 && counts[0] === 3 && counts[1] === 1) {
            const tripleValue = values.find(v => valueCount[v] === 3);
            return { type: CardType.TYPES.TRIPLE_WITH_ONE, value: tripleValue, length: 1 };
        }

        // 三带对
        if (count === 5 && counts[0] === 3 && counts[1] === 2) {
            const tripleValue = values.find(v => valueCount[v] === 3);
            return { type: CardType.TYPES.TRIPLE_WITH_PAIR, value: tripleValue, length: 1 };
        }

        // 顺子（至少5张连续的单牌，不能包含2和王）
        if (count >= 5) {
            const isStraight = this.checkStraight(values, counts, 1);
            if (isStraight && values[values.length - 1] <= 14) {
                return { type: CardType.TYPES.STRAIGHT, value: values[0], length: count };
            }
        }

        // 连对（至少3对连续的对子）
        if (count >= 6 && count % 2 === 0) {
            const isStraightPair = this.checkStraight(values, counts, 2);
            if (isStraightPair && values[values.length - 1] <= 14) {
                return { type: CardType.TYPES.STRAIGHT_PAIR, value: values[0], length: count / 2 };
            }
        }

        // 飞机（至少2个连续的三张）
        if (count >= 6 && count % 3 === 0) {
            const tripleValues = values.filter(v => valueCount[v] === 3);
            if (tripleValues.length >= 2 && this.isConsecutive(tripleValues) && 
                tripleValues[tripleValues.length - 1] <= 14) {
                return { type: CardType.TYPES.STRAIGHT_TRIPLE, value: tripleValues[0], length: tripleValues.length };
            }
        }

        // 飞机带单（连续的三张 + 等量的单牌）
        if (count >= 8 && count % 4 === 0) {
            const tripleValues = values.filter(v => valueCount[v] === 3);
            const singleCount = count / 4;
            if (tripleValues.length === singleCount && this.isConsecutive(tripleValues) &&
                tripleValues[tripleValues.length - 1] <= 14) {
                return { type: CardType.TYPES.STRAIGHT_TRIPLE_WITH_ONE, value: tripleValues[0], length: tripleValues.length };
            }
        }

        // 飞机带对（连续的三张 + 等量的对子）
        if (count >= 10 && count % 5 === 0) {
            const tripleValues = values.filter(v => valueCount[v] === 3);
            const pairCount = count / 5;
            if (tripleValues.length === pairCount && this.isConsecutive(tripleValues) &&
                tripleValues[tripleValues.length - 1] <= 14) {
                return { type: CardType.TYPES.STRAIGHT_TRIPLE_WITH_PAIR, value: tripleValues[0], length: tripleValues.length };
            }
        }

        // 四带二（4张 + 2张单牌）
        if (count === 6 && counts[0] === 4) {
            const fourValue = values.find(v => valueCount[v] === 4);
            return { type: CardType.TYPES.FOUR_WITH_TWO, value: fourValue, length: 1 };
        }

        // 四带两对（4张 + 2个对子）
        if (count === 8 && counts[0] === 4 && counts[1] === 2 && counts[2] === 2) {
            const fourValue = values.find(v => valueCount[v] === 4);
            return { type: CardType.TYPES.FOUR_WITH_PAIRS, value: fourValue, length: 1 };
        }

        return { type: CardType.TYPES.INVALID };
    }

    // 检查是否是连续的顺子
    static checkStraight(values, counts, requiredCount) {
        if (values.length < 5 / requiredCount) return false;
        
        for (let i = 0; i < values.length; i++) {
            if (counts[i] !== requiredCount) return false;
            if (i > 0 && values[i] !== values[i - 1] + 1) return false;
        }
        return true;
    }

    // 检查数组是否连续
    static isConsecutive(arr) {
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] !== arr[i - 1] + 1) return false;
        }
        return true;
    }

    // 比较两组牌的大小
    static compare(cards1, type1, cards2, type2) {
        // 王炸最大
        if (type1.type === CardType.TYPES.JOKER_BOMB) return 1;
        if (type2.type === CardType.TYPES.JOKER_BOMB) return -1;

        // 炸弹比普通牌大
        if (type1.type === CardType.TYPES.BOMB && type2.type !== CardType.TYPES.BOMB) return 1;
        if (type2.type === CardType.TYPES.BOMB && type1.type !== CardType.TYPES.BOMB) return -1;

        // 牌型不同，无法比较
        if (type1.type !== type2.type) return 0;

        // 长度不同，无法比较（顺子、连对等）
        if (type1.length !== type2.length) return 0;

        // 比较数值
        return type1.value - type2.value;
    }

    // 检查cards1是否能压过cards2
    static canBeat(cards1, cards2) {
        if (!cards2 || cards2.length === 0) return true;

        const type1 = CardType.analyzeType(cards1);
        const type2 = CardType.analyzeType(cards2);

        if (type1.type === CardType.TYPES.INVALID) return false;
        if (type2.type === CardType.TYPES.INVALID) return true;

        return CardType.compare(cards1, type1, cards2, type2) > 0;
    }
}
