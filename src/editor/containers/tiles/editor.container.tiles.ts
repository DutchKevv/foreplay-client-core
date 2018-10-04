import './editor.container.tiles.scss';
import HTML from './editor.container.tiles.html';
import { EditorContainer } from "../editor.container";
import { Layer } from '../../../core/classes/engine.layer';
import { PopupDevTiles } from '../../popups/tiles/editor.popup.tiles';
import { spriteToImg, createDraggingImg } from '../../util/editor.util.image';
import { Drawable } from '../../../core/classes/engine.drawable';
import { EditorLayer } from '../../editor.layer';
import { ITile } from '../../../../../shared/interfaces/tile.interface';

const LOCAL_STORAGE_LAST_TILES_KEY = 'dev-last-selected-tiles';

export class EditorContainerTiles extends EditorContainer {

    public list: Array<any> = [];
    public isDirty: boolean = false;
    public parent: EditorLayer;

    private _listContainerElement: HTMLElement = null;
    private _previousMousOverTile: ITile;

    public onInit() {
        this.setContent(HTML);
        this._listContainerElement = this.element.querySelector('.tiles-list');

        // insert last used tiles
        this._initLastSelectedTiles().catch(console.error);

        // load tile button
        (<HTMLElement>this.element.querySelector('.plus-btn')).onclick = () => this.showAllTilesMenu();
    }

    public update(delta: number, currentTime: DOMHighResTimeStamp) {
        this._checkKeyBoard();
        this._checkMouse();
    }

    async showAllTilesMenu() {
        const popup = new PopupDevTiles(undefined, this.engine);
        await popup.init();
        popup.open();
        popup.onDestroy = () => {
            if (popup.activeTile) {
                this.addListTile(popup.activeTile);
            }
        }
    }

    public addListTile(spriteObj, save = true) {
        // remove doubles and limit max
        Array.from(this.element.children).forEach((img: HTMLElement, index: number) => {
            if (index > 1 && (index > 50 || (<any>img).data.id === spriteObj.id))
                img.parentNode.removeChild(img);
        });

        // create image from sprite and inject
        const img = spriteToImg(spriteObj, this.engine);
        img.onclick = event => this._onClickMenuTile(event);

        // prepend
        if (this._listContainerElement.children.length > 1) {
            this._listContainerElement.insertBefore(img, this._listContainerElement.children[1]);
        }
        // append
        else {
            this._listContainerElement.appendChild(img);
        }

        // store in localstorage
        if (save && this._listContainerElement.children.length > 1) {
            const elements = Array.from(this._listContainerElement.children);
            const ids: Array<string> = elements.filter((e, i) => i).map((element: any) => element.data._id)
            const uniqueIds = Array.from(new Set(ids));
            window.localStorage.setItem(LOCAL_STORAGE_LAST_TILES_KEY, JSON.stringify(uniqueIds));
        }
    }

    private _onClickMenuTile(event: MouseEvent) {
        this.state.selectedObject = event.target['data'];
        this.state.draggingImg = createDraggingImg(this.state.selectedObject, this.engine);
    }

    private async _initLastSelectedTiles() {
        const storedItems = window.localStorage.getItem(LOCAL_STORAGE_LAST_TILES_KEY);
        if (storedItems) {
            try {
                const lastSelectedTileIds = JSON.parse(storedItems);
                const tilesMap = await this.engine.assets.loadTiles('/images/tile/dist/tiles');

                lastSelectedTileIds.reverse().forEach(tileId => {
                    const spriteObj = tilesMap.tiles.find(tile => tile._id === tileId);

                    if (spriteObj) {
                        this.addListTile(spriteObj, false);
                    }
                });
            } catch (error) {
                console.error(error);
            }
        }
    }

    private _checkKeyBoard() {
        if (this.engine.controls.activeKeyboard.up.escape && this.state.selectedObject && this.state.draggingImg) {
            this._removeDraggingImg();
        }
    }

    private _checkMouse() {
        const layerGame = <Layer>this.engine.findChildById(Layer.TYPE_GAME);
        const activeKeys = this.engine.controls.activeMouse;

        if (!layerGame)
            return;

        if (activeKeys.move && this.state.draggingImg && layerGame.map.state.mouseOverTile) {
            // currently dragging image / object
            const camera = layerGame.camera;

            const currentSelectedTile = layerGame.map.state.mouseOverTile;

            if (currentSelectedTile && currentSelectedTile !== this._previousMousOverTile) {

                // store original tile state
                if (currentSelectedTile.details) {
                    currentSelectedTile.preMouseOverDetails = currentSelectedTile.details;
                }

                currentSelectedTile._id = this.state.selectedObject._id;
                currentSelectedTile.details = this.state.selectedObject;

                // restore previous mouse over tile to original state
                if (this._previousMousOverTile) {
                    this._previousMousOverTile._id = this._previousMousOverTile.preMouseOverDetails ? this._previousMousOverTile.preMouseOverDetails._id : 0;
                    this._previousMousOverTile.details = this._previousMousOverTile.preMouseOverDetails;
                }

                this._previousMousOverTile = currentSelectedTile;

                // drag drag image at mouse position
                this._drawDraggingImgAtPosition(this.state.draggingImg, currentSelectedTile.x - camera.xView + layerGame.offset.x, currentSelectedTile.z - camera.zView + layerGame.offset.y);

                // update blocked tiles at blocked position
                layerGame.map.updateBlockedTiles();
            }
        }

        if (activeKeys.up && this.state.draggingImg && layerGame.map.state.selectedTile) {
            layerGame.map.updateTile(layerGame.map.state.selectedTile, this.state.draggingImg.data, false);

            this._removeDraggingImg();

            this.parent.state.isDirty = true;
        }
    }

    private _drawDraggingImgAtPosition(draggingImg: HTMLImageElement, x: number, z: number) {
        const layerGame = <Layer>this.engine.findChildById(Layer.TYPE_GAME);

        draggingImg.style.left = x + 'px';
        draggingImg.style.top = (z - draggingImg.height + layerGame.map.tileH) + 'px';

        if (!draggingImg.parentNode)
            this.element.appendChild(draggingImg);
    }


    private _removeDraggingImg() {
        if (this.state.draggingImg.parentNode) {
            this.state.draggingImg.parentNode.removeChild(this.state.draggingImg);
        }

        this.state.draggingImg = null;
    }
}