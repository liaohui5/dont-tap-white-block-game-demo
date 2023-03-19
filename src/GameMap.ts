import GameMgr from './GameMgr';

/*
[
  { // 第一行
    index: 0, // 当前行 index
    isTap: false, // 是否被点击过
    data: [true, false, true], // true:黑色块 false: 白色块
    doms: [Div, Div, Div], // 行内黑/白块元素
    rowDOM: Div, 当前行的DOM元素
  },
  { // 第二行
    index: 1,
    isTap: false,
    data: [true, false, true],
    doms: [Div, Div, Div],
    rowDOM: Div
  }
  // ...
]
*/

/**
 * 每一行的数据
 */
interface RowItem {
  index: number; // 当前行索引
  data: boolean[]; // 数据
  doms: HTMLDivElement[]; // 块 dom
  rowDOM: HTMLDivElement; // 行 dom
  isTap: boolean; // 是否被点击过
}

/**
 * 游戏地图: 也实现游戏主要玩法逻辑
 */
export default class GameMap {
  // 单例
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() { }
  public static instance: GameMap;
  public static getInstance(): GameMap {
    if (!GameMap.instance) {
      GameMap.instance = new GameMap();
    }
    return GameMap.instance;
  }

  // 游戏管理中心
  public static gameMgr?: GameMgr;
  public get gameMgr() {
    if (!GameMap.gameMgr) {
      GameMap.gameMgr = GameMgr.getInstance();
    }
    return GameMap.gameMgr;
  }

  // 开始按钮
  public startBtnDOM: HTMLButtonElement;

  // 分数显示元素
  public scoreDOM: HTMLParagraphElement;

  // 地图容器元素
  public mapDOM: HTMLDivElement;

  // 滚动的元素
  public scrollerDOM: HTMLDivElement;

  // 行数据
  public blockRows: RowItem[] = [];

  // 实际行数
  public rows: number = 8;

  // 显示的函数
  public showRows: number = 5;

  // 列数
  public columns: number = 4;

  // 行高
  public rowHeight: number = 100;

  // 列宽
  public columnWidth: number = 80;

  // 滚动的总高度
  public scrollBottom: number = 0;

  // 已经滚动的行数
  public scrollRows: number = 0;

  // 每次滚动距离
  public scrollSteps: number = 10;

  // 元素类名
  public classNames = {
    blackBlock: 'black',
    rowItem: 'row-item',
    blockItem: 'block-item',
    scrollerDOM: 'scroll-container',
    mapDOM: 'map-container',
    scoreDOM: 'game-score',
    startBtnDOM: 'start-button',
  };

  /**
   * 渲染元素
   */
  public render(container: HTMLElement): void {
    const frag = document.createDocumentFragment();
    frag.append(this.createScore());
    frag.append(this.createBlocks());
    frag.append(this.createButtons());
    this.initStyles();
    container.append(frag);
  }

  /**
   * 创建HTML元素并且设置类名和样式
   */
  public createStyledElement<T extends HTMLElement>(tagName: string, className: string): T {
    const element = document.createElement(tagName) as T;
    element.classList.add(className);
    return element;
  }

  /**
   * 绘制分数显示
   */
  public createScore(): HTMLParagraphElement {
    const scoreContainer = this.createStyledElement<HTMLParagraphElement>('p', this.classNames.scoreDOM);
    this.scoreDOM = scoreContainer;
    return scoreContainer;
  }

  /**
   * 更新分数显示
   */
  public updateScore(score: string): void {
    this.scoreDOM.innerText = score;
  }

  /**
   * 绘制按钮
   */
  public createButtons(): HTMLButtonElement {
    const startButton = this.createStyledElement<HTMLButtonElement>('button', this.classNames.startBtnDOM);
    startButton.textContent = '开始游戏';
    this.startBtnDOM = startButton;
    return startButton;
  }

  /**
   * 绘制地图的行和块
   */
  public createBlocks(): HTMLDivElement {
    // 创建地图容器
    const mapDOM = this.createStyledElement<HTMLDivElement>('div', this.classNames.mapDOM);

    // 创建可以滚动的容器(主要让这个容器滚动来检测碰撞)
    const scrollerDOM = this.createStyledElement<HTMLDivElement>('div', this.classNames.scrollerDOM);

    // 创建对应数据和dom
    for (let i = 0, rs = this.rows; i < rs; i++) {
      const rowItem = this.createRow(i);
      scrollerDOM.append(rowItem.rowDOM);
      this.blockRows.push(rowItem);
    }

    mapDOM.append(scrollerDOM);
    this.scrollerDOM = scrollerDOM;
    this.mapDOM = mapDOM;
    return mapDOM;
  }

