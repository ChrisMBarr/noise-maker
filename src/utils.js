function $(singeElSelector) {
  return document.querySelector(singeElSelector);
}
function $$(multiElSelector) {
  return document.querySelectorAll(multiElSelector);
}
function attr(node, attrName) {
  const attr = node.attributes.getNamedItem(attrName);
  return attr ? attr.value : null;
}
function toggleDisplay($elements) {
  function t(el) {
    const currentDisplay = getComputedStyle(el).display;
    if (currentDisplay !== 'none') {
      el.attributes['data-prev-display'] = currentDisplay;
      el.style.display = 'none';
    } else if (currentDisplay === 'none') {
      el.style.display = el.attributes['data-prev-display'] ?? 'block';
    }
  }

  //works with a nodelist or a single element
  if ($elements.length) {
    Array.from($elements).forEach(t);
  } else {
    t($elements);
  }
}
