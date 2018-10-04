import './editor.popup.tiles.scss';
import PopupTemplate from './editor.popup.tiles.hbs';
import EditTemplate from './editor.popup.tiles.edit.hbs';
import RowTemplate from './editor.popup.tiles.row.hbs';
import * as $ from 'jquery';
import { EditorPopup } from '../editor.popup';
import { ITileMap } from '../../../../../shared/interfaces/tilemap.interface';
import { ITile } from '../../../../../shared/interfaces/tile.interface';
import { Engine } from '../../../core/engine';
import { Scene } from '../../../core/classes/engine.scene';
import { Layer } from '../../../core/classes/engine.layer';
import { Map } from '../../../core/classes/engine.map';
import { Camera } from '../../../core/classes/engine.camera';
import { PlayerSelf } from '../../../core/classes/engine.player.self';

export class PopupDevTiles extends EditorPopup {

    public activeCategory: string = 'create';
    public activeTile: any;
    public element$: JQuery;
    public tilesContainerElement$: JQuery;
    public tileMap: ITileMap;
    public isLoading: boolean = false;
    public previewEngine: Engine;

    async onInit() {
        this.setContent(PopupTemplate, false);

        this.element$ = $(this.element);

        this.tilesContainerElement$ = this.element$.find('.tiles-container');

        this.addTiles().catch(console.error);

        this.element$.find('#footerCancelBtn').click(() => this.destroy());
        this.element$.find('#footerSelectBtn').click(() => this.selectAndClose());
        this.element$.find('#footerSubmitBtn').click(() => this.create());
        this.element$.find('#footerEditBtn').click(() => this.edit());
        this.element$.find('.tiles-categories a').click(event => this.switchCategory(event.currentTarget.getAttribute('data-value')));
        this.element$.find('.tiles-container').click(event => this.onClickTile(event));

        this.tileMap = await this.engine.assets.loadTiles('/images/tile/dist/tiles');
    }

    /**
     * switch active category
     * 
     * @param category 
     * @param tileId 
     */
    public switchCategory(category: string, tileId?: string) {
        this.clearTiles();
        this._showErrorText('');
        this._showSuccessText('');

        if (this.previewEngine) {
            this.previewEngine.destroy();
        }

        this.activeCategory = category;

        // toggle active class in category tabs
        this.element$.find('.tiles-categories a').each((index, el) => {
            el.classList.toggle('active', el.getAttribute('data-value') === category);
        });

        if (category === 'create' || category === 'edit') {
            this.element$.find('.create-tile-container').addClass('active');
            this.showAddEditMenu(tileId);
        } else {
            this.element$.find('.create-tile-container').removeClass('active');
            this.addTiles();
        }

        this.element$.find('#footerSelectBtn').toggle(category !== 'create' && category !== 'edit');
        this.element$.find('#footerSubmitBtn').toggle(category === 'create');
        this.element$.find('#footerEditBtn').toggle(category === 'edit');
    }

    /**
     * show the add / edit category
     * 
     * @param tileId 
     */
    public showAddEditMenu(tileId: string) {
        let data;

        if (this.activeCategory === 'edit')
            data = this.tileMap.tiles.find(tile => tile._id === tileId);

        this.element$.find('.create-tile-container').html(EditTemplate(data));

        // on form change
        this.element$.find('form').change(event => {
            const tile: ITile = {};
            new FormData(<HTMLFormElement>event.currentTarget).forEach((value, key) => tile[key] = value);
            if (data && data.imgEl)
                this.drawPreviewImg(tile);
        });

        // on file input change
        this.element$.find('input[type=file]').change((event: any) => {
            if (event.target.files && event.target.files[0]) {
                var reader = new FileReader();

                reader.onload = (e: any) => {
                    const img = new Image();
                    img.src = e.target.result;

                    const tile: ITile = { imgEl: img };
                    new FormData(this.element.querySelector('form')).forEach((value, key) => tile[key] = value);
                    this.drawPreviewImg(tile);
                };

                reader.readAsDataURL(event.target.files[0]);
            }
        })

        if (this.activeCategory === 'edit' && data) {
            const tile = {};
            new FormData(this.element.querySelector('form')).forEach((value, key) => tile[key] = value);
            this.drawPreviewImg(tile);
        }
    }

