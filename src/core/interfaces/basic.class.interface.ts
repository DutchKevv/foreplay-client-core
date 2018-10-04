import { Engine } from "../engine";
import { Map } from "../classes/engine.map";
import { Camera } from "../classes/engine.camera";

export interface OnInit {
    onInit(asdfsf: string): Promise<void> | void;
}

export interface OnUpdate {
    onUpdate(delta: number, currentTime: DOMHighResTimeStamp, ...args: Array<any>) : void
}

export interface OnDraw {
    onDraw(delta: number, currentTime: DOMHighResTimeStamp, map: Map, camera: Camera) : void;
}

export interface OnDestroy {
    onDestroy(...args: Array<any>) : void;
}