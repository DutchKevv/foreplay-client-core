// start of seperate 'editor' bundle (a.k. for webpack)
import 'jquery';
import 'popper.js';
import 'bootstrap';
import { Engine } from '../core/engine';
import { EditorLayer } from './editor.layer';
import { Layer } from '../core/classes/engine.layer';

let game: Engine;
let isDevModeEnabled = false;

// check if game has started
const timer = window.setInterval(async () => {
    game = window['game'];

    if (game && game.isRunning) {
        clearInterval(timer);
        toggleDevMode(true);
    }
}, 100);

export async function toggleDevMode(state?: boolean) {
    if (isDevModeEnabled === state)
        return;

    isDevModeEnabled = typeof state === 'boolean' ? state : !isDevModeEnabled;

    if (isDevModeEnabled) {
        game.element.classList.add('dev');
        await game.addChild(new EditorLayer({ type: 'html', id: Layer.TYPE_DEV }), 1000000);
    } else {
        game.element.classList.remove('dev');
        await game.removeChildById(Layer.TYPE_DEV);
    }

    game.resize();
}