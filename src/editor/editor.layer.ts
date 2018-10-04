import './editor.layer.scss';
import HTML from './editor.layer.html';
import { Layer } from "../core/classes/engine.layer";
import { EditorContainerMaps } from './containers/maps/editor.container.maps';
import { EditorContainerTiles } from './containers/tiles/editor.container.tiles';
import { ITile } from '../../../shared/interfaces/tile.interface';
import { createDraggingImg } from './util/editor.util.image';
import * as $ from 'jquery';
import { EditorContainerHeader } from './containers/header/editor.container.header';
import { Socket } from '../core/classes/engine.socket';

export class EditorLayer extends Layer {

    public state: any = {};
    public element$: JQuery;
    public socket: Socket;
    public _header: EditorContainerHeader;
    private _mapsContainer: EditorContainerMaps;
    private _tilesContainer: EditorContainerTiles;
    private _previousMoveTile: ITile;
    private _playerContainerElement: HTMLElement;
    private _selectedObjectContainerElement: HTMLElement;

    public async onInit() {
        // this.socket = new Socket(Object.assign({}, this.engine.options.socket, { path: '/io/editor' }), this.engine);
        // await this.socket.connect();

        this.element.innerHTML = HTML;
        this.element = <HTMLElement>this.element.children[0];
        this.element$ = $(this.element);
        this.engine.element.appendChild(this.element);

        // store element references
        this._selectedObjectContainerElement = this.element.querySelector('.selected-object-container');
        this._playerContainerElement = this.element.querySelector('.info-container--player');

        this._header = new EditorContainerHeader({}, this.engine);
        this._mapsContainer = new EditorContainerMaps({ label: 'Maps' });
        this._tilesContainer = new EditorContainerTiles({ label: 'Objects' });

        await this.addChild([
            this._header,
            this._mapsContainer,
            this._tilesContainer
        ]);

        // add containers to DOM
        this.engine.element.insertBefore(this._header.element, this.engine.canvasElement);
        this.element$.find('.map-container').append(this._mapsContainer.element);
        this.element$.find('.tiles-container').append(this._tilesContainer.element);

        // resolution
        this.element$.find('.display-container select').change(event => {
            const element = <HTMLSelectElement>event.target;
            this.engine.switchResolution(
                parseInt(element.value.split('x')[0], 10),
                parseInt(element.value.split('x')[1], 10)
            );
        });

        // move tile button
        (<HTMLElement>this._selectedObjectContainerElement.querySelector('#moveTileBtn')).onclick = () => this.moveSelectedObject();
        // remove tile button
        (<HTMLElement>this._selectedObjectContainerElement.querySelector('#removeTileBtn')).onclick = () => this.removeSelectedObject();

        // make draggable
        // makeElementDraggable(this.element, <HTMLElement>this.element.children[0])

        // before exiting page, show default browser 'unsaved changed' popup 
        window.onbeforeunload = () => this.state.isDirty || null;
    }

    public onUpdate() {
        // disable dev mode
        if (this.engine.controls.activeKeyboard.down.ctrl && this.engine.controls.activeKeyboard.down.slash) {
            this.destroy();
        }
    }

    public onDraw(delta: number, currentTime: DOMHighResTimeStamp) {
        const layerGame = <Layer>this.engine.findChildById(Layer.TYPE_GAME);

        // fps
        this._drawFPS(delta);

        if (layerGame) {
            // player
            this._drawPlayerData(delta);

            // keys
            this._checkKeyBoard(delta);
            this._checkMouse(delta);
        }
    }

    public moveSelectedObject() {
        if (!this.state.selectedTile || !this.state.selectedTile.blockedBy) {
            alert('no selected tileObject');
            return;
        }

        this._previousMoveTile = Object.assign({}, this.state.selectedTile.blockedBy);
        this.removeSelectedObject();
        createDraggingImg(this._previousMoveTile.details, this.engine);

        this.state.isDirty = true;
    }

    public removeSelectedObject() {
        if (!this.state.selectedTile || !this.state.selectedTile.blockedBy) {
            alert('no selected tileObject');
            return;
        }

        const layerGame = <Layer>this.engine.findChildById(Layer.TYPE_GAME);

        layerGame.map.clearTileByIndex(this.state.selectedTile.blockedBy.i);
        layerGame.map.generate();

        this.state.isDirty = true;
    }

    private _checkMouse(delta: number) { }

    private _checkKeyBoard(delta: number) {
        if (this.engine.controls.activeKeyboard.up.delete) {
            if (this.state.selectedObject) {
                this.removeSelectedObject()
            }
        }
    }

    private _drawFPS(delta) {
        (<HTMLElement>this.element.children[0].children[0]).innerText = <any>Math.floor(1 / delta);
    }

    private _drawPlayerData(delta: number) {
        const layerGame = <Layer>this.engine.findChildById(Layer.TYPE_GAME);

        if (!layerGame) return;

        const gameMap = layerGame.map;
        const player = this.engine.state.game.player;

        if (!gameMap || !gameMap.isInitialized || !player || !player.isInitialized)
            return;

        (<HTMLElement>this._playerContainerElement.children[1]).innerText = <any>Math.round(player.position.x);
        (<HTMLElement>this._playerContainerElement.children[3]).innerText = <any>Math.round(player.position.z);
        (<HTMLElement>this._playerContainerElement.children[5]).innerText = player.position.r.toFixed(3);
        (<HTMLElement>this._playerContainerElement.children[7]).innerText = <any>player.position.gx;
        (<HTMLElement>this._playerContainerElement.children[9]).innerText = <any>player.position.gz;
        (<HTMLElement>this._playerContainerElement.children[11]).innerText = <any>player.position.gx + (player.position.gz * gameMap.data.width);
    }

    public onDestroy() {
        // remove dev container from DOM
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}