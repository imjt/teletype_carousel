/*
 * Outer Width With Margin
 */
const getOuterWidth = (el: HTMLElement) => {
  const style = getComputedStyle(el);
  let width = el.offsetWidth;
  width += parseInt(style.marginLeft) + parseInt(style.marginRight);
  return width;
};

export default getOuterWidth;
