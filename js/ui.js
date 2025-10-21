// UI控制类
class GameUI {
    constructor(game) {
        this.game = game;
        this.selectedCards = [];
        this.timerInterval = null;
        this.timeLeft = 15;
        this.initElements();
        this.bindEvents();
    }

    // 初始化DOM元素
    initElements() {
        this.elements = {
            startScreen: document.querySelector('.start-screen'),
            btnStart: document.querySelector('.btn-start'),
            gameInfo: document.querySelector('.game-info'),
            gameStatus: document.querySelector('.game-status'),
            currentTurn: document.querySelector('.current-turn'),
            timerDisplay: document.querySelector('.timer-display'),
            timerValue: document.querySelector('.timer-value'),
            
            // 玩家区域
            bottomCards: document.querySelector('.bottom-cards'),
            topCards: document.querySelector('.top-cards'),
            leftCards: document.querySelector('.left-cards'),
            
            // 出牌区域
            topPlayed: document.querySelector('.top-played'),
            leftPlayed: document.querySelector('.left-played'),
            bottomPlayed: document.querySelector('.bottom-played'),
            
            // 底牌
            bottomCardsArea: document.querySelector('.bottom-cards-area'),
            landlordCards: document.querySelector('.landlord-cards'),
            bottomCardsLabel: document.querySelector('.bottom-cards-label'),
            
            // 按钮
            bidButtons: document.querySelector('.bid-buttons'),
            grabButtons: document.querySelector('.grab-buttons'),
            actionButtons: document.querySelector('.action-buttons'),
            btnBid: document.querySelector('.btn-bid'),
            btnPass: document.querySelectorAll('.btn-pass')[0],
            btnGrab: document.querySelector('.btn-grab'),
            btnPassGrab: document.querySelector('.btn-pass-grab'),
            btnPlay: document.querySelector('.btn-play'),
            btnHint: document.querySelector('.btn-hint'),
            btnActionPass: document.querySelectorAll('.btn-pass')[1],
            
            // 玩家信息
            playerInfos: document.querySelectorAll('.player-info'),
            cardCounts: document.querySelectorAll('.card-count'),
            roleBadges: document.querySelectorAll('.role-badge'),
            
            // 游戏结束
            gameOver: document.querySelector('.game-over'),
            resultTitle: document.querySelector('.result-title'),
            resultInfo: document.querySelector('.result-info'),
            btnRestart: document.querySelector('.btn-restart'),
            
            // 消息提示
            messageToast: document.querySelector('.message-toast')
        };
    }

    // 绑定事件
    bindEvents() {
        // 开始游戏
        this.elements.btnStart.addEventListener('click', () => {
            this.hideStartScreen();
            this.game.startNewGame();
            this.dealCardsAnimation(); // 只调用发牌动画，不要提前updateUI
        });

        // 叫地主
        this.elements.btnBid.addEventListener('click', () => {
            this.game.bid(0, 3);
            this.showMessage('叫地主！', 'warning');
            this.updateUI();
            this.checkAITurn();
        });

        this.elements.btnPass.addEventListener('click', () => {
            this.game.bid(0, 0);
            this.showMessage('不叫', 'info');
            this.updateUI();
            this.checkAITurn();
        });

        // 抢地主
        this.elements.btnGrab.addEventListener('click', () => {
            this.game.grab(0, true);
            this.showMessage('抢地主！', 'warning');
            this.updateUI();
            this.checkAITurn();
        });

        this.elements.btnPassGrab.addEventListener('click', () => {
            this.game.grab(0, false);
            this.showMessage('不抢', 'info');
            this.updateUI();
            this.checkAITurn();
        });

        // 出牌
        this.elements.btnPlay.addEventListener('click', () => {
            if (this.selectedCards.length > 0) {
                const success = this.game.playCards(0, this.selectedCards);
                if (success) {
                    this.selectedCards = [];
                    this.showMessage('出牌成功！', 'success');
                    this.updateUI();
                    this.checkAITurn();
                } else {
                    this.showMessage('不能这样出牌！', 'error');
                }
            }
        });

        // 不要
        this.elements.btnActionPass.addEventListener('click', () => {
            const success = this.game.pass(0);
            if (success) {
                this.selectedCards = [];
                this.showMessage('不要', 'info');
                this.updateUI();
                this.checkAITurn();
            } else {
                this.showMessage('你必须出牌！', 'error');
            }
        });

        // 提示
        this.elements.btnHint.addEventListener('click', () => {
            const hint = this.game.getHint();
            if (hint && hint.length > 0) {
                this.selectedCards = hint;
                this.showMessage('已为您选择建议牌', 'success');
                this.renderPlayerCards();
            } else {
                this.showMessage('没有合适的牌可以出', 'info');
            }
        });

        // 重新开始
        this.elements.btnRestart.addEventListener('click', () => {
            this.hideGameOver();
            this.game.startNewGame();
            this.dealCardsAnimation(); // 只调用发牌动画
        });
    }

