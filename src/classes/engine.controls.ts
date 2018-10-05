import throttle from 'lodash-es/throttle';
import { Engine } from "../engine";
import { Container } from './engine.container';
import { Drawable } from './engine.drawable';
import { Button } from './engine.button';

export interface IMouseEvent {
    event: MouseEvent,
    x: number,
    y: number
}

export class Controls extends Container {

    public static readonly hasTouch: boolean = !!('ontouchstart' in window || navigator.maxTouchPoints);
    public static readonly hasMouse: boolean = matchMedia('(pointer:fine)').matches;
    public static readonly mouseWheelThrottleLimit: number = 33; // max 60FPS

    public readonly activeKeyboard: { up: { [key: string]: KeyboardEvent }, down: { [key: string]: KeyboardEvent } } = {
        up: {},
        down: {}
    };

    public readonly activeMouse: { [key: string]: { x: number, y: number, event: MouseEvent | WheelEvent, up?: boolean } } = {};
    public readonly activeTouch: { [key: string]: { x: number, y: number, event: TouchEvent } } = {};

    public element: HTMLElement;
    public isListening: boolean = false;

    private _onMouseWheelThrottled = throttle(this._onMouseWheelListener, Controls.mouseWheelThrottleLimit, { 'trailing': false }).bind(this);

    constructor(public options: any = {}, public engine?: Engine) {
        super(options, engine);

        this.options.keyboardKeys = this.options.keyboardKeys || DEFAULT_KEYBOARD_KEYS;
        this.options.mouseKeys = this.options.mouseKeys || DEFAULT_MOUSE_KEYS;
        this.options.touchKeys = this.options.touchKeys || DEFAULT_TOUCH_KEYS;
    }

    public setListeners(): void {
        this.element = this.options.element || this.engine.element;

        const inputs = this.engine.options.inputs;

        // so always bind even if its a touch device
        if (inputs.includes('all') || inputs.includes('keyboard'))
            this._setKeyboardListeners();

        if (Controls.hasMouse && (inputs.includes('all') || inputs.includes('mouse')))
            this._setMouseListeners();

        if (Controls.hasTouch && (inputs.includes('all') || inputs.includes('touch')))
            this._setTouchListeners();

        this.isListening = true;
    }

    public clear(): void {
        // keyboard
        this.activeKeyboard.up = {};

        // mouse
        delete this.activeMouse.click;
        delete this.activeMouse.up;
        delete this.activeMouse.move;
        
        // mouse wheel
        delete this.activeMouse.wheel;
        
        // touch
        delete this.activeTouch.end;
    }

    /**
     * KEYBOARD LISTENERS
     */
    private _setKeyboardListeners(): void {
        window.addEventListener('keydown', (event) => {
            const keyObj = this.options.keyboardKeys[event.keyCode];

            if (keyObj) {
                this.activeKeyboard.down[keyObj.name] = event;
            }
        }, { passive: true });

        window.addEventListener('keyup', (event) => {
            const keyObj = this.options.keyboardKeys[event.keyCode];

            if (keyObj) {
                delete this.activeKeyboard.down[keyObj.name];
                this.activeKeyboard.up[keyObj.name] = event;
            }

        }, { passive: true });
    }

    /**
     * MOUSE LISTENERS
     */
    private _setMouseListeners(): void {
        this.element.addEventListener('mousedown', (event: MouseEvent) => {
            if ((<HTMLElement>event.target).tagName !== 'CANVAS') return;

            this.activeMouse.down = <IMouseEvent>{
                event,
                x: event.pageX,
                y: event.pageY
            };
        }, { passive: true });

        this.element.addEventListener('mouseup', (event: MouseEvent) => {
            if ((<HTMLElement>event.target).tagName !== 'CANVAS') return;

            delete this.activeMouse.down;
            delete this.activeMouse.move;
            this.activeMouse.up = <IMouseEvent>{
                event,
                x: event.pageX,
                y: event.pageY
            };

            this._checkMouseClickedObjects(this.activeMouse.up);
        }, { passive: true });

        this.element.addEventListener('mousemove', (event: MouseEvent) => {
            if ((<HTMLElement>event.target).tagName !== 'CANVAS') return;

            this.activeMouse.move = <IMouseEvent>{
                event,
                x: event.pageX,
                y: event.pageY
            };

            this._checkMouseMoveObjects(this.activeMouse.move);
        }, { passive: true });

        this.element.addEventListener('click', (event: MouseEvent) => {
            if ((<HTMLElement>event.target).tagName !== 'CANVAS') return;

            delete this.activeMouse.down;
            delete this.activeMouse.move;
            this.activeMouse.click = <IMouseEvent>{
                event,
                x: event.pageX,
                y: event.pageY
            };
        }, { passive: true });

        this.element.addEventListener('mousewheel', this._onMouseWheelThrottled, { passive: true });
    }

