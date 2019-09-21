import events from 'events';
import anime from 'animejs';

import enablePassiveEventListeners from '../utils/enablePassiveEventListeners';
import getOuterWidth from '../utils/getOuterWidth';

enum Direction {
  Default,
  Left,
  Right
}

export type EventType = keyof GlobalEventHandlersEventMap;
export type SpecificEventListener<K extends EventType> = (
  evt: GlobalEventHandlersEventMap[K]
) => void;
type UpEventType = 'mouseup' | 'touchend';
type DownEventType = 'mousedown' | 'touchstart';
type MoveEventType = 'mousemove' | 'touchmove';

const UP_EVENTS: UpEventType[] = ['mouseup', 'touchend'];
const DOWN_EVENTS: DownEventType[] = ['mousedown', 'touchstart'];
const MOVE_EVENTS: MoveEventType[] = ['mousemove', 'touchmove'];

const cssClasses = {
  IS_ACTIVE: 'is-active'
};

/**
 * カルーセル
 * 要件
 * 進むボタン、戻るボタン
 * スワイプ
 * アクティビティインジケーター（ページャー）3/5 サムネイル
 * 自動スライド
 * リサイズ
 */
export default class CarouselUI extends events {
  private $el: HTMLElement;
  private $wrapper: HTMLElement;
  private $items: HTMLElement[];
  private $prev: HTMLElement;
  private $next: HTMLElement;
  private $dots: HTMLElement[];
  private $firstItem: HTMLElement;
  private $lastItem: HTMLElement;

  private threshold: number;

  private currentIndex: number;
  private length: number;
  private unitWidth: number;

  private duration: number;
  private easing: anime.EasingOptions;

  private touched: boolean;

  private translateX: number;

  private startTranslateX: number;
  private lastClientX: number;
  private lastTranslateX: number;
  private velocityX: number;

  constructor(
    selector: string,
    options: { duration?: number; easing?: anime.EasingOptions } = {}
  ) {
    super();
    this.$el = document.querySelector(selector);
    this.$wrapper = this.$el.querySelector(`${selector}_wrapper`);
    this.$items = Array.from(
      this.$el.querySelectorAll<HTMLElement>(`${selector}_item`)
    );
    this.$prev = this.$el.querySelector(`${selector}_previous`);
    this.$next = this.$el.querySelector(`${selector}_next`);
    this.$dots = Array.from(
      this.$el.querySelectorAll<HTMLElement>(`${selector}_dot`)
    );
    this.$firstItem = this.$el.querySelector(`${selector}_item:first-child`);
    this.$lastItem = this.$el.querySelector(`${selector}_item:last-child`);

    this.threshold = 5;

    this.currentIndex = 0;
    this.length = this.$items.length;
    this.unitWidth = 0;

    this.duration = options.duration || 300;
    this.easing = options.easing || 'easeOutQuad';

    this.touched = false;

    this.translateX = 0;

    this.startTranslateX = 0;
    this.lastClientX = 0;
    this.lastTranslateX = 0;
    this.velocityX = 0;

    this.update();
    this.bind();
  }

  static get cssClasses(): { [key: string]: string } {
    return cssClasses;
  }

  relocateWrapper(translateX: number) {
    anime.set(this.$wrapper, {
      translateX
    });
    this.translateX = translateX;
  }

  relocateLastItem() {
    anime.set(this.$lastItem, {
      translateX: -this.unitWidth * this.length
    });
  }

  relocateFirstItem() {
    anime.set(this.$firstItem, {
      translateX: this.unitWidth * this.length
    });
  }

  resetLastItem() {
    anime.set(this.$lastItem, {
      translateX: 0
    });
  }

  resetFirstItem() {
    anime.set(this.$firstItem, {
      translateX: 0
    });
  }

  update() {
    this.unitWidth = getOuterWidth(this.$items[0]);
  }

  bind() {
    const options:
      | AddEventListenerOptions
      | false = enablePassiveEventListeners() ? { passive: true } : false;

    window.addEventListener('load', this.handleLoad, options);
    window.addEventListener('resize', this.handleResize, options);

    this.$next.addEventListener('click', this.handleClickNext, options);
    this.$prev.addEventListener('click', this.handleClickPrev, options);
    this.$dots.forEach(($dot, dotIndex) =>
      $dot.addEventListener(
        'click',
        () => {
          this.goTo(dotIndex);
        },
        options
      )
    );

    DOWN_EVENTS.forEach(eventName => {
      this.$el.addEventListener(eventName, this.handleSwipeStart, options);
    });
    UP_EVENTS.forEach(eventName => {
      document.body.addEventListener(eventName, this.handleSwipeEnd, options);
    });
    MOVE_EVENTS.forEach(eventName => {
      this.$el.addEventListener(eventName, this.handleSwipeMove, options);
    });
    this.$el.addEventListener('mouseleave', this.handleSwipeEnd, options);
  }

  handleLoad = () => {
    this.update();
    this.updateItem();
  };

  handleResize = () => {
    this.update();
    this.translateX = -this.unitWidth * this.currentIndex;
    anime.set(this.$wrapper, {
      translateX: this.translateX
    });
    this.updateItem();
  };

