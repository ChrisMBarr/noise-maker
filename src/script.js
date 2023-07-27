const $svgFilter = $('#grainy-output');
const $controls = $$('.ctrl');

//Loop through all the controls and run an event any time one changes
Array.from($controls).forEach((ctrl) => {
  const $input = ctrl.querySelector('input, select');
  const $outputDisplay = ctrl.querySelector('output');

  $input.addEventListener('input', (ev) => {
    update($input, $outputDisplay);
  });

  //Initialize
  update($input, $outputDisplay);
});

/**
 * @description This runs any time an input element changes value
 * @param {HTMLElement} $inputEl
 * @param {HTMLElement} $outputDisplay
 */
function update($inputEl, $outputDisplay) {
  if ($outputDisplay) {
    $outputDisplay.innerHTML = $inputEl.value;
  }

  const tgtSelector = $inputEl.attributes.getNamedItem('data-target');
  const tgtStyleProp = $inputEl.attributes.getNamedItem('data-target-style-prop');
  const tgtAttr = $inputEl.attributes.getNamedItem('data-target-attr');
  if (tgtSelector) {
    if (tgtStyleProp) {
      $(tgtSelector.value).style[tgtStyleProp.value] = $inputEl.value;
    } else if (tgtAttr) {
      $(tgtSelector.value).attributes[tgtAttr.value].value = $inputEl.value;
    }

    if ($inputEl.attributes.getNamedItem('data-force-reload-svg')) {
      forceReloadSvg();
    }
  }
}

function forceReloadSvg() {
  //Re-select every time since it's being replaced and we lose the reference
  const $svg = $('#demo-output svg');

  //remove any styles it has
  if ($svg.attributes.style && $svg.attributes.style.transform) {
    $svg.attributes.style.transform.value = '';
  }

  //clone the element and replace it
  var $clone = $svg.cloneNode(true);
  $svg.parentNode.replaceChild($clone, $svg);

  //force it into a new GPU rendering layer
  $clone.style['transform'] = 'translateZ(0)';
}
