import events from 'events';

/**
 * ヘッダー
 * ページ内リンクの実装
 */
export default class AccordionUI extends events {
  /**
   * @param selector
   */
  constructor(element) {
    super();
    this.$ = element;
    this.isOpen = false;
    this.$title = this.$.querySelector('.acd-ttl');
    this.$detail = this.$.querySelector('.acd-detail');

    this.bind();
  }

  /**
   * イベントを付与する
   */
  bind() {
    this.$title.addEventListener('click', this.toggle.bind(this));
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.emit('open');
    this.isOpen = true;
    this.$.classList.add('is-active');
  }

  close() {
    this.isOpen = false;
    this.$.classList.remove('is-active');
  }
}
