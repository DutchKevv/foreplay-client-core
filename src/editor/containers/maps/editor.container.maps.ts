import './editor.container.maps.scss';
import HTML from './editor.container.maps.html';
import { EditorContainer } from "../editor.container";
import { EditorPopupAlert } from '../../popups/alert/editor.popup.alert';
import { EditorPopupCreateMap } from '../../popups/create-map/editor.popup.create.map';
import { Layer } from '../../../core/classes/engine.layer';
import { OnInit } from '../../../core/interfaces/basic.class.interface';
import { Map } from '../../../core/classes/engine.map';

export class EditorContainerMaps extends EditorContainer implements OnInit {

    public list: Array<any> = [];

    private _layerGame: Layer = null;
    private _listElement: HTMLElement = null;

    onInit() {
        this.setContent(HTML);

        this._listElement = this.element.querySelector('.maps-list');

        this.refresh();

        this.updateBackgroundName();
        this.updateActiveMapName();

        // this.setLabelInfo(this.engine.layers[Layer.TYPE_GAME].map.data.id);

        // save map button
        (<HTMLElement>this.element.querySelector('#saveMapBtn')).onclick = () => this.save();
        // create map button
        (<HTMLElement>this.element.querySelector('#createMapBtn')).onclick = () => this.create();
        // clear map button
        (<HTMLElement>this.element.querySelector('#clearMapBtn')).onclick = () => this.clear();
        // clear map button
        (<HTMLElement>this.element.querySelector('#refreshMapsBtn')).onclick = () => this.refresh();

        this.engine.events.on('map-switch', () => this.refresh());
    }

    async create() {
        const popup = new EditorPopupCreateMap(undefined, this.engine);
        await popup.init();
        popup.open();
    }

    public async load(mapId: string) {
        await this.engine.findChildById(Layer.TYPE_GAME).switchMap(mapId);
        this.refresh();
    }

    public async save() {
        const layerGame = <Layer>this.engine.findChildById(Layer.TYPE_GAME);
        await layerGame.map.save();
        this.engine.findChildById(Layer.TYPE_DEV).state.isDirty = false;
    }

    async clear() {
        const popup = new EditorPopupAlert({
            title: 'Clear map',
            content: '<p>Are you sure you want to clear the map?</p>',
            buttons: [
                {
                    closeOnClick: true,
                    text: 'cancel'
                },
                {
                    onClick: () => {
                        popup.close();
                        const map: Map = (<Layer>this.engine.findChildById(Layer.TYPE_GAME)).map;
                        map.clear();
                        map.generate();
                    },
                    text: 'Clear'
                }
            ]
        });
        await popup.init();
        popup.open();

    }

    public async remove() {
        const popup = new EditorPopupAlert({
            title: 'Remove map',
            content: '<p>Are you sure you want to clear the map?</p>',
            buttons: [
                {
                    closeOnClick: true,
                    text: 'cancel'
                },
                {
                    onClick: () => {
                        popup.close();
                        this._layerGame.map.clear();
                        this._layerGame.map.generate();
                    },
                    text: 'Clear'
                }
            ]
        }, this.engine);
        await popup.init();
        popup.open();
    }

    public async refresh() {
        const layerGame = <Layer>this.engine.findChildById(Layer.TYPE_GAME);

        if (!layerGame || !layerGame.map)
            return;

        const currentActiveMap = layerGame.map.data.id;
        const maps = <any>await this.engine.http.get('/map');
        const container = document.createDocumentFragment();

        for (let i = 0, len = maps.length; i < len; i++) {
            const element = document.createElement('a');
            element.setAttribute('data-value', maps[i]);
            element.innerText = maps[i];
            element.onclick = event => this._onClickRowItem(event);
            element.classList.toggle('active', currentActiveMap === maps[i]);
            container.appendChild(element);
        }

        this._listElement.innerHTML = '';
        this._listElement.appendChild(container);
        // this._listElement.querySelector('.active').scrollIntoView();

        this.updateActiveMapName();
    }

    public updateBackgroundName() {
        // (<HTMLElement>this._mapsContainerElement.children[0].children[1]).innerText = this._drawLayerMain.map.data.backgroundImage;
    }

    public updateActiveMapName() {
        const layerGame = <Layer>this.engine.findChildById(Layer.TYPE_GAME);

        if (layerGame && layerGame.map)
            this.setLabelInfo(layerGame.map.data.id);
    }

    private _onClickRowItem(event) {
        if (event.target.hasAttribute('data-value')) {
            this.load(event.target.getAttribute('data-value'));
        }
    }
}