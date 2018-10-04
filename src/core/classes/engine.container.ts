import { Engine } from "../engine";
import { Camera } from "./engine.camera";
import { Map } from "./engine.map";
import { Layer } from "./engine.layer";
import { Scene } from './engine.scene';
import { Drawable } from "./engine.drawable";

export interface IContainerOptions {
    id?: string;
    order?: number;
    [key: string]: any;
}

export abstract class Container {

    // static counter used for incrementing ID
    public static idCounter: number = 0;

    // each object has a unique ID
    public id: string;

    // set class type
    // TODO - feels like anti-pattern
    public readonly type: string = 'container';

    // the lower the number, the earlier in update/draw loop it will be called
    public order: number = 1;

    // each object has its own 'state', used for custom data
    public state: any = {};

    // each object can have children on its own
    public children: Array<Container> = [];

    // each container has a parent (Scene | Layer | Drawable | Container)
    public parent: Container;

    // lifecycle 
    public isInitialized: boolean = false;
    public isEnabled: boolean = false;
    public isDestroyed: boolean = false;

    /**
     * 
     * @param options 
     */
    constructor(
        public options: IContainerOptions = {},
        public engine?: Engine
    ) {
        this.id = options.id || '__' + Container.idCounter++;
    }

    /**
    * placeholders (optionally overwritten by inheriting class)
    */
    public onInit(): Promise<void> | void { }
    public onUpdate(delta: number, currentTime: DOMHighResTimeStamp, ...args: Array<any>): void { }
    public onDraw(delta: number, currentTime: DOMHighResTimeStamp, context: CanvasRenderingContext2D, camera?: Camera): void { }
    public onDestroy(...args: Array<any>): void { }
    public switchMap(mapId: string): void { } // temp

    /**
     * initialize - called automaticly by addChild()
     */
    public async init(): Promise<void> {
        if (this.isInitialized) throw new Error('already initialized');

        this.isInitialized = true;

        // call super onInit
        await this.onInit();

        // set lifecycle: 'ready'
        this.isEnabled = true;

        // init uninitialized children
        await Promise.all(this.children.filter(child => !child.isInitialized).map(child => child.init()));
    }

    /**
     * update children and call onUpdate()
     * 
     * @param delta 
     * @param currentTime 
     * @param map 
     * @param camera 
     */
    public update(delta: number, currentTime: DOMHighResTimeStamp, map?: Map, camera?: Camera): void {
        for (let i = 0, len = this.children.length; i < len; i++) {
            const child = this.children[i];
            child && child.isEnabled && child.update(delta, currentTime, map, camera);
        }

        this.onUpdate(delta, currentTime, map, camera);
    }

    /**
     * find a child by unique ID
     * @param id 
     */
    public findChildById(id: string, resursive: boolean = true): Container | Drawable | Layer | Scene {
        for (let i = 0, len = this.children.length; i < len; i++) {
            const child = this.children[i];

            if (child.id === id) {
                return child;
            }
            else if (resursive && child.children.length) {
                const subChild = child.findChildById(id);

                if (subChild) return subChild;
            }
        }
    }

    /**
     * add single|multiple children
     * @param children 
     */
    public async addChild(children: Container | Array<Container>, order?): Promise<void> {
        (Array.isArray(children) || (children = [children]));

        // init (if not initialized already)
        for (let i = 0, len = children.length; i < len; i++) {
            const child = children[i];
            child.order = typeof order === 'number' ? order : child.order;
            child.engine = this.engine;
            child.parent = this;
            const index = this.children.findIndex(_child => _child.order > order);
            this.children.splice(index > - 1 ? index : this.children.length, 0, child);
            this.isInitialized && !child.isInitialized && await child.init();
        }
    }

    /**
     * remove a child by instance
     * @param child 
     */
    public removeChild(child: Container | Drawable | Layer | Scene): void {
        if (!child.isDestroyed) child.destroy();

        this.children.splice(this.children.indexOf(child), 1);
    }

    /**
     * remove a child by ID
     * @param id 
     */
    public removeChildById(id: string): void {
        this.removeChild(this.findChildById(id));
    }

    /**
     * remove all gameObject instances
     * TODO - if a gameObject update() func calls remove(All)Object(s) on layer, the update loop of layer breaks
     * because array is changed while still in for() { gameObject.update() } loop
     * so should not remove until update call done??? Or add 'afterUpdate' func? :/
     */
    public clear(): void {
        for (let i = 0, len = this.children.length; i < len; i++)
            !this.children[i].isDestroyed && this.children[i].destroy();

        this.children = [];
    }

    public destroy(data?: any): void {
        this.isDestroyed = true;
        this.isEnabled = this.isInitialized = false;

        this.onDestroy(data);
    }
}