import * as socketIOClient from 'socket.io-client';
import { Engine } from '../engine';
import { ISocketConnectOptions } from '../../../../shared/interfaces/socket.interface';
import { Container } from './engine.container';

const DEFAULT_CONNECT_OPTIONS: ISocketConnectOptions = {
    host: window.location.hostname,
    port: window.location.port,
    secure: window.location.protocol === 'https:',
    protocol: <any>window.location.protocol,
    reconnectionAttempts: 10000,
    timeout: 10000,
    autoConnect: true,
    transports: ['polling', 'websocket']
}

export class Socket extends Container {

    public isConnected: boolean = false;
    private _socket: SocketIOClient.Socket = null;

    constructor(options?: any, engine?: Engine) {
        super(Object.assign({}, engine.options.socket, options), engine);
    }

    public connect(): Promise<void> {;
        return new Promise((resolve, reject) => {
            let isResolved = false;

            if (this.isConnected) {
                throw new Error('socket already connected')
            }

            // merge given connect options with defaults
            const token = this.engine.options.credentials.token;
            const cId = this.engine.options.credentials.characterId;
            const connectOptions = Object.assign({}, DEFAULT_CONNECT_OPTIONS, this.engine.options.socket, { query: { token, cId } });
            const connectUrl = `${connectOptions.protocol}//${connectOptions.host}${connectOptions.port ? ':' + connectOptions.port : ''}`;

            // open connection
            this._socket = socketIOClient(connectUrl, connectOptions);

            // TODO - fire event
            this._socket.on('connect', () => {
                console.info('socket.io connected');
                this.isConnected = true;
                if (!isResolved) {
                    isResolved = true;
                    resolve();
                }
            });

            this._socket.on('disconnect', () => {
                console.warn('socket disconnected');
                this.isConnected = false;
            });

            this._socket.on('connect_error', function () {
                if (!isResolved) {
                    isResolved = true;
                    reject();
                }
            });
        });
    }

    /**
     * close connection to server
     */
    public disconnect(): void {
        this._socket.disconnect();
        this._socket = null;
    }

    public on(eventName: string, callback: Function): void {
        this._socket.on(eventName, callback);
    }

    public off(eventName: string): void {
        this._socket.off(eventName);
    }

    public emit(eventName: string, data?: any, callback?: Function): void {
        this._socket.emit(eventName, data, callback);
    }
}