import { Size } from "../basic/rect";
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
  align: Alignment;
}

export class ImageDecoration
  extends Decoration
  implements ImageDecorationArguments
{
  imageSource: ImageSource;
  fit: BoxFit;
  align: Alignment;
  constructor(args: Partial<ImageDecorationArguments>) {
    super();
    this.imageSource = args?.imageSource;
    if (!this.imageSource) {
      throw new Error("Image can not be null");
    }
    this.fit = args?.fit ?? BoxFit.none;
    this.align = args?.align ?? Alignment.center;
  }
  createBoxPainter(onChanged: VoidFunction): ImageDecorationPainter {
    return new ImageDecorationPainter(this, onChanged);
  }
}

export class ImageDecorationPainter extends BoxPainter {
  private decoration: ImageDecoration;
  private fittedSize: Size;
  private alignedOffset: Vector;
  constructor(decoration: ImageDecoration, onChanged: VoidFunction) {
    super(onChanged);
    this.decoration = decoration;
    this.onChanged = onChanged;
  }
  layout(size: Size) {
    this.fittedSize = applyBoxFit(
      this.decoration.fit,
      size,
      new Size(
        this.decoration.imageSource.width,
        this.decoration.imageSource.height
      )
    );
    this.alignedOffset = this.decoration.align.inscribe(this.fittedSize, size);
  }
  paint(paint: Painter, offset: Vector, size: Size): void {
    const overflow =
      this.fittedSize.width > size.width ||
      this.fittedSize.height > size.height;

    paint.save();
    if (overflow) {
      paint.rect(offset.x, offset.y, size.width, size.height);
      paint.clip();
    }
    paint.drawImage(
      this.decoration.imageSource.image,
      offset.x + this.alignedOffset.x,
      offset.y + this.alignedOffset.y,
      this.fittedSize.width,
      this.fittedSize.height,
      0,
      0,
      this.decoration.imageSource.width,
      this.decoration.imageSource.height
    );
    paint.restore();
  }
  debugPaint(paint: Painter, offset: Vector, size: Size): void {
    paint.strokeStyle="#0d7bc1";
    paint.strokeRect(offset.x, offset.y, size.width, size.height);
    paint.beginPath();
    paint.moveTo(offset.x,offset.y);
    paint.lineTo(offset.x+size.width,offset.y+size.height);
    paint.moveTo(offset.x+size.width,offset.y);
    paint.lineTo(offset.x,offset.y+size.height);
    paint.stroke();

  }
}
