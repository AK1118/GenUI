import { Size } from "../basic/rect";
import Vector from "../math/vector";
import Color from "./color";
import Painter from "./painter";
import BorderRadius from "./radius";

/**
 * 四个边在默认情况下可以自由选填、更改颜色等。
 * 在borderRadius时，不论那个角是BorderRadius,四个边都必须：
 *  1. 四个边都不允许为空
 *  2.颜色都必须一致
 * 不满足以上条件，会报错。
 */
export abstract class BoxBorder {
  abstract paint(
    paint: Painter,
    size: Size,
    offset: Vector,
    radius: BorderRadius
  ): void;
}

interface BordersArguments {
  top: BorderSide;
  right: BorderSide;
  bottom: BorderSide;
  left: BorderSide;
}

export class Border extends BoxBorder implements BordersArguments {
  top: BorderSide;
  right: BorderSide;
  bottom: BorderSide;
  left: BorderSide;
  constructor(option: Partial<BordersArguments>) {
    super();
    this.bottom = option?.bottom ?? BorderSide.none;
    this.left = option?.left ?? BorderSide.none;
    this.right = option?.right ?? BorderSide.none;
    this.top = option?.top ?? BorderSide.none;
  }
  paint(
    paint: Painter,
    size: Size,
    offset: Vector,
    radius: BorderRadius
  ): void {
    this.paintBorders(paint, size, offset, radius, {
      top: this.top,
      right: this.right,
      bottom: this.bottom,
      left: this.left,
    });
  }

  paintBorders(
    paint: Painter,
    size: Size,
    offset: Vector,
    borderRadius: BorderRadius,
    option: BordersArguments
  ) {
    const { top, bottom, right, left } = option;

    if (borderRadius && !borderRadius.isNone()) {
      if (
        top?.style === BorderStyle.none ||
        bottom?.style === BorderStyle.none ||
        right?.style === BorderStyle.none ||
        left?.style === BorderStyle.none
      ) {
        throw new Error("Borders must be none when BorderRadius is not none");
      }
      const color = top.color || bottom.color || right.color || left.color;
      if (
        top.color !== color ||
        left.color !== color ||
        right.color !== color ||
        bottom.color !== color
      ) {
        throw new Error(
          "When BorderRadius is not none, all BorderSide colors must be the same"
        );
      }
      const dashed = top.dashed || right.dashed || bottom.dashed || left.dashed;

      if (
        top.dashed !== dashed ||
        right.dashed !== dashed ||
        bottom.dashed !== dashed ||
        left.dashed !== dashed
      ) {
        throw new Error(
          "When BorderRadius is not none, all BorderSide dashed must be the same"
        );
      }

      paint.lineWidth = top.width;
      paint.strokeStyle = top.color.rgba;
      dashed && paint.setLineDash(top.dashed);
      paint.roundRect(
        offset.x,
        offset.y,
        size.width,
        size.height,
        borderRadius.radius
      );
      paint.stroke();
      return;
    }

    if (top?.style !== BorderStyle.none) {
      paint.beginPath();
      paint.lineWidth = top.width;
      paint.strokeStyle = top.color.rgba;
      top.dashed && paint.setLineDash(top.dashed);
      paint.moveTo(offset.x, offset.y);
      paint.lineTo(offset.x + size.width, offset.y);
      if (top?.width === 0) {
        paint.stroke();
      } else {
        paint.save();
        paint.fillStyle = top.color.rgba;
        paint.lineTo(offset.x + size.width - right.width, offset.y + top.width);
        paint.lineTo(offset.x + left.width, offset.y + top.width);
        paint.fill();
        paint.restore();
      }
      paint.closePath();
    }
    if (right?.style !== BorderStyle.none) {
      paint.beginPath();
      paint.lineWidth = right.width;
      paint.strokeStyle = right.color.rgba;
      right.dashed && paint.setLineDash(right.dashed);
      paint.moveTo(offset.x + size.width, offset.y);
      paint.lineTo(offset.x + size.width, offset.y + size.height);
      if (right?.width === 0) {
        paint.stroke();
      } else {
        paint.save();
        paint.fillStyle = right.color.rgba;
        paint.lineTo(
          offset.x + size.width - right.width,
          offset.y + size.height
        );
        paint.lineTo(offset.x + size.width - right.width, offset.y + top.width);
        paint.fill();
        paint.restore();
      }
      paint.closePath();
    }
    if (bottom?.style !== BorderStyle.none) {
      paint.beginPath();
      paint.lineWidth = bottom.width;
      paint.strokeStyle = bottom.color.rgba;
      bottom.dashed && paint.setLineDash(bottom.dashed);
      paint.moveTo(offset.x, offset.y + size.height);
      paint.lineTo(offset.x + size.width, offset.y + size.height);
      if (bottom?.width === 0) {
        paint.stroke();
      } else {
        paint.save();
        paint.fillStyle = bottom.color.rgba;
        paint.lineTo(
          offset.x + size.width - right.width,
          offset.y + size.height - bottom.width
        );
        paint.lineTo(
          offset.x + left.width,
          offset.y + size.height - bottom.width
        );
        paint.fill();
        paint.restore();
      }
      paint.closePath();
    }
    if (left?.style !== BorderStyle.none) {
      paint.beginPath();
      paint.lineWidth = left.width;
      paint.strokeStyle = left.color.rgba;
      left.dashed && paint.setLineDash(left.dashed);
      paint.moveTo(offset.x, offset.y);
      paint.lineTo(offset.x, offset.y+size.height);
      if (left?.width === 0) {
        paint.stroke();
      } else {
        paint.save();
        paint.fillStyle = left.color.rgba;
        paint.lineTo(
          offset.x + left.width,
          offset.y + size.height - bottom.width
        );
        paint.lineTo(offset.x+ left.width, offset.y + top.width);
        paint.fill();
        paint.restore();
      }
      paint.closePath();
    }
  }

  static all(option: Partial<BorderSideArguments>): Border {
    return new Border({
      top: new BorderSide(option),
      left: new BorderSide(option),
      right: new BorderSide(option),
      bottom: new BorderSide(option),
    });
  }

  static only(option: Partial<BordersArguments>): Border {
    return new Border(option);
  }
}

enum BorderStyle {
  none,
  solid,
  dashed,
}

interface BorderSideArguments {
  color: Color;
  width: number;
  style: BorderStyle;
  dashed: Iterable<number>;
}

export class BorderSide implements BorderSideArguments {
  public color: Color;
  public width: number;
  public style: BorderStyle;
  public dashed: Iterable<number>;
  constructor(option: Partial<BorderSideArguments>) {
    this.color = option?.color;
    this.width = option?.width??1;
    this.style = option?.style;
    this.dashed = option?.dashed;
  }
  static get none(): BorderSide {
    return new BorderSide({
      color: new Color(0x00000000),
      width: 0,
      style: BorderStyle.none,
    });
  }
}
