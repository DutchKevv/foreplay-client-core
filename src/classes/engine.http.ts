import { Container } from "./engine.container";
import { Engine } from "../engine";

export interface IHttpOptions {
    host?: string;
    port?: string | number;
    protocol?: string;
    prefix?: string;
    fullUrl?: string;
}

// Camera constructor
export class Http extends Container {

    constructor(options: IHttpOptions, engine: Engine) {
        super(options, engine);
    }

    async get(url: string, options: any = {}): Promise<Response> {
        const fetchOptions = {
            query: options.query || {},
            headers: {
                authorization: 'Bearer ' + this.engine.options.credentials.token
            }
        }

        const response = await fetch(this.buildUrl(url), fetchOptions);

        return response.json();
    }

    async post(url: string, options: any, editor: boolean = false): Promise<Response> {
        const fetchOptions = {
            method: 'POST',
            query: options.query || {},
            body: options.body,
            headers: {
                authorization: 'Bearer ' + this.engine.options.credentials.token
            }
        }

        if (!(options.body instanceof FormData)) {
            fetchOptions.headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(options.body)
        }

        const response = await fetch(this.buildUrl(url, editor), fetchOptions);

        return response.json();
    }

    public async put(url: string, options: any, editor: boolean = false) {
        const fetchOptions = {
            method: 'PUT',
            query: options.query || {},
            body: options.body,
            headers: {
                authorization: 'Bearer ' + this.engine.options.credentials.token
            }
        }

        if (!(options.body instanceof FormData)) {
            fetchOptions.headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(options.body)
        }

        const response = await fetch(this.buildUrl(url, editor), fetchOptions);

        return response.json();
    }

    delete(url: string, options: any) {

    }

    buildUrl(url: string, editor: boolean = false) {
        const serverConfig = editor ? this.engine.options.editor : this.engine.options.api;
        url = `${serverConfig.protocol}//${serverConfig.host}${serverConfig.port ? ':' + serverConfig.port : ''}${serverConfig.prefix}${url}`;

        // remove double slashes
        return url.replace(/([^:]\/)\/+/g, "$1");
    }
}