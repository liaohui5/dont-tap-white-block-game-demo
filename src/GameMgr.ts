"use strict";

import GameMap from "./GameMap";

/**
 * 游戏控制中心:控制游戏的启动/结束/重启
 * 但是并不负责游戏的具体实现逻辑
 */
export default class GameMgr {
  // 单例
  static instance: undefined | GameMgr;
  private constructor() {}
  public static getInstance(): GameMgr {
    if (!GameMgr.instance) {
      GameMgr.instance = new GameMgr();
    }
    return GameMgr.instance;
  }

  // 游戏地图
  public gameMap: GameMap | undefined;

  // 是否已经开始: 没有开始前点击白块不判定游戏结束
  public isStarted: boolean = false;

  // 滚动定时器
  public timer: number | undefined;

  // 滚动速度
  public speed: number = 50;

  // 得分
  public score: number = 0;

  // 得分提示
  public get scoreText() {
    return "您当前的得分是: " + this.score;
  }

  /**
   * 初始化
   */
  public init(el: HTMLElement): GameMgr {
    // 初始化地图,挂载游戏管理中心
    this.gameMap = GameMap.getInstance();
    GameMap.gameMgr = this;

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
    if (!block.classList.contains(this.gameMap.classNames.blackBlock)) {
      this.gameOver();
      return;
    }
    const rowDOM = block.parentNode as HTMLDivElement;
    const rowIndex = Number(rowDOM.getAttribute("data-row-index"));
    this.gameMap.tapBlock(rowIndex, block);
    this.score++;
    this.gameMap.updateScore(this.scoreText);
  }

  /**
   * 游戏结束
   */
  public gameOver(): void {
    console.log("gameOver");
    setTimeout(() => {
      alert("游戏结束");
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
