import Rect, { Size } from "../basic/rect";
import Vector from "../math/vector";
import Alignment from "./alignment";
import { applyBoxFit, BoxFit } from "./box-fit";
import { BoxPainter, Decoration } from "./decoration";
import Painter from "./painter";

interface ImageSourceArguments {
  width: number;
  height: number;
  image:
    | HTMLImageElement
    | SVGImageElement
    | HTMLVideoElement
    | HTMLCanvasElement
    | ImageBitmap
    | OffscreenCanvas;
  url: string;
}

export class ImageSource implements ImageSourceArguments {
  width: number;
  height: number;
  image:
    | HTMLImageElement
    | SVGImageElement
    | HTMLVideoElement
    | HTMLCanvasElement
    | ImageBitmap
    | OffscreenCanvas;
  url: string;
  constructor(args: Partial<ImageSourceArguments>) {
    this.width = args?.width;
    this.height = args?.height;
    this.image = args?.image;
    this.url = args?.url;

    if (this.width === 0 || this.height === 0) {
      throw new Error("Width or height can not be zero");
    }
    if (!this.image) {
      throw new Error("Image can not be null");
    }
    if (
      !(
        this.image instanceof HTMLImageElement ||
        this.image instanceof SVGImageElement ||
        this.image instanceof HTMLVideoElement ||
        this.image instanceof HTMLCanvasElement ||
        this.image instanceof ImageBitmap ||
        this.image instanceof OffscreenCanvas
      )
    ) {
      throw new Error(
        "Image type is not supported, please use one of the following types: HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas"
      );
    }
  }
}

export interface ImageDecorationArguments {
  imageSource: ImageSource;
  fit: BoxFit;
  alignment: Alignment;
  width: number;
  height: number;
}

export class ImageDecoration extends Decoration {
  imageSource: ImageSource;
  fit: BoxFit;
  alignment: Alignment;
  constructor(args: Partial<ImageDecorationArguments>) {
    super();
    this.imageSource = args?.imageSource;
    if (!this.imageSource) {
      throw new Error("Image can not be null");
    }
    this.fit = args?.fit ?? BoxFit.none;
    this.alignment = args?.alignment ?? Alignment.center;
  }
  createBoxPainter(onChanged: VoidFunction): ImageDecorationPainter {
    return new ImageDecorationPainter(this, onChanged);
  }
}

export class ImageDecorationPainter extends BoxPainter {
  private decoration: ImageDecoration;
  private sourceRect: Rect = Rect.zero;
  private destinationRect: Rect = Rect.zero;
  constructor(decoration: ImageDecoration, onChanged: VoidFunction) {
    super(onChanged);
    this.decoration = decoration;
    this.onChanged = onChanged;
  }
  layout(size: Size): Size {
    const inputSize = new Size(
      this.decoration.imageSource.width,
      this.decoration.imageSource.height
    );
    const outputSize = size;
    const fittedSizes = applyBoxFit(this.decoration.fit, inputSize, outputSize);
    const sourceSize = fittedSizes.source;
    const destinationSize = fittedSizes.destination;
    const alignment = this.decoration.alignment;
    const destinationPosition = alignment.inscribe(destinationSize, outputSize);
    const sourceOffset = alignment.inscribe(sourceSize, inputSize);
    this.destinationRect = Rect.merge(destinationPosition, destinationSize);
    this.sourceRect = Rect.merge(sourceOffset, sourceSize);
    return this.destinationRect.size;
  }
  paint(paint: Painter, offset: Vector, size: Size): void {
    const overflow =
      this.destinationRect.width > size.width ||
      this.destinationRect.height > size.height;
    paint.save();
    if (overflow) {
      paint.rect(offset.x, offset.y, size.width, size.height);
      paint.clip();
    }
    const x = offset.x + this.destinationRect.x,
      y = offset.y + this.destinationRect.y;
    const sx = this.sourceRect.x,
      sy = this.sourceRect.y;
    paint.drawImage(
      this.decoration.imageSource.image,
      sx,
      sy,
      this.sourceRect.width,
      this.sourceRect.height,
      x,
      y,
      this.destinationRect.width,
      this.destinationRect.height
    );
    paint.restore();
  }
  debugPaint(paint: Painter, offset: Vector, size: Size): void {
    paint.strokeStyle = "#0d7bc1";
    const x = this.destinationRect.x + offset.x,
      y = this.destinationRect.y + offset.y,
      ex = x + this.destinationRect.width,
      ey = y + this.destinationRect.height;

    paint.strokeRect(
      x,
      y,
      this.destinationRect.width,
      this.destinationRect.height
    );
    paint.beginPath();
    paint.moveTo(x, y);
    paint.lineTo(ex, ey);
    paint.moveTo(ex, y);
    paint.lineTo(x, ey);
    paint.stroke();
    // this.paint(paint, offset, size);
  }
}