    // 隐藏开始界面
    hideStartScreen() {
        this.elements.startScreen.classList.add('hidden');
    }

    // 更新UI
    updateUI() {
        this.updatePhaseUI();
        this.renderAllCards();
        this.updatePlayerInfo();
        this.updateButtons();
    }

    // 更新阶段UI
    updatePhaseUI() {
        const phase = this.game.phase;
        
        switch (phase) {
            case Game.PHASES.DEALING:
                this.elements.gameStatus.textContent = '发牌中...';
                break;
            case Game.PHASES.BIDDING:
                this.elements.gameStatus.textContent = '叫地主阶段';
                break;
            case Game.PHASES.GRABBING:
                this.elements.gameStatus.textContent = '抢地主阶段';
                break;
            case Game.PHASES.PLAYING:
                const currentPlayer = this.game.getCurrentPlayer();
                if (currentPlayer.isHuman) {
                    this.elements.gameStatus.textContent = '轮到你出牌';
                    this.elements.currentTurn.classList.remove('hidden');
                } else {
                    this.elements.gameStatus.textContent = `${currentPlayer.name}出牌中...`;
                    this.elements.currentTurn.classList.add('hidden');
                }
                break;
        }
    }

    // 渲染所有牌
    renderAllCards() {
        this.renderPlayerCards();
        this.renderComputerCards(1, this.elements.topCards);
        this.renderComputerCards(2, this.elements.leftCards);
        this.renderPlayedCards();
        
        if (this.game.phase === Game.PHASES.PLAYING) {
            this.renderBottomCards();
        }
    }

    // 渲染玩家手牌
    renderPlayerCards() {
        const player = this.game.getHumanPlayer();
        const container = this.elements.bottomCards;
        container.innerHTML = '';

        player.cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, false);
            
            // 发牌动画已禁用 - 避免视觉不适
            
            // 检查是否被选中
            const isSelected = this.selectedCards.some(c => 
                c.suit === card.suit && c.value === card.value
            );
            
            if (isSelected) {
                cardElement.classList.add('selected');
            }

            // 点击选择/取消选择
            cardElement.addEventListener('click', () => {
                if (this.game.phase !== Game.PHASES.PLAYING || 
                    !this.game.getCurrentPlayer().isHuman) {
                    return;
                }

                const index = this.selectedCards.findIndex(c => 
                    c.suit === card.suit && c.value === card.value
                );

                if (index >= 0) {
                    this.selectedCards.splice(index, 1);
                    cardElement.classList.remove('selected');
                } else {
                    this.selectedCards.push(card);
                    cardElement.classList.add('selected');
                }

                this.updatePlayButton();
            });

