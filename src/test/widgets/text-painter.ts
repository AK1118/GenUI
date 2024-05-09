import Painter from "@/core/lib/painter";
import { TextDirection } from "./basic";
import Vector from "@/core/lib/vector";

class Accumulator {
  private _value: number = 0;
  get value() {
    return this._value;
  }
  increment(): number {
    return (this._value += 1);
  }
}

type InlineSpanVisitor = (span: InlineSpan) => boolean;

abstract class InlineSpan {
  abstract build(): void;
  abstract getSpanForPosition(offset: Accumulator): InlineSpan;
  abstract visitChildren(visitor: InlineSpanVisitor): boolean;
  abstract computeToPlainText(): void;
}

export class ParagraphConstraints {
  private _width: number;
  constructor(width: number) {
    this._width = width;
  }
  get width(): number {
    return this._width;
  }
}

class ParagraphStyle {
  maxLines: number = 999;
  fontFamily: string;
  fontSize: number = 20;
  height: number = 20;
  letterSpacing: number = 0;
  wordSpace: number = 0;
  lineHeight: number = 10;
  direction: TextDirection;
}
class TextBox {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  direction: TextDirection;

  constructor(
    width: number,
    height: number,
    left: number,
    right: number,
    top: number,
    bottom: number,
    direction: TextDirection
  ) {
    this.width = width;
    this.height = height;
    this.left = left;
    this.top = top;
    this.bottom = bottom;
    this.right = right;
    this.direction = direction;
  }

  static fromLTRBD(
    width: number,
    height: number,
    left: number,
    right: number,
    top: number,
    bottom: number,
    direction: TextDirection
  ): TextBox {
    return new TextBox(width, height, left, right, top, bottom, direction);
  }
}

class TextPoint {
  text: string;
  offset: Vector = Vector.zero;
  box: TextBox;
  constructor(text: string, box: TextBox) {
    this.text = text;
    this.box = box;
  }
}
/**
 * 段落
 */
export class Paragraph {
  textStyle: ParagraphStyle = new ParagraphStyle();
  text: string;
  boxes: TextBox[];
  textPoints: TextPoint[];
  public pushStyle() {}
  public addText(text: string) {
    this.text = text;
  }
  layout(constraints: ParagraphConstraints, paint: Painter) {
    this.textPoints = this.performLayoutTextOffset(paint);
    this.performConstraintsWidth(constraints);
  }
  /**
   * 约束文字宽度
   *
   * 根据约束宽度判断文字是否超出宽度得到overflow,如果overflow>0说明超出
   * 超出后由于已经有布局过，需要将新的一行x设置为0,就必须让x加上反向增量达到0,反向增量为x的倒数
   */
  private performConstraintsWidth(constraints: ParagraphConstraints) {
    let column = 0,
      subDeltaX = 0;
    const maxWidth = constraints.width;
    for (const textPoint of this.textPoints) {
      const codePoint = textPoint.text.charCodeAt(0);
      const offset = textPoint.offset;
      const textOffsetX = offset.x + subDeltaX;
      const overflow = maxWidth - textOffsetX;
      if (overflow < 0 || TextPainter.isNewline(codePoint)) {
        //标记当前减量
        subDeltaX = offset.x * -1;
        column++;
      }
      const deltaY = this.textStyle.lineHeight * column;
      offset.setXY(subDeltaX + offset.x, deltaY);
    }
  }
  /**
   *  将文字处理为[TextBox]并计算每个文字的offset
   */
  private performLayoutTextOffset(paint: Painter): TextPoint[] {
    const textPoints: TextPoint[] = [];
    const symbolRegex = /\.|\(|\)|\（|\）|\!|\！/;
    const texts: Array<string> = this.text.split("");
    const textMetrics: Array<TextMetrics> = texts.map((_) =>
      this.getMeasureText(paint, _)
    );
    this.boxes = this.genTextBoxes(textMetrics);
    let x: number = 0;
    this.boxes.forEach((_, ndx) => {
      const text: string = texts[ndx];
      const textPoint = new TextPoint(text, _);
      const isOffset = !symbolRegex.test(text);
      textPoint.offset.setXY(
        isOffset ? x + _.width - _.right + _.left : x + Math.max(_.left, 0),
        0
      );
      x += _.width;
      textPoints.push(textPoint);
    });
    return textPoints;
  }
  private genTextBoxes(textMetrics: TextMetrics[]): TextBox[] {
    const boxes: TextBox[] = textMetrics.map((_: any) =>
      TextBox.fromLTRBD(
        _.width,
        _.hangingBaseline,
        _.actualBoundingBoxLeft,
        _.actualBoundingBoxRight,
        _.actualBoundingBoxDescent,
        _.actualBoundingBoxAscent,
        this.textStyle.direction
      )
    );
    return boxes;
  }
  private getMeasureText(paint: Painter, text: string): TextMetrics {
    return paint.measureText(text);
  }
  paint(paint: Painter, offset: Vector) {
    if (this.textPoints)
      this.textPoints.forEach((_) => {
        paint.fillText(_.text, _.offset.x + offset.x, _.offset.y + offset.y);
      });
  }
}

class TextSpan extends InlineSpan {
  children: InlineSpan[];
  text: string;
  /**
   * 将文字转为
   */
  build(): void {
    if (this.text) {
    }
    if (this.children) {
      for (const child of this.children) {
        child.build();
      }
    }
    throw new Error("Method not implemented.");
  }
  getSpanForPosition(offset: Accumulator): InlineSpan {
    throw new Error("Method not implemented.");
  }
  visitChildren(visitor: InlineSpanVisitor): boolean {
    throw new Error("Method not implemented.");
  }
  computeToPlainText(): void {
    throw new Error("Method not implemented.");
  }
}

class TextPainter {
  private text: InlineSpan;
  layout(minWidth: number = 0, maxWidth: number = Infinity) {}

  //是否是一个新的换行点
  static isNewline(codePoint: number): boolean {
    switch (codePoint) {
      case 0x000a:
      case 0x0085:
      case 0x000b:
      case 0x000c:
      case 0x2028:
      case 0x2029:
        return true;
      default:
        return false;
    }
  }
}
