import './editor.popup.create.game.scss';
import Template from './editor.popup.create.game.hbs';
import { EditorPopup } from "../editor.popup";

export class EditorPopupCreateGame extends EditorPopup {

    public onInit() {
        this.setContent(Template, false);

        this.element$.find('#footerSubmitBtn').click(() => this.create());
    }

    public async create() {
        const formData = new FormData(<HTMLFormElement>this.element.querySelector('form'));

        const result = await this.engine.http.post('/game', { body: formData }, true);
    }
}