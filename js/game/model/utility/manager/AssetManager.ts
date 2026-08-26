import Game from '../../game/Game.js';
import GameSettings from '../../../constants.js';
import HTMLHandlers from '../../htmlElements/HTMLHandlers.js';
import { Outfit } from '../enums/Outfit.js';

export default class AssetManager {
    // @ts-ignore
    private static audioSource = new (window.AudioContext || window.webkitAudioContext)();
    private static colors = GameSettings.GAME.COLOR;
    private static htmlHandler: HTMLHandlers;
    private static counter: number;
    private static assetAmount: number;
    private static _assetList: Map<string, HTMLImageElement | AudioBuffer> = new Map();
    private static showLoading: boolean;

    // A browser only keeps a handful of sockets open per host, so kicking off
    // every request at once leaves hundreds of them queued and, once in a
    // while, one of them stalls without ever firing load or error.
    private static readonly maxParallelRequests = 8;
    private static readonly requestTimeout = 15000;
    private static readonly maxAttempts = 4;
    private static fallbackImage: HTMLImageElement | null = null;

    public static getAudio(name: string): AudioBuffer {
        return <AudioBuffer>this._assetList.get(name);
    }

    static get assetList(): Map<string, HTMLImageElement | AudioBuffer> {
        return this._assetList;
    }

    static set assetList(value: Map<string, HTMLImageElement | AudioBuffer>) {
        this._assetList = value;
    }

    static get source(): AudioContext {
        return this.audioSource;
    }

    public static setHTMLHandler(htmlHandler: HTMLHandlers) {
        this.htmlHandler = htmlHandler;
    }

    public static getImage(name: string): HTMLImageElement {
        return <HTMLImageElement>this._assetList.get(name);
    }

    public static getNumberedImage(name: string, number: number): HTMLImageElement {
        return <HTMLImageElement>this._assetList.get(`${name}_${number}`);
    }

    public static async assetLoader(assetData: Asset[][], outfit?: Outfit, show = true) {
        this.showLoading = show;
        this.counter = 0;

        const queue = this.buildQueue(assetData);
        this.assetAmount = queue.length;

        if (this.showLoading) this.htmlHandler.notify('loadingModal:open');

        const failed: string[] = [];
        let cursor = 0;

        const worker = async () => {
            while (cursor < queue.length) {
                const asset = queue[cursor++];

                this.htmlHandler.notify('loadingModal:editText', asset.name);
                if (!(await this.loadWithRetry(asset, outfit))) {
                    failed.push(asset.name);
                }
                this.htmlHandler.notify('loadingModal:editCounter', ++this.counter + '/' + this.assetAmount);
            }
        };

        const workers: Promise<void>[] = [];
        for (let i = 0; i < Math.min(this.maxParallelRequests, queue.length); i++) {
            workers.push(worker());
        }

        try {
            await Promise.all(workers);
        } finally {
            if (this.showLoading) this.htmlHandler.notify('loadingModal:close');
        }

        if (failed.length) {
            console.error(`AssetManager: gave up on ${failed.length} asset(s) after ${this.maxAttempts} attempts`, failed);
        }
    }

    /**
     * Flattens every asset group into the individual files that have to be
     * fetched. Names are unique, so the same group being passed twice costs
     * nothing.
     */
    private static buildQueue(assetData: Asset[][]): Asset[] {
        const queue: Asset[] = [];
        const queued = new Set<string>();

        const push = (asset: Asset) => {
            if (queued.has(asset.name)) {
                return;
            }
            queued.add(asset.name);
            queue.push(asset);
        };

        for (const group of assetData) {
            for (const { ref, name, amount, isOutfit, isAudio } of group) {
                if (!amount) {
                    push({ ref, name, isOutfit, isAudio });
                    continue;
                }

                const base = ref.split('.')[0];
                const extension = isAudio ? ref.split('.')[1] : 'png';

                for (let i = 1; i <= amount; i++) {
                    push({
                        ref: `${base}_${i}.${extension}`,
                        name: `${name}_${i}`,
                        isOutfit,
                        isAudio,
                    });
                }
            }
        }

        return queue;
    }