            container.appendChild(cardElement);
        });
    }

    // 渲染电脑玩家手牌（背面）
    renderComputerCards(playerIndex, container) {
        const player = this.game.players[playerIndex];
        container.innerHTML = '';

        for (let i = 0; i < player.cards.length; i++) {
            const cardElement = this.createCardElement(null, true);
            cardElement.classList.add('card-small');
            container.appendChild(cardElement);
        }
    }

    // 渲染已出的牌
    renderPlayedCards() {
        // 清空所有出牌区域
        this.elements.topPlayed.innerHTML = '';
        this.elements.leftPlayed.innerHTML = '';
        this.elements.bottomPlayed.innerHTML = '';

        // 显示最后出的牌
        if (this.game.lastPlayedCards && this.game.lastPlayedCards.length > 0) {
            const container = this.getPlayedContainer(this.game.lastPlayedPlayerIndex);
            
            this.game.lastPlayedCards.forEach(card => {
                const cardElement = this.createCardElement(card, false);
                cardElement.classList.add('card-small');
                container.appendChild(cardElement);
            });
        }
    }

    // 渲染底牌
    renderBottomCards() {
        const container = document.querySelector('.landlord-cards');
        const areaElement = document.querySelector('.bottom-cards-area');
        container.innerHTML = '';

        if (this.game.landlordIndex >= 0) {
            // 显示底牌区域
            areaElement.classList.remove('hidden');
            
            this.game.bottomCards.forEach(card => {
                const cardElement = this.createCardElement(card, false);
                cardElement.classList.add('card-small');
                container.appendChild(cardElement);
            });
        }
    }

    // 创建牌元素
    createCardElement(card, isBack = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';

        if (isBack) {
            cardDiv.classList.add('card-back');
            cardDiv.textContent = '斗地主';
        } else {
            cardDiv.classList.add(card.getColor());
            
            const valueDiv = document.createElement('div');
            valueDiv.className = 'card-value';
            valueDiv.textContent = card.value;
            
            const suitDiv = document.createElement('div');
            suitDiv.className = 'card-suit';
            suitDiv.textContent = card.suit === Card.SUITS.JOKER ? '' : card.suit;
            
            if (card.suit === Card.SUITS.JOKER) {
                cardDiv.textContent = card.value === 'small' ? '小王' : '大王';
            } else {
                cardDiv.appendChild(valueDiv);
                cardDiv.appendChild(suitDiv);
            }
        }

        return cardDiv;
    }

    // 获取出牌容器
    getPlayedContainer(playerIndex) {
        switch (playerIndex) {
            case 0: return this.elements.bottomPlayed;
            case 1: return this.elements.topPlayed;
            case 2: return this.elements.leftPlayed;
            default: return this.elements.bottomPlayed;
        }
    }

    // 更新玩家信息
    updatePlayerInfo() {
        this.game.players.forEach((player, index) => {
            const cardCountElement = this.elements.cardCounts[index];
            const roleBadge = this.elements.roleBadges[index];
            
            if (cardCountElement) {
                cardCountElement.textContent = `${player.getCardCount()}张`;
            }

            if (roleBadge) {
                if (player.role === Player.ROLES.LANDLORD) {
                    roleBadge.classList.remove('hidden', 'farmer-badge');
                    roleBadge.classList.add('landlord-badge');
                    roleBadge.textContent = '地主';
                } else if (player.role === Player.ROLES.FARMER) {
                    roleBadge.classList.remove('hidden', 'landlord-badge');
                    roleBadge.classList.add('farmer-badge');
                    roleBadge.textContent = '农民';
                } else {
                    roleBadge.classList.add('hidden');
                }
            }
        });
    }

    // 更新按钮状态
    updateButtons() {
        const phase = this.game.phase;
        const isHumanTurn = this.game.getCurrentPlayer().isHuman;

        // 隐藏所有按钮组
        this.elements.bidButtons.classList.add('hidden');
        this.elements.grabButtons.classList.add('hidden');
        this.elements.actionButtons.classList.add('hidden');
        
        // 先停止计时器
        this.stopTimer();
        
        switch (phase) {
            case Game.PHASES.BIDDING:
                if (isHumanTurn) {
                    this.elements.bidButtons.classList.remove('hidden');
                    this.startTimer(15); // 15秒倒计时
                }
                break;
                
            case Game.PHASES.GRABBING:
                if (isHumanTurn) {
                    this.elements.grabButtons.classList.remove('hidden');
                    this.startTimer(10); // 10秒倒计时
                }
                break;
                
            case Game.PHASES.PLAYING:
                this.elements.actionButtons.classList.remove('hidden');
                if (isHumanTurn) {
                    this.startTimer(20); // 20秒倒计时
                }
                // 出牌按钮始终显示，但根据情况启用/禁用
                this.updatePlayButton();
                break;
        }
    }

    // 更新出牌按钮
    updatePlayButton() {
        const canPlay = this.selectedCards.length > 0 && 
                       this.game.getCurrentPlayer().isHuman;
        this.elements.btnPlay.disabled = !canPlay;
    }

    // 检查AI轮次
    checkAITurn() {
        // 检查是否有玩家已经没牌了（游戏结束）
        const emptyPlayer = this.game.players.findIndex(p => p.getCardCount() === 0);
        if (emptyPlayer >= 0) {
            this.game.phase = Game.PHASES.GAME_OVER;
            setTimeout(() => {
                this.showGameOver(emptyPlayer);
            }, 1000);
            return;
        }

        if (this.game.phase === Game.PHASES.GAME_OVER) {
            this.showGameOver();
            return;
        }

        const currentPlayer = this.game.getCurrentPlayer();
        
        if (!currentPlayer.isHuman) {
            setTimeout(() => {
                this.aiTurn();
            }, 1000);
        }
    }

    // AI回合
    aiTurn() {
        const action = this.game.aiAction();
        
        if (!action) {
            return;
        }

        switch (action.action) {
            case 'bid':
                this.game.bid(this.game.currentPlayerIndex, action.score);
                this.showMessage(`${this.game.getCurrentPlayer().name}${action.score > 0 ? '叫' + action.score + '分' : '不叫'}`, 'info');
                break;
                
            case 'grab':
                this.game.grab(this.game.currentPlayerIndex, action.shouldGrab);
                this.showMessage(`${this.game.players[this.game.currentPlayerIndex].name}${action.shouldGrab ? '抢地主' : '不抢'}`, 'info');
                break;
                
            case 'play':
                if (action.cards && action.cards.length > 0) {
                    this.game.playCards(this.game.currentPlayerIndex, action.cards);
                    this.showMessage(`${this.game.players[this.game.currentPlayerIndex].name}出牌`, 'info');
                } else {
                    this.game.pass(this.game.currentPlayerIndex);
                    this.showMessage(`${this.game.players[this.game.currentPlayerIndex].name}不要`, 'info');
                }
                break;
        }

        this.updateUI();
        this.checkAITurn();
    }

    // 发牌动画
    dealCardsAnimation() {
        setTimeout(() => {
            this.updateUI();
            this.showMessage('发牌完成', 'info');
            this.checkAITurn();
        }, 500);
    }

    // 显示消息
    showMessage(message, type = 'info') {
        const toast = this.elements.messageToast;
        toast.textContent = message;
        toast.className = `message-toast ${type}`;
        
        // 显示提示
        toast.classList.remove('hidden');
        
        // 2秒后自动隐藏
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2000);
    }

    // 显示游戏结束
    showGameOver(winnerIndex = null) {
        // 如果没有传入获胜者索引，尝试从游戏状态获取
        if (winnerIndex === null) {
            winnerIndex = this.game.players.findIndex(p => p.getCardCount() === 0);
            if (winnerIndex === -1) {
                winnerIndex = this.game.currentPlayerIndex;
            }
        }
        
        const winner = this.game.players[winnerIndex];
        const result = {
            winner: winner,
            isLandlordWin: winner.isLandlord(),
            baseScore: this.game.bidScore,
            multiple: this.game.multiple,
            finalScore: this.game.bidScore * this.game.multiple
        };
        
        this.elements.gameOver.classList.remove('hidden');
        
        if (result.isLandlordWin) {
            if (this.game.players[0].isLandlord()) {
                this.elements.resultTitle.textContent = '胜利！';
                this.elements.resultTitle.style.color = '#ffd700';
            } else {
                this.elements.resultTitle.textContent = '失败！';
                this.elements.resultTitle.style.color = '#e74c3c';
            }
        } else {
            if (!this.game.players[0].isLandlord()) {
                this.elements.resultTitle.textContent = '胜利！';
                this.elements.resultTitle.style.color = '#ffd700';
            } else {
                this.elements.resultTitle.textContent = '失败！';
                this.elements.resultTitle.style.color = '#e74c3c';
            }
        }

        this.elements.resultInfo.innerHTML = `
            <p>获胜者: ${result.winner.name}</p>
            <p>倍数: ${result.multiple}倍</p>
            <p>得分: ${result.finalScore}分</p>
        `;
    }

    // 隐藏游戏结束界面
    hideGameOver() {
        this.elements.gameOver.classList.add('hidden');
    }

    // 开始倒计时
    startTimer(duration = 15) {
        this.stopTimer(); // 先清除之前的计时器
        this.timeLeft = duration;
        this.elements.timerDisplay.classList.remove('hidden');
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.handleTimeout();
            }
        }, 1000);
    }

    // 停止倒计时
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.elements.timerDisplay.classList.add('hidden');
    }

    // 更新倒计时显示
    updateTimerDisplay() {
        this.elements.timerValue.textContent = this.timeLeft;
        
        // 时间紧急时添加特效
        if (this.timeLeft <= 5) {
            this.elements.timerValue.classList.add('urgent');
        } else {
            this.elements.timerValue.classList.remove('urgent');
        }
    }

    // 处理超时
    handleTimeout() {
        const phase = this.game.phase;
        const isHumanTurn = this.game.getCurrentPlayer().isHuman;

        if (!isHumanTurn) return; // 只处理玩家超时

        switch (phase) {
            case Game.PHASES.BIDDING:
                // 超时自动不叫
                this.game.bid(0, 0);
                this.showMessage('超时，自动不叫', 'info');
                break;
                
            case Game.PHASES.GRABBING:
                // 超时自动不抢
                this.game.grab(0, false);
                this.showMessage('超时，自动不抢', 'info');
                break;
                
            case Game.PHASES.PLAYING:
                // 超时自动不要
                const success = this.game.pass(0);
                if (!success) {
                    // 如果不能不要，就出最小的牌
                    const hint = this.game.getHint();
                    if (hint && hint.length > 0) {
                        this.game.playCards(0, hint);
                        this.showMessage('超时，自动出牌', 'info');
                    }
                } else {
                    this.showMessage('超时，自动不要', 'info');
                }
                break;
        }

        this.selectedCards = [];
        this.updateUI();
        this.checkAITurn();
    }
}