    /**
     * show the 'mini game' where user can test sprite
     * 
     * @param tile 
     */
    public async drawPreviewImg(tile: ITile) {
        if (this.previewEngine)
            this.previewEngine.destroy();

        const previewEl$: JQuery = this.element$.find('.create-tile-upload-preview');
        const width: number = 400;
        const height: number = 400;
        const tileSize: number = 32;

        // engine
        this.previewEngine = new Engine({
            devMode: false,
            element: previewEl$[0],
            display: {
                width, 
                height    
            },
            sound: {
                enabled: false
            }
        });

        await this.previewEngine.init();

        // scene
        const scene = new Scene({});
        await this.previewEngine.addChild(scene);

        // layer
        const layer = new Layer({});
        await scene.addChild(layer);

        // map
        const mapSize = Math.min(Math.max(8, tile['width'] * 2, Math.max(6, tile['height'] * 2)));
        const tiles = new Array(mapSize * mapSize);
        const indexX = Math.round((mapSize / 2) - (tile['width'] / 2));
        const indexY = Math.round((mapSize / 2) + (tile['width'] / 4)) * mapSize;
        const index = indexX + indexY;

        tiles.fill(0);
        tiles[index] = { _id: tile._id };
        layer.map = new Map(
            {
                drawGrid: true,
                saveLastOpened: false
            },
            {
                version: 1,
                id: '__tmp',
                width: mapSize,
                height: mapSize,
                tileW: tileSize,
                tileH: tileSize,
                tiles: tiles,
                tileMap: '/images/tile/dist/tiles'
            }
        );
        await layer.addChild(layer.map);

        // layer scale
        layer.scale = Math.min(width / (mapSize * tileSize), height / (mapSize * tileSize));

        // camera
        layer.camera = new Camera(this.engine, 0, 0, layer.map.width, layer.map.height, layer.map.width, layer.map.height);

        // player
        const player = new PlayerSelf({});
        await layer.addChild(player);

        this.previewEngine.start();
    }

    async addTiles() {
        this.clearTiles();

        const documentFragment = document.createDocumentFragment();

        if (this.activeCategory === 'create') {
            this.element.querySelector('.create-tile-container').classList.toggle('active', true);
        } else {
            const parser = new DOMParser();

            for (let i = 0, len = this.tileMap.tiles.length; i < len; i++) {
                const tile = this.tileMap.tiles[i];

                if (!tile.frame || tile.type !== this.activeCategory)
                    continue;

                const el = parser.parseFromString(RowTemplate(tile), 'text/html').body.children[0];
                el.replaceChild(tile.imgEl, el.querySelector('img'));
                documentFragment.appendChild(el);
            }
        }

        this.tilesContainerElement$.append(documentFragment);

        this.tilesContainerElement$.find('.actions-edit').click(event => this.switchCategory('edit', event.target.closest('[data-id]').getAttribute('data-id')));
        this.tilesContainerElement$.find('.actions-remove').click(event => this.removeTile(event.target.closest('[data-id]').getAttribute('data-id')));
    }

    /**
     * 
     * @param event 
     */
    public onClickTile(event: JQuery.Event) {
        const tileContainer$ = $(event.target).closest('[data-id]');

        if (!tileContainer$.length)
            return;

        this.activeTile = tileContainer$.find('img')[0]['data'];

        tileContainer$.siblings().removeClass('active');
        tileContainer$.addClass('active');
    }

    /**
     * remove single tile
     * 
     * @param tileId 
     */
    public removeTile(tileId: string) {
        alert(tileId);
    }

    /**
     * remove all tiles
     */
    public clearTiles() {
        this.tilesContainerElement$.empty();
        this.activeTile = null;
    }

    public selectAndClose() {
        this.destroy();
    }

    public async create(): Promise<void> {
        try {
            const formData = new FormData(this.element.querySelector('form'));

            this._toggleLoading(true);

            await this.engine.http.post('/object', { body: formData }, true);

            this._showSuccessText('Object created!');
        } catch (error) {
            console.error(error);
            this._showErrorText(error);
        } finally {
            this._toggleLoading(false);
        }
    }

    public async edit(): Promise<void> {
        try {
            const formData = new FormData(this.element.querySelector('form'));

            this._toggleLoading(true);

            await this.engine.http.put('/object/' + formData.get('_id'), { body: formData }, true);

            this.tileMap = await this.engine.assets.loadTiles('/images/tile/dist/tiles');

            this.engine.events.emit('tilemap-changed', this.tileMap);

            this._showSuccessText('Object updated!');
        } catch (error) {
            console.error(error);
            this._showErrorText(error);
        } finally {
            this._toggleLoading(false);
        }
    }

    /**
     * 
     * @param state 
     */
    private _toggleLoading(state: boolean = !this.isLoading) {
        this.isLoading = state
        this.element$.toggleClass('loading', state);
        // this.element$.find('.modal-footer .btn-primary').toggleClass('spinner', state);
        this.element$.find('input, select, button').prop('disabled', state);
    }

    /**
     * 
     * @param text 
     */
    private _showErrorText(text: string) {
        this.element$.find('.error-container').text(text);
    }

    /**
     * 
     * @param text 
     */
    private _showSuccessText(text: string) {
        this.element$.find('.success-container').text(text);
    }

    public onDestroy() {
        if (this.previewEngine) {
            this.previewEngine.destroy();
        }
    }
}