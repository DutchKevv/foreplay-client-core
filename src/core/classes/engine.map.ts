import { Grid, AStarFinder, DiagonalMovement } from 'pathfinding';
import { Camera } from './engine.camera';
import { ITile } from '../../../../shared/interfaces/tile.interface';
import { IPosition } from '../../../../shared/interfaces/position.interface';
import { IMap } from '../../../../shared/interfaces/map.options.interface';
import { Layer } from "./engine.layer";
import { IAnimation } from '../interfaces/animation.interface';
import { Drawable } from './engine.drawable';
import { Sprite } from './engine.sprite';

export interface IMapOptions {
    saveLastOpened?: boolean;
    drawGrid?: boolean;
    gridLineColor?: string;
    selectedTileLineColor?: string;
    blockedTileLineColor?: string;
    mouseOverTileLineColor?: string;
    playMusic?: boolean;
}

export class Map extends Drawable {

    public static readonly DEFAULT_MUSIC_URL: string = '/audio/outside_ost1c.mp3';
    public static readonly DEFAULT_MAP_ID: string = 'default';
    public static readonly DEFAULT_LOCALSTORAGE_LAS_MAPT_KEY: string = 'map-last';
    public static readonly DEFAULT_OPTIONS: IMapOptions = {
        saveLastOpened: true,
        drawGrid: true,
        gridLineColor: 'grey',
        selectedTileLineColor: 'rgba(255, 0, 0, 1)',
        blockedTileLineColor: 'rgba(255, 255, 0, 0.6)',
        mouseOverTileLineColor: 'rgba(0, 255, 0, 1)',
        playMusic: true
    };

    public tileW = 32;
    public tileH = 32;
    public data: IMap = null;
    public tiles: Array<ITile> = [];
    public tileMap = null;
    public pathFindingGrid: Grid = null;
    public pathFinder: AStarFinder = null;
    public isMusicPlaying: boolean = false;
    public state = {
        selectedTile: undefined,
        mouseOverTile: undefined,
        selectedObject: undefined
    }

    private _audioMusic: HTMLAudioElement = null;
    private _audioAmbient: HTMLAudioElement = null;
    private _highlightedTile: ITile = null;
    private _highlightedTileAlpha: any = { a: 0 };
    private _highlightedTileAnimation: IAnimation;

    /**
     * 
     */
    private _onTileMapChange = tileMap => {
        this.tileMap = tileMap;

        // TODO - update only changed objects in base Drawable class?
        this.generate();
    }

    /**
     * 
     * @param mapId 
     */
    static saveLastOpenedMapLocal(mapId: string) {
        // store last map (temp)
        localStorage.setItem(Map.DEFAULT_LOCALSTORAGE_LAS_MAPT_KEY, mapId);
    }

    /**
     * 
     */
    static loadLastOpenedMapLocal(): string {
        return localStorage.getItem(Map.DEFAULT_LOCALSTORAGE_LAS_MAPT_KEY);
    }

    /**
     * 
     * @param options 
     * @param map 
     */
    constructor(options: IMapOptions, map: IMap) {
        super(Object.assign({}, Map.DEFAULT_OPTIONS, options));

        this.data = map;

        this.width = map.width * this.tileW;
        this.height = map.height * this.tileH;
    }

    public async init(): Promise<void> {
        this.pathFinder = new AStarFinder({
            diagonalMovement: DiagonalMovement.Always
        });

        this.tileMap = await this.engine.assets.loadTiles(this.data.tileMap);

        // generate map
        await this.generate();

        this.handleMusic(this.data.music || '/audio/outside_ost1c.mp3');

        if (this.options.saveLastOpened) {
            Map.saveLastOpenedMapLocal(this.data.id);
        }

        this.engine.events.on('tilemap-changed', this._onTileMapChange);

        await super.init();
    }

    /**
     * 
     * @param delta 
     * @param currentTime 
     */
    public update(delta: number, currentTime: DOMHighResTimeStamp) {
        this._checkMouse();
        super.update(delta, currentTime);
    }

    /**
     * 
     * @param delta 
     * @param currentTime 
     * @param context 
     * @param camera 
     */
    public draw(delta: number, currentTime: DOMHighResTimeStamp, context: CanvasRenderingContext2D, camera: Camera) {
        super.draw(delta, currentTime, context, camera);

        if (this.options.drawGrid)
            this.drawGrid(delta, currentTime, context, camera);
    }

    /**
    * save current map
    */
    public save(): Promise<any> {
        Map.saveLastOpenedMapLocal(this.data.id);
        return this.engine.http.put(`/map/${this.data.id}`, { body: this.data });
    }

    /**
     * clear current map
     */
    public clear(resetTiles: boolean = false): void {
        super.clear();

        if (resetTiles) {
            this.data.tiles = new Array(this.data.width * this.data.height);
            this.data.tiles.fill(0);
        }
    }

