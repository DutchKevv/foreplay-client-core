import { Camera } from "./engine.camera";
import { Drawable, IDrawableOptions } from "./engine.drawable";

export interface ITextInputOptions extends IDrawableOptions {
    value?: string;
    backgroundColor?: string;
    placeholder?: string;
    placeholderColor?: string;
    textColor?: string;
    textSize?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    onClick?(button?: any): void;
}

export const DEFAULT_TEXT_INPUT_OPTIONS = {
    height: 50,
    value: '',
    backgroundColor: 'white',
    placeholder: '',
    placeholderColor: 'grey',
    textColor: 'black',
    textSize: 20,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8
}

export class TextInput extends Drawable {

    public static CURSOR_PADDING: number = 4;

    public value: string = '';
    public isFocused: boolean = true;

    constructor(options: ITextInputOptions) {
        super(Object.assign({}, DEFAULT_TEXT_INPUT_OPTIONS, options));
    }

    onInit() {

    }

    update(delta: number, currentTime: DOMHighResTimeStamp) {
        // check keyboard
        const activeKeyboardKeys = this.engine.controls.activeKeyboard.up;

        for (let key in activeKeyboardKeys) {
            const event = activeKeyboardKeys[key];
            const keyCode = event.keyCode;

            if ((keyCode > 64 && keyCode < 91) // letter keys
                || (keyCode > 47 && keyCode < 58) // number keys
                || (keyCode > 95 && keyCode < 112)) // numpad keys
            {
                if (event.shiftKey)
                    key = key.toUpperCase();

                this.value += key;
            }
        }

        if (activeKeyboardKeys.backspace) {
            this.value = this.value.slice(0, -1);
        }

        super.draw(delta, currentTime);
    }

    draw(delta: number, currentTime: DOMHighResTimeStamp, context?: CanvasRenderingContext2D, camera?: Camera) {
        const options = this.options;

        context.fillStyle = options.backgroundColor;
        context.fillRect(options.position.x, options.position.y, this.width, this.height);

        context.font = options.textSize + 'px Arial';
        context.textBaseline = 'top';

        // placeholder
        if (this.value) {
            context.textAlign = "left";
            context.fillStyle = options.textColor;
            context.fillText(this.value, options.position.x + options.paddingLeft, options.position.y + (this.height / 4));
        }

        else if (options.placeholder) {
            context.textAlign = "center";
            context.fillStyle = options.placeholderColor;
            context.fillText(options.placeholder, options.position.x + (this.width / 2), options.position.y + (this.height / 4));
        }

        // draw blinking cursor
        if (this.isFocused && new Date().getSeconds() % 2 === 0) {
            context.beginPath();
            context.fillStyle = 'red';
            context.lineWidth = 2;

            if (this.value) {
                const textWidth = context.measureText(this.value).width;
                context.moveTo(textWidth + options.paddingLeft + TextInput.CURSOR_PADDING, this.position.y + options.paddingTop + TextInput.CURSOR_PADDING);
                context.lineTo(textWidth + options.paddingLeft + TextInput.CURSOR_PADDING, this.position.y + this.height - options.paddingBottom - TextInput.CURSOR_PADDING);
            } else {
                context.moveTo(this.position.x + options.paddingLeft, this.position.y + options.paddingTop);
                context.lineTo(this.position.x + options.paddingLeft, this.position.y + this.height - options.paddingBottom);
            }
            context.stroke();
        }

        super.draw(delta, currentTime, context, camera);
    }
}