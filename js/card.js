// 扑克牌类
class Card {
    static SUITS = {
        SPADE: '♠',    // 黑桃
        HEART: '♥',    // 红桃
        CLUB: '♣',     // 梅花
        DIAMOND: '♦',  // 方块
        JOKER: 'JOKER' // 王
    };

    static VALUES = {
        '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
        'small': 16, 'big': 17
    };

    static VALUE_NAMES = {
        3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
        10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2',
        16: '小王', 17: '大王'
    };

    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.numValue = Card.VALUES[value];
        this.selected = false;
    }

    // 获取牌的显示名称
    getName() {
        if (this.suit === Card.SUITS.JOKER) {
            return this.value === 'small' ? '小王' : '大王';
        }
        return `${this.suit}${this.value}`;
    }

    // 获取牌的颜色（红色或黑色）
    getColor() {
        if (this.suit === Card.SUITS.HEART || this.suit === Card.SUITS.DIAMOND) {
            return 'red';
        }
        if (this.suit === Card.SUITS.JOKER) {
            return this.value === 'small' ? 'red' : 'black';
        }
        return 'black';
    }

    // 比较两张牌的大小
    static compare(card1, card2) {
        return card1.numValue - card2.numValue;
    }

    // 创建一副完整的扑克牌
    static createDeck() {
        const deck = [];
        const suits = [Card.SUITS.SPADE, Card.SUITS.HEART, Card.SUITS.CLUB, Card.SUITS.DIAMOND];
        const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

        // 添加普通牌
        for (let suit of suits) {
            for (let value of values) {
                deck.push(new Card(suit, value));
            }
        }

        // 添加大小王
        deck.push(new Card(Card.SUITS.JOKER, 'small'));
        deck.push(new Card(Card.SUITS.JOKER, 'big'));

        return deck;
    }

    // 洗牌
    static shuffle(deck) {
        const newDeck = [...deck];
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        return newDeck;
    }

    // 排序（按数值从小到大）
    static sort(cards) {
        return [...cards].sort(Card.compare);
    }
}
