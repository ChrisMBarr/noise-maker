let $handles;

let forceReloadDebounce = null;
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

let lightingMaxDebounce = null;
function updateLightingMaxValues() {
  clearTimeout(lightingMaxDebounce);
  lightingMaxDebounce = setTimeout(() => {
    const $svg = $demoOutput.children('svg');
    let maxX = $svg.width();
    let maxY = $svg.height();

    canvasSize.height = maxY;
    canvasSize.width = maxX;
    canvasSize.left = $svg.offset().left;

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

function clearLightingEffects() {
  $('#noise-filter').find('feDiffuseLighting, feSpecularLighting').remove();
}

function createLightingElement() {
  const $svgFilter = $('#noise-filter');
  const result = $svgFilter.find('feTurbulence').attr('result');
  const lightingPrimitiveType = $('#ctrl-lighting-primitive-type').val();

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

function createLightHandles(handleMappings) {
  clearLightingHandles();

  if (handleMappings.length > 0) {
    handleMappings.forEach((data) => {
      $('<div class="handle bg-light rounded-circle border border-secondary" tabindex="0"></div>')
        .data('mapping', data)
        .insertBefore($demoOutput.children('svg'));
    });

    $handles = $demoOutput.children('.handle');

    let mapping;
    let $dragHandle;
    $demoOutput
      .on('mousedown', (ev) => {
        if (ev.target.classList.contains('handle')) {
          isDraggingHandle = true;
          $dragHandle = $(ev.target);
          mapping = $dragHandle.data('mapping');
        }
      })
      .on('mousemove', (ev) => {
        if (isDraggingHandle) {
          const x = Math.min(
            Math.max(ev.originalEvent.clientX - canvasSize.left, 0),
            canvasSize.width
          );
          const y = Math.min(Math.max(ev.originalEvent.clientY, 0), canvasSize.height);

          $('#' + mapping.left)
            .val(x)
            .trigger(inputEventName);
          $('#' + mapping.top)
            .val(y)
            .trigger(inputEventName);

          $dragHandle.css({ left: x, top: y });
        }
      })
      .on('mouseup', () => {
        isDraggingHandle = false;
        mapping = undefined;
        $dragHandle = undefined;
      });
  }
}

function updateHandlePosition(index, positionProperty, value) {
  // console.log($handles.eq(index), positionProperty, value);
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
