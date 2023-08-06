"use strict";
let $handles;
let forceReloadDebounce;
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
let lightingMaxDebounce;
function updateLightingMaxValues() {
    clearTimeout(lightingMaxDebounce);
    lightingMaxDebounce = setTimeout(() => {
        const $svg = $demoOutput.children('svg');
        let maxX = $svg.width();
        let maxY = $svg.height();
        canvasSize.height = maxY;
        canvasSize.width = maxX;
        canvasSize.left = $svg.offset().left;
        $('#ctrl-lighting-point-x, #ctrl-lighting-spot-overhead-x, #ctrl-lighting-spot-manual-x, #ctrl-lighting-spot-manual-pointsat-x')
            .attr('max', maxX)
            .trigger(inputEventName);
        $('#ctrl-lighting-point-y, #ctrl-lighting-spot-overhead-y, #ctrl-lighting-spot-manual-y, #ctrl-lighting-spot-manual-pointsat-y')
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
    const lightingPrimitiveType = $('#ctrl-lighting-primitive-type').val().toString();
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
                const x = Math.min(Math.max(ev.originalEvent.clientX - canvasSize.left, 0), canvasSize.width);
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
        if ($clicked.parents('.dropdown, .dropup').length === 0 ||
            $clicked.parents('.dropdown-menu').length === 1) {
            // close the dropdown
            $('.dropdown .show, .dropup .show').removeClass('show');
        }
    });
});
const svgNs = 'http://www.w3.org/2000/svg';
let customSizeEnabled = false;
let lightingEffectsEnabled = false;
let isDraggingHandle = false;
let $demoOutput;
let canvasSize = {
    left: 0,
    width: 0,
    height: 0,
};
const inputEventName = 'input';
const textureStyles = {
    filter: {},
};
$(() => {
    $demoOutput = $('#demo-output');
    //Special controls we will need to treat differently
    const $baseFrequencyX = $('#ctrl-base-frequency-x');
    const $baseFrequencyY = $('#ctrl-base-frequency-y');
    //Loop through all the controls and run an event any time one changes
    $('#svg-controls')
        .find('.form-control-wrapper, .card-header')
        .each((_i, ctrl) => {
        const $input = $(ctrl).find('select, input:not([data-enable]):not([data-toggle-visibility])');
        const $enableInput = $(ctrl).find('input[data-enable]');
        const $toggleVisibilityInput = $(ctrl).find('input[data-toggle-visibility], select[data-toggle-visibility]');
        const $outputDisplay = $(ctrl).find('output');
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
    function initEnableInputs($enableInput, $outputDisplay) {
        const $enableTargets = $($enableInput.data('enable'));
        $enableInput.on(inputEventName, () => {
            const isChecked = $enableInput.is(':checked');
            if (isChecked) {
                $enableTargets.removeAttr('disabled');
            }
            else {
                $enableTargets.attr('disabled', 'disabled');
            }
            if ($enableInput.attr('id') === 'ctrl-enable-lighting') {
                lightingEffectsEnabled = isChecked;
                if (isChecked) {
                    createLightingElement();
                }
                else {
                    clearLightingEffects();
                    clearLightingHandles();
                }
            }
            else if ($enableInput.attr('id') === 'ctrl-enable-custom-size') {
                customSizeEnabled = isChecked;
                updateLightingMaxValues();
                if (!isChecked) {
                    $demoOutput.children('svg').css({ height: '100%', width: '100%' });
                }
            }
            $enableTargets.each((_i, t) => updateTexture($(t), $outputDisplay));
            $enableTargets.trigger(inputEventName);
        });
        //Initialize
        $enableInput.trigger(inputEventName);
    }
    function initToggleVisibilityInputs($toggleVisibilityInput, $outputDisplay) {
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
        }
        else if ($toggleVisibilityInput.is('select')) {
            const $allToggles = $toggleVisibilityInput.find('option[data-toggle-visibility-and-enable]');
            const allTargetsSelectorStr = $allToggles
                .toArray()
                .map((x) => {
                return $(x).data('toggle-visibility-and-enable');
            })
                .join(',');
            const $allTargets = $(allTargetsSelectorStr);
            $toggleVisibilityInput.on(inputEventName, (ev) => {
                const el = ev.target;
                // @ts-ignore
                const $currentTarget = $toggleVisibilityInput.children().eq(el.selectedIndex);
                const $toggleTargets = $($currentTarget.data('toggle-visibility-and-enable'));
                const id = $toggleVisibilityInput.attr('id');
                if (lightingEffectsEnabled) {
                    if (id === 'ctrl-lighting-primitive-type') {
                        clearLightingEffects();
                        createLightingElement();
                        $('#lighting-controls .shared-lighting-controls')
                            .find('input, select:not(#' + id + ')')
                            .trigger(inputEventName);
                    }
                    else if (id === 'ctrl-light-type') {
                        replaceLightElement();
                        const handleMappings = $currentTarget.data('handles');
                        createLightHandles(handleMappings);
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
    function initFormInputs($input, $outputDisplay) {
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
            }
            else if (!isDisabled && tgtAttr) {
                if (id === $baseFrequencyX.attr('id') || id === $baseFrequencyY.attr('id')) {
                    let combinedBaseFreq = $baseFrequencyX.val();
                    if (!$baseFrequencyY.is(':disabled')) {
                        combinedBaseFreq += ` ${$baseFrequencyY.val()}`;
                    }
                    // @ts-ignore
                    $tgt.attr(tgtAttr, combinedBaseFreq);
                }
                else {
                    if (tgtAttr.includes(' ')) {
                        //multiple attributes to set with the same value
                        const attrObj = tgtAttr
                            .split(' ')
                            .reduce((acc, curr) => ((acc[curr] = val), acc), {});
                        $tgt.attr(attrObj);
                    }
                    else {
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
                }
            }
            else if (tgtFilterProp) {
                updateTextureFilter($tgt, tgtFilterProp, val, isDisabled);
            }
            if ($inputEl.data('force-reload-svg')) {
                forceReloadSvg();
            }
        }
    }
});
$(() => {
    const $modal = $('#code-modal');
    const $modalDialog = $modal.find('dialog');
    const $ctrlCodeHtml = $('#code-html');
    const $ctrlCodeCss = $('#code-css');
    $('#btn-get-code').on('click', openDialog);
    //All the 'copy' buttons
    $('.btn-copy').on('click', (event) => {
        const tgtSelector = $(event.target).data('target');
        if (tgtSelector) {
            navigator.clipboard.writeText($(tgtSelector).get(0).value).then(() => { }, () => {
                alert('could not copy text, please select and copy it manually!');
            });
        }
    });
    $modalDialog.on('click', function (ev) {
        closeDialog(ev, this);
    });
    $modalDialog.find('.btn-close').on('click', function (ev) {
        closeDialog(ev, this);
    });
    function openDialog() {
        writeCodeToFields();
        $modal.show();
        $modalDialog.get(0)?.showModal();
    }
    function closeDialog(ev, self) {
        if (ev.target == self) {
            $modalDialog.get(0)?.close();
            $modal.hide();
        }
    }
    function writeCodeToFields() {
        const $svgFilter = $('#demo-output svg filter');
        const textureStylesStr = Object.keys(textureStyles)
            //skip the mix-blend-mode if it's set to 'normal'
            .filter((k) => k !== 'mix-blend-mode' || (k === 'mix-blend-mode' && textureStyles[k] !== 'normal'))
            .map((k) => {
            const val = textureStyles[k];
            if (k === 'filter') {
                const filterValues = getPropsAsCssString(val);
                return `  filter: url(#${$svgFilter.attr('id')}) ${filterValues};`;
            }
            return `  ${k}: ${val};`;
        })
            .join('\n');
        $ctrlCodeHtml.val(`<svg xmlns="${svgNs}" class="hidden-svg">${prettyIndentHtml('\n' + $svgFilter.get(0)?.outerHTML)}</svg>`);
        $ctrlCodeCss.val(`.bg-texture {
  position: relative;
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
    function prettyIndentHtml(htmlStr) {
        const tagLevels = {
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
});
let $controls;
const ctrlIdPrefix = 'ctrl-';
function serializeControls() {
    //used to log out the current values to the console to manually save as presets
    return $controls
        .filter(':not(:disabled):not(#ctrl-enable-custom-size)')
        .toArray()
        .map((el) => {
        let value = el.value;
        const numVal = el.valueAsNumber;
        if (el.type === 'checkbox') {
            value = el.checked;
        }
        else if (typeof numVal !== 'undefined' && !isNaN(numVal)) {
            value = numVal;
        }
        return { id: el.id.replace(ctrlIdPrefix, ''), value };
    });
}
function applyPreset(num) {
    //dividers can't be selected so we can force the type here
    const selectedPreset = presets[num];
    const arr = selectedPreset.settings;
    arr.forEach((obj) => {
        if (typeof obj.value === 'boolean') {
            $('#' + ctrlIdPrefix + obj.id)
                .prop('checked', obj.value)
                .trigger(inputEventName);
        }
        else {
            $('#' + ctrlIdPrefix + obj.id)
                .val(obj.value)
                .trigger(inputEventName);
        }
    });
}
function randomizeSelectOption(ddl) {
    const items = ddl.getElementsByTagName('option');
    const index = Math.floor(Math.random() * items.length);
    ddl.selectedIndex = index;
}
function randomizeRangeOrNumberInput(rangeInput) {
    //default values defined here: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range#validation
    let min = parseFloat(rangeInput.min);
    if (isNaN(min))
        min = 0;
    let max = parseFloat(rangeInput.max);
    if (isNaN(max))
        max = 100;
    let step = parseFloat(rangeInput.step);
    if (isNaN(step))
        step = 1;
    const stepIsWholeNumber = !step.toString().includes('.');
    const randomVal = Math.random() * (max - min) + min;
    rangeInput.value = (stepIsWholeNumber ? Math.round(randomVal) : randomVal).toString();
}
function randomizeColorValue(colorInput) {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    colorInput.value = color;
}
$(() => {
    $controls = $('#svg-controls').find('input:not([type="hidden"]), select');
    const $presetDdl = $('#ddl-preset');
    const presetOptions = presets
        .map((p, i) => {
        const itemContent = Object.hasOwn(p, 'divider')
            ? `<hr class="dropdown-divider">`
            : `<a class="dropdown-item" href="#" onclick="applyPreset(${i});">${p.name}</a>`;
        return `<li>${itemContent}</li>`;
    })
        .join('');
    $(presetOptions).appendTo($presetDdl);
    $('#btn-randomize').on('click', () => {
        $controls
            .filter(':not(#ctrl-enable-custom-size,#ctrl-custom-width,#ctrl-custom-height)')
            .each((_i, el) => {
            if (el.type === 'range' || el.type === 'number') {
                randomizeRangeOrNumberInput(el);
            }
            else if (el.type === 'color') {
                randomizeColorValue(el);
            }
            else if (el.type === 'checkbox') {
                el.checked = Math.random() < 0.5;
            }
            else if (el.type.startsWith('select')) {
                randomizeSelectOption(el);
            }
        })
            .trigger(inputEventName);
    });
});
const presets = [
    {
        name: 'Default',
        settings: [
            { id: 'base-frequency-x', value: 0.03 },
            { id: 'base-frequency-y', value: 0.03 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 3 },
            { id: 'noise-type', value: 'turbulence' },
            { id: 'seed', value: 0 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#ffffff' },
            { id: 'lighting-primitive-type', value: 'feDiffuseLighting' },
            { id: 'lighting-surface-scale', value: 3 },
            { id: 'lighting-diffuse-constant', value: 1 },
            { id: 'lighting-specular-exponent', value: 1 },
            { id: 'lighting-specular-constant', value: 1 },
            { id: 'light-type', value: 'distant' },
            { id: 'lighting-distant-azimuth', value: 90 },
            { id: 'lighting-distant-elevation', value: 55 },
            { id: 'lighting-point-x', value: 100 },
            { id: 'lighting-point-y', value: 100 },
            { id: 'lighting-point-z', value: 50 },
            { id: 'lighting-spot-overhead-cone-angle', value: 75 },
            { id: 'lighting-spot-overhead-x', value: 180 },
            { id: 'lighting-spot-overhead-y', value: 180 },
            { id: 'lighting-spot-overhead-z', value: 100 },
            { id: 'lighting-spot-manual-cone-angle', value: 45 },
            { id: 'lighting-spot-manual-x', value: 100 },
            { id: 'lighting-spot-manual-y', value: 100 },
            { id: 'lighting-spot-manual-z', value: 50 },
            { id: 'lighting-spot-manual-pointsat-x', value: 150 },
            { id: 'lighting-spot-manual-pointsat-y', value: 150 },
            { id: 'lighting-spot-manual-pointsat-z', value: 50 },
            { id: 'bg-color', value: '#e9e4ef' },
            { id: 'blend-mode', value: 'normal' },
            { id: 'enable-saturation', value: false },
            { id: 'num-saturation', value: 1 },
            { id: 'enable-brightness', value: false },
            { id: 'num-brightness', value: 1 },
            { id: 'enable-blur', value: false },
            { id: 'num-blur', value: 1 },
            { id: 'enable-custom-size', value: false },
            { id: 'custom-width', value: 500 },
            { id: 'custom-height', value: 500 },
        ],
    },
    { divider: true },
    {
        name: 'Bokeh',
        settings: [
            { id: 'base-frequency-x', value: 0.004 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 1 },
            { id: 'noise-type', value: 'turbulence' },
            { id: 'seed', value: 5 },
            { id: 'enable-lighting', value: false },
            { id: 'lighting-diffuse-constant', value: 1 },
            { id: 'lighting-distant-azimuth', value: 45 },
            { id: 'lighting-distant-elevation', value: 60 },
            { id: 'bg-color', value: '#ffd9ec' },
            { id: 'blend-mode', value: 'exclusion' },
            { id: 'enable-saturation', value: true },
            { id: 'num-saturation', value: 5.1 },
            { id: 'enable-brightness', value: true },
            { id: 'num-brightness', value: 4.1 },
            { id: 'enable-blur', value: true },
            { id: 'num-blur', value: 10 },
        ],
    },
    {
        name: 'Cinder',
        settings: [
            { id: 'base-frequency-x', value: 0.048 },
            { id: 'base-frequency-y', value: 0.059 },
            { id: 'separate-frequencies', value: true },
            { id: 'num-octaves', value: 3 },
            { id: 'noise-type', value: 'fractalNoise' },
            { id: 'seed', value: 5 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#ff0000' },
            { id: 'lighting-primitive-type', value: 'feSpecularLighting' },
            { id: 'lighting-surface-scale', value: 9 },
            { id: 'lighting-specular-exponent', value: 19.2 },
            { id: 'lighting-specular-constant', value: 2.8 },
            { id: 'light-type', value: 'distant' },
            { id: 'lighting-distant-azimuth', value: 45 },
            { id: 'lighting-distant-elevation', value: 60 },
            { id: 'bg-color', value: '#413a23' },
            { id: 'blend-mode', value: 'lighten' },
            { id: 'enable-saturation', value: false },
            { id: 'enable-brightness', value: false },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Color Static',
        settings: [
            { id: 'base-frequency-x', value: 0.367 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 2 },
            { id: 'noise-type', value: 'turbulence' },
            { id: 'seed', value: 1 },
            { id: 'enable-lighting', value: false },
            { id: 'lighting-diffuse-constant', value: 1 },
            { id: 'lighting-distant-azimuth', value: 45 },
            { id: 'lighting-distant-elevation', value: 60 },
            { id: 'bg-color', value: '#000020' },
            { id: 'blend-mode', value: 'lighten' },
            { id: 'enable-saturation', value: true },
            { id: 'num-saturation', value: 8.6 },
            { id: 'enable-brightness', value: true },
            { id: 'num-brightness', value: 7.8 },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Fudge',
        settings: [
            { id: 'base-frequency-x', value: 0.043 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 4 },
            { id: 'noise-type', value: 'turbulence' },
            { id: 'seed', value: 0 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#e3d9ca' },
            { id: 'lighting-primitive-type', value: 'feSpecularLighting' },
            { id: 'lighting-surface-scale', value: 10 },
            { id: 'lighting-specular-exponent', value: 5.9 },
            { id: 'lighting-specular-constant', value: 0.9 },
            { id: 'light-type', value: 'fePointLight' },
            { id: 'lighting-point-x', value: 227 },
            { id: 'lighting-point-y', value: 163.2 },
            { id: 'lighting-point-z', value: 35.1 },
            { id: 'bg-color', value: '#453e32' },
            { id: 'blend-mode', value: 'normal' },
            { id: 'enable-saturation', value: false },
            { id: 'enable-brightness', value: false },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Jazz',
        settings: [
            { id: 'base-frequency-x', value: 0.01 },
            { id: 'base-frequency-y', value: 0.02 },
            { id: 'separate-frequencies', value: true },
            { id: 'num-octaves', value: 1 },
            { id: 'noise-type', value: 'turbulence' },
            { id: 'seed', value: 2 },
            { id: 'enable-lighting', value: false },
            { id: 'lighting-diffuse-constant', value: 1 },
            { id: 'lighting-distant-azimuth', value: 45 },
            { id: 'lighting-distant-elevation', value: 60 },
            { id: 'bg-color', value: '#f2f3f7' },
            { id: 'blend-mode', value: 'color-burn' },
            { id: 'enable-saturation', value: true },
            { id: 'num-saturation', value: 4.1 },
            { id: 'enable-brightness', value: true },
            { id: 'num-brightness', value: 2.7 },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Leather',
        settings: [
            { id: 'base-frequency-x', value: 0.231 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 2 },
            { id: 'noise-type', value: 'fractalNoise' },
            { id: 'seed', value: 0 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#ded6bc' },
            { id: 'lighting-primitive-type', value: 'feDiffuseLighting' },
            { id: 'lighting-surface-scale', value: 0.4 },
            { id: 'lighting-diffuse-constant', value: 0.7 },
            { id: 'light-type', value: 'distant' },
            { id: 'lighting-distant-azimuth', value: 90 },
            { id: 'lighting-distant-elevation', value: 62 },
            { id: 'bg-color', value: '#ffffff' },
            { id: 'blend-mode', value: 'normal' },
            { id: 'enable-saturation', value: false },
            { id: 'enable-brightness', value: false },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Marble/Clouds',
        settings: [
            { id: 'base-frequency-x', value: 0.006 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 3 },
            { id: 'noise-type', value: 'turbulence' },
            { id: 'seed', value: 46 },
            { id: 'enable-lighting', value: false },
            { id: 'lighting-diffuse-constant', value: 1 },
            { id: 'lighting-distant-azimuth', value: 35 },
            { id: 'lighting-distant-elevation', value: 8 },
            { id: 'bg-color', value: '#647a9b' },
            { id: 'blend-mode', value: 'normal' },
            { id: 'enable-saturation', value: true },
            { id: 'num-saturation', value: 0 },
            { id: 'enable-brightness', value: true },
            { id: 'num-brightness', value: 3.3 },
            { id: 'enable-blur', value: true },
            { id: 'num-blur', value: 5.8 },
        ],
    },
    {
        name: 'Microscopic',
        settings: [
            { id: 'base-frequency-x', value: 0.035 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 1 },
            { id: 'noise-type', value: 'turbulence' },
            { id: 'seed', value: 28 },
            { id: 'enable-lighting', value: false },
            { id: 'lighting-diffuse-constant', value: 1 },
            { id: 'lighting-distant-azimuth', value: 45 },
            { id: 'lighting-distant-elevation', value: 60 },
            { id: 'bg-color', value: '#dadedd' },
            { id: 'blend-mode', value: 'luminosity' },
            { id: 'enable-saturation', value: false },
            { id: 'enable-brightness', value: true },
            { id: 'num-brightness', value: 4.3 },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Paper',
        settings: [
            { id: 'base-frequency-x', value: 0.1 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 3 },
            { id: 'noise-type', value: 'fractalNoise' },
            { id: 'seed', value: 2 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#fbfce9' },
            { id: 'lighting-primitive-type', value: 'feDiffuseLighting' },
            { id: 'lighting-surface-scale', value: 0.3 },
            { id: 'lighting-diffuse-constant', value: 1.08 },
            { id: 'light-type', value: 'distant' },
            { id: 'lighting-distant-azimuth', value: 180 },
            { id: 'lighting-distant-elevation', value: 65 },
            { id: 'bg-color', value: '#ffffff' },
            { id: 'blend-mode', value: 'normal' },
            { id: 'enable-saturation', value: true },
            { id: 'num-saturation', value: 1 },
            { id: 'enable-brightness', value: false },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Radar',
        settings: [
            { id: 'base-frequency-x', value: 0.994 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 4 },
            { id: 'noise-type', value: 'fractalNoise' },
            { id: 'seed', value: 52 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#a1345d' },
            { id: 'lighting-primitive-type', value: 'feSpecularLighting' },
            { id: 'lighting-surface-scale', value: 6.6 },
            { id: 'lighting-specular-exponent', value: 34.6 },
            { id: 'lighting-specular-constant', value: 7.3 },
            { id: 'light-type', value: 'spot-overhead' },
            { id: 'lighting-spot-overhead-cone-angle', value: 60.2 },
            { id: 'lighting-spot-overhead-x', value: 355 },
            { id: 'lighting-spot-overhead-y', value: 356 },
            { id: 'lighting-spot-overhead-z', value: 122.5 },
            { id: 'bg-color', value: '#0c5a93' },
            { id: 'blend-mode', value: 'difference' },
            { id: 'enable-saturation', value: false },
            { id: 'enable-brightness', value: true },
            { id: 'num-brightness', value: 0.6 },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Reptile',
        settings: [
            { id: 'base-frequency-x', value: 0.001 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 6 },
            { id: 'noise-type', value: 'turbulence' },
            { id: 'seed', value: 0 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#637e30' },
            { id: 'lighting-primitive-type', value: 'feDiffuseLighting' },
            { id: 'lighting-surface-scale', value: 10 },
            { id: 'lighting-diffuse-constant', value: 1.97 },
            { id: 'light-type', value: 'fePointLight' },
            { id: 'lighting-point-x', value: 10 },
            { id: 'lighting-point-y', value: 10 },
            { id: 'lighting-point-z', value: 100 },
            { id: 'bg-color', value: '#ffffff' },
            { id: 'blend-mode', value: 'normal' },
            { id: 'enable-saturation', value: false },
            { id: 'enable-brightness', value: false },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Solarized Rose',
        settings: [
            { id: 'base-frequency-x', value: 0.032 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 3 },
            { id: 'noise-type', value: 'turbulence' },
            { id: 'seed', value: 0 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#d96666' },
            { id: 'lighting-primitive-type', value: 'feSpecularLighting' },
            { id: 'lighting-surface-scale', value: 10 },
            { id: 'lighting-specular-exponent', value: 8.4 },
            { id: 'lighting-specular-constant', value: 0.9 },
            { id: 'light-type', value: 'fePointLight' },
            { id: 'lighting-point-x', value: 260 },
            { id: 'lighting-point-y', value: 260 },
            { id: 'lighting-point-z', value: 100 },
            { id: 'bg-color', value: '#f5f5f5' },
            { id: 'blend-mode', value: 'normal' },
            { id: 'enable-saturation', value: false },
            { id: 'enable-brightness', value: false },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Sun Spots',
        settings: [
            { id: 'base-frequency-x', value: 0.079 },
            { id: 'base-frequency-y', value: 0.702 },
            { id: 'separate-frequencies', value: true },
            { id: 'num-octaves', value: 2 },
            { id: 'noise-type', value: 'fractalNoise' },
            { id: 'seed', value: 35 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#cdc51f' },
            { id: 'lighting-primitive-type', value: 'feSpecularLighting' },
            { id: 'lighting-surface-scale', value: 5.4 },
            { id: 'lighting-specular-exponent', value: 11.8 },
            { id: 'lighting-specular-constant', value: 2.2 },
            { id: 'light-type', value: 'distant' },
            { id: 'lighting-distant-azimuth', value: 157 },
            { id: 'lighting-distant-elevation', value: 67 },
            { id: 'bg-color', value: '#bf3304' },
            { id: 'blend-mode', value: 'screen' },
            { id: 'enable-saturation', value: false },
            { id: 'enable-brightness', value: false },
            { id: 'enable-blur', value: true },
            { id: 'num-blur', value: 5.3 },
        ],
    },
    {
        name: 'Threads',
        settings: [
            { id: 'base-frequency-x', value: 0.022 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 1 },
            { id: 'noise-type', value: 'turbulence' },
            { id: 'seed', value: 0 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#ffffff' },
            { id: 'lighting-primitive-type', value: 'feDiffuseLighting' },
            { id: 'lighting-surface-scale', value: 0.7 },
            { id: 'lighting-diffuse-constant', value: 1.09 },
            { id: 'light-type', value: 'distant' },
            { id: 'lighting-distant-azimuth', value: 45 },
            { id: 'lighting-distant-elevation', value: 60 },
            { id: 'bg-color', value: '#ffffff' },
            { id: 'blend-mode', value: 'normal' },
            { id: 'enable-saturation', value: false },
            { id: 'enable-brightness', value: false },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Water',
        settings: [
            { id: 'base-frequency-x', value: 0.001 },
            { id: 'base-frequency-y', value: 0.011 },
            { id: 'separate-frequencies', value: true },
            { id: 'num-octaves', value: 3 },
            { id: 'noise-type', value: 'fractalNoise' },
            { id: 'seed', value: 0 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#2492ff' },
            { id: 'lighting-primitive-type', value: 'feSpecularLighting' },
            { id: 'lighting-surface-scale', value: 9.1 },
            { id: 'lighting-specular-exponent', value: 5.6 },
            { id: 'lighting-specular-constant', value: 1.6 },
            { id: 'light-type', value: 'distant' },
            { id: 'lighting-distant-azimuth', value: 86 },
            { id: 'lighting-distant-elevation', value: 62 },
            { id: 'bg-color', value: '#0080c0' },
            { id: 'blend-mode', value: 'multiply' },
            { id: 'enable-saturation', value: false },
            { id: 'enable-brightness', value: false },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Waves',
        settings: [
            { id: 'base-frequency-x', value: 0.043 },
            { id: 'separate-frequencies', value: false },
            { id: 'num-octaves', value: 3 },
            { id: 'noise-type', value: 'fractalNoise' },
            { id: 'seed', value: 0 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#00274f' },
            { id: 'lighting-primitive-type', value: 'feSpecularLighting' },
            { id: 'lighting-surface-scale', value: 10 },
            { id: 'lighting-specular-exponent', value: 7.8 },
            { id: 'lighting-specular-constant', value: 1.9 },
            { id: 'light-type', value: 'distant' },
            { id: 'lighting-distant-azimuth', value: 45 },
            { id: 'lighting-distant-elevation', value: 60 },
            { id: 'bg-color', value: '#f5f5f5' },
            { id: 'blend-mode', value: 'normal' },
            { id: 'enable-saturation', value: false },
            { id: 'enable-brightness', value: false },
            { id: 'enable-blur', value: false },
        ],
    },
    {
        name: 'Wood Grain',
        settings: [
            { id: 'base-frequency-x', value: 0.1 },
            { id: 'base-frequency-y', value: 0.001 },
            { id: 'separate-frequencies', value: true },
            { id: 'num-octaves', value: 3 },
            { id: 'noise-type', value: 'turbulence' },
            { id: 'seed', value: 0 },
            { id: 'enable-lighting', value: true },
            { id: 'lighting-lighting-color', value: '#daa841' },
            { id: 'lighting-primitive-type', value: 'feSpecularLighting' },
            { id: 'lighting-surface-scale', value: 7.7 },
            { id: 'lighting-specular-exponent', value: 35.9 },
            { id: 'lighting-specular-constant', value: 1.3 },
            { id: 'light-type', value: 'distant' },
            { id: 'lighting-distant-azimuth', value: 45 },
            { id: 'lighting-distant-elevation', value: 60 },
            { id: 'bg-color', value: '#af994e' },
            { id: 'blend-mode', value: 'multiply' },
            { id: 'enable-saturation', value: true },
            { id: 'num-saturation', value: 1.6 },
            { id: 'enable-brightness', value: false },
            { id: 'enable-blur', value: false },
        ],
    },
];
