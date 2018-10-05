import { Drawable, IDrawableOptions } from "./engine.drawable";
import { Engine } from "../engine";

export interface ITextOptions extends IDrawableOptions {
    text: string;
    fontSize?: number;
    fontColor?: string;
    fontFamily?: string;
    maxWidth?: number;
}

export class TextWrapper extends Drawable {

    public texture: HTMLImageElement;

    public static readonly DEFAULT_OPTIONS: ITextOptions = {
        text: '',
        fontSize: 40,
        fontColor: 'black',
        fontFamily: 'Arial'
    }

    constructor(public options: ITextOptions, engine?: Engine) {
        super(Object.assign({}, TextWrapper.DEFAULT_OPTIONS, options));

        this.create();
    }

    async create() {
        const context = Engine.tempContext;
        
        // setup font size for measureText()
        context.font = this.options.fontSize + 'px Arial';
        
        // measure bounding box
        const textBounds = context.measureText(this.options.text);
           
        // resize and clear canvas
        context.canvas.width = textBounds.width;
        context.canvas.height = this.options.fontSize;
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        // draw text
        context.textBaseline = 'top';
        context.font = this.options.fontSize + 'px Arial';
        context.fillStyle = this.options.fontColor;
        context.fillText(this.options.text, 0, 0);

        // create image
        this.texture = new Image();
        this.texture.src = context.canvas.toDataURL();
        this.texture.width = textBounds.width;
        this.texture.height = this.options.fontSize;
    }
}