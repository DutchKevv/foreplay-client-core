import { Container, IContainerOptions } from "./engine.container";
import { IAnimationOptions, IAnimation } from "../interfaces/animation.interface";
import { Layer } from "./engine.layer";
import { Scene } from "./engine.scene";
import { IPosition } from "@foreplay/shared/interfaces/position.interface";
import { Camera } from './engine.camera';
import { Map } from './engine.map';
import { ITile } from "@foreplay/shared/interfaces/tile.interface";
import { IBehavior } from '../interfaces/behavior.interface';
import { IMouseEvent } from "./engine.controls";
import { Engine } from "../engine";

const TWEEN: any = <any>require('@tweenjs/tween.js');

export const DEFAULT_DRAWABLE_STYLE = {
    backgroundColor: 'blue',
    alpha: false
}

export interface IDrawableOptions extends IContainerOptions {
    element?: string | HTMLElement | HTMLCanvasElement;
    position?: IPosition;
    style?: IDrawableStyleOptions;
    width?: number;
    height?: number;
}

export interface IDrawableStyleOptions {
    border?: {
        width?: number;
        color?: string;
    }
    background?: string;
    alpha?: boolean;
    center?: boolean;
    padding?: Array<number>;
    margin?: Array<number>;
}

export interface IDrawable extends Container {
    onClick?(event: IMouseEvent): void
}

export class Drawable extends Container {

    public readonly type: string = 'drawable';

    // some generic style
    public style: IDrawableStyleOptions;

    // reference to HTML element
    // TODO - should only be in layer
    public element: HTMLElement | HTMLCanvasElement;

    // reference to Canvas context
    // TODO - should only be in layer
    public context: CanvasRenderingContext2D;

    // reference to layer instance where object is living in
    public layer: Layer;

    // reference to scene instance where object is living in
    public scene: Scene;

    // this object width
    public width: number;

    // this object height
    public height: number;

    // this object WORLD position
    public position: IPosition = { x: 0, z: 0, r: 0, gx: 0, gz: 0 };

    // this object WORLD offset
    public offset: any = { x: 0, y: 0 };

    // if this object is currently moving
    public isMoving: boolean;

    // this object destination tile
    public movePath: Array<ITile> = [];

    // this object is controlled by player
    public isSelf: boolean;

    // this object mouse enter occured
    public isMouseOver: boolean = false;

    // behavior
    public behaviorTimeout: number;
    public behavior: IBehavior = {
        aggresive: true,
        viewRadius: 4,
        moveRadius: 30,
        moveEverywhere: false,
        moveDelay: 10000,
        immortal: true,
        speed: 200
    };

    // animation group for syncing animations
    private _animationGroup = new TWEEN.Group();
    // private _animationGroup: TWEEN.Group = new TWEEN.Group();

    // animation used for smoothly moving objects to a certain position
    private _syncAnimation: IAnimation;
    private _syncAnimationDestination: IPosition;

    /**
     * 
     * @param options 
     */
    constructor(options: IDrawableOptions, engine?: Engine) {
        super(options, engine);

        this.style = Object.assign({}, DEFAULT_DRAWABLE_STYLE, options.style || {});

        // merge position object
        // TODO: also set GX / GY etc, make seperate 'updatePosition' func
        if (options.position)
            Object.assign(this.position, options.position);
    }

    /**
     * to be overwriten
     * 
     * @param event 
     */
    public onClick?(event: IMouseEvent) { }

    /**
     *  to be overwriten
     * 
     * @param event 
     */
    public onMouseEnter?(event: IMouseEvent) { }

    /**
     *  to be overwriten
     * 
     * @param event 
     */
    public onMouseLeave?(event: IMouseEvent) { }

    /**
     * 
     */
    public init(): Promise<void> {
        // set width / height / offset etc
        this.resize();
        return super.init();
    }

    /**
     * 
     * @param children 
     * @param order 
     */
    public async addChild(children: Array<Container> | Container, order?: number): Promise<void> {
        (Array.isArray(children) || (children = [children]));

        for (let i = 0, len = children.length; i < len; i++) {
            const child = <Drawable>children[i];
            child.scene = child.scene || this.scene || <Scene>child;
            child.layer = child.layer || this.layer || <Layer>child;
            order = typeof order === 'number' ? order : child.position ? child.position.z + 10 : child.order;
            await super.addChild(child, order);
        }
    }

