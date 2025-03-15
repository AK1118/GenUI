import { Size } from "../basic/rect";
import Painter from "../painting/painter";

export abstract class Strategy { }
/**
 * # 获取网络图片策略
 *   - 各个平台获取网络图片的策略都不一样，将所有的平台相似处抽取出来，封装成策略类。
 *   - 不论使用什么方法，只返回一个Uint8Array即可渲染图片。
 */
export abstract class NativeNetWorkImageStrategy extends Strategy {
    abstract loadBuffer(url: string): Promise<Uint8Array | unknown>;
    abstract getImageSize(arrayBuffer: Uint8Array): Promise<Size>;

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



class DefaultNativeNetWorkImageStrategy extends NativeNetWorkImageStrategy {
    getImageSize(arrayBuffer: Uint8Array): Promise<Size> {
        const img = new Image();
        return new Promise((resolve) => {
            img.onload = () => resolve(new Size(img.width, img.height));
            const blob = new Blob([arrayBuffer]);
            const url = URL.createObjectURL(blob);
            img.src = url;
        });
    }
    async loadBuffer(url: string): Promise<Uint8Array | unknown> {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        return buffer;
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