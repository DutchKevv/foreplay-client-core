import { Camera } from './engine.camera';
import { Drawable } from './engine.drawable';

export class Sprite extends Drawable {

    private _maxFrames: number = 1;
    private _currentFrame: number = 0;
    private _img: HTMLImageElement = null;
    private _lastFrame: number = 0;

    private drawWidth;
    private drawHeight;

    constructor(options) {
        super(options);
    }

    async init() {
        this._img = this.options.img || await this.engine.assets.load(this.options.imgUrl);

        this._maxFrames = this.options.maxFrames || 1;
        this.width = this.options.width || this._img.width;
        this.height = this.options.height || this._img.height;
        this.drawWidth = this.options.drawWidth || this.width;
        this.drawHeight = this.options.drawHeight || this.height;
        this.behavior = this.options.behavior || {};
        this._lastFrame = performance.now();

        return super.init();
    }

    /**
     * 
     * @param delta 
     * @param currentTime 
     * @param context 
     * @param camera 
     */
    public draw(delta: number, currentTime: DOMHighResTimeStamp, context: CanvasRenderingContext2D, camera: Camera) {
        context.drawImage(
            this._img,
            this._currentFrame * this.width,
            0,
            this.width,
            this.height,
            this.position.x - camera.xView,
            this.position.z - camera.zView,
            this.drawWidth,
            this.drawHeight
        );
        
        if (this._maxFrames > 1 && this._lastFrame + (600 / this._maxFrames) < currentTime) {
            if (++this._currentFrame > this._maxFrames)
                this._currentFrame = 0;

            this._lastFrame = currentTime;
        }

        super.draw(delta, currentTime, context, camera);
    }
}