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
const outerWidth = (el) => {
  let width = el.offsetWidth;
  const style = getComputedStyle(el);

  width += parseInt(style.marginLeft) + parseInt(style.marginRight);
  return width;
};

/**
 * カルーセル
 要件
 進むボタン、戻るボタン
 スワイプ
 アクティビティインジケーター（ページャー）　3/5 サムネイル
 自動スライド
 リサイズ
 */
export default class CarouselUI extends events {
  /**
   * @param selector
   */
  constructor(selector) {
    super();
    this.$el = document.querySelector(selector);
    this.$wrapper = this.$el.querySelector(`${selector}_wrapper`);
    this.$items = this.$el.querySelectorAll(`${selector}_item`);
    this.$prev = this.$el.querySelector(`${selector}_previous`);
    this.$next = this.$el.querySelector(`${selector}_next`);

    this.anime = null;
    this.currentIndex = 0;
    this.length = this.$items.length;
    this.unitWidth = 0;

    this.update();
    this.bind();
  }

  update() {
    this.unitWidth = outerWidth(this.$items[0]);
  }

  bind() {
    const options = enablePassiveEventListeners()
      ? { passive: true }
      : false;

    window.addEventListener('load', this.update.bind(this), options);
    document.addEventListener('resize', this.update.bind(this), options);
    this.$next.addEventListener('click', this.next.bind(this), options);
    this.$prev.addEventListener('click', this.prev.bind(this), options);
  }

  next() {
    this.currentIndex = (this.currentIndex < this.length - 1) ? this.currentIndex + 1 : 0;
    this.goTo(this.currentIndex);
  }

  prev() {
    this.currentIndex = (this.currentIndex < 0) ? 0 : this.currentIndex - 1;
    this.goTo(this.currentIndex);
  }

  goTo(index) {
    console.log('goto', -this.unitWidth * this.currentIndex);
    this.currentIndex = index;
    this.anime && this.anime.remove();
    this.anime = anime({
      targets: this.$wrapper,
      translateX: -this.unitWidth * this.currentIndex,
      easing: 'easeInOutQuad',
      duration: 500
    });
  }
}
