import './editor.popup.create.map.scss';
import { EditorPopup } from "../editor.popup";
import HTML from './editor.popup.create.map.html';
import { Layer } from '../../../core/classes/engine.layer';

export class EditorPopupCreateMap extends EditorPopup {

    private _errorMessgeElement: HTMLElement = null;
    private _formElement: HTMLFormElement = null;

    public onInit() {
        this.setContent(HTML);

        this._errorMessgeElement = this.element.querySelector('.error-container');
        this._formElement = this.element.querySelector('form');
        this._formElement.onsubmit = () => false;

        const layerGame = <Layer>this.engine.findChildById(Layer.TYPE_GAME);

        if (layerGame && layerGame.map) {
            (<HTMLInputElement>this._formElement.querySelector('[name=createMapFormNameInput]')).value = layerGame.map.data.id;
        } else {
            (<HTMLInputElement>this._formElement.querySelector('[name=createMapFormNameInput]')).value = 'default'
        }
    }

    async onClickFooterButton(event, value) {
        if (value === 'create') {
            if (!this._formElement.checkValidity()) {
                // document.getElementById("demo").innerHTML = this._formElement.validationMessage;
                return;
            }
            
            const name = (<HTMLInputElement>this._formElement.querySelector('[name=createMapFormNameInput]')).value.trim();
            const width = parseInt((<HTMLInputElement>this._formElement.querySelector('[name=createMapFormWidthInput]')).value, 10);
            const height = parseInt((<HTMLInputElement>this._formElement.querySelector('[name=createMapFormHeightInput]')).value, 10);
            const randomFill = (<HTMLInputElement>this._formElement.querySelector('[name=createMapFormRandomInput]')).checked;
            const overwrite = (<HTMLInputElement>this._formElement.querySelector('[name=createMapFormOverwriteInput]')).checked;

            // temp
            const result = await this.engine.http.post('/map', {body: {id: name, width, height, randomFill, overwrite}}, true);

            let body: any = '';

            switch (result.status) {
                case 200:
                    body = await result.json();
                    console.log(body);
                    this.engine.findChildById(Layer.TYPE_GAME).switchMap(body.id);
                    this.destroy(body);
                    return;
                case 424:
                    body = await result.json();
                    console.log(result.body);

                    switch (body.errorCode) {
                        case 'overwrite':
                            this._errorMessgeElement.innerText = `Map with name '${name}' already exists. To overwrite check the 'overwrite' checkbox below`;
                            break;
                    }
                    break;
            }
        }
    }

    onAterOpen() {
        this.element$.find('form .row:first-child input').focus();
    }
}