    /**
     * 
     * @param free 
     */
    public getRandomTile(free: boolean = true): ITile {
        const freeTiles = this.tiles.filter(tile => tile.blockedBy);
        console.log(freeTiles.length, this.tiles.length);
        return freeTiles[Math.floor(Math.random() * freeTiles.length)];
    }

    /**
     * could use a little optimisation
     * @param fromTile 
     * @param radius 
     * @param free 
     */
    public getRandomTileInRadiusOfTile(fromTile: ITile | IPosition, radius: number, free: boolean = true): ITile {
        let halfRadius = radius / 2;
        let rowXStart = Math.max(0, fromTile.gx - halfRadius);
        let rowXEnd = Math.min(this.data.width, fromTile.gx + halfRadius);
        let rowZStart = Math.max(0, fromTile.gz - halfRadius);
        let rowZEnd = Math.min(this.data.height, fromTile.gz + halfRadius);
        let i = (rowZStart * this.data.width) + rowXStart;

        // start at first Y row, until last Y row
        const freeTiles = [];
        for (let len = this.tiles.length; i < len; i++) {
            const tile = this.tiles[i];
            if (!tile.blockedBy && tile.gx > rowXStart && tile.gx < rowXEnd) {
                freeTiles.push(tile);
            }

            if (tile.gz > rowZEnd)
                break;
        }

        return freeTiles[Math.floor(Math.random() * freeTiles.length)];
    }

    /**
     * 
     * @param x 
     * @param z 
     * @param xView 
     * @param zView 
     */
    public getTileByScreenXZ(x: number, z: number, xView: number, zView: number): ITile {
        const tileX = Math.floor((x + xView) / this.tileW);
        const tileZ = Math.floor((z + zView) / this.tileH) * this.data.width;
        return this.tiles[tileX + tileZ];
    }

    /**
     * 
     * @param x 
     * @param z 
     */
    public getTileByWorldXZ(x: number, z: number): ITile {
        const tileX = Math.floor(x / this.tileW);
        const tileZ = Math.floor(z / this.tileH) * this.data.width;
        return this.tiles[tileX + tileZ];
    }

    /**
     * 
     * @param gx 
     * @param gz 
     */
    public getTileByGridXZ(gx: number, gz: number): ITile {
        return this.tiles[gx + (gz * this.data.width)];
    }

    /**
     * 
     * @param tile 
     * @param data 
     * @param merge 
     */
    public updateTile(tile: ITile, data: any, merge: boolean = true): void {
        if (merge) {

        } else {
            this.data.tiles[tile.i] = { _id: data._id };
            const oldTileRef = this.tiles[tile.i];
            const newTileRef = this.tiles[tile.i] = this.generateTileObjects([this.data.tiles[tile.i]], oldTileRef.gx, oldTileRef.gz)[0];
            this.generateRenderObjects([newTileRef]);
        }
    }

    /**
     * 
     */
    public clearTileByIndex(index: number): void {
        this.data.tiles[index] = 0;
    }

    /**
     * 
     * @param fromTile 
     * @param toTile 
     */
    public getPathToTile(fromTile: IPosition, toTile: IPosition): Array<ITile> {
        // library path (only [ [2,4] -> [3,4] ] etc)
        const path = this.pathFinder.findPath(fromTile.gx, fromTile.gz, toTile.gx, toTile.gz, this.pathFindingGrid.clone());
        
        // remove first tile (not needed)
        path.shift();

        // array with tiles to follow
        return path.map(path => this.tiles[path[0] + (path[1] * this.data.width)]);
    }

    /**
     * 
     * @param tile 
     */
    public setHighlightedTile(tile: ITile): void {
        this._highlightedTile = tile;
        this._highlightedTileAlpha.a = 0;

        this.addAnimation({
            from: this._highlightedTileAlpha,
            to: { a: 1 },
            time: 500,
            yoyo: true,
            repeat: Infinity
        });
    }

    /**
     * 
     */
    public unsetHighlightedTile() {
        this._highlightedTile = null;
    }

    /**
     * 
     * @param delta 
     * @param currentTime 
     * @param context 
     * @param camera 
     */
    public drawHighlightedTile(delta: number, currentTime: DOMHighResTimeStamp, context: CanvasRenderingContext2D, camera: Camera) {
        context.beginPath();
        context.arc(this._highlightedTile.x - camera.xView, this._highlightedTile.z - camera.zView, this.tileH / 2, 0, 2 * Math.PI, false);
        context.fillStyle = 'rgba(0, 255, 0, ' + this._highlightedTileAlpha.a + ')';
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = '#003300';
        context.stroke();
    }