    /**
     * A single dropped request used to leave the loading screen frozen forever.
     * Retry it a few times instead, and keep going with a blank placeholder if
     * it never arrives.
     */
    private static async loadWithRetry(asset: Asset, outfit?: Outfit): Promise<boolean> {
        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            try {
                if (asset.isAudio) {
                    await this.loadAudio(asset, attempt);
                } else {
                    await this.loadImage(asset, outfit, attempt);
                }
                return true;
            } catch (error) {
                if (attempt === this.maxAttempts) {
                    console.error(`AssetManager: could not load ${asset.name} (${asset.ref})`, error);

                    if (!asset.isAudio) {
                        this._assetList.set(asset.name, this.getFallbackImage());
                    }
                    return false;
                }

                this.htmlHandler.notify('loadingModal:editText', `${asset.name} (retrying ${attempt}/${this.maxAttempts - 1})`);
                await this.delay(250 * attempt);
            }
        }

        return false;
    }

    public static async loadImage({ ref, name, isOutfit }: Asset, outfit?: Outfit, attempt = 1) {
        let data = await this.requestImage(ref, attempt);

        if (isOutfit && outfit !== Outfit.default) {
            data = this.replaceOutfitColor(data);
        }

        this._assetList.set(name, data);
    }

    private static requestImage(ref: string, attempt: number): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            const cleanUp = () => {
                window.clearTimeout(timeout);
                img.onload = null;
                img.onerror = null;
            };

            const timeout = window.setTimeout(() => {
                cleanUp();
                // Aborts the pending request so the retry starts from scratch.
                img.removeAttribute('src');
                reject(new Error(`timed out after ${this.requestTimeout}ms`));
            }, this.requestTimeout);

            img.onload = () => {
                cleanUp();
                resolve(img);
            };
            img.onerror = () => {
                cleanUp();
                reject(new Error('request failed'));
            };

            img.src = this.withRetryParam('../assets/' + ref, attempt);
        });
    }

    public static replaceOutfitColor(image: HTMLImageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const defaultColor = this.colors.default;
        const color = this.colors[Game.getInstance().player.outfit];

        const pixel = imageData.data;
        for (let i = 0; i < pixel.length; i += 4) {
            for (let j = 0; j < defaultColor.length; j++) {
                if (this.getEqualPixel(defaultColor[j], pixel, i)) {
                    imageData.data[i] = color[j][0];
                    imageData.data[i + 1] = color[j][1];
                    imageData.data[i + 2] = color[j][2];
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
        image.src = canvas.toDataURL('image/png');

        return image;
    }

    private static async loadAudio({ ref, name }: Asset, attempt = 1) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), this.requestTimeout);
        let data: ArrayBuffer;

        try {
            const response = await fetch(this.withRetryParam(`../assets/audio/${ref}`, attempt), {
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`request failed with status ${response.status}`);
            }
            data = await response.arrayBuffer();
        } finally {
            window.clearTimeout(timeout);
        }

        const audioData = await this.audioSource.decodeAudioData(data);

        this.assetList.set(name, audioData);
    }

    /**
     * Keeps a retry from being served whatever the browser cached for the
     * attempt that just failed.
     */
    private static withRetryParam(url: string, attempt: number) {
        return attempt > 1 ? `${url}?retry=${attempt}` : url;
    }

    private static getFallbackImage(): HTMLImageElement {
        if (!this.fallbackImage) {
            const image = new Image();
            image.src =
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            this.fallbackImage = image;
        }

        return this.fallbackImage;
    }

    private static delay(ms: number): Promise<void> {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    private static getEqualPixel(color: number[], pixel: Uint8ClampedArray, i: number) {
        return pixel[i] === color[0] && pixel[i + 1] === color[1] && pixel[i + 2] === color[2];
    }
}
