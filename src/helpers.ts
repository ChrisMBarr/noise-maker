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
    const $clone = $svg.clone();
    $svg.replaceWith($clone);

    //force it into a new GPU rendering layer
    $clone.css('transform', 'translateZ(0)');
  }, 5);
}

function updateFilterStyles(
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
    const tokenValue = match[1];
    const $tokenizedEl = $(tokenValue);

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

let $preloadImg: JQuery<HTMLElement> = $();
function preloadImage($tgtEl: JQuery<HTMLElement>, tgtStyleProp: string, propertyValue: string) {
  $preloadImg.remove(); //cancel any previous loaders

  //extract the image URL
  const imgUrlMatch = propertyValue.match(/url\('(.+?)'\)/);
  const imgUrl = imgUrlMatch?.[1];

  if (imgUrl) {
    $('#img-loader').removeClass('d-none');

    //create an image in memory
    $preloadImg = $('<img/>')
      .attr('src', imgUrl)
      .on('load', () => {
        $preloadImg.remove();
        $('#img-loader').addClass('d-none');
        $tgtEl.css(tgtStyleProp, propertyValue);
      })
      .on('error', () => {
        const imgNumMatch = imgUrl.match(/id\/(\d+)\//i);
        const imgNum = imgNumMatch?.[1];
        const msg = imgNum
          ? `Error loading background image #${imgNum}!`
          : 'Error loading this background image!';
        showToast('danger', msg);
        $('#img-loader').addClass('d-none');
      });
  } else {
    //con't find url, so just set it and skip preloading!
    $tgtEl.css(tgtStyleProp, propertyValue);
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

//----------------------------------------------------
//Toast
function showToast(state: string, message: string) {
  const $toastTemplate = $('#toast-template');
  const $newToast = $toastTemplate.clone();
  $newToast
    .removeAttr('id')
    .addClass(`text-bg-${state}`)
    .appendTo($toastTemplate.parent())
    .find('.toast-body')
    .text(message);

  const newToastEl = $newToast.get(0)!;

  bootstrap.Toast.getOrCreateInstance(newToastEl).show();

  newToastEl.addEventListener('hidden.bs.toast', () => {
    newToastEl.remove();
  });
}

//----------------------------------------------------
//Sharable links
function serializeControls(includeSize = false): IPresetSetting[] {
  //used to log out the current values to the console to manually save as presets
  let excludeFilter = ':not(:disabled)';
  if (!includeSize) {
    excludeFilter += ':not(#ctrl-enable-custom-size)';
  }

  return $controls
    .filter(excludeFilter)
    .toArray()
    .map((el) => {
      let value: IPresetValue = el.value;
      const numVal = (el as HTMLInputElement).valueAsNumber;
      if (el.type === 'checkbox') {
        value = (el as HTMLInputElement).checked;
      } else if (typeof numVal !== 'undefined' && !isNaN(numVal)) {
        value = numVal;
      }
      return { id: el.id.replace(ctrlIdPrefix, ''), value };
    });
}

function getShareableLink(): string {
  const values = serializeControls(true);
  const qs = Object.values(values)
    .map((o) => `${o.id}=${encodeURIComponent(o.value)}`)
    .join('&');

  return `${location.origin + location.pathname}?${qs}`;
}

let forceHistoryDebounce: number | undefined;
function updateHistory() {
  clearTimeout(forceHistoryDebounce);
  forceHistoryDebounce = setTimeout(() => {
    const newUrl = getShareableLink();
    if (location.href !== newUrl) {
      window.history.pushState(null, document.title, newUrl);
    }
  }, 500);
}

function applySettingsFromUrl(): void {
  const settings = new URLSearchParams(location.search);
  if (settings) {
    settings.forEach((value, key) => {
      if (/^(true|false)$/.test(value)) {
        $('#' + ctrlIdPrefix + key)
          .prop('checked', /^true$/i.test(value))
          .trigger(inputEventName);
      } else {
        $('#' + ctrlIdPrefix + key)
          .val(value)
          .trigger(inputEventName);
      }
    });
  }
}
