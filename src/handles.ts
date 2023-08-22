import { scrollElementIntoView } from './helpers';
import { $demoOutput, controlsMenuOpenClass, canvasSize, inputEventName, appState } from './main';

let $handles: JQuery<HTMLElement>;

export function createHandles(handleMappings: ILightHandleMapping[]): void {
  clearHandles();

  if (handleMappings.length > 0) {
    handleMappings.forEach((data) => {
      $(
        '<div class="handle bg-light rounded-circle border border-secondary" tabindex="0"><i class="bi bi-arrows-move text-dark pe-none"></i></div>'
      )
        .data('mapping', data)
        .insertBefore($demoOutput.children('svg'));
    });

    $handles = $demoOutput.children('.handle');

    let mapping: ILightHandleMapping | undefined;
    let $dragHandle: JQuery<HTMLElement> | undefined;
    $demoOutput
      .on('mousedown touchstart', (ev) => {
        $('body').removeClass(controlsMenuOpenClass); //close the sidebar
        if (ev.target.classList.contains('handle')) {
          appState.isDraggingHandle = true;
          $dragHandle = $(ev.target);
          mapping = $dragHandle.data('mapping');
        }
      })
      .on('mousemove touchmove', (ev) => {
        if (appState.isDraggingHandle) {
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
        appState.isDraggingHandle = false;
        mapping = undefined;
        $dragHandle = undefined;
      });
  }
}

export function clearHandles(): void {
  appState.isDraggingHandle = false;
  $demoOutput.children('.handle').remove();
  $handles = $demoOutput.children('.handle'); //should select nothing, which is what we want here

  //Remove event listeners
  $demoOutput.off('mousedown touchstart mousemove touchmove mouseup touchend');
}

export function updateHandlePosition(index: number, positionProperty: string, value: number): void {
  $handles.eq(index).css(positionProperty, value + 'px');
}
