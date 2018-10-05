import { IGameOptions } from "./interfaces/engine.options.interface";


export const DEFAULT_ENGINE_CONFIG: IGameOptions = Object.freeze(<IGameOptions>{
    devMode: true,
    element: document.body,
    inputs: ['all'],
    display: {
        width: 800,
        height: 600,
        stretchMode: 'stretch',
    },
    sound: {
        enabled: true,
        volume: 0.7
    },
    credentials: {
        token: null,
        characterId: null
    },
    editor: {
        host: window.location.hostname,
        port: window.location.port,
        protocol: window.location.protocol,
        prefix: '/editor/v1/'
    },
    api: {
        host: window.location.hostname,
        port: window.location.port,
        protocol: window.location.protocol,
        prefix: '/api/v1/'
    },
    socket: {
        host: window.location.hostname,
        port: window.location.port,
        protocol: window.location.protocol,
        secure: true,
        path: '/io/game'
    }
});