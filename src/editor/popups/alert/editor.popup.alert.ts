import './editor.popup.alert.scss';
import { EditorPopup } from "../editor.popup";
import HTML from './editor.popup.alert.html';

export class EditorPopupAlert extends EditorPopup {

    onInit() {
        this.setContent(HTML);
        this._setButtons();
        this._setAlertContent();
    }

    _setButtons() {
        const footerElement = this.element.querySelector('footer');

        this.options.buttons.reverse().forEach(button => {
            const buttonElement = document.createElement('button');
            buttonElement.setAttribute('data-value', button.value);

            if (button.closeOnClick) {
                buttonElement.setAttribute('data-autodestroy', "true");
            }
            
            buttonElement.innerText = button.text;
            buttonElement.onclick = (event) => {
                if (button.onClick)
                    button.onClick(event, buttonElement.getAttribute('data-value'));
            };
            footerElement.appendChild(buttonElement)
        });
        
        // Array.from(footerElement.children).forEach(button => {
        //     button.onclick = event => this._onClickButton(event);
        // });
    }

    _setAlertContent() {
        this.element.querySelector('main').innerHTML = this.options.content;
    }

    _onClickButton(event) {
        this.options.buttons.find(button => button.value == event.target.getAttribute('data-value'));
    }

    onDestroy() {

    }
}