  handleClickNext: SpecificEventListener<'click'> = event => {
    event.stopImmediatePropagation();
    this.next();
  };

  handleClickPrev: SpecificEventListener<'click'> = event => {
    event.stopImmediatePropagation();
    this.prev();
  };

  handleSwipeStart: SpecificEventListener<DownEventType> = event => {
    // TODO: event as TouchEvent のようにアサーションしているのはイケてない書き方な気がするため
    //       別の手段がわかり次第修正する（タイプガードでいける？）
    this.lastClientX =
      event.type === 'touchstart'
        ? (event as TouchEvent).touches[0].clientX
        : (event as MouseEvent).clientX;
    const translateX = anime.get(this.$wrapper, 'translateX');
    this.startTranslateX =
      typeof translateX === 'string' ? parseFloat(translateX) : translateX;
    this.lastTranslateX = this.startTranslateX;
    this.touched = true;
    this.velocityX = 0;

    anime.remove(this.$wrapper);
  };

  handleSwipeMove: SpecificEventListener<MoveEventType> = event => {
    if (this.touched === false) return;

    // TODO: event as TouchEvent のようにアサーションしているのはイケてない書き方な気がするため
    //       別の手段がわかり次第修正する（タイプガードでいける？）
    const clientX =
      event.type === 'touchmove'
        ? (event as TouchEvent).touches[0].clientX
        : (event as MouseEvent).clientX;
    const diffX = clientX - this.lastClientX;
    this.lastTranslateX = this.lastTranslateX + diffX;
    this.translateX = this.lastTranslateX;

    anime.set(this.$wrapper, {
      translateX: this.lastTranslateX
    });

    this.lastClientX = clientX;
    this.velocityX = diffX;

    this.updateItem();
  };

  handleSwipeEnd = () => {
    if (this.touched === false) return;
    this.touched = false;

    const diffX = this.lastTranslateX - this.startTranslateX;

    const isFast = Math.abs(this.velocityX) > this.threshold;

    if (isFast) {
      diffX <= 0 ? this.next() : this.prev();
    } else if (diffX !== 0) {
      this.goTo(
        (Math.round(-this.lastTranslateX / this.unitWidth) + this.length) %
          this.length
      );
    }
  };

  next() {
    this.currentIndex =
      this.currentIndex < this.length - 1 ? this.currentIndex + 1 : 0;
    this.goTo(this.currentIndex, Direction.Right);
  }

  prev() {
    this.currentIndex =
      this.currentIndex <= 0 ? this.length - 1 : this.currentIndex - 1;
    this.goTo(this.currentIndex, Direction.Left);
  }

  goTo(index: number, direction: Direction = Direction.Default) {
    this.currentIndex = index;

    let virtualIndex = this.currentIndex;
    if (
      direction === Direction.Left &&
      this.currentIndex === this.length - 1 &&
      this.virtualIndex > -0.5 &&
      this.virtualIndex < this.length / 2
    ) {
      virtualIndex = -1;
    }
    if (
      direction === Direction.Right &&
      this.currentIndex === 0 &&
      this.virtualIndex < this.length - 0.5 &&
      this.virtualIndex > this.length / 2
    ) {
      virtualIndex = this.length;
    }

    this.$dots.forEach(($dot, dotIndex) => {
      dotIndex === this.currentIndex
        ? $dot.classList.add(cssClasses.IS_ACTIVE)
        : $dot.classList.remove(cssClasses.IS_ACTIVE);
    });

    anime.remove(this.$wrapper);

    const translate = {
      x: this.translateX
    };

    return anime({
      targets: translate,
      x: -this.unitWidth * virtualIndex,
      easing: this.easing,
      duration: this.duration,
      update: () => {
        // 境界値から出ていないか判定、というか境界内に補正
        // DOMに反映する
        anime.set(this.$wrapper, { translateX: translate.x });
        const translateX = anime.get(this.$wrapper, 'translateX');
        this.translateX =
          typeof translateX === 'string' ? parseFloat(translateX) : translateX;
        this.updateItem();
      }
    }).finished;
  }

  // indexの値を見てwrapperの位置とitemの位置を移動させる
  updateItem() {
    if (this.translateX >= -this.unitWidth * -0.5) {
      this.relocateWrapper(this.translateX - this.unitWidth * this.length);
    } else if (this.translateX <= -this.unitWidth * (this.length - 0.5)) {
      this.relocateWrapper(this.translateX + this.unitWidth * this.length);
    }

    if (this.translateX >= -this.unitWidth * 0.5) {
      this.relocateLastItem();
    } else if (this.translateX < -this.unitWidth * 0.5) {
      this.resetLastItem();
    }

    if (this.translateX <= -this.unitWidth * (this.length - 1.5)) {
      this.relocateFirstItem();
    } else if (this.translateX > -this.unitWidth * (this.length - 1.5)) {
      this.resetFirstItem();
    }
  }

  get virtualIndex() {
    return -this.translateX / this.unitWidth;
  }
}
