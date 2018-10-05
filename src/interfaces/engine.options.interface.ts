import { IHttpOptions } from "../classes/engine.http";
import { ISocketOptions } from "../classes/engine.socket";

export interface IGameOptions {
    id?: string;
    name?: string;
    devMode?: boolean;
    inputs?: Array<string>;
    element?: string | HTMLElement,
    compile?: {
        webpack?: {
            entry?: Array<string>
        }
    },
    display?: {
        width?: number;
        height?: number;
        stretchMode?: string;
    },
    sound?: {
        enabled?: boolean;
        volume?: number;
    },
    credentials?: {
        token?: string;
        characterId?: string;
    },
    editor?: IHttpOptions;
    api?: IHttpOptions;
    socket?: ISocketOptions;
}