import { ITileMap } from "@foreplay/shared/interfaces/tilemap.interface";
import { spriteToImg } from "../util/engine.util.image";
import { Container } from "./engine.container";

export class Assets extends Container {

    public static cache = {};

    public static clearCache(): void {
        Assets.cache = {};
    }

    /**
     * 
     * @param url 
     */
    public getCached(url: string): any {
        return Assets.cache[this.normalizeUrl(url)];
    }

    /**
     * 
     * @param tileMapName 
     * @param cache 
     * @param reload 
     */
    public async loadTiles(tileMapName: string, cache: boolean = true, reload: boolean = false): Promise<ITileMap> {
        const url = this.normalizeUrl(tileMapName);

        if (!reload && Assets.cache[url])
            return Assets.cache[url];

        const tileMap: [ITileMap, HTMLImageElement] = await Promise.all([
            this.load(tileMapName + '.json', cache, reload),
            this.load(tileMapName + '.png', cache, reload)
        ]);

        // split tilemap to images
        for (let i = 0, len = tileMap[0].tiles.length; i < len; i++) {
            const tile = tileMap[0].tiles[i];
            if (tile.frame)
                tile.imgEl = spriteToImg(tile, this.engine);
        }

        Assets.cache[url] = tileMap[0];

        return tileMap[0];
    }

    /**
     * 
     * @param url 
     * @param cache 
     * @param reload 
     */
    public load(url: string, cache: boolean = true, reload: boolean = false): Promise<Response | HTMLElement> | any {
        const normalizedUrl = this.normalizeUrl(url);

        if (!reload && Assets.cache[normalizedUrl])
            return Assets.cache[normalizedUrl];

        return new Promise((resolve, reject) => {
            const fileExtension = normalizedUrl.split('.').pop();

            switch (fileExtension) {
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'bmp':
                    const img = new Image();
                    img.onload = () => {
                        if (cache) {
                            Assets.cache[normalizedUrl] = img;
                        }
                        resolve(img);
                    }
                    img.crossOrigin = "Anonymous"
                    img.onerror = reject;
                    img.src = normalizedUrl;
                    break;
                case 'mp3':
                    const audio = new Audio();
                    audio.load = () => {
                        if (cache) {
                            Assets.cache[normalizedUrl] = audio;
                        }
                        resolve(audio)
                    };
                    audio.onerror = reject;
                    audio.src = normalizedUrl;
                    audio.load();
                    break;
                case 'json':
                default:
                    fetch(normalizedUrl).then(result => result.json()).then(resolve).catch(reject);
                    break;
            }
        });
    }

    /**
     * 
     * @param url 
     */
    public removeFromCache(url) {
        delete Assets.cache[this.normalizeUrl(url)];
    }

    /**
     * 
     * @param url 
     */
    public normalizeUrl(url: string): string {
        if (!url.startsWith('http') && url.includes('.') && !url.startsWith(`projects/${this.engine.id}/assets`) && !url.startsWith(`/projects/${this.engine.id}/assets`))
            url = `/projects/${this.engine.id}/assets/` + url;

        return url.replace(/([^:]\/)\/+/g, "$1");
    }
}