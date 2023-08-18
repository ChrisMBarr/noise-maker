function initEnableInputs($enableInput: JQuery<HTMLInputElement>) {
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
        clearHandles();
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
    const targetSelector = $toggleVisibilityInput.data('toggle-visibility') as string;
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
        updateTexture($('#ctrl-base-frequency-x'), $outputDisplay);
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - we have to do this because we know the element type here and TS doesn't let us tell jQuery's types what that is
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
          createHandles(handleMappings);
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
