import GameMap from './GameMap';

/**
 * 游戏控制中心:控制游戏的启动/结束/重启
 * 但是并不负责游戏的具体实现逻辑
 */
export default class GameMgr {
  /* eslint-disable */
  public static instance: GameMgr;
  private constructor() { }
  public static getInstance(): GameMgr {
    if (!GameMgr.instance) {
      GameMgr.instance = new GameMgr();
    }
    return GameMgr.instance;
  }

  // 游戏地图
  private static _gameMap: GameMap;
  public get gameMap() {
    if (!GameMgr._gameMap) {
      GameMgr._gameMap = GameMap.getInstance();
    }
    return GameMgr._gameMap;
  }

  // 是否已经开始: 没有开始前点击白块不判定游戏结束
  public isStarted: boolean = false;

  // 滚动定时器
  public timer?: number;

  // 滚动一次间隔速度
  public speed: number = 80;

  // 得分
  public score: number = 0;

  // 得分提示
  public get scoreText() {
    return '您当前的得分是: ' + this.score;
  }

  /**
   * 初始化
   */
  public init(el: HTMLElement): GameMgr {
    // 绘制地图
    this.gameMap.render(el);
    this.gameMap.initEvents();
    this.gameMap.updateScore(this.scoreText);
    return this;
  }

  /**
   * 开始游戏: 自动向上滚动,并且检测是否结束游戏
   */
  public start() {
    console.log('gameStart');
    this.isStarted = true;
    this.timer && clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.gameMap.moveUp();
    }, this.speed);
  }

  /**
   * 点击块: 正确位置得分, 错误位置结束游戏
   */
  public tap(e: MouseEvent): void {
    if (!this.isStarted) return;
    const block = e.target as HTMLDivElement;

    // 游戏是否结束: 点击带有黑色块的的就继续, 否则就是白色块
    if (!block.classList.contains(this.gameMap.classNames.blackBlock)) {
      this.gameOver();
      return;
    }

    const rowDOM = block.parentNode as HTMLDivElement;
    const rowIndex = Number(rowDOM.getAttribute('data-row-index'));
    this.gameMap.tapBlock(rowIndex, block);
    this.score++;
    this.gameMap.updateScore(this.scoreText);
  }

  /**
   * 游戏结束
   */
  public gameOver(): void {
    console.log('gameOver');
    setTimeout(() => {
      alert('游戏结束');
      this.restart();
    });
  }

  /**
   * 重新开始游戏
   */
  public restart(): void {
    window.location.reload();
  }
}
