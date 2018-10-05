import { Layer } from "./engine.layer";

export class Popup extends Layer {
    
    constructor(options?) {
        super(options);
    }

    onInit() {
        
    }

    onUpdate() {

    }

    onDraw(delta, context, camera) {
        this.context.fillStyle = 'black';
        this.context.fillRect(100, 100, 400, 400);

        this.context.fillStyle = 'white';
        this.context.fillText('safdfd', 110, 110)
    }

    onDestroy() {
        
    }
}