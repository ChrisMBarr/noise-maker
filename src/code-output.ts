import { getPropsAsCssString, getShareableLink } from './helpers';
import { textureStyles, svgNs } from './main';

export function writeCodeToFields() {
  const $svgFilter = $('#demo-output svg filter');

  const backgroundStylesStr = textureStyles['background']
    ? `background: ${textureStyles['background']};`
    : '';

  const textureStylesStr = Object.keys(textureStyles)
    .filter((k) => {
      //skip the background, we don't want ot add it to the texture pseudo-element
      //also skip the width and height - they are for app preview purposes only!
      //skip the mix-blend-mode if it's set to 'normal'
      const isSkippedKey =
        k === 'background' ||
        k === 'width' ||
        k === 'height' ||
        (k === 'mix-blend-mode' && textureStyles[k] === 'normal');

      return !isSkippedKey && textureStyles[k] !== null;
    })
    .map((k) => {
      const val = textureStyles[k];
      if (k === 'filter') {
        const skipDefaultFilters: IIndexableObject = {};
        Object.keys(val).forEach((k) => {
          if (
            (k === 'saturate' && val[k] !== '1') ||
            (k === 'brightness' && val[k] !== '1') ||
            (k === 'blur' && val[k] !== '0px')
          ) {
            skipDefaultFilters[k] = val[k];
          }
        });
        const filterValues = getPropsAsCssString(skipDefaultFilters);
        return `  filter: url(#${$svgFilter.attr('id')})${filterValues ? ' ' + filterValues : ''};`;
      }
      return `  ${k}: ${val};`;
    })
    .join('\n');

  $('#code-html').val(
    `<svg xmlns="${svgNs}" class="hidden-svg">${prettyIndentHtml(
      '\n' + $svgFilter.get(0)?.outerHTML
    )}</svg>
<!-- Generated from ${getShareableLink()} -->`
  );

  $('#code-css').val(`.bg-texture {
  position: relative;
  ${backgroundStylesStr}
}
.bg-texture::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  z-index: -1;
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

function prettyIndentHtml(htmlStr: string) {
  const tagLevels: { [key: string]: number } = {
    filter: 2,
    feTurbulence: 4,
    feSpecularLighting: 4,
    feDiffuseLighting: 4,
    feDistantLight: 6,
    fePointLight: 6,
    feSpotLight: 6,
  };

  Object.keys(tagLevels).forEach((k) => {
    const pattern = new RegExp(`\n\\s*(<\\/?${k})`, 'ig');
    htmlStr = htmlStr.replace(pattern, `\n${' '.repeat(tagLevels[k])}$1`);
  });

  return `${htmlStr}\n`;
}
