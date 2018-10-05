// import * as TWEEN from '@tweenjs/tween.js';

export interface IAnimationOptions {
    from: any;
    to: any;
    time?: number;
    delay?: number;
    easing?: any;
    yoyo?: boolean;
    repeat?: any;
    noAutoStart?: boolean;
    noAutoRemove?: boolean;
    onStart?(): any;
    onStop?(): any;
    onUpdate?(value: any): any;
    onComplete?(): any;
}

export interface IAnimation {
    isComplete?: boolean;
    from: any;
    to: any;
    time?: number;
    delay?: number;
    easing?: any;
    yoyo?: boolean;
    repeat?: any;
    noAutoStart?: boolean;
    noAutoRemove?: boolean;
    onStart?(): any;
    onStop?(): any;
    onUpdate?(value: any): any;
    onComplete?(): any;
}

// export interface IAnimation extends TWEEN.Tween {
//     isComplete?: boolean;
// }