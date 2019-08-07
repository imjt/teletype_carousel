import events from 'events';
import anime from 'animejs';

/**
 * イベントのオプション出し分け
 */
const enablePassiveEventListeners = () => {
  let result = false;

  const opts =
    Object.defineProperty &&
    Object.defineProperty({}, 'passive', {
      get: () => {
        result = true;
      }
    });

  document.addEventListener('test', () => {}, opts);

  return result;
};

/*
 * Outer Width With Margin
 */
const outerWidth = el => {
  let width = el.offsetWidth;
  const style = getComputedStyle(el);

  width += parseInt(style.marginLeft) + parseInt(style.marginRight);
  return width;
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

    this.threshold = 5;

    this.currentIndex = 0;
    this.length = this.$items.length;
    this.unitWidth = 0;

    this.duration = options.duration || 300;
    this.easing = options.easing || 'easeOutQuad';

    this.touched = false;
    this.offsetX = 0;
    this.lastDiffX = 0;

    this.classes = {
      active: 'is-active'
    };

    this.startTranslateX = 0;
    this.lastClientX = 0;
    this.lastTranslateX = 0;
    this.velocityX = 0;

    this.update();
    this.bind();
  }

  update() {
    this.unitWidth = outerWidth(this.$items[0]);
  }

  bind() {
    const options = enablePassiveEventListeners() ? { passive: true } : false;

    window.addEventListener('load', this.handleLoad.bind(this), options);
    window.addEventListener('resize', this.handleResize.bind(this), options);
    this.$next.addEventListener('click', this.next.bind(this), options);
    this.$prev.addEventListener('click', this.prev.bind(this), options);
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

  handleSwipeStart(event) {
    this.lastClientX =
      event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
    this.startTranslateX = parseFloat(anime.get(this.$wrapper, 'translateX'));
    this.lastTranslateX = this.startTranslateX;
    this.offsetX = 0;
    this.touched = true;
    this.lastDiffX = 0;

    anime.remove(this.$wrapper);
  }

  handleLoad() {
    this.update();
  }

  handleResize() {
    this.update();
    anime.set(this.$wrapper, {
      translateX: -this.unitWidth * this.currentIndex
    });
  }

  handleSwipeMove(event) {
    if (this.touched === false) return;

    const clientX =
      event.type === 'touchmove' ? event.touches[0].clientX : event.clientX;
    const diffX = clientX - this.lastClientX;
    this.lastTranslateX = this.lastTranslateX + diffX;

    anime.set(this.$wrapper, {
      translateX: this.lastTranslateX
    });

    // update last clientX
    this.lastClientX = clientX;
    this.velocityX = diffX;
  }

  handleSwipeEnd() {
    this.touched = false;

    const diffX = this.lastTranslateX - this.startTranslateX;

    const isFast = Math.abs(this.velocityX) > this.threshold;

    if (isFast) {
      diffX <= 0 ? this.next() : this.prev();
    } else {
      this.goTo(
        (Math.round(-this.lastTranslateX / this.unitWidth) + this.length) %
          this.length
      );
    }

    // if (diffX > 30) {
    //   this.next();
    // } else if (diffX < -30) {
    //   this.prev();
    // } else {
    //   this.goTo(this.currentIndex);
    // }
  }

  next() {
    this.currentIndex =
      this.currentIndex < this.length - 1 ? this.currentIndex + 1 : 0;
    this.goTo(this.currentIndex);
  }

  prev() {
    this.currentIndex =
      this.currentIndex <= 0 ? this.length - 1 : this.currentIndex - 1;
    this.goTo(this.currentIndex);
  }

  goTo(index) {
    console.log('goto', -this.unitWidth * this.currentIndex);
    this.currentIndex = index;

    [...this.$dots].forEach(($dot, dotIndex) => {
      dotIndex === this.currentIndex
        ? $dot.classList.add(this.classes.active)
        : $dot.classList.remove(this.classes.active);
    });

    anime.remove(this.$wrapper);

    return anime({
      targets: this.$wrapper,
      translateX: -this.unitWidth * this.currentIndex,
      easing: this.easing,
      duration: this.duration
    }).finished;
  }

  // indexの値を見てwrapperの位置とitemの位置を移動させる
  updateItem() {
    // parseFloat(anime.get(this.$wrapper, "translateX"));
    // anime.set(this.$wrapper, {
    // translateX: this.lastTranslateX
    // });
  }
}