  /**
   * 创建一行的具体数据和dom
   */
  public createRow(index: number): RowItem {
    const data: boolean[] = [];
    const doms: HTMLDivElement[] = [];
    const rowIndex = String(index);

    const rowDOM = this.createStyledElement<HTMLDivElement>('div', this.classNames.rowItem);
    rowDOM.setAttribute('data-row-index', rowIndex);
    this.setStyle(rowDOM, {
      height: this.rowHeight + 'px',
    });

    for (let i = 0, cols = this.columns; i < cols; i++) {
      data.push(false);
      const blockDOM = this.createStyledElement<HTMLDivElement>('div', this.classNames.blockItem);
      this.setStyle(blockDOM, {
        height: '100%',
        width: this.columnWidth + 'px',
      });
      rowDOM.append(blockDOM);
      doms.push(blockDOM);
    }

    const row: RowItem = {
      index,
      data,
      doms,
      rowDOM,
      isTap: false,
    };

    this.shuffle(row);
    return row;
  }

  /**
   * 设置行内的 block 的状态
   */
  public setBlockStatusInRow(row: RowItem, index: number, status: boolean) {
    const { data, doms } = row;
    data[index] = status;
    if (status) {
      doms[index].classList.add(this.classNames.blackBlock);
    } else {
      doms[index].classList.remove(this.classNames.blackBlock);
    }
  }

  /**
   * 重置一行中所有block的状态
   */
  public resetRow(row: RowItem) {
    row.isTap = false;
    for (let i = 0; i < row.data.length; i++) {
      this.setBlockStatusInRow(row, i, false);
    }
    return row;
  }

  /**
   * 洗牌:打乱一行的数据(重新设置黑块位置)
   */
  public shuffle(row: RowItem): RowItem {
    // 打乱数据: 因为每一行只有一个黑色块, 随机取
    // 一个值修改状态, 先归原始状态再修改(打乱)
    this.resetRow(row);
    const randomIndex = Math.floor(Math.random() * row.data.length);
    this.setBlockStatusInRow(row, randomIndex, true);
    return row;
  }

  /**
   * 初始化元素样式
   */
  public initStyles() {
    const { rowHeight, showRows, columnWidth, columns } = this;
    this.setStyle(<HTMLElement>this.mapDOM, {
      width: columnWidth * columns + 'px',
      height: rowHeight * showRows + 'px',
    });
    this.setStyle(<HTMLDivElement>this.scrollerDOM, {
      width: '100%',
    });
  }

  /**
   * 设置元素样式
   */
  public setStyle(el: HTMLElement, style: object): void {
    Object.keys(style).forEach((key) => {
      el.style[key] = style[key];
    });
  }

  /**
   * 监听事件
   */
  public initEvents(): void {
    const gameMgr = this.gameMgr;
    const events = [
      {
        dom: this.startBtnDOM,
        event: 'click',
        handler: gameMgr.start,
        capture: false,
      },
      {
        dom: this.mapDOM,
        event: 'click',
        handler: gameMgr.tap,
        capture: false,
      },
    ];

    for (const { dom, event, handler, capture } of events) {
      dom.addEventListener(event, handler.bind(GameMap.gameMgr), capture);
    }
  }

  /**
   * 向上滚动
   */
  public moveUp(): void {
    // 每次判断: 如果超过了1行的高度, 就增加 padding-bottom
    // 判断是否点击: 如果没有点击, 证明可以直接结束游戏
    // 如果点击了(并且正确点击了), 将最后一条(向下滚动)取出
    // 并打乱数据然后放到第一行的位置
    const {
      scrollerDOM,
      scrollRows,
      scrollBottom,
      scrollSteps,
      rowHeight, // 每行高度
    } = this;

    this.scrollBottom += scrollSteps;
    scrollerDOM.style.bottom = `-${scrollBottom}px`;
    const scrollRowsHeight = rowHeight * (scrollRows + 1); // 已经滚动的高度
    if (scrollBottom >= scrollRowsHeight) {
      this.scrollRows++;
      // move
      const lastRowDOM = scrollerDOM.lastChild as HTMLDivElement;
      const rowIndex = Number(lastRowDOM.getAttribute('data-row-index'));
      const rowItem = this.blockRows[rowIndex];

      if (!rowItem.isTap) {
        // 检测游戏是否结束: 如果滚动过了一行
        // 但是没有点击, 证明游戏结束
        this.gameMgr.gameOver();
        return;
      }
      this.blockRows[rowIndex] = this.shuffle(rowItem);
      scrollerDOM.insertBefore(lastRowDOM, scrollerDOM.firstChild);
      scrollerDOM.style.paddingBottom = scrollRowsHeight + 'px';
    }
  }

  /**
   * 根据 rowIndex 修改对应 rowItem 的 isTap 状态
   */
  public tapBlock(rowIndex: number, block: HTMLDivElement): void {
    this.blockRows[rowIndex].isTap = true;
    block.classList.remove(this.classNames.blackBlock);
  }
}
