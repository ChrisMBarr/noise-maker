const $baseFrequencyX = $('#ctrl-base-frequency-x');
const $baseFrequencyToggleDisplay = $$('.baseFrequencyToggleDisplay');
let separateBaseFrequencies = false;
const textureStyles = {};

//Loop through all the controls and run an event any time one changes
Array.from($$('#svg-controls .form-control-wrapper')).forEach((ctrl) => {
  const $input = ctrl.querySelector('input, select');
  const $outputDisplay = ctrl.querySelector('output');

  $input.addEventListener('input', () => {
    updateTexture($input, $outputDisplay, false);
  });

  //Initialize
  updateTexture($input, $outputDisplay, true);
});

/**
 * @description This runs any time an input element changes value
 * @param {HTMLInputElement} $inputEl
 * @param {HTMLOutputElement} $outputDisplay
 */
function updateTexture($inputEl, $outputDisplay, isInit) {
  if ($outputDisplay) {
    $outputDisplay.innerHTML = $inputEl.value;
  }

  if (!isInit && $inputEl.id === 'ctrl-separate-frequencies') {
    separateBaseFrequencies = $inputEl.checked;
    toggleDisplay($baseFrequencyToggleDisplay);
    updateTexture($baseFrequencyX, $outputDisplay);
  }

  const tgtSelector = $inputEl.attributes.getNamedItem('data-target');
  const tgtStyleProp = $inputEl.attributes.getNamedItem('data-target-style-prop');
  const tgtAttr = $inputEl.attributes.getNamedItem('data-target-attr');
  if (tgtSelector) {
    if (tgtStyleProp) {
      $(tgtSelector.value).style[tgtStyleProp.value] = $inputEl.value;
      textureStyles[tgtStyleProp.value] = $inputEl.value;
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

//================================================
// Buttons
//================================================
$('#btn-get-code').addEventListener('click', openDialog);

//All the 'copy' buttons
Array.from($$('.btn-copy')).forEach((btn) => {
  btn.addEventListener('click', () => {
    const tgtSelector = btn.attributes.getNamedItem('data-target');
    if (tgtSelector) {
      navigator.clipboard.writeText($(tgtSelector.value).value).then(
        () => {},
        () => {
          alert('could not copy text, please select and copy it manually!');
        }
      );
    }
  });
});

//================================================
// Dialog
//================================================
const $modal = $('#code-modal');
const $modalDialog = $modal.querySelector('dialog');
const $ctrlCodeHtml = $('#code-html');
const $ctrlCodeCss = $('#code-css');

$modalDialog.addEventListener('click', function (ev) {
  closeDialog(ev, this);
});
$modalDialog.querySelector('.btn-close').addEventListener('click', function (ev) {
  closeDialog(ev, this);
});

function openDialog() {
  const filterId = 'grainy-texture';
  $ctrlCodeHtml.value = `<svg xmlns="http://www.w3.org/2000/svg" class="hidden-svg">
  <filter id="${filterId}">
    ${$('#grainy-output').innerHTML.trim()}
  </filter>
</svg>`;

  const textureStylesStr = Object.keys(textureStyles)
    //skip the mix-blend-mode if it's set to 'normal'
    .filter(
      (k) => k !== 'mix-blend-mode' || (k === 'mix-blend-mode' && textureStyles[k] !== 'normal')
    )
    .map((k) => `  ${k}: ${textureStyles[k]};`)
    .join('\n');
  $ctrlCodeCss.innerHTML = `.bg-texture {
${textureStylesStr}
  filter: url(#${filterId});
}
.hidden-svg {
  height: 0px;
  width: 0px;
  overflow: hidden;
  opacity: 0;
  position: absolute;
  z-index: -999;
  left: 0;
  top: 0;
}
`;

  toggleDisplay($modal);
  $modalDialog.showModal();
}

function closeDialog(ev, self) {
  if (ev.target == self) {
    $modalDialog.close();
    toggleDisplay($modal);
  }
}
