// 主入口文件
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    const game = new Game();
    
    // 创建UI实例
    const ui = new GameUI(game);
    
    console.log('欢乐斗地主游戏已加载');
    console.log('点击"开始游戏"按钮开始游戏');
});
