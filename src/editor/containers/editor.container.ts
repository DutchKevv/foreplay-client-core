import './editor.container.scss';
import HTML from './editor.container.html';
import { Container } from "../../core/classes/engine.container";

export class EditorContainer extends Container {
    
    public element: HTMLElement = document.createElement('div');

    public init() {
        this.element.innerHTML = HTML;
        this.element = <HTMLElement>this.element.children[0];

        if (this.options.label) {
            this.setLabel(this.options.label);
        }
        
        return super.init();
    }

    public setContent(content: string | HTMLElement, wrapper: boolean = true) {
        if (this.element) {
            if (typeof content === 'string') {
                if (wrapper) {
                    this.element.children[1].innerHTML = content;
                } else {
                    this.element = <HTMLElement>new DOMParser().parseFromString(content, 'text/html').body.children[0];
                }
            }
            else if (content instanceof HTMLElement) {
                if (wrapper) {
                    this.element.children[1].appendChild(content);
                } else {
                    this.element = content;
                }
            }
        }
    }

    public setLabel(text: string) {
        this.element.querySelector('header label').innerHTML = text;
    }

    public setLabelInfo(text: string) {
        this.element.querySelector('header span').innerHTML = text;
    }
}