const svgNs = 'http://www.w3.org/2000/svg';
let customSizeEnabled = false;
let lightingEffectsEnabled = false;
let isDraggingHandle = false;
let $demoOutput: JQuery<HTMLElement>;
let canvasSize = {
  left: 0,
  width: 0,
  height: 0,
};
const inputEventName = 'input';
const textureStyles: IIndexableObject = {
  filter: {},
};

$(() => {
  $demoOutput = $('#demo-output');
  //Special controls we will need to treat differently
  const $baseFrequencyX = $('#ctrl-base-frequency-x') as JQuery<HTMLInputElement>;

  //Enable tooltips
  $('[data-bs-toggle="tooltip"]').each((_i, el) => {
    new bootstrap.Tooltip(el);
  });

  //Loop through all the controls and run an event any time one changes
  $('#svg-controls')
    .find('.form-control-wrapper, .card-header')
    .each((_i, ctrl) => {
      const $input = $(ctrl).find(
        'select, input:not([data-enable]):not([data-toggle-visibility])'
      ) as JQuery<HTMLInputElement>;
      const $enableInput = $(ctrl).find('input[data-enable]') as JQuery<HTMLInputElement>;
      const $toggleVisibilityInput = $(ctrl).find(
        'input[data-toggle-visibility], select[data-toggle-visibility]'
      ) as JQuery<HTMLInputElement>;
      const $outputDisplay = $(ctrl).find('output') as JQuery<HTMLOutputElement>;

      //Checkboxes to enable/disable other inputs
      if ($enableInput.length) {
        initEnableInputs($enableInput, $outputDisplay);
      }

      //Checkboxes or <select> options that show/hide other elements
      if ($toggleVisibilityInput.length) {
        initToggleVisibilityInputs($toggleVisibilityInput, $outputDisplay);
      }

      //All other form inputs
      if ($input.length) {
        initFormInputs($input, $outputDisplay);
      }
    });

  //Mobile screen toggle button
  $('#btn-toggle-controls').on('click', () => {
    $('body').toggleClass('controls-open');
  });

  function initEnableInputs(
    $enableInput: JQuery<HTMLInputElement>,
    $outputDisplay: JQuery<HTMLOutputElement>
  ) {
    const $enableTargets = $($enableInput.data('enable'));
    $enableInput.on(inputEventName, () => {
      const isChecked = $enableInput.is(':checked');
      if (isChecked) {
        $enableTargets.removeAttr('disabled');
      } else {
        $enableTargets.attr('disabled', 'disabled');
      }

      if ($enableInput.attr('id') === 'ctrl-enable-lighting') {
        lightingEffectsEnabled = isChecked;
        if (isChecked) {
          createLightingElement();
        } else {
          clearLightingEffects();
          clearLightingHandles();
        }
      } else if ($enableInput.attr('id') === 'ctrl-enable-custom-size') {
        customSizeEnabled = isChecked;
        updateLightingMaxValues();
        if (!isChecked) {
          $demoOutput.children('svg').css({ height: '100%', width: '100%' });
        }
      }

      $enableTargets.trigger(inputEventName);
    });

    //Initialize
    $enableInput.trigger(inputEventName);
  }

  function initToggleVisibilityInputs(
    $toggleVisibilityInput: JQuery<HTMLInputElement>,
    $outputDisplay: JQuery<HTMLOutputElement>
  ) {
    if ($toggleVisibilityInput.is(':checkbox')) {
      const targetSelector = $toggleVisibilityInput.data('toggle-visibility');
      const collapseEls = document.querySelectorAll(targetSelector);
      const collapseList = [...collapseEls].map(
        (el) => new bootstrap.Collapse(el, { toggle: false })
      );

      $toggleVisibilityInput.on(inputEventName, () => {
        if ($toggleVisibilityInput.is(':checked')) {
          collapseList.forEach((e) => e.show());
        } else {
          collapseList.forEach((e) => e.hide());
        }

        if ($toggleVisibilityInput.attr('id') === 'ctrl-separate-frequencies') {
          updateTexture($baseFrequencyX, $outputDisplay);
        }
      });
      //Initialize
      $(targetSelector)
        .addClass('collapse')
        .toggleClass('show', $toggleVisibilityInput.is(':checked'));
    } else if ($toggleVisibilityInput.is('select')) {
      const $allToggleOptions = $toggleVisibilityInput.find(
        'option[data-toggle-visibility-and-enable]'
      );
      const allTargetsSelectorStr = $allToggleOptions
        .toArray()
        .map((x) => {
          return $(x).data('toggle-visibility-and-enable');
        })
        .join(',');
      const $allTargets = $(allTargetsSelectorStr);

      //Create collapsable elements
      const collapseEls = document.querySelectorAll(allTargetsSelectorStr);
      [...collapseEls].forEach((el) => new bootstrap.Collapse(el, { toggle: false }));

      $toggleVisibilityInput.on(inputEventName, (ev) => {
        const el = ev.target;
        // @ts-ignore
        const $currentTarget = $toggleVisibilityInput.children().eq(el.selectedIndex);
        const currentTgtSelector = $currentTarget.data('toggle-visibility-and-enable');
        const $toggleTargets = $(currentTgtSelector);

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
            const handleMappings = $currentTarget.data('handles');
            createLightHandles(handleMappings);
          }
        }

        collapseEls.forEach((el) => {
          const collapse = bootstrap.Collapse.getInstance(el);
          if ($toggleTargets.is(el)) {
            collapse?.show();
          } else {
            collapse?.hide();
          }
        });

        $allTargets.find('input, select').attr('disabled', 'disabled');
        const $enabledInputs = $toggleTargets
          .find('input, select')
          .removeAttr('disabled') as JQuery<HTMLInputElement>;
        $enabledInputs.each((_i, t) => updateTexture($(t), $outputDisplay));
        $enabledInputs.trigger(inputEventName);
      });

      //Initialize
      const $selectedOpt = $toggleVisibilityInput
        .children()
        .filter(`[value='${$toggleVisibilityInput.val()}']`);
      const selectedToggle = $selectedOpt.data('toggle-visibility-and-enable');
      $(allTargetsSelectorStr)
        .addClass('collapse')
        .toggleClass('show', $toggleVisibilityInput.is(selectedToggle));
    }
  }

  function initFormInputs(
    $input: JQuery<HTMLInputElement>,
    $outputDisplay: JQuery<HTMLOutputElement>
  ) {
    $input.on(inputEventName, () => {
      updateTexture($input, $outputDisplay);
    });

    //Initialize
    $input.trigger(inputEventName);
  }

  //Initialize max values & update them on window resize
  $(window)
    .on('resize', () => {
      updateLightingMaxValues();
    })
    .trigger('resize');

  function updateTexture(
    $inputEl: JQuery<HTMLInputElement>,
    $outputDisplay: JQuery<HTMLOutputElement>
  ) {
    const isDisabled = $inputEl.is(':disabled');
    const suffix = $inputEl.data('target-value-suffix');
    let val = suffix ? $inputEl.val() + suffix : $inputEl.val();

    if ($outputDisplay.length) {
      $outputDisplay.text(isDisabled ? '' : val);
    }

    if ($inputEl.data('target-value-formatter')) {
      val = getFormattedValue($inputEl);
    }

    const tgtSelector = $inputEl.data('target') as string | undefined;
    const tgtStyleProp = $inputEl.data('target-style-prop') as string | undefined;
    const tgtFilterProp = $inputEl.data('target-filter-prop') as string | undefined;
    const tgtAttr = $inputEl.data('target-attr') as string | undefined;

    if (tgtSelector) {
      const $tgt = $(tgtSelector);
      const id = $inputEl.attr('id');

      if (tgtStyleProp) {
        const disabledVal = $inputEl.data('target-style-value-when-disabled');

        if (isDisabled && disabledVal) {
          $tgt.css(tgtStyleProp, disabledVal);
          textureStyles[tgtStyleProp] = disabledVal;
        }

        if (!isDisabled) {
          $tgt.css(tgtStyleProp, val);
          textureStyles[tgtStyleProp] = val;
          if (id === 'ctrl-custom-height' || id === 'ctrl-custom-width') {
            updateLightingMaxValues();
          }
        }
      } else if (!isDisabled && tgtAttr) {
        if (tgtAttr.includes(' ')) {
          //multiple attributes to set with the same value
          const attrObj = tgtAttr
            .split(' ')
            .reduce((acc, curr) => ((acc[curr] = val), acc), {} as IIndexableObject);
          $tgt.attr(attrObj);
        } else {
          $tgt.attr(tgtAttr, val);
        }

        //Handle dragging updates the input value, but we don't want that coming back through to update the handle position
        if (!isDraggingHandle) {
          const handleIndex = $inputEl.data('handle-index');
          const handlePos = $inputEl.data('handle-position');
          if (handleIndex !== undefined && handlePos !== undefined) {
            updateHandlePosition(handleIndex, handlePos, val);
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