    /**
    * 
    * @param delta 
    * @param currentTime 
    * @param context 
    * @param camera 
    */
    public draw(delta: number, currentTime: DOMHighResTimeStamp, context?: CanvasRenderingContext2D, camera?: Camera): void {
        // translate to position
        if (!this.context && context)
            context.translate(this.offset.x, this.offset.y);

        this._animationGroup.update(currentTime);
        this.drawChildren(delta, currentTime, context, camera);
        this.onDraw(delta, currentTime, context, camera);

        // translate back to original position
        if (!this.context && context)
            context.translate(-this.offset.x, this.offset.y);
    }

    /**
     * 
     */
    public drawChildren(delta: number, currentTime: DOMHighResTimeStamp, context?: CanvasRenderingContext2D, camera?: Camera): void {
        for (let i = 0, len = this.children.length; i < len; i++) {
            const child = <Drawable>this.children[i];

            // if (child && child.draw && child.isEnabled)
            if (child.draw && child.isEnabled && (!camera || camera.isInViewByContainer(child)))
                child.draw(delta, currentTime, context, camera);
        }
    }

    public click(event: IMouseEvent) {
        this.options.onClick ? this.options.onClick(event) : this.onClick(event);
    }

    public mouseEnter(event: IMouseEvent) {
        this.isMouseOver = true;
        this.onMouseEnter(event);
    }

    public mouseLeave(event: IMouseEvent) {
        this.isMouseOver = false;
        this.onMouseLeave(event);
    }

    /**
     * 
     * @param options 
     * @param stack 
     */
    public addAnimation(options: IAnimationOptions, stack: boolean = true): IAnimation {

        // const animation = <IAnimation>new TWEEN.Tween(options.from)
        //     .to(options.to, options.time || 2000)
        //     .onComplete(() => {
        //         animation.isComplete = true;

        //         if (options.onComplete)
        //             options.onComplete();

        //         if (!options.noAutoRemove)
        //             this.removeAnimation(animation);
        //     });

        // if (options.yoyo === true)
        //     animation.yoyo(true)

        // if (typeof options.repeat !== 'undefined')
        //     animation.repeat(options.repeat)

        // if (options.easing)
        //     animation.easing(options.easing)

        // if (options.onStart)
        //     animation.onStart(options.onStart)

        // if (options.onUpdate)
        //     animation.onUpdate(options.onUpdate)

        // if (options.onStop)
        //     animation.onStop(options.onStop)

        // if (stack)
        //     this._animationGroup.add(animation);

        // if (!options.noAutoStart)
        //     animation.start();

        // return animation;
        return null;
    }

    public removeAnimation(animation: IAnimation): void {
        // this._animationGroup.remove(animation);
    }

    public removeAllAnimations(): void {
        this._animationGroup.removeAll();
    }

    public calculateOffset() {
        if (this.style.center) {
            this.offset.x = ((<Drawable>this.parent).width / 2) - (this.width / 2);
            this.offset.y = ((<Drawable>this.parent).height / 2) - (this.height / 2);
        } else {
            this.offset.x = this.position.x || 0;
            this.offset.y = this.position.y || 0;
        }


        // console.log(this, this.offset);
    }

    /**
     * 
     * @param positionObject 
     * @param map 
     */
    public normalizePositionObject(positionObject: IPosition, map: Map): void {
        // don't let object leave the world's boundary
        if (positionObject.x - this.width / 2 < 0) {
            positionObject.x = this.width / 2;
        }
        if (positionObject.z - this.height / 2 < 0) {
            positionObject.z = this.height / 2;
        }
        if (positionObject.x + this.width / 2 > map.width) {
            positionObject.x = map.width - this.width / 2;
        }
        if (positionObject.z + this.height / 2 > map.height) {
            positionObject.z = map.height - this.height / 2;
        }

        // calculate grid position;
        positionObject.gx = Math.round((positionObject.x - this.width / 2) / map.tileW);
        positionObject.gz = Math.round((positionObject.z - this.height / 2) / map.tileH);

        if (positionObject.gx < 0) {
            positionObject.gx = 0;
        }

        if (positionObject.gz < 0) {
            positionObject.gz = 0;
        }

        // collision detection
        let currentTile = map.tiles[positionObject.gx + (positionObject.gz * map.data.width)];

        if (!currentTile)
            return;

        // if the tile is blocked, stop
        if (currentTile.blockedBy) {
            currentTile = positionObject.tile;
        }

        positionObject.x = Math.round(positionObject.x);
        positionObject.z = Math.round(positionObject.z);
        positionObject.tile = currentTile;
    }