    /**
    * generate full map
    * WARNING: very expensive!
    * 
    * note: 
    * generatePathFindingGrid is called by updateBlockedTiles, 
    * so not need to call here
    */
    public async generate(): Promise<void> {
        this.clear(false);
        this.tiles = this.generateTileObjects();
        this.updateBlockedTiles();

        if (this.data.backgroundImage) {
            await this.generateBackground();
        }

        await this.generateRenderObjects();
    }

    /**
     * create objects
     * WARNING: expensive
     */
    public generateTileObjects(tiles = this.data.tiles, startX: number = 0, startZ: number = 0): Array<ITile> {
        let tileW = this.tileW, tileH = this.tileH;

        return tiles.map((tile, index) => {

            const obj: any = {
                _id: typeof tile._id === 'string' ? tile._id : tile,
                i: index,
                w: tileW,
                h: tileH,
                x: startX * tileW,
                z: startZ * tileH,
                gx: startX,
                gz: startZ
            };

            if (tile._id) {
                const tileDetails = this.tileMap.tiles.find(tileObj => tileObj._id === tile._id);

                // obj.img = this.engine.assets.load(tileDetails.img);
                obj.details = tileDetails;

                // if (typeof tileDetails.width === 'number')
                //     obj.w = tileW * tileDetails.width;

                // if (typeof tileDetails.height === 'number') {
                //     obj.h = tileH * tileDetails.height;
                // }
            }

            if (++startX === this.data.width) {
                startX = 0;
                startZ++;
            }

            return obj;
        });
    }

    /**
     * calculate blocked tiles
     * WARNING: expensive
     */
    public updateBlockedTiles(): void {
        // reset all tiles to unblocked
        for (let i = 0, len = this.tiles.length; i < len; i++) {
            delete this.tiles[i].blockedBy;
        }

        for (let i = 0, len = this.tiles.length; i < len; i++) {
            const tile = this.tiles[i];

            // empty block
            if (!tile.details)
                continue;

            // default: blockedBy self
            tile.blockedBy = tile;

            // if no size (1 block)
            if (!tile.details.width && tile.details.height)
                continue;

            // set surrounding tiles blockedBy
            let xSize = tile.details.width || 1;
            let ySize = tile.details.height || 1;

            // total surrounding blocks is object width * height [4,6] = 24 blocks
            let totalBlocks = xSize * ySize;

            // extra check for 1x1 block (still 1 block)
            if (totalBlocks < 2)
                continue;

            // starting row / column
            let yRow = tile.gz - ySize + 1;
            let xRow = tile.gx;

            // loop over total blocks
            while (totalBlocks--) {
                // a surrounding tile
                let bTile = this.tiles[(yRow * this.data.width) + xRow];

                // check if tile exists (can be over map border)
                if (bTile) {
                    bTile.blockedBy = tile;
                }

                // check if X is not further than object position+width
                if (++xRow >= this.data.width || xRow > tile.gx + xSize - 1) {

                    // check if Y is not further than object position+height, than we can stop
                    if (++yRow > tile.gz)
                        break;

                    // continue to next x column (x++)
                    xRow = tile.gx;
                }
            }
        }

        this.generatePathFindingGrid();
    }

    /**
     * generate grid used in pathfinding
     * WARNING: expensive
     */
    public generatePathFindingGrid(): void {
        this.pathFindingGrid = null;

        const matrix = new Array(this.data.height);
        const data = this.data;

        for (let i = 0, len = data.height; i < len; i++) {
            const rowArr = new Array(data.width);
            for (let k = 0, lenk = data.width; k < lenk; k++) {
                rowArr[k] = this.tiles[(i * data.width) + k].blockedBy ? 1 : 0;
            }
            matrix[i] = rowArr;
        }

        this.pathFindingGrid = new Grid(matrix);
    }

    /**
     * 
     * @param tiles 
     */
    public async generateRenderObjects(tiles: Array<ITile> = this.tiles): Promise<void> {
        const tileW = this.tileW, tileH = this.tileH;

        for (let i = 0, len = tiles.length; i < len; i++) {

            if (!tiles[i]._id)
                continue;

            const tile = tiles[i];
            const tileData = this.tileMap.tiles.find(tileMapItem => tileMapItem._id === tile._id);

            if (!tileData || !tileData.frame)
                continue;

            const w = (tileData.width || 1) * tileW;
            const h = (tileData.height || 1) * tileH;

            const renderObject = new Sprite({
                drawWidth: w,
                drawHeight: h,
                img: tileData.imgEl,
                position: {
                    x: tile.x,
                    z: tile.z - h + tileH,
                    r: tile.r || 0,
                    gx: tile.gx,
                    gz: tile.gz,
                    tile
                }
            });

            await this.addChild(renderObject, 2);
        }
    }

