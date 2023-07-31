function $(singeElSelector) {
  return document.querySelector(singeElSelector);
}
function $$(multiElSelector) {
  return document.querySelectorAll(multiElSelector);
}
function attr(node, attrName, newValue) {
  if (newValue) {
    //Set a value
    node.setAttribute(attrName, newValue);
    return null;
  } else {
    //return a value
    return node.getAttribute(attrName);
  }
}
function toggleDisplay($elements, show) {
  function t(el) {
    const currentDisplay = getComputedStyle(el).display;
    if (!show) {
      el.attributes['data-prev-display'] = currentDisplay;
      el.style.display = 'none';
    } else {
      const displayPref = attr(el, 'data-display') ?? 'block';
      el.style.display = attr(el, 'data-prev-display') ?? displayPref;
    }
  }

  //works with a nodelist or a single element
  if ($elements.length) {
    Array.from($elements).forEach(t);
  } else {
    t($elements);
  }
}
