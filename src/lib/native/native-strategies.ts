import { GenNative } from "@/types/native";
import { Size } from "../basic/rect";
import Painter from "../painting/painter";
import { AsyncStream } from "../core/stream";

export abstract class Strategy { }
/**
 * # 获取网络图片策略
 *   - 各个平台获取网络图片的策略都不一样，将所有的平台相似处抽取出来，封装成策略类。
 *   - 不论使用什么方法，只返回一个Uint8Array即可渲染图片。
 */
export abstract class NativeNetWorkImageStrategy extends Strategy {
    abstract loadBuffer(configuration: GenNative.ImageLoader.ImageProviderLoadConfiguration): AsyncStream<GenNative.ImageLoader.ImageStreamPayload>;
    abstract getImageSize(arrayBuffer: Uint8Array): Promise<Size>;
    abstract load(configuration: GenNative.ImageLoader.ImageProviderLoadConfiguration, arrayBuffer: Uint8Array): Promise<any>;
}

/**
 * # 绘制画布策略
 */
export abstract class NativePainterStrategy extends Strategy {
    abstract getPainter(canvasContext2D:
        | CanvasRenderingContext2D
        | OffscreenCanvasRenderingContext2D): Painter;
}

// abstract class NativeOffscreenCanvasStrategy extends Strategy {
//     abstract getOffscreenCanvas(): OffscreenCanvas;
// }

/**
 * # 跨平台适配器
 *   - 将各个适配器模块封装到一起，便于管理。
 */
export abstract class NativeStrategies {
    abstract getImageStrategy(): NativeNetWorkImageStrategy;
    abstract getPainterStrategy(): NativePainterStrategy;
}

/**
 * # 默认跨平台适配器实现
 */
class DefaultNativeNetWorkImageStrategy extends NativeNetWorkImageStrategy {
    async load(configuration: GenNative.ImageLoader.ImageProviderLoadConfiguration, arrayBuffer: Uint8Array): Promise<any> {
        return await await createImageBitmap(new Blob([arrayBuffer]));
    }
    loadBuffer(configuration: GenNative.ImageLoader.ImageProviderLoadConfiguration): AsyncStream<GenNative.ImageLoader.ImageStreamPayload> {
        async function* readStream(reader: ReadableStreamDefaultReader, total: number): AsyncGenerator<GenNative.ImageLoader.ImageStreamPayload> {
            let current: number = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const progress = ((current += value.length) / total);
                const payload: GenNative.ImageLoader.ImageStreamPayload = {
                    value,
                    total,
                    error: null,
                    progress
                }
                yield payload
            }
        }
        return new AsyncStream<GenNative.ImageLoader.ImageStreamPayload>((async function* (): AsyncGenerator<GenNative.ImageLoader.ImageStreamPayload> {
            try {
                const res = await fetch(configuration.url, {
                    headers: configuration.headers
                });
                const total = parseInt(res.headers.get("content-length") ?? "-1");
                const reader = res.body.getReader();
                yield* readStream(reader, total);
            } catch (e) {
                yield {
                    value: null,
                    total: 0,
                    error: e,
                    progress: 0,
                }
            }
        })());
    }
    getImageSize(arrayBuffer: Uint8Array): Promise<Size> {
        const img = new Image();
        return new Promise((resolve) => {
            img.onload = () => resolve(new Size(img.width, img.height));
            const blob = new Blob([arrayBuffer]);
            const url = URL.createObjectURL(blob);
            img.src = url;
        });
    }

}

class DefaultNativePainterStrategy extends NativePainterStrategy {
    getPainter(canvasContext2D: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): Painter {
        return new Painter(canvasContext2D);
    }
}

export class DefaultNativeStrategies extends NativeStrategies {
    getImageStrategy(): NativeNetWorkImageStrategy {
        return new DefaultNativeNetWorkImageStrategy();
    }
    getPainterStrategy(): NativePainterStrategy {
        return new DefaultNativePainterStrategy();
    }
}