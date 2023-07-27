const $svgFilter = $('#grainy-output');
const $controls = $$('.ctrl');
const $baseFrequencyX = $('#ctrl-base-frequency-x');
const $baseFrequencyToggleDisplay = $$('.baseFrequencyToggleDisplay');
let separateBaseFrequencies = false;

//Loop through all the controls and run an event any time one changes
Array.from($controls).forEach((ctrl) => {
  const $input = ctrl.querySelector('input, select');
  const $outputDisplay = ctrl.querySelector('output');

  $input.addEventListener('input', () => {
    update($input, $outputDisplay, false);
  });

  //Initialize
  update($input, $outputDisplay, true);
});

/**
 * @description This runs any time an input element changes value
 * @param {HTMLInputElement} $inputEl
 * @param {HTMLOutputElement} $outputDisplay
 */
function update($inputEl, $outputDisplay, isInit) {
  if ($outputDisplay) {
    $outputDisplay.innerHTML = $inputEl.value;
  }

  if (!isInit && $inputEl.id === 'ctrl-separate-frequencies') {
    separateBaseFrequencies = $inputEl.checked;
    toggleDisplay($baseFrequencyToggleDisplay);
    update($baseFrequencyX, $outputDisplay);
  }

  const tgtSelector = $inputEl.attributes.getNamedItem('data-target');
  const tgtStyleProp = $inputEl.attributes.getNamedItem('data-target-style-prop');
  const tgtAttr = $inputEl.attributes.getNamedItem('data-target-attr');
  if (tgtSelector) {
    if (tgtStyleProp) {
      $(tgtSelector.value).style[tgtStyleProp.value] = $inputEl.value;
    } else if (tgtAttr) {
      if (separateBaseFrequencies && tgtAttr.value === 'baseFrequency') {
        const combinedBaseFreq = `${$baseFrequencyX.value} ${$('#ctrl-base-frequency-y').value}`;
        $(tgtSelector.value).attributes[tgtAttr.value].value = combinedBaseFreq;
      } else {
        $(tgtSelector.value).attributes[tgtAttr.value].value = $inputEl.value;
      }
    }

    if ($inputEl.attributes.getNamedItem('data-force-reload-svg')) {
      forceReloadSvg();
    }
  }
}

function toggleDisplay($elements) {
  Array.from($elements).forEach((el) => {
    if (el.style.display === '') {
      el.style.display = 'none';
    } else if (el.style.display === 'none') {
      el.style.display = '';
    }
  });
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
