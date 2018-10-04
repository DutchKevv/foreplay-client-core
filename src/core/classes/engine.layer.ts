import { Camera } from './engine.camera';
import { Map } from './engine.map';
import { Drawable } from './engine.drawable';
import { Controls } from './engine.controls';

export class Layer extends Drawable {

    static readonly TYPE_CUSTOM = '@@custom';
    static readonly TYPE_MENU = '@@menu';
    static readonly TYPE_GAME = '@@main';
    static readonly TYPE_HUD = '@@hud';
    static readonly TYPE_DEV = '@@dev';

    public readonly type: string = 'layer';

    public autoClear: boolean = true;

    public controls: Controls;

    // reference to map
    public map: Map;

    // reference to camera
    public camera: Camera;

    // this object scale/zoom
    // TODO - should be moved to Scene?? (Whole scene zooms in, not just one object... ?)
    public scale = 1;

    // this object stretch 
    // TOO - should be moved to Scene?? (Whole scene stretches, not just one object... ?)
    public stretch: any = { w: 1, h: 1 };

    public init(): Promise<void> {
        this.layer = this;
        this.setElement();
        return super.init();
    }

    public draw(delta: number, time: DOMHighResTimeStamp) {
        const context = this.context;

        if (context) {
            context.save();
            context.clearRect(0, 0, this.width, this.height);
            context.scale(this.scale, this.scale) // zoom in / out
        }
       
        super.draw(delta, time, context, this.camera);

        context && context.restore();
    }

    public addChild(children, order?: number) {
        (Array.isArray(children) || (children = [children]));

        for (let i = 0, len = children.length; i < len; i++) {
            children[i].scene = this.scene;
            children[i].layer = this;
        }

        return super.addChild(children, order);
    }

    public resize(width: number = this.width || (<Drawable>this.parent).width || this.engine.width, height: number = this.height || (<Drawable>this.parent).height || this.engine.height) {
        if (this.element instanceof HTMLCanvasElement) {
            this.element.width = width;
            this.element.height = height;
        }

        const boundingClientRect = <DOMRect>this.element.getBoundingClientRect();

        this.offset.x = boundingClientRect.x;
        this.offset.y = boundingClientRect.y;

        this.stretch.w = width / boundingClientRect.width;
        this.stretch.h = height / boundingClientRect.height;

        super.resize(width, height);
    }

    public calculateOffset() {
        const boundingClientRect = <DOMRect>this.element.getBoundingClientRect();

        this.offset.x = boundingClientRect.x;
        this.offset.y = boundingClientRect.y;
    }

    public setElement(): void {
        if (this.options.type === 'html') {
            this.element = this.options.element || document.createElement('div');
            return;
        }

        else if (this.options.element instanceof HTMLCanvasElement) {
            this.element = this.options.element;
        }

        else if (!this.options.element) {
            this.element = document.createElement('canvas');
        }

        else {
            throw new Error('No canvas element or constant option given');
        }

        // apply css styles and store context ref
        if (this.element instanceof HTMLCanvasElement) {
            this.element.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; height: 100%;';

            if (this.style.center)
                this.element.style.margin = '0 auto';

            this.context = this.element.getContext('2d', { alpha: this.style.alpha });
        }

        this.element.setAttribute('data-layer-id', this.id);

        // add to DOM
        if (!this.element.parentNode) {
            const canvases = this.engine.canvasElement.querySelectorAll('canvas');
            this.engine.canvasElement.insertBefore(this.element, canvases[canvases.length - 1]);
        }
    }

    public toggle(state?: boolean) {
        this.isEnabled = typeof state === 'boolean' ? state : !this.isEnabled;

        this.element.style.display = this.isEnabled ? 'block' : 'none';
    }

    public destroy(): void {
        super.destroy();

        // remove (canvas) element from DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}