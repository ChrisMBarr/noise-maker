let forceReloadDebounce = null;
function forceReloadSvg() {
  clearTimeout(forceReloadDebounce);
  forceReloadDebounce = setTimeout(() => {
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
  }, 50);
}

let lightingMaxDebounce = null;
function updateLightingMaxValues() {
  clearTimeout(lightingMaxDebounce);
  lightingMaxDebounce = setTimeout(() => {
    const $svg = $('#demo-output svg');
    let maxX = $svg.width();
    let maxY = $svg.height();

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
  const lightType = $('#ctrl-light-type').val();
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
