import { $demoOutput, canvasSize, inputEventName, svgNs } from './main';

let lightingMaxDebounce: number | undefined;
export function updateLightingMaxValues(): void {
  clearTimeout(lightingMaxDebounce);
  lightingMaxDebounce = setTimeout(() => {
    const $svg = $demoOutput.children('svg');
    const maxX = $svg.width()!;
    const maxY = $svg.height()!;

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

export function clearLightingEffects(): void {
  $('#noise-filter').find('feDiffuseLighting, feSpecularLighting').remove();
}

export function createLightingElement(): void {
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

export function replaceLightElement() {
  const $svgFilter = $('#noise-filter');
  $svgFilter.find('feDistantLight, fePointLight, feSpotLight').remove();
  $svgFilter
    .find('feDiffuseLighting, feSpecularLighting')
    .append('\n')
    .append(getLightElement())
    .append('\n');
}

function getLightElement(): SVGElement {
  const selectedVal = $('#ctrl-light-type').val();
  const lightType = $(`#ctrl-light-type option[value="${selectedVal}"]`).data(
    'light-type'
  ) as string;
  return document.createElementNS(svgNs, lightType);
}
