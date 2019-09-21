/*
 * Outer Width With Margin
 */
const getOuterWidth = el => {
  let width = el.offsetWidth;
  const style = getComputedStyle(el);

  width += parseInt(style.marginLeft) + parseInt(style.marginRight);
  return width;
};

export default getOuterWidth;
