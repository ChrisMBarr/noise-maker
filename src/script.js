const svgNs = 'http://www.w3.org/2000/svg';
const $baseFrequencyX = $('#ctrl-base-frequency-x');
const $baseFrequencyY = $('#ctrl-base-frequency-y');
const textureStyles = {
  filter: {},
};

//Loop through all the controls and run an event any time one changes
$('#svg-controls .form-control-wrapper').each((_i, ctrl) => {
  const $input = $(ctrl).find('select, input:not([data-enable]):not([data-toggle-visibility])');
  const $enableInput = $(ctrl).find('input[data-enable]');
  const $toggleVisibilityInput = $(ctrl).find(
    'input[data-toggle-visibility], select[data-toggle-visibility]'
  );
  const $outputDisplay = $(ctrl).find('output');

  //Checkboxes to enable/disable other inputs
  if ($enableInput.length) {
    const $enableTargets = $($enableInput.attr('data-enable'));
    $enableInput.on('input', () => {
      const isChecked = $enableInput.is(':checked');
      $enableTargets.attr('disabled', !isChecked);

      if ($enableInput.attr('id') === 'ctrl-enable-lighting') {
        //special condition when enabling/disabling lighting
        const $svgFilter = $('#noise-filter');
        if (isChecked) {
          $svgFilter.append(createLightingElement());
        } else {
          $svgFilter.find('feDiffuseLighting, feSpecularLighting').remove();
        }
      }

      $enableTargets.each((_i, t) => updateTexture($(t), $outputDisplay));
      $enableTargets.trigger('input');
    });

    //Initialize
    $enableInput.trigger('input');
  }

  if ($toggleVisibilityInput.length) {
    if ($toggleVisibilityInput.is(':checkbox')) {
      const $toggleTargets = $($toggleVisibilityInput.attr('data-toggle-visibility'));
      $toggleVisibilityInput.on('input', () => {
        $toggleTargets.toggle($toggleVisibilityInput.is(':checked'));

        if ($toggleVisibilityInput.attr('id') === 'ctrl-separate-frequencies') {
          updateTexture($baseFrequencyX, $outputDisplay);
        }
      });
      //Initialize
      $toggleTargets.toggle($toggleVisibilityInput.is(':checked'));
    } else if ($toggleVisibilityInput.is('select')) {
      const $allToggles = $toggleVisibilityInput.find('option[data-toggle-visibility-and-enable]');
      const allTargetsSelectorStr = $allToggles
        .toArray()
        .map((x) => {
          return $(x).attr('data-toggle-visibility-and-enable');
        })
        .join(',');
      const $allTargets = $(allTargetsSelectorStr);

      $toggleVisibilityInput.on('input', () => {
        const selectedVal = $toggleVisibilityInput.val();
        const $currentTarget = $toggleVisibilityInput.find(`option[value=${selectedVal}]`);
        const $toggleTargets = $($currentTarget.attr('data-toggle-visibility-and-enable'));

        $allTargets.hide().find('input, select').attr('disabled', 'disabled');
        const $enabledInputs = $toggleTargets.show().find('input, select').removeAttr('disabled'); //.trigger('input');
        $enabledInputs.each((_i, t) => updateTexture($(t), $outputDisplay));
      });
    }
  }

  //Form inputs
  if ($input.length) {
    $input.on('input', () => {
      updateTexture($input, $outputDisplay);
    });

    //Initialize
    $input.trigger('input');
  }
});

/**
 * @description This runs any time an input element changes value
 * @param {HTMLInputElement} $inputEl
 * @param {HTMLOutputElement} $outputDisplay
 */