    /**
     * TOUCH LISTENERS
     */
    private _setTouchListeners(): void {
        this.element.addEventListener('touchstart', (event: TouchEvent) => {
            this.activeTouch.start = {
                event,
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }, { passive: true });

        this.element.addEventListener('touchmove', (event: TouchEvent) => {
            delete this.activeTouch.start;

            this.activeTouch.move = {
                event,
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };

            event.preventDefault();
        }, { passive: true });

        this.element.addEventListener('touchend', (event: TouchEvent) => {
            delete this.activeTouch.start;
            delete this.activeTouch.move;

            this.activeTouch.end = {
                event,
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }, { passive: true });
    }

    public removeListener(): void {

    }

    public removeAllListeners(): void {

    }

    public removeAllMouseListeners(): void {

    }

    public removeAllKeyBoardListeners(): void {

    }

    public removeAllTouchListeners(): void {

    }

    /**
     * 
     * TODO - Should probably not be here.. Engine class ?
     * 
     * @param event 
     * @param children 
     */
    private _checkMouseClickedObjects(event: IMouseEvent, children?: Array<Drawable>) {
        children = children || <Array<Drawable>>this.engine.children;

        for (let i = 0, len = children.length; i < len; i++) {
            const child = children[i];

            // only enabled objects with onclick function
            if (!child.isEnabled || !child.position) continue;

            const worldXZ = child.getRelativeXZFromScreenXY(event.x, event.y);

            if (worldXZ.x > child.offset.x &&
                worldXZ.x < child.offset.x + child.width &&
                worldXZ.z > child.offset.y &&
                worldXZ.z < child.offset.y + child.height) {

                child.click(event)
            }

            if (child.children.length)
                this._checkMouseClickedObjects(event, <Array<Drawable>>child.children);
        }
    }

    /**
     * 
     * TODO - Should probably not be here.. Engine class ?
     * 
     * @param event 
     * @param children 
     */
    private _checkMouseMoveObjects(event: IMouseEvent, children?: Array<Drawable>) {
        children = children || <Array<Drawable>>this.engine.children;

        for (let i = 0, len = children.length; i < len; i++) {
            const child = children[i];

            // only enabled objects with onclick function
            if (!child.isEnabled || !child.position) continue;

            const worldXZ = child.getRelativeXZFromScreenXY(event.x, event.y);

            if (worldXZ.x > child.offset.x &&
                worldXZ.x < child.offset.x + child.width &&
                worldXZ.z > child.offset.y &&
                worldXZ.z < child.offset.y + child.height) {

                child.mouseEnter(event)
            }
            else if (child.isMouseOver) {
                child.mouseLeave(event);
            }

            if (child.children.length)
                this._checkMouseMoveObjects(event, <Array<Drawable>>child.children);
        }
    }

    private _onMouseWheelListener(event: MouseWheelEvent) {
        if ((<HTMLElement>event.target).tagName !== 'CANVAS') return;

        this.activeMouse.mousewheel = {
            event,
            up: event.wheelDelta < 0,
            x: event.pageX,
            y: event.pageY
        };

        return false;
    }
}

const DEFAULT_KEYBOARD_KEYS = {
    8: {
        name: 'backspace'
    },
    17: {
        name: 'ctrl'
    },
    27: {
        name: 'escape'
    },
    32: {
        name: 'space'
    },
    37: {
        name: 'left',
    },
    38: {
        name: 'up',
    },
    39: {
        name: 'right',
    },
    40: {
        name: 'down',
    },
    46: {
        name: 'delete'
    },
    65: {
        name: 'a'
    },
    66: {
        name: 'b'
    },
    67: {
        name: 'c'
    },
    68: {
        name: 'd'
    },
    69: {
        name: 'e'
    },
    70: {
        name: 'f'
    },
    71: {
        name: 'g'
    },
    72: {
        name: 'h'
    },
    73: {
        name: 'i'
    },
    74: {
        name: 'j'
    },
    75: {
        name: 'k'
    },
    76: {
        name: 'l'
    },
    77: {
        name: 'm'
    },
    78: {
        name: 'n'
    },
    79: {
        name: 'o'
    },
    80: {
        name: 'p'
    },
    81: {
        name: 'q'
    },
    82: {
        name: 'r'
    },
    83: {
        name: 's'
    },
    84: {
        name: 't'
    },
    85: {
        name: 'u'
    },
    86: {
        name: 'v'
    },
    87: {
        name: 'w'
    },
    88: {
        name: 'x'
    },
    89: {
        name: 'y'
    },
    90: {
        name: 'z'
    },
    191: {
        name: 'slash'
    }
};

const DEFAULT_MOUSE_KEYS = {
    mousedown: {
        name: 'down'
    },
    mousemove: {
        name: 'move'
    },
    mouseup: {
        name: 'up'
    },
    mousewheel: {
        name: 'wheel'
    },
    click: {
        name: 'click'
    }
}

const DEFAULT_TOUCH_KEYS = {
    touchstart: {
        name: 'start'
    },
    touchmove: {
        name: 'move'
    },
    touchend: {
        name: 'end'
    }
}