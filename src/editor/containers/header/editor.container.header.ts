import './editor.container.header.scss';
import HTML from './editor.container.header.html';
import { EditorContainer } from "../editor.container";
import { OnInit } from '../../../core/interfaces/basic.class.interface';
import { EditorPopupCreateGame } from '../../popups/create-game/editor.popup.create.game';
import * as $ from 'jquery';

export class EditorContainerHeader extends EditorContainer implements OnInit {

    public list: Array<any> = [];

    onInit() {
        this.setContent(HTML, false);

        $(this.element).find('a[data-value]').click((event: JQuery.Event) => {
            this._parseAction($(event.target).attr('data-value')).catch(console.error);
        });
    }

    private async _parseAction(action: string) {
        switch (action) {
            case 'createGame':
                const popup = new EditorPopupCreateGame({}, this.engine);
                await popup.init();
                popup.open();
                break;
            case 'loadGame':
                break;
            default:
                throw new Error('unkown header action: ' + action);
        }
    }
}