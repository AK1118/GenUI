export namespace GenNative {
    namespace ImageLoader {
        interface ImageStreamPayload<T = Uint8Array> {
            value: T;
            total: number;
            error: any;
            progress: number;
        }
        interface ImageProviderLoadConfiguration {
            url: string;
            headers?: Record<string, string>;
        }
    }
}