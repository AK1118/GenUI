import { GenNative } from "@/types/native";
import { GenPlatformConfig } from "../core/platform";
import { AsyncStream } from "../core/stream";
import { Size } from "../basic/rect";

type ImageStreamPayload = GenNative.ImageLoader.ImageStreamPayload;
type ImageProviderLoadConfiguration = GenNative.ImageLoader.ImageProviderLoadConfiguration;
type ImageLoadPayload = {
    size: Size,
    image: any
}
export abstract class ImageProvider {
    // static cacheMap: Map<string, any> = new Map();
    constructor(protected readonly configuration: ImageProviderLoadConfiguration) { }
    protected get loadStrategy() {
        return GenPlatformConfig.instance.strategies.getImageStrategy();
    }
    createStream() {
        return this.loadStrategy.loadBuffer(this.configuration);
    }
    abstract load(): Promise<ImageLoadPayload>;
    loadBuffer(): AsyncStream<ImageStreamPayload> {
        return this.createStream();
    }
    getImageSize(arrayBuffer: Uint8Array): Promise<Size> {
        return this.loadStrategy.getImageSize(arrayBuffer);
    }
}


export class NetWorkImageProvider extends ImageProvider {
    async load(): Promise<ImageLoadPayload> {
        const bufferLoader = this.loadBuffer();
        let total: number = 0;
        const chunks = [];
        await bufferLoader.forEach((payload) => {
            total += payload.value.length;
            chunks.push(payload.value);
        });
        const uint8Array = new Uint8Array(total);
        let position = 0;
        for (const chunk of chunks) {
            uint8Array.set(chunk, position);
            position += chunk.length;
        }
        const size = await this.getImageSize(uint8Array);
        const image = await this.loadStrategy.load(this.configuration, uint8Array);
        return {
            size,
            image,
        };
    }
}