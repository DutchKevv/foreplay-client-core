import './editor.popup.scss';
import HTML from './editor.popup.html';
import { Container } from '../../core/classes/engine.container';
import { Engine } from '../../core/engine';
import * as $ from 'jquery';

export class EditorPopup extends Container {

    public element: HTMLElement;
    public element$: JQuery;

    constructor(options?: any, engine?: Engine) {
        super(options, engine);

        this.setContent(HTML, false);
    }

    onBeforeOpen() { }
    onAfterOpen() { }
    onClose() { }
    onClickFooterButton(event: MouseEvent, value?: string) { }

    open() {
        this.onBeforeOpen();
        this._addToDom();

        // jquery modal
        if (this.element.classList.contains('modal')) {
            $(this.element)['modal']();
        }

        this.onAfterOpen();
    }

    /**
     * 
     * @param {String | HTMLElement} HTML 
     */
    setContent(content: string | HTMLElement | Function, wrapper: boolean = true) {
        if (typeof content === 'string') {
            if (wrapper)
                this.element.innerHTML = content;
            else
                this.element = $(content)[0];
        }
        else if (content instanceof HTMLElement) {
            if (wrapper)
                this.element.appendChild(content);
            else
                this.element = content;
        }
        else if (typeof content === 'function') {
            if (wrapper)
                this.element.innerHTML = content();
            else
                this.element = $(content())[0];
        }
        else
            throw new Error('unkown content type [string|function|HTMLElement]');

        this.element$ = $(this.element);

        this.element$.find('.modal-footer button').click((event: JQuery.Event) => {
            this.onClickFooterButton(<MouseEvent>event.originalEvent, (<HTMLElement>event.target).getAttribute('data-value'));

            if ((<HTMLElement>event.target).hasAttribute('data-autodestroy'))
                this.destroy();
        });
    }

    close() {
        this.onClose();
        this._removeFromDom();
    }

    destroy(data?) {
        this.close();
        super.destroy(data);
        this.element$.empty();
        this.element = this.element$ = null;
    }

    _addToDom() {
        document.body.appendChild(this.element);
    }

    _removeFromDom() {
        // jquery modal
        if (this.element.classList.contains('modal')) {
            $(this.element)['modal']('hide');
        }

        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}