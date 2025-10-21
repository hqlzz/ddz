// 玩家类
class Player {
    static ROLES = {
        UNKNOWN: 'unknown',
        LANDLORD: 'landlord',
        FARMER: 'farmer'
    };

    constructor(name, isHuman = false) {
        this.name = name;
        this.isHuman = isHuman;
        this.cards = [];
        this.role = Player.ROLES.UNKNOWN;
        this.bidScore = 0; // 叫地主分数
    }

    // 接收牌
    receiveCards(cards) {
        this.cards.push(...cards);
        this.sortCards();
    }

    // 排序手牌
    sortCards() {
        this.cards = Card.sort(this.cards);
    }

    // 出牌
    playCards(cards) {
        // 从手牌中移除出的牌
        cards.forEach(card => {
            const index = this.cards.findIndex(c => 
                c.suit === card.suit && c.value === card.value
            );
            if (index !== -1) {
                this.cards.splice(index, 1);
            }
        });
        return cards;
    }

    // 检查是否还有牌
    hasCards() {
        return this.cards.length > 0;
    }

    // 获取手牌数量
    getCardCount() {
        return this.cards.length;
    }

    // 设置角色
    setRole(role) {
        this.role = role;
    }

    // 是否是地主
    isLandlord() {
        return this.role === Player.ROLES.LANDLORD;
    }

    // 叫地主
    bid(score) {
        this.bidScore = score;
        return score;
    }

    // 重置玩家状态
    reset() {
        this.cards = [];
        this.role = Player.ROLES.UNKNOWN;
        this.bidScore = 0;
    }

    // 获取指定数值的牌
    getCardsByValue(value) {
        return this.cards.filter(card => card.numValue === value);
    }

    // 获取指定数值范围的牌
    getCardsByValueRange(minValue, maxValue) {
        return this.cards.filter(card => 
            card.numValue >= minValue && card.numValue <= maxValue
        );
    }
}
