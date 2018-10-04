import * as $ from 'jquery';

let counter = 0;

export const makeElementDraggable = function(element: HTMLElement, dragElement?: HTMLElement) {
    const unique = counter++;

    $(dragElement || element).mousedown(function() {
        $(window).on('mousemove.dev-drag_' + unique, event => {
            $(element).css({left: event.clientX, top: event.clientY});
        });

        $(window).one('mouseup', () => $(window).off('mousemove.dev-drag_' + unique));
    });
}