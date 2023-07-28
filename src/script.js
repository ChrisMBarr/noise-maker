const $baseFrequencyX = $('#ctrl-base-frequency-x');
const $baseFrequencyToggleDisplay = $$('.baseFrequencyToggleDisplay');
let separateBaseFrequencies = false;
const textureStyles = {
  filter: {},
};

//Loop through all the controls and run an event any time one changes
Array.from($$('#svg-controls .form-control-wrapper')).forEach((ctrl) => {
  const $input = ctrl.querySelector('input:not([data-enable]), select');
  const $enableInput = ctrl.querySelector('input[data-enable]');
  const $outputDisplay = ctrl.querySelector('output');

  //Form inputs
  $input.addEventListener('input', () => {
    updateTexture($input, $outputDisplay, false);
  });

  //Checkboxes to enable/disable other inputs
  if ($enableInput) {
    const enableTgt = $enableInput.attributes.getNamedItem('data-enable');
    $enableInput.addEventListener('input', () => {
      $(enableTgt.value).disabled = !$enableInput.checked;
      updateTexture($(enableTgt.value), $outputDisplay, false);
    });

    //Initialize
    $(enableTgt.value).disabled = !$enableInput.checked;
  }

  //Initialize
  updateTexture($input, $outputDisplay, true);
});

/**
 * @description This runs any time an input element changes value
 * @param {HTMLInputElement} $inputEl
 * @param {HTMLOutputElement} $outputDisplay
 */
function updateTexture($inputEl, $outputDisplay, isInit) {
  const isDisabled = $inputEl.disabled;
  const suffix = $inputEl.attributes.getNamedItem('data-target-filter-prop-suffix');
  const val = suffix ? $inputEl.value + suffix.value : $inputEl.value;

  if ($outputDisplay) {
    $outputDisplay.innerHTML = isDisabled ? '' : val;
  }

  if (!isInit && $inputEl.id === 'ctrl-separate-frequencies') {
    separateBaseFrequencies = $inputEl.checked;
    toggleDisplay($baseFrequencyToggleDisplay);
    updateTexture($baseFrequencyX, $outputDisplay);
  } else {
    const tgtSelector = $inputEl.attributes.getNamedItem('data-target');
    const tgtStyleProp = $inputEl.attributes.getNamedItem('data-target-style-prop');
    const tgtFilterProp = $inputEl.attributes.getNamedItem('data-target-filter-prop');
    const tgtAttr = $inputEl.attributes.getNamedItem('data-target-attr');
    if (tgtSelector) {
      const $tgt = $(tgtSelector.value);

      if (tgtStyleProp) {
        $tgt.style[tgtStyleProp.value] = val;
        textureStyles[tgtStyleProp.value] = val;
      } else if (tgtFilterProp) {
        updateTextureFilter($tgt, tgtFilterProp.value, val, isDisabled);
      } else if (tgtAttr) {
        if (separateBaseFrequencies && tgtAttr.value === 'baseFrequency') {
          const combinedBaseFreq = `${$baseFrequencyX.value} ${$('#ctrl-base-frequency-y').value}`;
          $tgt.attributes[tgtAttr.value].value = combinedBaseFreq;
        } else {
          $tgt.attributes[tgtAttr.value].value = val;
        }
      }

      if ($inputEl.attributes.getNamedItem('data-force-reload-svg')) {
        forceReloadSvg();
      }
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

function updateTextureFilter($tgt, tgtFilterProp, val, isDisabled) {
  textureStyles.filter[tgtFilterProp] = isDisabled ? null : val;
  $tgt.style.filter = getPropsAsCssString(textureStyles.filter);
}

function getPropsAsCssString(obj) {
  return Object.keys(obj)
    .map((key) => {
      const val = obj[key];
      return val == null ? '' : `${key}(${val})`;
    })
    .filter((v) => v !== '')
    .join(' ');
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
  writeCodeToFields();
  toggleDisplay($modal);
  $modalDialog.showModal();
}

function closeDialog(ev, self) {
  if (ev.target == self) {
    $modalDialog.close();
    toggleDisplay($modal);
  }
}

function writeCodeToFields() {
  const $svgFilter = $('#demo-output svg filter');

  const textureStylesStr = Object.keys(textureStyles)
    //skip the mix-blend-mode if it's set to 'normal'
    .filter(
      (k) => k !== 'mix-blend-mode' || (k === 'mix-blend-mode' && textureStyles[k] !== 'normal')
    )
    .map((k) => {
      const val = textureStyles[k];
      if (k === 'filter') {
        const filterValues = getPropsAsCssString(val);
        return `  filter: url(#${$svgFilter.id}) ${filterValues};`;
      }
      return `  ${k}: ${val};`;
    })
    .join('\n');

  $ctrlCodeHtml.value = `<svg xmlns="http://www.w3.org/2000/svg" class="hidden-svg">${prettyIndentHtml(
    $svgFilter.outerHTML
  )}</svg>`;

  $ctrlCodeCss.value = `.bg-texture {
${textureStylesStr}
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
}`;
}

function prettyIndentHtml(htmlStr) {
  const tagLevels = {
    filter: 2,
    feTurbulence: 4,
  };

  Object.keys(tagLevels).forEach((k) => {
    const pattern = new RegExp(`\\s*(<\\/?${k})`, 'ig');
    htmlStr = htmlStr.replace(pattern, `\n${' '.repeat(tagLevels[k])}$1`);
  });

  return `${htmlStr}\n`;
}
