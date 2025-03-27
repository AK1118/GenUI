import Rect, { Size } from "../basic/rect";
import Vector from "../math/vector";
import Alignment from "./alignment";
import { applyBoxFit, BoxFit } from "./box-fit";
import { BoxPainter, Decoration } from "./decoration";
import { ImageProvider } from "./image-provider";
import Painter from "./painter";


export interface ImageDecorationArguments {
  imageProvider: ImageProvider
  fit: BoxFit;
  alignment: Alignment;
  width: number;
  height: number;
}

export class ImageDecoration extends Decoration implements ImageDecorationArguments{
  imageProvider: ImageProvider;
  width: number;
  height: number;
  fit: BoxFit;
  alignment: Alignment;
  constructor(args: Partial<ImageDecorationArguments>) {
    super();
    this.fit = args?.fit ?? BoxFit.none;
    this.alignment = args?.alignment ?? Alignment.center;
    this.imageProvider = args?.imageProvider;
    this.width = args?.width ?? 0;
    this.height = args?.height ?? 0;
  }
  createBoxPainter(onChanged: VoidFunction): ImageDecorationPainter {
    return new ImageDecorationPainter(this, onChanged);
  }
}

export class ImageDecorationPainter extends BoxPainter {
  private decoration: ImageDecoration;
  private sourceRect: Rect = Rect.zero;
  private destinationRect: Rect = Rect.zero;
  private _image: any;
  private sourceImageSize: Size = Size.zero;
  constructor(decoration: ImageDecoration, onChanged: VoidFunction) {
    super(onChanged);
    this.decoration = decoration;
    this.onChanged = onChanged;
    this.loadImage();
  }
  async loadImage() {
    const { size, image } = await this.decoration.imageProvider.load();
    this._image = image;
    this.sourceImageSize = size;
    this.onChanged();
  }
  get width() {
    return this.sourceImageSize.width;
  }
  get height() {
    return this.sourceImageSize.height;
  }
  layout(size: Size): Size {
    const inputSize = this.sourceImageSize;
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
    if (this._image) paint.drawImage(
      this._image,
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
