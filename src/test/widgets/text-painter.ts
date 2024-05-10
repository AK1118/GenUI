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
  wordSpace: number = 10;
  lineHeight: number = 25;
  direction: TextDirection;
}
class TextStyle extends ParagraphStyle {
  color: string = "black";
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

class TextPointParentData {
  public prePointText: TextPoint;
  public nextPointText: TextPoint;
}

class TextPoint {
  parentData: TextPointParentData = new TextPointParentData();
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
  constructor() {}
  textStyle: TextStyle = new TextStyle();
  text: string;
  boxes: TextBox[];
  textPoints: TextPoint[] = [];
  public pushStyle(textStyle: TextStyle) {
    this.textStyle = textStyle;
  }
  public addText(text: string) {
    this.text = text;
  }
  /**
   * 将所有文字逐个分开并通过[getMeasureText]方法获取文字数据，生成[TextBox]列表
   * 1.[performLayoutTextOffset]首次排序使用 [performLayoutRow]将所有文字按ltr方向排序成一条直线并给出每个文字的offset,同时会设置word space
   * 2.[performConstraintsWidth]约束排序，主要做换行等操作,根据文字特性判定换行规则,并返回堆叠高度[maxHeight]
   */
  layout(constraints: ParagraphConstraints, paint: Painter,startOffset:Vector=Vector.zero) {
    this.performLayoutTextOffset(paint);
    const maxHeight = this.performConstraintsWidth(constraints,startOffset);
  }
  /**
   * 约束文字宽度
   * 根据约束宽度判断文字是否超出宽度得到overflow,如果overflow>0说明超出
   * 超出后由于已经有布局过，需要将新的一行x设置为0,就必须让x加上反向增量达到0,反向增量为x的倒数
   * 文本是否为单词判断逻辑为next不为null与next的code码小于256与next不为空格即判定为一个单词
   */
  private performConstraintsWidth(constraints: ParagraphConstraints,startOffset:Vector): number {
    let maxHeight = 0;
    let column = 0,
      subDeltaX = 0;
    const maxWidth = constraints.width;
    const len = this.textPoints.length;
    for (let index = 0; index < len; index++) {
      const textPoint = this.textPoints[index];
      const codePoint = textPoint.text.charCodeAt(0);
      const offset = textPoint.offset;
      const box = textPoint.box;
      let wordWidth = box.width + offset.x;
      let currentPoint = textPoint;
      let wordCount: number = 0;
      while (
        currentPoint != null &&
        !TextPainter.isSpace(currentPoint.text.charCodeAt(0))
      ) {
        if (currentPoint?.text.charCodeAt(0) > 256) {
          break;
        }
        const parentData = currentPoint.parentData;
        wordWidth += currentPoint.box.width;
        currentPoint = parentData.nextPointText;
        wordCount++;
        index++;
      }
      const textOffsetX = wordWidth + subDeltaX;
      const overflow = maxWidth - textOffsetX;
      if (overflow < 0 || TextPainter.isNewline(codePoint)) {
        //标记当前反向增量
        subDeltaX = offset.x * -1;
        column++;
      }
      const deltaY = this.textStyle.lineHeight * column;
      offset.setXY(subDeltaX + offset.x, deltaY);
      offset.add(startOffset);
      maxHeight = Math.max(deltaY + this.textStyle.lineHeight, maxHeight);
      if (wordCount > 1) this.performLayoutRow(textPoint, offset, wordCount);
    }
    return maxHeight;
  }
  /**
   *  将文字处理为[TextBox]并计算每个文字的offset
   */
  private performLayoutTextOffset(paint: Painter) {
    const texts: Array<string> = Array.from(this.text);
    let after: TextPoint;
    let firstTextPoint: TextPoint;
    for (const text of texts) {
      const textPoint = this.insertTextToList(text, paint, after);
      after = textPoint;
      if (!firstTextPoint) {
        firstTextPoint = textPoint;
      }
    }
    this.performLayoutRow(firstTextPoint);
    console.log(firstTextPoint);
  }
  /**
   * 传入一个[TextPoint],这个对象将会是渲染的第一位，接下来会一只next下去，布局的将会是从左到右进行，不会出现换行
   * next的offset将会基于前一个offset而重新计算,直至next==null 或者 到达 maRange
   */
  private performLayoutRow(
    textPoint: TextPoint,
    offset?: Vector,
    maxRange?: number
  ) {
    const symbolRegex = /\.|\(|\)|\（|\）|\!|\！/;
    let x: number = offset?.x ?? 0;
    let currentPoint = textPoint;
    let range: number = 0;
    while (currentPoint != null) {
      const parentData = currentPoint?.parentData;
      const isOffset = !symbolRegex.test(currentPoint.text);
      const offset = Vector.zero;
      const box = currentPoint.box;
      if (TextPainter.isSpace(currentPoint.text.charCodeAt(0))) {
        if (parentData.prePointText != null && parentData.nextPointText != null)
          box.width += this.textStyle.wordSpace;
      }
      const offsetX = isOffset
        ? x + box.width - box.right + box.left
        : x + Math.max(box.left, 0);
      const offsetY = textPoint.offset.y;
      offset.setXY(offsetX, offsetY);
      currentPoint.offset.set(offset);
      currentPoint = parentData.nextPointText;
      x += box.width;
      range++;
      if (maxRange && range > maxRange) break;
    }
  }
  private insertTextToList(
    text: string,
    paint: Painter,
    after?: TextPoint
  ): TextPoint {
    const textMetrics = this.getMeasureText(paint, text);
    const box = this.getTextBox(textMetrics);
    const textPoint = new TextPoint(text, box);

    if (after) {
      textPoint.parentData.prePointText = after;
      after.parentData.nextPointText = textPoint;
    }

    this.textPoints.push(textPoint);
    return textPoint;
  }
  private getTextBox(textMetrics: any): TextBox {
    const letterSpacing = this.textStyle.letterSpacing;
    const isFirstChar = this.textPoints.length == 0;
    return TextBox.fromLTRBD(
      textMetrics.width + (isFirstChar ? 0 : letterSpacing),
      textMetrics.hangingBaseline,
      textMetrics.actualBoundingBoxLeft,
      textMetrics.actualBoundingBoxRight,
      textMetrics.actualBoundingBoxDescent,
      textMetrics.actualBoundingBoxAscent,
      this.textStyle.direction
    );
  }

  private getMeasureText(paint: Painter, text: string): TextMetrics {
    return paint.measureText(text);
  }
  paint(paint: Painter, offset: Vector=Vector.zero): Vector {
    let lastTextPointOffset: Vector = offset;
    if (this.textPoints) {
      this.textPoints.forEach((_) => {
        paint.fillText(_.text, _.offset.x + offset.x, _.offset.y + offset.y);
        lastTextPointOffset=_.offset;
      });
    }
    return lastTextPointOffset;
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

  static isSpace(codePoint: number): boolean {
    return codePoint === 32;
  }

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
