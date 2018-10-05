import { Container } from "./engine.container";
import { IPosition } from "@foreplay/shared/interfaces/position.interface";
import { Camera } from "./engine.camera";
import { Drawable } from "./engine.drawable";
import { IMouseEvent } from "./engine.controls";
import { TextWrapper } from './engine.text';

export interface IButtonOptions {
    text?: string;
    textAlign?: string;
    onClick?: Function;
    position?: IPosition;
    width?: number;
    height?: number;
    backgroundColor?: string;
    fontColor?: string;
    fontSize?: number;
    data?: any;
    clickSound?: string | HTMLAudioElement;
    mouseOverBackgroundColor?: string;
    mouseOverFontColor?: string;
}

export const DEFAULT_BUTTON_OPTIONS: IButtonOptions = {
    text: '',
    position: { x: 0, y: 0, z: 0 },
    height: 50,
    backgroundColor: 'red',
    fontColor: 'black',
    fontSize: 20,
    data: {},
    clickSound: '/sounds/button_click.mp3',
    textAlign: 'center',
    mouseOverBackgroundColor: 'purple',
    mouseOverFontColor: 'white',
}

export class Button extends Drawable {

    public options: IButtonOptions;

    private _drawConfig: any;
    private _textTexture: TextWrapper;

    constructor(options: IButtonOptions) {
        super(Object.assign({}, DEFAULT_BUTTON_OPTIONS, options));
    }

    public async init() {
        // get sound
        if (this.options.clickSound) {
            if (typeof this.options.clickSound === 'string') {
                this.options.clickSound = <HTMLAudioElement>await this.engine.assets.load(this.options.clickSound);
            }
        }
 
        super.init();

        this.initTextTexture();
        this.initDrawConfig();
    }

    public initDrawConfig() {
        const drawConfig = this._drawConfig = this._drawConfig || {};
        drawConfig.backgroundColor = this.options.backgroundColor;
        drawConfig.position = this.position;
        drawConfig.textPositionX = this.position.x + (this.width / 2) - (this._textTexture.texture.width / 2);
        drawConfig.textPositionY = this.position.y + (this.height / 4);
        drawConfig.textAlign = this.options.textAlign;
        drawConfig.font = this.options.fontSize + 'px Arial';
    }

    public initTextTexture() {
        this._textTexture = new TextWrapper({
            text: this.options.text,
            fontSize: this.options.fontSize,
            fontColor: this.options.fontColor
        });
    }

    public click(event: IMouseEvent) {
        if (this.options.clickSound)
            (<HTMLAudioElement>this.options.clickSound).play();

        super.click(event);
    }

    public mouseEnter(event: IMouseEvent) {
        this._drawConfig.fontColor = this.options.mouseOverFontColor;
        this._drawConfig.backgroundColor = this.options.mouseOverBackgroundColor;
        super.mouseEnter(event);
    }

    public mouseLeave(event: IMouseEvent) {
        this._drawConfig.fontColor = this.options.fontColor;
        this._drawConfig.backgroundColor = this.options.backgroundColor;
        super.mouseLeave(event);

    }

    public draw(delta: number, currentTime: DOMHighResTimeStamp, context?: CanvasRenderingContext2D, camera?: Camera) {
        if (!this._drawConfig) this.initDrawConfig();

        const drawConfig = this._drawConfig;

        // background
        context.fillStyle = drawConfig.backgroundColor;
        context.fillRect(drawConfig.position.x, drawConfig.position.y, this.width, this.height);

        // text
        if (this._textTexture)
            context.drawImage(this._textTexture.texture, drawConfig.textPositionX, drawConfig.textPositionY);
    }
}