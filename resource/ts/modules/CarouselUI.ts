import events from 'events';
import anime from 'animejs';

import enablePassiveEventListeners from '../utils/enablePassiveEventListeners';
import getOuterWidth from '../utils/getOuterWidth';

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
  /**
   * @param selector
   */
  constructor(selector, options = {}) {
    super();
    this.$el = document.querySelector(selector);
    this.$wrapper = this.$el.querySelector(`${selector}_wrapper`);
    this.$items = this.$el.querySelectorAll(`${selector}_item`);
    this.$prev = this.$el.querySelector(`${selector}_previous`);
    this.$next = this.$el.querySelector(`${selector}_next`);
    this.$dots = this.$el.querySelectorAll(`${selector}_dot`);
    this.$firstItem = this.$el.querySelector(`${selector}_item:first-child`);
    this.$lastItem = this.$el.querySelector(`${selector}_item:last-child`);

    this.threshold = 5;

    this.currentIndex = 0;
    this.length = this.$items.length;
    this.unitWidth = 0;

    this.duration = options.duration || 300;
    this.easing = options.easing || 'easeOutQuad';

    this.touched = false;
    this.offsetX = 0;
    this.lastDiffX = 0;

    this.translateX = 0;

    this.classes = {
      active: 'is-active'
    };
    this.directions = {
      default: 0,
      left: 1,
      right: 2
    };

    this.startTranslateX = 0;
    this.lastClientX = 0;
    this.lastTranslateX = 0;
    this.velocityX = 0;

    this.update();
    this.bind();
  }

  relocateWrapper(translateX) {
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
    const options = enablePassiveEventListeners() ? { passive: true } : false;

    window.addEventListener('load', this.handleLoad.bind(this), options);
    window.addEventListener('resize', this.handleResize.bind(this), options);
    this.$next.addEventListener(
      'click',
      this.handleClickNext.bind(this),
      options
    );
    this.$prev.addEventListener(
      'click',
      this.handleClickPrev.bind(this),
      options
    );
    [...this.$dots].forEach(($dot, dotIndex) =>
      $dot.addEventListener('click', this.goTo.bind(this, dotIndex), options)
    );

    this.$el.addEventListener(
      'touchstart',
      this.handleSwipeStart.bind(this),
      options
    );
    this.$el.addEventListener(
      'touchmove',
      this.handleSwipeMove.bind(this),
      options
    );
    document.body.addEventListener(
      'touchend',
      this.handleSwipeEnd.bind(this),
      options
    );
    this.$el.addEventListener(
      'mousedown',
      this.handleSwipeStart.bind(this),
      options
    );
    this.$el.addEventListener(
      'mousemove',
      this.handleSwipeMove.bind(this),
      options
    );
    this.$el.addEventListener(
      'mouseleave',
      this.handleSwipeEnd.bind(this),
      options
    );
    document.body.addEventListener(
      'mouseup',
      this.handleSwipeEnd.bind(this),
      options
    );
  }

  handleClickNext(event) {
    event.stopImmediatePropagation();
    this.next();
  }

  handleClickPrev(event) {
    event.stopImmediatePropagation();
    this.prev();
  }

  handleSwipeStart(event) {
    this.lastClientX =
      event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
    this.startTranslateX = parseFloat(anime.get(this.$wrapper, 'translateX'));
    this.lastTranslateX = this.startTranslateX;
    this.offsetX = 0;
    this.touched = true;
    this.lastDiffX = 0;
    this.velocityX = 0;

    anime.remove(this.$wrapper);
  }

  handleLoad() {
    this.update();
    this.updateItem();
  }

  handleResize() {
    this.update();
    this.translateX = -this.unitWidth * this.currentIndex;
    anime.set(this.$wrapper, {
      translateX: this.translateX
    });
    this.updateItem();
  }

  handleSwipeMove(event) {
    if (this.touched === false) return;

    const clientX =
      event.type === 'touchmove' ? event.touches[0].clientX : event.clientX;
    const diffX = clientX - this.lastClientX;
    this.lastTranslateX = this.lastTranslateX + diffX;
    this.translateX = this.lastTranslateX;

    anime.set(this.$wrapper, {
      translateX: this.lastTranslateX
    });

    // update last clientX
    this.lastClientX = clientX;
    this.velocityX = diffX;

    this.updateItem();
  }

  handleSwipeEnd() {
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
  }

  next() {
    this.currentIndex =
      this.currentIndex < this.length - 1 ? this.currentIndex + 1 : 0;
    this.goTo(this.currentIndex, this.directions.right);
  }

  prev() {
    this.currentIndex =
      this.currentIndex <= 0 ? this.length - 1 : this.currentIndex - 1;
    this.goTo(this.currentIndex, this.directions.left);
  }

  goTo(index, direction = this.directions.default) {
    this.currentIndex = index;

    let virtualIndex = this.currentIndex;
    if (
      direction === this.directions.left &&
      this.currentIndex === this.length - 1 &&
      this.virtualIndex > -0.5 &&
      this.virtualIndex < this.length / 2
    ) {
      virtualIndex = -1;
    }
    if (
      direction === this.directions.right &&
      this.currentIndex === 0 &&
      this.virtualIndex < this.length - 0.5 &&
      this.virtualIndex > this.length / 2
    ) {
      virtualIndex = this.length;
    }

    [...this.$dots].forEach(($dot, dotIndex) => {
      dotIndex === this.currentIndex
        ? $dot.classList.add(this.classes.active)
        : $dot.classList.remove(this.classes.active);
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
        this.translateX = parseFloat(anime.get(this.$wrapper, 'translateX'));
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