    /**
     * show the game grid
     */
    public drawGrid(delta: number, currentTime: DOMHighResTimeStamp, context: CanvasRenderingContext2D, camera: Camera): void {
        const layer = this.layer;
        const tileSize = layer.map.tileH;

        // grid lines
        // TODO - optimize more to only draw visible in camera 
        const fromX = 0;
        // const fromX = Math.floor(camera.xView / tileSize);
        const untilX = Math.floor(fromX + (camera.wView / tileSize));
        // const untilX = this.data.height;
        const fromY = Math.floor(camera.zView / this.tileH);
        const untilY = Math.ceil(fromY + (camera.hView / tileSize) + tileSize);

        // context.save();
        context.beginPath();
        context.strokeStyle = this.options.gridLineColor;
        for (let i = fromX; i < untilX; i++) {
            context.moveTo((i * tileSize - camera.xView), 0);
            context.lineTo(i * tileSize - camera.xView, this.height - camera.zView);
        }
        for (let i = fromY; i < untilY; i++) {
            context.moveTo(0, i * tileSize - camera.zView);
            context.lineTo(this.width, i * tileSize - camera.zView);
        }
        context.stroke();

        // blocked tiles
        context.beginPath();
        context.strokeStyle = this.options.blockedTileLineColor;;
        for (let i = 0, len = this.tiles.length; i < len; i++) {
            const tile = this.tiles[i];

            if (tile.blockedBy && camera.isInViewByTile(tile))
                context.rect(tile.x - camera.xView, tile.z - camera.zView, tileSize, tileSize);
        }
        context.stroke();

        // selected tile
        if (this.state.selectedTile) {
            const tile = this.state.selectedTile;
            context.strokeStyle = this.options.selectedTileLineColor;
            context.strokeRect(tile.x - camera.xView, tile.z - camera.zView, tileSize, tileSize);
        }

        // mouseover tile
        if (this.state.mouseOverTile) {
            const tile = this.state.mouseOverTile;
            context.strokeStyle = this.options.mouseOverTileLineColor;
            context.strokeRect(tile.x - camera.xView, tile.z - camera.zView, tileSize, tileSize);
        }

        // context.restore();
    }


    /**
     * generate the background image
     * WARNING: expensive
     */
    public async generateBackground(): Promise<void> {
        const background = new Sprite({
            img: await this.engine.assets.load(this.data.backgroundImage),
            width: this.width,
            height: this.height,
            drawWidth: this.width,
            drawHeight: this.height
        });

        await this.addChild(background, 0);
    }

    public handleMusic(file: string, delay: number = 0) {
        if (!this.engine.options.sound.enabled) return;

        if (!this._audioMusic) {
            this._audioMusic = new Audio(this.engine.assets.normalizeUrl(file));
            this._audioMusic.volume = this.engine.options.sound.volume;
            this._audioMusic.onended = () => this.handleMusic(file, Math.floor(Math.random() * 60000));
        }

        setTimeout(() => this._audioMusic.play(), delay);
    }

    public handleAmbient() {
        if (!this.engine.options.sound.enabled) return;

        // stop previous background_noise
        if (this._audioAmbient != null) {
            this._audioAmbient.pause();
            this._audioAmbient.currentTime = 0;
        }
    }

    private _checkMouse() {
        const activeKeys = this.engine.controls.activeMouse;

        // click - set selected style
        if (activeKeys.up) {
            const screenXZ = this.getRelativeXZFromScreenXY(activeKeys.up.x, activeKeys.up.y);
            const clickedTile = this.getTileByScreenXZ(
                screenXZ.x,
                screenXZ.z,
                this.layer.camera.xView,
                this.layer.camera.zView
            );

            if (!clickedTile)
                return;

            if (clickedTile.selected) {
                clickedTile.selected = false;
                this.state.selectedTile = null;
            } else {
                if (this.state.selectedTile) {
                    this.state.selectedTile.selected = false;
                }
                clickedTile.selected = true;
                this.state.selectedTile = clickedTile;
                this.state.selectedObject = clickedTile.blockedBy ? clickedTile.blockedBy.details : null;
            }
        }

        // mousemove
        else if (activeKeys.move) {
            const camera = this.layer.camera;
            const screenXZ = this.getRelativeXZFromScreenXY(activeKeys.move.x, activeKeys.move.y);

            const mouseOverTile = this.getTileByScreenXZ(
                screenXZ.x,
                screenXZ.z,
                camera.xView,
                camera.zView
            );

            if (!mouseOverTile)
                return;

            if (this.state.mouseOverTile !== mouseOverTile) {
                this.state.mouseOverTile = mouseOverTile;
            }
        }
    }

    public destroy() {
        super.destroy();

        if (this._audioMusic) {
            this._audioMusic.pause();
            this._audioMusic = null;
        }

        // clear data from memory
        this.tiles = [];
        this.tileMap = null;
        this.data = null;
    }
}