    /**
     * 
     * @param delta 
     * @param map 
     */
    public checkAutoMovement(delta: number, map: Map): void {
        if (this.movePath.length === 0)
            return;

        this.isMoving = true;
        this.position.x += this.behavior.speed * delta * Math.cos(this.position.r);
        this.position.z += this.behavior.speed * delta * Math.sin(this.position.r);

        if (this.position.tile.i === this.movePath[0].i) {
            this.movePath.shift();

            // face destination
            if (this.movePath[0]) {
                this.faceDirectionByTile(this.movePath[0]);
            }

            // reached final tile of destination
            else {
                this.isMoving = false;

                if (this.isSelf)
                    map.unsetHighlightedTile();

                // AI
                else if (this.behavior.moveRadius)
                    this.moveRandomInRadius(this.behavior.moveRadius, map)
            }
        }

        else if (Math.abs(this.position.r - this.movePath[0].gx) > 1 || Math.abs(this.position.gz - this.movePath[0].gz) > 1) {
            this.faceDirectionByTile(this.movePath[0]);
        }
    }

    /**
     * 
     * @param radius 
     * @param map 
     * @param awaitMoveDelay 
     */
    public moveRandomInRadius(radius: number = 30, map: Map, awaitMoveDelay: boolean = true): void {
        if (this.behaviorTimeout) {
            window.clearTimeout(this.behaviorTimeout);
            this.behaviorTimeout = null;
        }

        if (awaitMoveDelay) {
            const timeout = Math.floor(Math.random() * (this.behavior.moveDelay || 0));
            this.behaviorTimeout = window.setTimeout(() => this.moveRandomInRadius(this.behavior.moveRadius, map, false), timeout);
            return;
        }

        this.behavior.moveRadius = radius || this.behavior.moveRadius;

        const tile = map.getRandomTileInRadiusOfTile(this.position, this.behavior.moveRadius);
        if (tile) {
            this.moveToTile(tile, map);
        }
    }

    /**
     * 
     * @param tile 
     * @param map 
     */
    public moveToTile(tile: ITile, map: Map): void {
        this.movePath = map.getPathToTile(this.position, tile);

        if (this.movePath.length) {
            this.isMoving = true;
            this.faceDirectionByTile(this.movePath[0]);
        } else {
            console.log('no path');
        }
    }

    public unsetMoveTo(): void {
        this.movePath = [];
    }

    /**
     * 
     * @param tile 
     */
    public faceDirectionByTile(tile: any): void {
        const tileWorldX = tile.x + (tile.w / 2);
        const tileWorldY = tile.z + (tile.h / 2);
        this.position.r = Math.atan2(tileWorldY - this.position.z, tileWorldX - this.position.x);
    }

    /**
     * 
     * @param x 
     * @param z 
     */
    public faceDirectionByWorldXY(x: number, z: number): void {
        // this.position.r = Math.atan2(tile.gz - (this.position.z - this.drawLayerMain.camera.zView), x - this.position.x - this.drawLayerMain.camera.xView)
    }

    /**
     * 
     * @param screenX 
     * @param screenY 
     * @param camera 
     */
    public faceDirectionByScreenXY(screenX: number, screenY: number, camera: Camera): void {
        const worldX = screenX + camera.xView;
        const worldY = screenY + camera.zView;
        this.position.r = Math.atan2(worldY - this.position.z, worldX - this.position.x)
    }

