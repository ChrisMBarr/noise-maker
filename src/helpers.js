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

function clearLightingEffects() {
  $('#noise-filter').find('feDiffuseLighting, feSpecularLighting').remove();
}

function createLightingElement() {
  const $svgFilter = $('#noise-filter');
  const result = $svgFilter.find('feTurbulence').attr('result');
  const lightingPrimitiveType = $('#ctrl-lighting-primitive-type').val();
  const lightType = $('#ctrl-light-type').val();

  const lightingPrimitiveEl = document.createElementNS(svgNs, lightingPrimitiveType);
  lightingPrimitiveEl.setAttributeNS(svgNs, 'in', result);

  let lightEl = document.createElementNS(svgNs, lightType);
  lightingPrimitiveEl.appendChild(lightEl);

  $svgFilter.append(lightingPrimitiveEl);
}
