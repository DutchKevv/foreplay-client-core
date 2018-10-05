import { Drawable, IDrawableOptions } from "../engine.drawable";
import { Camera } from "../engine.camera";
import { Engine } from "../../engine";

export interface IArrowOptions extends IDrawableOptions {
    headSize?: number;
    angle?: number;
}

export class Arrow extends Drawable {

    public static readonly DEFAULT_OPTIONS: IArrowOptions = {
        headSize: 80,
        angle: 0
    }

    constructor(options: IArrowOptions, engine?: Engine) {
        super(Object.assign({}, Arrow.DEFAULT_OPTIONS, options), engine);

        this.width = Math.abs(this.position.x - this.options.toPosition.x);
        this.height = this.options.headSize;
    }

    async init() {
        await super.init();

    }

    draw(delta: number, currentTime: DOMHighResTimeStamp, context: CanvasRenderingContext2D, camera: Camera) {
        const fromX = this.position.x;
        const fromY = this.position.y;
        const toX = this.options.toPosition.x;
        const toY = this.options.toPosition.y;
        const correctionX = fromX > toX ? this.width : 0;
        const correctionY = this.options.headSize / 2;

        var headlen = this.options.headSize;

        var angle = Math.atan2(toY - fromY, toX - fromX);

        context.translate(correctionX, correctionY);

        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        context.strokeStyle = "#cc0000";
        context.lineWidth = 22;
        context.stroke();

        //starting a new path from the head of the arrow to one of the sides of the point
        context.beginPath();
        context.moveTo(toX, toY);
        context.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7));

        //path from the side point of the arrow, to the other side point
        context.lineTo(toX - headlen * Math.cos(angle + Math.PI / 7), toY - headlen * Math.sin(angle + Math.PI / 7));

        //path from the side point back to the tip of the arrow, and then again to the opposite side point
        context.lineTo(toX, toY);
        context.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7));

        //draws the paths created above
        context.strokeStyle = "#cc0000";
        context.lineWidth = 22;
        context.stroke();
        context.fillStyle = "#cc0000";
        context.fill();
        context.translate(-correctionX, -correctionY);
    }
}