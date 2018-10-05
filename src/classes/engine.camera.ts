import { Rectangle } from './engine.rectangle';
import { IPosition } from "@foreplay/shared/interfaces/position.interface";
import { Layer } from './engine.layer';
import { Engine } from "../engine";
import { Container } from './engine.container';
import { Animation } from './engine.animation';
import { Drawable } from './engine.drawable';
import { ITile } from "@foreplay/shared/interfaces/tile.interface";
import { IAnimation } from '../interfaces/animation.interface';

// possibles axis to move the camera
var AXIS = {
    NONE: "none",
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical",
    BOTH: "both"
};

// Camera constructor
export class Camera {
    public xDeadZone: number = 0;
    public zDeadZone: number = 0;

    // rectangle that represents the viewport
    public viewportRect: Rectangle;

    // rectangle that represents the world
    public worldRect: Rectangle;

    // if is busy animating
    public isAnimating: boolean = false;

    // the object camera is following
    public followingPosition: IPosition;

    private _animation: IAnimation;
    private _swingBackTimeout: number;

    constructor(
        public engine: Engine,
        public xView: number = 0,
        public zView: number = 0,
        public wView: number = 0,
        public hView: number = 0,
        public worldWidth: number = 0,
        public worldHeight: number = 0,
        public axis: string = AXIS.BOTH) {

        this.updateViewPortSize(wView, hView);
        this.updateWorldSize(worldWidth, worldHeight);
    }

    /**
     * 
     * @param delta 
     * @param currentTime 
     */
    public update(delta: number, currentTime: DOMHighResTimeStamp): void {
        this.updatePosition();
    }

    public updatePosition(xView?: number, zView?: number, swingBackToFollowingTime: number = 2000): void {
        // if (typeof xView === 'number' || typeof zView === 'number') {
        //     this.xView = xView;
        //     this.zView = zView;
            
            // // update viewportRect
            // this.viewportRect.set(this.xView, this.zView);
            // this.isAnimating = false;

            // if (this._animation) {
            //     const layerGame = <Layer>this.engine.findChildById(Layer.TYPE_GAME);
            //     layerGame.removeAnimation(this._animation);
            //     this._animation = null;
            //     if (swingBackToFollowingTime) {
            //         this.isFollowingEnabled = false;
            //         this._swingBackTimeout = window.setTimeout(() => this.isFollowingEnabled = true, swingBackToFollowingTime);
            //     } 
            // }
        // }

        // keep following the player (or other desired object)
        if (this.isAnimating && this.followingPosition) {
            const following = this.followingPosition;
          
            if (this.axis == AXIS.HORIZONTAL || this.axis == AXIS.BOTH) {
                // moves camera on horizontal axis based on followed object position
                if (following.x - this.xView + this.xDeadZone > this.wView)
                    this.xView = following.x - (this.wView - this.xDeadZone);
                if (following.x - this.xDeadZone < this.xView)
                    this.xView = following.x - this.xDeadZone;
            }
            if (this.axis == AXIS.VERTICAL || this.axis == AXIS.BOTH) {
                // moves camera on vertical axis based on followed object position
                if (following.z - this.zView + this.zDeadZone > this.hView)
                    this.zView = following.z - (this.hView - this.zDeadZone);
                if (following.z - this.zDeadZone < this.zView)
                    this.zView = following.z - this.zDeadZone;
            }

            // update viewportRect
            this.viewportRect.set(this.xView, this.zView);
        }

        // don't let camera leaves the world's boundary
        if (!this.viewportRect.within(this.worldRect)) {
            if (this.viewportRect.left < this.worldRect.left)
                this.xView = this.worldRect.left;
            if (this.viewportRect.top < this.worldRect.top)
                this.zView = this.worldRect.top;
            if (this.viewportRect.right > this.worldRect.right)
                this.xView = this.worldRect.right - this.wView;
            if (this.viewportRect.bottom > this.worldRect.bottom)
                this.zView = this.worldRect.bottom - this.hView;

            // update viewportRect
            this.viewportRect.set(this.xView, this.zView);
        }
    }

    /**
     * 
     * @param positionObject 
     * @param xDeadZone 
     * @param yDeadZone 
     * @param animate 
     */
    public followObject(positionObject: IPosition, xDeadZone: number, yDeadZone: number, animate: boolean = true): void {
        this.followingPosition = positionObject;

        this.xDeadZone = xDeadZone;
        this.zDeadZone = yDeadZone;

        if (animate) {
            this.isAnimating = true;
            const objRef = { x: this.xView, z: this.zView };
            const layerGame = <Layer>this.engine.findChildById(Layer.TYPE_GAME);

            this._animation = layerGame.addAnimation({
                from: objRef,
                to: positionObject,
                easing: Animation.EASE_QUADRATIC_OUT,
                onUpdate: value => {
                    this.xView = value.x - (this.wView / 2);
                    this.zView = value.z - (this.hView / 2);
                },
                onComplete: () => this.isAnimating = false,
                time: 4000
            });
        }
    }

    /**
     * 
     * @param tile 
     */
    public isInViewByTile(tile: ITile): boolean {
        return tile.x >= this.xView &&
            tile.x < this.xView + this.wView &&
            tile.z + tile.h > this.zView &&
            tile.z < this.zView + this.hView;
    }

    /**
     * 
     * @param object 
     */
    public isInViewByContainer(object: Drawable): boolean {
        const position = object.position;
        // console.log(object.height);

        return position.x + object.width > this.xView
            && position.x < this.xView + this.wView
            && position.z - object.height < this.zView + this.hView
        // && position.z > this.zView 
    }

    /**
     * update the camera viewport
     * @param width
     * @param height 
     */
    public updateViewPortSize(width: number, height: number) {
        // viewport cannot get bigger then world
        if (width > this.worldWidth)
            width = this.worldWidth;

        if (height > this.worldHeight)
            height = this.worldHeight;

        this.wView = width;
        this.hView = height;

        this.viewportRect = new Rectangle(this.xView, this.zView, this.wView, this.hView);
    }

    /**
     * rectangle that represents the world's boundary (room's boundary)
     * 
     * @param worldWidth 
     * @param worldHeight 
     */
    public updateWorldSize(worldWidth, worldHeight): void {
        this.worldRect = new Rectangle(0, 0, worldWidth, worldHeight);
    }
}