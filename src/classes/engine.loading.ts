import { Container } from "./engine.container";

export class LoadingAnimation extends Container {

    public amountDone = 0;
    
    constructor(public options) {
        super(options)
    }

    onDraw() {
        
    }
}