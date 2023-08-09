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
let $controls: JQuery<HTMLInputElement | HTMLSelectElement>;
const ctrlIdPrefix = 'ctrl-';
const controlsMenuOpenClass = 'controls-open';
const inputEventName = 'input';
const textureStyles: IIndexableObject = {
  filter: {},
};

$(() => {
  const $controlsContainer = $('#svg-controls');
  $demoOutput = $('#demo-output');
  $controls = $controlsContainer.find('input:not([type="hidden"]), select') as JQuery<
    HTMLInputElement | HTMLSelectElement
  >;

  const themePref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  $('html').attr('data-bs-theme', themePref);

  //----------------------------------------------------
  //Enable tooltips
  $('[data-bs-toggle="tooltip"]').each((_i, el) => {
    new bootstrap.Tooltip(el);
  });

  //----------------------------------------------------
  //Loop through all the controls and run an event any time one changes
  $controlsContainer.find('.form-control-wrapper, .card-header').each((_i, ctrl) => {
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
      initEnableInputs($enableInput);
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

  //----------------------------------------------------
  //Mobile screen toggle button
  $('#btn-toggle-controls').on('click', () => {
    $('body').toggleClass(controlsMenuOpenClass);
  });

  //----------------------------------------------------
  //Initialize max values & update them on window resize
  $(window)
    .on('resize orientationchange', () => {
      updateLightingMaxValues();
    })
    .trigger('resize');

  //----------------------------------------------------
  //Build the presets menu
  buildPresetsMenu();

  //----------------------------------------------------
  //Make the "randomize" button work
  $('#btn-randomize').on('click', () => {
    $controls
      .filter(':not(#ctrl-enable-custom-size,#ctrl-custom-width,#ctrl-custom-height)')
      .each((_i, el) => {
        if (el.type === 'range' || el.type === 'number') {
          randomizeRangeOrNumberInput(el as HTMLInputElement);
        } else if (el.type === 'color') {
          randomizeColorValue(el as HTMLInputElement);
        } else if (el.type === 'checkbox') {
          (el as HTMLInputElement).checked = Math.random() < 0.5;
        } else if (el.type.startsWith('select')) {
          randomizeSelectOption(el as HTMLSelectElement);
        }
      })
      .trigger(inputEventName);
  });

  //----------------------------------------------------
  //When the modal shows, fill in the textareas with code
  $('#modal-code').on('show.bs.modal', writeCodeToFields);

  //----------------------------------------------------
  //Modal "copy" code buttons
  $('.btn-copy').on('click', (event) => {
    const tgtSelector = $(event.target).data('target');
    if (tgtSelector) {
      const $tgtEl = $(tgtSelector);
      navigator.clipboard.writeText($tgtEl.get(0).value).then(
        () => {
          const labelTxt = $tgtEl.siblings('label').text();
          showToast('success', labelTxt + ' Code Copied!');
        },
        () => {
          showToast('danger', 'could not copy text, please select and copy it manually!');
        }
      );
    }
  });

  $('#btn-copy-sharable-link').on('click', () => {
    const link = getShareableLink();
    window.history.replaceState(null, document.title, link);
    navigator.clipboard.writeText(link).then(
      () => {
        showToast('success', 'Link Copied!');
      },
      () => {
        showToast(
          'danger',
          'could not copy link! It has been set as the current URL, please select that and copy it manually'
        );
      }
    );
  });

  //----------------------------------------------------
  //If the URL contains settings to apply, apply them

  $(window).on('popstate', (event) => {
    applySettingsFromUrl();
  });
  applySettingsFromUrl();
});

function updateTexture(
  $inputEl: JQuery<HTMLInputElement>,
  $outputDisplay: JQuery<HTMLOutputElement>
): void {
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
      updateFilterStyles($tgt, tgtFilterProp, val, isDisabled);
    }

    if ($inputEl.data('force-reload-svg')) {
      forceReloadSvg();
    }

    updateHistory();
  }
}