function updateTexture($inputEl, $outputDisplay) {
  const isDisabled = $inputEl.is(':disabled');
  const suffix = $inputEl.attr('data-target-filter-prop-suffix');
  const val = suffix ? $inputEl.val() + suffix : $inputEl.val();

  if ($outputDisplay.length) {
    $outputDisplay.text(isDisabled ? '' : val);
  }

  const tgtSelector = $inputEl.attr('data-target');
  const tgtStyleProp = $inputEl.attr('data-target-style-prop');
  const tgtFilterProp = $inputEl.attr('data-target-filter-prop');
  const tgtAttr = $inputEl.attr('data-target-attr');

  if (tgtSelector) {
    const $tgt = $(tgtSelector);

    if (!isDisabled && tgtStyleProp) {
      $tgt.css(tgtStyleProp, val);
      textureStyles[tgtStyleProp] = val;
    } else if (!isDisabled && tgtAttr) {
      if (
        $inputEl.attr('id') === $baseFrequencyX.attr('id') ||
        $inputEl.attr('id') === $baseFrequencyY.attr('id')
      ) {
        let combinedBaseFreq = $baseFrequencyX.val();
        if (!$baseFrequencyY.disabled) {
          combinedBaseFreq += ` ${$baseFrequencyY.val()}`;
        }
        $tgt.attr(tgtAttr, combinedBaseFreq);
      } else {
        $tgt.attr(tgtAttr, val);
      }
    } else if (tgtFilterProp) {
      updateTextureFilter($tgt, tgtFilterProp, val, isDisabled);
    }

    if ($inputEl.attr('data-force-reload-svg')) {
      forceReloadSvg();
    }
  }
}

function forceReloadSvg() {
  //Re-select every time since it's being replaced and we lose the reference
  const $svg = $('#demo-output svg');

  //remove any styles it has
  if ($svg.css('transform')) {
    $svg.css('transform', '');
  }

  //clone the element and replace it
  var $clone = $svg.clone();
  $svg.replaceWith($clone);

  //force it into a new GPU rendering layer
  $clone.css('transform', 'translateZ(0)');
}

function updateTextureFilter($tgt, tgtFilterProp, val, isDisabled) {
  textureStyles.filter[tgtFilterProp] = isDisabled ? null : val;
  $tgt.css('filter', getPropsAsCssString(textureStyles.filter));
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

function createLightingElement() {
  const lightingPrimitiveType = $('#ctrl-lighting-primitive-type').val();
  const lightType = 'feDistantLight'; //$('#ctrl-light-type').val();

  const lightingPrimitiveEl = document.createElementNS(svgNs, lightingPrimitiveType);
  lightingPrimitiveEl.setAttributeNS(svgNs, 'in', 'noise'); //needs to match the `result` property on the `feTurbulence` element

  let lightEl = document.createElementNS(svgNs, lightType);
  lightingPrimitiveEl.appendChild(lightEl);

  return lightingPrimitiveEl;
}

//================================================
// Buttons
//================================================
$('#btn-get-code').on('click', openDialog);

//All the 'copy' buttons
$('.btn-copy').on('click', (btn) => {
  const tgtSelector = $(btn).attr('data-target');
  if (tgtSelector) {
    navigator.clipboard.writeText($(tgtSelector).val()).then(
      () => {},
      () => {
        alert('could not copy text, please select and copy it manually!');
      }
    );
  }
});

//================================================
// Dialog
//================================================
const $modal = $('#code-modal');
const $modalDialog = $modal.find('dialog');
const $ctrlCodeHtml = $('#code-html');
const $ctrlCodeCss = $('#code-css');

$modalDialog.on('click', function (ev) {
  closeDialog(ev, this);
});

$modalDialog.find('.btn-close').on('click', function (ev) {
  closeDialog(ev, this);
});

function openDialog() {
  writeCodeToFields();
  $modal.show();
  $modalDialog.get(0).showModal();
}

function closeDialog(ev, self) {
  if (ev.target == self) {
    $modalDialog.get(0).close();
    $modal.hide();
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
        return `  filter: url(#${$svgFilter.attr('id')}) ${filterValues};`;
      }
      return `  ${k}: ${val};`;
    })
    .join('\n');

  $ctrlCodeHtml.val(
    `<svg xmlns="${svgNs}" class="hidden-svg">${prettyIndentHtml(
      $svgFilter.get(0).outerHTML
    )}</svg>`
  );

  $ctrlCodeCss.val(`.bg-texture {
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
}`);
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
