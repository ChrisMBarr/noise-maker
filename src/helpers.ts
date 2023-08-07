let $handles: JQuery<HTMLElement>;

let forceReloadDebounce: number | undefined;
function forceReloadSvg() {
  clearTimeout(forceReloadDebounce);
  forceReloadDebounce = setTimeout(() => {
    //Re-select every time since it's being replaced and we lose the reference
    const $svg = $demoOutput.children('svg');

    //remove any styles it has
    if ($svg.css('transform')) {
      $svg.css('transform', '');
    }

    //clone the element and replace it
    var $clone = $svg.clone();
    $svg.replaceWith($clone);

    //force it into a new GPU rendering layer
    $clone.css('transform', 'translateZ(0)');
  }, 50);
}

let lightingMaxDebounce: number | undefined;
function updateLightingMaxValues() {
  clearTimeout(lightingMaxDebounce);
  lightingMaxDebounce = setTimeout(() => {
    const $svg = $demoOutput.children('svg');
    let maxX = $svg.width()!;
    let maxY = $svg.height()!;

    canvasSize.height = maxY;
    canvasSize.width = maxX;
    canvasSize.left = $svg.offset()!.left;

    $(
      '#ctrl-lighting-point-x, #ctrl-lighting-spot-overhead-x, #ctrl-lighting-spot-manual-x, #ctrl-lighting-spot-manual-pointsat-x'
    )
      .attr('max', maxX)
      .trigger(inputEventName);
    $(
      '#ctrl-lighting-point-y, #ctrl-lighting-spot-overhead-y, #ctrl-lighting-spot-manual-y, #ctrl-lighting-spot-manual-pointsat-y'
    )
      .attr('max', maxY)
      .trigger(inputEventName);
  }, 50);
}

function updateTextureFilter(
  $tgt: JQuery<HTMLElement>,
  tgtFilterProp: string,
  val: string | number,
  isDisabled: boolean
) {
  textureStyles.filter[tgtFilterProp] = isDisabled ? null : val;
  $tgt.css('filter', getPropsAsCssString(textureStyles.filter));
}

function getPropsAsCssString(obj: IIndexableObject) {
  return Object.keys(obj)
    .map((key) => {
      const val = obj[key];
      return val == null ? '' : `${key}(${val})`;
    })
    .filter((v) => v !== '')
    .join(' ');
}

function getFormattedValue($el: JQuery<HTMLInputElement>) {
  let formatterStr = $el.data('target-value-formatter') as string;
  const selectorMatches = formatterStr.matchAll(/{{(.+?)}}/g);

  for (const match of selectorMatches) {
    const token = match[0];
    const cssSelector = match[1];
    const $tokenizedEl = $(cssSelector);
    let value = '';
    if ($tokenizedEl.is(':not(:disabled)')) {
      const suffix = $tokenizedEl.data('target-value-suffix');
      value = $tokenizedEl.val() as string;
      if (suffix) value += suffix;
    }
    formatterStr = formatterStr.replace(token, value);
  }

  return formatterStr;
}

function clearLightingEffects() {
  $('#noise-filter').find('feDiffuseLighting, feSpecularLighting').remove();
}

function createLightingElement() {
  const $svgFilter = $('#noise-filter');
  const result = $svgFilter.find('feTurbulence').attr('result')!;
  const lightingPrimitiveType = $('#ctrl-lighting-primitive-type').val()!.toString();
  const lightingPrimitiveEl = document.createElementNS(svgNs, lightingPrimitiveType);
  lightingPrimitiveEl.setAttributeNS(svgNs, 'in', result);
  lightingPrimitiveEl.appendChild(document.createTextNode('\n'));
  lightingPrimitiveEl.appendChild(getLightElement());
  lightingPrimitiveEl.appendChild(document.createTextNode('\n'));

  $svgFilter.append('\n').append(lightingPrimitiveEl).append('\n');
}

function getLightElement() {
  const selectedVal = $('#ctrl-light-type').val();
  const lightType = $(`#ctrl-light-type option[value="${selectedVal}"]`).data('light-type');
  return document.createElementNS(svgNs, lightType);
}

function replaceLightElement() {
  const $svgFilter = $('#noise-filter');
  $svgFilter.find('feDistantLight, fePointLight, feSpotLight').remove();
  $svgFilter
    .find('feDiffuseLighting, feSpecularLighting')
    .append('\n')
    .append(getLightElement())
    .append('\n');
}

function clearLightingHandles() {
  isDraggingHandle = false;
  $demoOutput.children('.handle').remove();
  $handles = $demoOutput.children('.handle'); //should select nothing, which is what we want here
}

function createLightHandles(handleMappings: ILightHandleMapping[]) {
  clearLightingHandles();

  if (handleMappings.length > 0) {
    handleMappings.forEach((data) => {
      $('<div class="handle bg-light rounded-circle border border-secondary" tabindex="0"></div>')
        .data('mapping', data)
        .insertBefore($demoOutput.children('svg'));
    });

    $handles = $demoOutput.children('.handle');

    let mapping: ILightHandleMapping | undefined;
    let $dragHandle: JQuery<HTMLElement> | undefined;
    $demoOutput
      .on('mousedown touchstart', (ev) => {
        if (ev.target.classList.contains('handle')) {
          isDraggingHandle = true;
          $dragHandle = $(ev.target);
          mapping = $dragHandle.data('mapping');
        }
      })
      .on('mousemove touchmove', (ev) => {
        if (isDraggingHandle) {
          const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX!;
          const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY!;

          const x = Math.min(Math.max(clientX - canvasSize.left, 0), canvasSize.width);
          const y = Math.min(Math.max(clientY, 0), canvasSize.height);

          const ctrlLeft = $('#' + mapping!.left)
            .val(x)
            .trigger(inputEventName)
            .get(0)!;

          const ctrlTop = $('#' + mapping!.top)
            .val(y)
            .trigger(inputEventName)
            .get(0)!;

          scrollElementIntoView(ctrlLeft);
          scrollElementIntoView(ctrlTop);

          $dragHandle!.css({ left: x, top: y });
        }
      })
      .on('mouseup touchend', () => {
        isDraggingHandle = false;
        mapping = undefined;
        $dragHandle = undefined;
      });
  }
}

function scrollElementIntoView(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  // Only completely visible elements return true
  const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

  if (!isVisible) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function updateHandlePosition(index: number, positionProperty: string, value: number) {
  $handles.eq(index).css(positionProperty, value + 'px');
}

$(() => {
  $('.dropdown-toggle').on('click', (ev) => {
    const $menu = $(ev.target).siblings('.dropdown-menu');
    $(ev.target).add($menu).toggleClass('show');
  });

  $(document).on('click', (ev) => {
    const $clicked = $(ev.target);
    if (
      $clicked.parents('.dropdown, .dropup').length === 0 ||
      $clicked.parents('.dropdown-menu').length === 1
    ) {
      // close the dropdown
      $('.dropdown .show, .dropup .show').removeClass('show');
    }
  });
});
