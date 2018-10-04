import throttle from 'lodash-es/throttle';
import * as EventEmitter from 'events';
import { Socket } from "./classes/engine.socket";
import { Controls } from "./classes/engine.controls";
import { Assets } from './classes/engine.assets';
import { Player } from "./classes/engine.player";
import { IGameOptions } from '../../../shared/interfaces/game.options.interface';
import { Http } from './classes/engine.http';
import { DEFAULT_ENGINE_CONFIG } from './engine.options.default';
import { IState } from './interfaces/state.interface';
import { Drawable } from './classes/engine.drawable';

export class Engine extends Drawable {

    // to be used as temp drawing context
    public static readonly tempContext: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d');

    public get isRunning(): boolean {
        return !!this._requestAnimationFrameTimer;
    }

    public isDevMode: boolean = !process.env.NODE_ENV.startsWith('prod');
    public element: HTMLElement;
    public canvasElement: HTMLElement;
    public events: EventEmitter = new EventEmitter();
    public assets: Assets = new Assets({}, this);
    public http: Http = new Http({}, this);
    public socket: Socket = new Socket({}, this);
    public controls: Controls = new Controls({}, this);
    public state: IState = {
        game: {}
    };

    private _lastFrameTime: DOMHighResTimeStamp;
    private _requestAnimationFrameTimer: number;
    private _resizeThrottled: Function = throttle(this.resize, 100).bind(this);

    constructor(options: IGameOptions) {
        super(Object.assign({}, DEFAULT_ENGINE_CONFIG, options));
        console.log('options optionsoptions', options);
        this.width = this.options.display.width;
        this.height = this.options.display.height;
        this.engine = this;

        if (this.isDevMode)
            console.info('running in dev mode');
    }

    public async init(): Promise<void> {

        // set wrapper HTML
        this.setupDOM();

        // listen for input events
        this.controls.setListeners();

        // listen for resize events
        window.addEventListener('resize', <EventListenerOrEventListenerObject>this._resizeThrottled, { passive: true });

        return super.init();
    }

    public start(): void {
        // store global game (for editor)
        if (!window['game']) window['game'] = this;

        // set first frame timestamp
        this._lastFrameTime = performance.now();

        // start looping
        this._requestAnimationFrameTimer = requestAnimationFrame(() => this.tick());
    }

    public stop(): void {
        cancelAnimationFrame(this._requestAnimationFrameTimer);
        this._requestAnimationFrameTimer = null;
    }

    public tick(): void {
        const currentTime = performance.now();
        const delta = (currentTime - this._lastFrameTime) / 1000;
        this._lastFrameTime = currentTime;

        // update
        this.update(delta, currentTime);

        // clear input before draw to force using input at update cycle
        this.controls.clear();

        // draw
        this.draw(delta, currentTime);

        // request next animation frame
        this._requestAnimationFrameTimer = requestAnimationFrame(() => this.tick());
    }

    /**
     * 
     * @param player 
     */
    public async setPlayerSelf(player: Player): Promise<void> {
        if (this.state.game.player) throw Error('Player already set');

        this.state.game.player = player;
    }

    /**
     * 
     * @param width 
     * @param height 
     */
    public switchResolution(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.resize();
    }

    public switchStretchMode(x, y) {

    }

    public setupDOM(): void {
        if (this.element) throw Error('element already set')

        if (this.options.element instanceof HTMLElement) {
            this.element = this.options.element;
        }
        else if (typeof this.options.element === 'string') {
            this.element = document.querySelector(this.options.element);
        }

        if (!this.element) {
            this.element = document.body;
        }

        if (this.isDevMode) {
            const wrapper = <HTMLElement>new DOMParser().parseFromString(HTML_DEV, 'text/html').body.children[0];
            this.element.appendChild(wrapper);
            this.element = wrapper;
        }

        this.canvasElement = this.element.querySelector('.canvas-wrapper');
        this.element.style.width = this.element.style.height = '100%';
    }

    public requestFullScreen(): void {
        /* Get the documentElement (<html>) to display the page in fullscreen */
        const elem = <any>document.documentElement;

        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
    }

    public closeFullScreen(): void {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document['mozCancelFullScree']) { /* Firefox */
            document['mozCancelFullScreen']();
        } else if (document['webkitExitFullscreen']) { /* Chrome, Safari and Opera */
            document['webkitExitFullscreem']();
        } else if (document['msExitFullscreen']) { /* IE/Edge */
            document['msExitFullscreen']();
        }
    }

    public destroy(): void {
        this.stop();

        super.destroy();

        if (this.element.parentNode)
            this.element.parentNode.removeChild(this.element);
    }
}

const HTML_DEV = `
    <div class="game-wrapper">
        <div class="canvas-wrapper"></div>
    </div>
`