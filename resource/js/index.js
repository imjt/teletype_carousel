import 'babel-polyfill';
import CarouselUI from './modules/CarouselUI';

/**
 * INDEX LOGIC
 */
class Index {

  /**
   * constructor
   */
  constructor() {
    this.carouselUI = new CarouselUI('.carousel');
  }
}

window.INDEX = new Index();

// mi73
// kzhr
// soarflat
// ASugita
// j-fujimura
