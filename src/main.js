const svgNs = 'http://www.w3.org/2000/svg';
let customSizeEnabled = false;
let lightingEffectsEnabled = false;
const inputEventName = 'input';
const textureStyles = {
  filter: {},
};

$(() => {
  const $baseFrequencyX = $('#ctrl-base-frequency-x');
  const $baseFrequencyY = $('#ctrl-base-frequency-y');

  //Loop through all the controls and run an event any time one changes
  $('#svg-controls')
    .find('.form-control-wrapper, .card-header')
    .each((_i, ctrl) => {
      const $input = $(ctrl).find('select, input:not([data-enable]):not([data-toggle-visibility])');
      const $enableInput = $(ctrl).find('input[data-enable]');
      const $toggleVisibilityInput = $(ctrl).find(
        'input[data-toggle-visibility], select[data-toggle-visibility]'
      );
      const $outputDisplay = $(ctrl).find('output');

      //Checkboxes to enable/disable other inputs
      if ($enableInput.length) {
        const $enableTargets = $($enableInput.data('enable'));
        $enableInput.on(inputEventName, () => {
          const isChecked = $enableInput.is(':checked');
          $enableTargets.attr('disabled', !isChecked);

          if ($enableInput.attr('id') === 'ctrl-enable-lighting') {
            lightingEffectsEnabled = isChecked;
            if (isChecked) {
              createLightingElement();
            } else {
              clearLightingEffects();
            }
          } else if ($enableInput.attr('id') === 'ctrl-enable-custom-size') {
            customSizeEnabled = isChecked;
            updateLightingMaxValues();
            if (!isChecked) {
              $('#demo-output svg').css({ height: '100%', width: '100%' });
            }
          }

          $enableTargets.each((_i, t) => updateTexture($(t), $outputDisplay));
          $enableTargets.trigger(inputEventName);
        });

        //Initialize
        $enableInput.trigger(inputEventName);
      }

      if ($toggleVisibilityInput.length) {
        if ($toggleVisibilityInput.is(':checkbox')) {
          const $toggleTargets = $($toggleVisibilityInput.data('toggle-visibility'));
          $toggleVisibilityInput.on(inputEventName, () => {
            $toggleTargets.toggle($toggleVisibilityInput.is(':checked'));

            if ($toggleVisibilityInput.attr('id') === 'ctrl-separate-frequencies') {
              updateTexture($baseFrequencyX, $outputDisplay);
            }
          });
          //Initialize
          $toggleTargets.toggle($toggleVisibilityInput.is(':checked'));
        } else if ($toggleVisibilityInput.is('select')) {
          const $allToggles = $toggleVisibilityInput.find(
            'option[data-toggle-visibility-and-enable]'
          );
          const allTargetsSelectorStr = $allToggles
            .toArray()
            .map((x) => {
              return $(x).data('toggle-visibility-and-enable');
            })
            .join(',');
          const $allTargets = $(allTargetsSelectorStr);

          $toggleVisibilityInput.on(inputEventName, (ev) => {
            const $currentTarget = $toggleVisibilityInput.children().eq(ev.target.selectedIndex);
            const $toggleTargets = $($currentTarget.data('toggle-visibility-and-enable'));

            const id = $toggleVisibilityInput.attr('id');
            if (lightingEffectsEnabled) {
              if (id === 'ctrl-lighting-primitive-type') {
                clearLightingEffects();
                createLightingElement();
                $('#lighting-controls .shared-lighting-controls')
                  .find('input, select:not(#' + id + ')')
                  .trigger(inputEventName);
              } else if (id === 'ctrl-light-type') {
                replaceLightElement();
              }
            }

            $allTargets.hide().find('input, select').attr('disabled', 'disabled');
            const $enabledInputs = $toggleTargets
              .show()
              .find('input, select')
              .removeAttr('disabled');
            $enabledInputs.each((_i, t) => updateTexture($(t), $outputDisplay));
            $enabledInputs.trigger(inputEventName);
          });
        }
      }

      //Form inputs
      if ($input.length) {
        $input.on(inputEventName, () => {
          updateTexture($input, $outputDisplay);
        });

        //Initialize
        $input.trigger(inputEventName);
      }
    });

  //Initialize max values & update them on window resize
  $(window).on('resize', updateLightingMaxValues);
  updateLightingMaxValues();

  function updateTexture($inputEl, $outputDisplay) {
    const isDisabled = $inputEl.is(':disabled');
    const suffix = $inputEl.data('target-filter-prop-suffix');
    const val = suffix ? $inputEl.val() + suffix : $inputEl.val();

    if ($outputDisplay.length) {
      $outputDisplay.text(isDisabled ? '' : val);
    }

    const tgtSelector = $inputEl.data('target');
    const tgtStyleProp = $inputEl.data('target-style-prop');
    const tgtFilterProp = $inputEl.data('target-filter-prop');
    const tgtAttr = $inputEl.data('target-attr');

    if (tgtSelector) {
      const $tgt = $(tgtSelector);
      const id = $inputEl.attr('id');

      if (!isDisabled && tgtStyleProp) {
        $tgt.css(tgtStyleProp, val);
        textureStyles[tgtStyleProp] = val;

        if (id === 'ctrl-custom-height' || id === 'ctrl-custom-width') {
          updateLightingMaxValues();
        }
      } else if (!isDisabled && tgtAttr) {
        if (id === $baseFrequencyX.attr('id') || id === $baseFrequencyY.attr('id')) {
          let combinedBaseFreq = $baseFrequencyX.val();
          if (!$baseFrequencyY.is(':disabled')) {
            combinedBaseFreq += ` ${$baseFrequencyY.val()}`;
          }
          $tgt.attr(tgtAttr, combinedBaseFreq);
        } else {
          if (tgtAttr.includes(' ')) {
            //multiple attributes to set with the same value
            const attrObj = tgtAttr.split(' ').reduce((acc, curr) => ((acc[curr] = val), acc), {});
            $tgt.attr(attrObj);
          } else {
            $tgt.attr(tgtAttr, val);
          }
        }
      } else if (tgtFilterProp) {
        updateTextureFilter($tgt, tgtFilterProp, val, isDisabled);
      }

      if ($inputEl.data('force-reload-svg')) {
        forceReloadSvg();
      }
    }
  }
});
