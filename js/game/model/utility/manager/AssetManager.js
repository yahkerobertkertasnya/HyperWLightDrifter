var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Game from '../../game/Game.js';
import GameSettings from '../../../constants.js';
import { Outfit } from '../enums/Outfit.js';
class AssetManager {
    static getAudio(name) {
        return this._assetList.get(name);
    }
    static get assetList() {
        return this._assetList;
    }
    static set assetList(value) {
        this._assetList = value;
    }
    static get source() {
        return this.audioSource;
    }
    static setHTMLHandler(htmlHandler) {
        this.htmlHandler = htmlHandler;
    }
    static getImage(name) {
        return this._assetList.get(name);
    }
    static getNumberedImage(name, number) {
        return this._assetList.get(`${name}_${number}`);
    }
    static assetLoader(assetData_1, outfit_1) {
        return __awaiter(this, arguments, void 0, function* (assetData, outfit, show = true) {
            this.showLoading = show;
            this.counter = 0;
            const queue = this.buildQueue(assetData);
            this.assetAmount = queue.length;
            if (this.showLoading)
                this.htmlHandler.notify('loadingModal:open');
            const failed = [];
            let cursor = 0;
            const worker = () => __awaiter(this, void 0, void 0, function* () {
                while (cursor < queue.length) {
                    const asset = queue[cursor++];
                    this.htmlHandler.notify('loadingModal:editText', asset.name);
                    if (!(yield this.loadWithRetry(asset, outfit))) {
                        failed.push(asset.name);
                    }
                    this.htmlHandler.notify('loadingModal:editCounter', ++this.counter + '/' + this.assetAmount);
                }
            });
            const workers = [];
            for (let i = 0; i < Math.min(this.maxParallelRequests, queue.length); i++) {
                workers.push(worker());
            }
            try {
                yield Promise.all(workers);
            }
            finally {
                if (this.showLoading)
                    this.htmlHandler.notify('loadingModal:close');
            }
            if (failed.length) {
                console.error(`AssetManager: gave up on ${failed.length} asset(s) after ${this.maxAttempts} attempts`, failed);
            }
        });
    }
    /**
     * Flattens every asset group into the individual files that have to be
     * fetched. Names are unique, so the same group being passed twice costs
     * nothing.
     */
    static buildQueue(assetData) {
        const queue = [];
        const queued = new Set();
        const push = (asset) => {
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
    static loadWithRetry(asset, outfit) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
                try {
                    if (asset.isAudio) {
                        yield this.loadAudio(asset, attempt);
                    }
                    else {
                        yield this.loadImage(asset, outfit, attempt);
                    }
                    return true;
                }
                catch (error) {
                    if (attempt === this.maxAttempts) {
                        console.error(`AssetManager: could not load ${asset.name} (${asset.ref})`, error);
                        if (!asset.isAudio) {
                            this._assetList.set(asset.name, this.getFallbackImage());
                        }
                        return false;
                    }
                    this.htmlHandler.notify('loadingModal:editText', `${asset.name} (retrying ${attempt}/${this.maxAttempts - 1})`);
                    yield this.delay(250 * attempt);
                }
            }
            return false;
        });
    }
    static loadImage(_a, outfit_1) {
        return __awaiter(this, arguments, void 0, function* ({ ref, name, isOutfit }, outfit, attempt = 1) {
            let data = yield this.requestImage(ref, attempt);
            if (isOutfit && outfit !== Outfit.default) {
                data = this.replaceOutfitColor(data);
            }
            this._assetList.set(name, data);
        });
    }
    static requestImage(ref, attempt) {
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
    static replaceOutfitColor(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
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
    static loadAudio(_a) {
        return __awaiter(this, arguments, void 0, function* ({ ref, name }, attempt = 1) {
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), this.requestTimeout);
            let data;
            try {
                const response = yield fetch(this.withRetryParam(`../assets/audio/${ref}`, attempt), {
                    signal: controller.signal,
                });
                if (!response.ok) {
                    throw new Error(`request failed with status ${response.status}`);
                }
                data = yield response.arrayBuffer();
            }
            finally {
                window.clearTimeout(timeout);
            }
            const audioData = yield this.audioSource.decodeAudioData(data);
            this.assetList.set(name, audioData);
        });
    }
    /**
     * Keeps a retry from being served whatever the browser cached for the
     * attempt that just failed.
     */
    static withRetryParam(url, attempt) {
        return attempt > 1 ? `${url}?retry=${attempt}` : url;
    }
    static getFallbackImage() {
        if (!this.fallbackImage) {
            const image = new Image();
            image.src =
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            this.fallbackImage = image;
        }
        return this.fallbackImage;
    }
    static delay(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }
    static getEqualPixel(color, pixel, i) {
        return pixel[i] === color[0] && pixel[i + 1] === color[1] && pixel[i + 2] === color[2];
    }
}
// @ts-ignore
AssetManager.audioSource = new (window.AudioContext || window.webkitAudioContext)();
AssetManager.colors = GameSettings.GAME.COLOR;
AssetManager._assetList = new Map();
// A browser only keeps a handful of sockets open per host, so kicking off
// every request at once leaves hundreds of them queued and, once in a
// while, one of them stalls without ever firing load or error.
AssetManager.maxParallelRequests = 8;
AssetManager.requestTimeout = 15000;
AssetManager.maxAttempts = 4;
AssetManager.fallbackImage = null;
export default AssetManager;