    /**
     * 
     * @param gx 
     * @param gz 
     * @param r 
     * @param map 
     * @param animate 
     */
    public setPositionByWorldGridXYR(gx: number, gz: number, r: number, map: Map, animate: boolean = false): void {
        if (animate) {
            this._syncAnimation = this.addAnimation({
                from: this.position,
                to: {}
            });
        } else {
            this.position.x = (gx * map.tileW) + (this.width / 2);
            this.position.z = (gz * map.tileH) + (this.height / 2)
            this.position.r = r;
            this.position.gx = gx;
            this.position.gz = gz;
        }

        this.position.tile = map.tiles[this.position.gx + (this.position.gz * map.data.width)];
    }

    /**
     * 
     * @param x 
     * @param z 
     * @param r 
     * @param map 
     * @param animate 
     */
    public setPositionByWorldXYR(x: number, z: number, r: number, map: Map, animate: boolean = false): void {
        if (animate) {
            this.isMoving = true;

            if (this._syncAnimation) {
                // this._syncAnimation.stop();
                this.removeAnimation(this._syncAnimation);
            }

            this._syncAnimationDestination = { x, z, r };
            this._syncAnimation = this.addAnimation({
                from: this.position,
                to: this._syncAnimationDestination,
                time: 100,
                easing: TWEEN.Easing.Linear.None,
                onComplete: () => {
                    this.isMoving = false;
                    this._syncAnimationDestination = null;
                }
            });
            // }

        } else {
            // this.position.x = x;
            // this.position.z = y;
            // this.position.r = r;
            // this.position.gx = Math.round(x / map.tileW);
            // this.position.gy = Math.round(y / map.tileH);
        }

        // this.position.tile = map.tiles[this.position.gx + (this.position.gy * map.data.width)];
    }

    /**
     * canvas can be 'stretched' and re-positioned by css
     * so when clicking 'on screen', the coordinates need to be transformed
     * @param x 
     * @param y 
     */
    public getRelativeXZFromScreenXY(x: number, y: number): { x: number, z: number } {
        const offset = { x: 0, z: 0 };
        let parent: Drawable = <Drawable>this.parent;

        while (parent && !parent.context) {
            offset.x += parent.offset.x;
            offset.z += parent.offset.y;
            parent = <Drawable>parent.parent;
        }

        switch (this.type) {
            case 'scene':
                // TODO
                break;
            case 'layer':
                offset.x = (x / this.layer.scale) - offset.x;
                offset.z = (y / this.layer.scale) - offset.z;
                break;
            case 'drawable':
            case 'sprite':
                offset.x = (x - this.layer.offset.x - offset.x) * this.layer.stretch.w / this.layer.scale;
                offset.z = (y - this.layer.offset.y - offset.z) * this.layer.stretch.h / this.layer.scale;
                break;
        }

        return offset;
    }
    
    public getRelativeXZFromScreenXY2(x: number, y: number): { x: number, z: number } {
        const offset = { x: 0, z: 0 };
        let parent: Drawable = this;

        do {
            offset.x += parent.offset.x;
            offset.z += parent.offset.y;
            parent = <Drawable>parent.parent;
        } while (parent && !parent.context)


        switch (this.type) {
            case 'scene':
                break;
            case 'layer':
                offset.x = (x / this.layer.scale) - offset.x;
                offset.z = (y / this.layer.scale) - offset.z;
                break;
            case 'drawable':
            case 'sprite':
                offset.x = (x - this.layer.offset.x - offset.x) * this.layer.stretch.w / this.layer.scale;
                offset.z = (y - this.layer.offset.y - offset.z) * this.layer.stretch.h / this.layer.scale;
                break;
        }

        return offset;
    }

    /**
     * 
     * @param width 
     * @param height 
     */
    public resize(width?: number, height?: number): void {
        this.width = width || this.width || this.options.width || (<Drawable>this.parent).width || this.engine.width;
        this.height = height || this.height || this.options.height || (<Drawable>this.parent).height || this.engine.height;

        this.calculateOffset();

        for (let i = 0, len = this.children.length; i < len; i++) {
            const child = <Drawable>this.children[i];
            child.resize && child.resize();
        }
    }
}