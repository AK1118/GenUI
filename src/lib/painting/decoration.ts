import { Size } from "../basic/rect";
import Vector from "../math/vector";
import { BoxBorder } from "./borders";
import Painter from "./painter";
import BorderRadius from "./radius";
import BoxShadow from "./shadow";

export abstract class Decoration {
  hitTest(size: Size, position: Vector): boolean {
    return true;
  }
  abstract createBoxPainter(onChanged: VoidFunction): BoxPainter;
}

export abstract class BoxPainter {
  onChanged: VoidFunction;
  constructor(onChanged: VoidFunction) {
    this.onChanged = onChanged;
  }
  abstract paint(paint: Painter, offset: Vector, size: Size): void;
  abstract debugPaint(paint: Painter, offset: Vector, size: Size): void;
  dispose(): void {}
}

interface BoxDecorationArguments {
  backgroundColor: string;
  border: BoxBorder;
  borderRadius: BorderRadius;
  shadows: Array<BoxShadow>;
}

export class BoxDecoration
  extends Decoration
  implements BoxDecorationArguments
{
  border: BoxBorder;
  borderRadius: BorderRadius;
  backgroundColor: string;
  shadows: BoxShadow[];
  constructor(option: Partial<BoxDecorationArguments>) {
    super();
    this.border = option?.border;
    this.borderRadius = option?.borderRadius;
    this.backgroundColor = option?.backgroundColor;
    this.shadows = option?.shadows;
  }

  createBoxPainter(onChanged: VoidFunction): BoxPainter {
    return new BoxDecorationPainter(this, onChanged);
  }
}

class BoxDecorationPainter extends BoxPainter {
  private decoration: BoxDecoration;
  constructor(decoration: BoxDecoration, onChanged: VoidFunction) {
    super(onChanged);
    this.decoration = decoration;
  }
  private paintShadow(
    paint: Painter,
    size: Size,
    offset: Vector = new Vector(0, 0)
  ) {
    paint.save();
    if (this.decoration.shadows && this.decoration.shadows.length > 0) {
      for (let i = 0; i < this.decoration.shadows.length; i++) {
        const shadow = this.decoration.shadows[i];
        shadow.paint(paint);
        paint.fillStyle = "white";
        if (
          !this.decoration.borderRadius ||
          this.decoration.borderRadius?.isNone()
        ) {
          paint.fillRect(offset.x, offset.y, size.width - 1, size.height - 1);
        } else {
          paint.roundRect(
            offset.x,
            offset.y,
            size.width - 1,
            size.height - 1,
            this.decoration.borderRadius?.radius
          );
          paint.fill();
        }
      }
    }
    paint.restore();
  }
  private paintBackgroundColor(paint: Painter, size: Size, offset: Vector) {
    paint.fillStyle = this.decoration.backgroundColor;
    if (this.decoration.backgroundColor) {
      paint.beginPath();
      if (
        this.decoration?.borderRadius &&
        this.decoration.borderRadius !== BorderRadius.zero
      ) {
        paint.roundRect(
          offset.x,
          offset.y,
          size.width,
          size.height,
          this.decoration.borderRadius.radius
        );
        paint.fill();
      } else {
        paint.fillRect(offset.x, offset.y, size.width, size.height);
      }
      paint.closePath();
    }
  }

  paint(paint: Painter, offset: Vector, size: Size): void {
    paint.save();
    this.paintShadow(paint, size, offset);
    this.paintBackgroundColor(paint, size, offset);
    this.decoration.border?.paint(
      paint,
      size,
      offset,
      this.decoration.borderRadius
    );
    paint.restore();
  }

  debugPaint(paint: Painter, offset: Vector, size: Size): void {
    this.paint(paint, offset, size);
    paint.fillStyle="rgba(162, 118, 196,.5)";
    paint.fillRect(offset.x, offset.y, size.width - 1, size.height - 1);
  }
}
