import Painter from "@/core/lib/painter";
import { TextDirection } from "./basic";
import Vector from "@/core/lib/vector";

export enum TextAlign {
  start,
  end,
  center,
  justify,
}

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

interface ParagraphStyleOption {
  maxLines: number;
  fontFamily: string;
  fontSize: number;
  height: number;
  letterSpacing: number;
  wordSpace: number;
  lineHeight: number;
  direction: TextDirection;
  textAlign: TextAlign;
}
interface TextStyleOption {
  color: string;
}

class ParagraphStyle implements ParagraphStyleOption {
  maxLines: number = 999;
  fontFamily: string;
  fontSize: number = 20;
  height: number = 20;
  letterSpacing: number = 0;
  wordSpace: number = 0;
  lineHeight: number = 20;
  direction: TextDirection;
  textAlign: TextAlign = TextAlign.start;
  constructor(option?: Partial<ParagraphStyleOption>) {
    if (option) {
      this.maxLines = option?.maxLines ?? this.maxLines;
      this.fontFamily = option?.fontFamily ?? "";
      this.fontSize = option?.fontSize ?? this.fontSize;
      this.height = option?.height ?? this.height;
      this.letterSpacing = option?.letterSpacing ?? this.letterSpacing;
      this.wordSpace = option?.wordSpace ?? this.wordSpace;
      this.lineHeight = option?.lineHeight ?? this.lineHeight;
      this.direction = option?.direction ?? TextDirection.ltr;
      this.textAlign = option?.textAlign ?? this.textAlign;
    }
  }
}
export class TextStyle extends ParagraphStyle implements TextStyleOption {
  color: string = "black";
  constructor(option?: Partial<ParagraphStyleOption & TextStyle>) {
    super(option);
    if (option) {
      this.color = option?.color;
    }
  }
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
  public column: number;
  public offset: Vector = Vector.zero;
  public box: TextBox;
  public broCount: number = 1;
  public wordCountWidth: number = 0;
}

class TextPoint {
  parentData: TextPointParentData = new TextPointParentData();
  text: string;
  private isSpace: boolean = false;
  private _hidden: boolean = false;
  public hiddenTextPoint(): void {
    this._hidden = true;
  }
  get hidden(): boolean {
    return this._hidden;
  }
  constructor(text: string) {
    this.text = text;
    this.isSpace = TextPainter.isSpace(this.charCodePoint);
  }
  get charCodePoint(): number {
    return this.text.charCodeAt(0);
  }
  //空格不记为一个单词
  get isWord(): boolean {
    return !this.isSpace;
  }
}

class Word extends TextPoint {
  children: TextPoint[];
}

type ParagraphLayouted = {
  height: number;
  nextStartOffset: Vector;
};
interface Rowed {
  textPoints: TextPoint[];
  countWidth: number;
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
  public lastTextPoint: TextPoint;
  public firstTextPoint: TextPoint;
  public pushStyle(textStyle: TextStyle) {
    this.textStyle = textStyle;
  }
  public addText(text: string) {
    this.text = text;
  }
  /**
   * layout函数只负责将文本进行布局操作，并返回布局后的堆叠高度height和下一段文字的startOffset
   * [startOffset]表示该文本(首个文字)从此开始布局，在[TextSpan]具有children时会按此规律排序
   * 将所有文字逐个分开并通过[getMeasureText]方法获取文字数据，生成[TextBox]列表
   * 1.[performLayoutTextOffset]首次排序使用 [performLayoutRow]将所有文字按ltr方向排序成一条直线并给出每个文字的offset,同时会设置word space
   * 2.[performConstraintsWidth]约束排序，主要做换行等操作,根据文字特性判定换行规则,并返回堆叠高度[maxHeight]
   */
  layout(
    constraints: ParagraphConstraints,
    paint: Painter,
    startOffset: Vector = Vector.zero
  ): Partial<ParagraphLayouted> {
    this.performLayoutTextOffset(paint, startOffset);
    this.handleCompileWord();
    const maxHeight = this.performConstraintsWidth(constraints);
    this.performLayoutTextAlignment(constraints);
    let countWidth = 0;
    // this.textPoints.forEach((_) => {
    //   // if (_.parentData.broCount>1)
    //   console.log(
    //     _.text,
    //     _.parentData.offset
    //   );
    // });

    // this.performLayoutTextAlignment(constraints);
    // console.log();
    return {
      height: maxHeight,
      nextStartOffset: this.getNextStartOffset(),
    };
  }
  private handleCompileWord() {
    let current = this.firstTextPoint;
    let currentHead = this.firstTextPoint;
    let wordCount = 0;
    while (current != null) {
      const parentData = current.parentData;
      const nextBroTextPoint = parentData.nextPointText;
      const currentTextCodePoint = current?.charCodePoint;
      //遇到空格中文跳过
      if (
        currentTextCodePoint > 256 ||
        TextPainter.isSpace(currentTextCodePoint) ||
        TextPainter.isNewline(currentTextCodePoint)
      ) {
        current = nextBroTextPoint;
        currentHead = current;
        wordCount = 0;
        continue;
      }
      current = nextBroTextPoint;
      currentHead.parentData.broCount = ++wordCount;
      //词缀无实际broCount
      if (wordCount >= 1 && current?.isWord) {
        current.parentData.broCount = 0;
      }
      currentHead.parentData.wordCountWidth += parentData.box.width;
    }

    console.log("完成", this.firstTextPoint);
  }
  private performLayoutTextAlignment(constraints: ParagraphConstraints) {
    let textPoint = this.firstTextPoint;
    const rows: Record<number, Rowed> = {};
    while (textPoint != null) {
      const parentData = textPoint.parentData;
      const next = parentData.nextPointText;
      const column = parentData.column;
      let row = rows[column];
      if (!row) {
        row = {
          textPoints: [],
          countWidth: 0,
        };
      }
      row.countWidth += parentData.box.width;
      //行末空格忽略
      if (
        next?.parentData.column != column &&
        TextPainter.isSpace(textPoint.charCodePoint)
      ) {
        row.countWidth -= parentData.box.width;
        textPoint.hiddenTextPoint();
      } else {
        row.textPoints.push(textPoint);
      }
      
      rows[column] = row;
      textPoint = next;
    }

    const maxWidth = constraints.width;

    let leadingSpace: number = 0;
    let betweenSpace: number = 0;

    const rowLen: number = Object.keys(rows).length;
    for (const key in rows) {
      const row = rows[key];
      const wordList = row.textPoints;
      const countWidth = row.countWidth;
      const freeSpace = Math.max(maxWidth - countWidth, 0);
      const canLayout: boolean = freeSpace > 0;
      const wordCount: number = wordList.reduce<number>(
        (count: number, textPoint: TextPoint) => {
          return count + (textPoint.parentData.broCount&&!textPoint.hidden ? 1 : 0);
        },
        0
      );
      switch (this.textStyle.textAlign) {
        case TextAlign.end:
          leadingSpace = freeSpace;
          break;
        case TextAlign.center:
          leadingSpace = freeSpace * 0.5;
          break;
        case TextAlign.start:
          leadingSpace = 0;
          betweenSpace = 0;
          break;
        case TextAlign.justify:
          betweenSpace = freeSpace / (wordCount - 1);
          //最后行不需要flex
          if (Number(key) === rowLen) {
            leadingSpace = 0;
            betweenSpace = 0;
          }
          break;
      }
      let positionX: number = leadingSpace;
      // console.log(key+"单词数量", wordCount+"剩余"+freeSpace);
      if (!canLayout) continue;
      wordList.forEach((_, ndx) => {
        const parentData = _.parentData;
        if (parentData.broCount) {
          parentData.offset = new Vector(positionX, parentData.offset.y);
          positionX += parentData.wordCountWidth || parentData.box.width;
          positionX += betweenSpace;
          this.performLayoutRow(_, parentData.offset, parentData.broCount);
        }
      });
    }
  }

  /**
   * 约束文字宽度
   * 根据约束宽度判断文字是否超出宽度得到overflow,如果overflow>0说明超出
   * 超出后由于已经有布局过，需要将新的一行x设置为0,就必须让x加上反向增量达到0,反向增量为x的倒数
   * 文本是否为单词判断逻辑为next不为null与next的code码小于256与next不为空格即判定为一个单词
   * 区别是否一个单词时，必须满足连续字母超过一个才满足为一个"单词"
   * 每个单词的broCount至少为1，空格以及兄弟字母该属性为null
   *
   * ----
   */
  private performConstraintsWidth(constraints: ParagraphConstraints): number {
    let maxHeight = 0;
    let column = 1,
      subDeltaX = 0;
    const maxWidth = constraints.width;
    const len = this.textPoints.length;
    for (let index = 0; index < len; index) {
      const textPoint = this.textPoints[index];
      const codePoint = textPoint.text.charCodeAt(0);
      const parentData = textPoint?.parentData;
      const broCount = parentData.broCount;
      const offset = parentData.offset;
      const box = parentData.box;
      let wordWidth = (parentData.wordCountWidth || box.width) + offset.x;
      const textOffsetX = wordWidth + subDeltaX;
      const overflow = maxWidth - textOffsetX;
      if (overflow < 0 || TextPainter.isNewline(codePoint)) {
        subDeltaX = offset.x * -1;
        column++;
      }
      const deltaY = this.textStyle.lineHeight * column;
      let deltaX = subDeltaX + offset.x;
      offset.setXY(deltaX, deltaY);
      maxHeight = Math.max(deltaY, maxHeight);
      parentData.column = column;
      index += broCount || 1;
      this.performLayoutRow(textPoint, offset, broCount);
      textPoint.parentData = parentData;
    }
    return maxHeight;
  }
  /**
   *  将文字处理为[TextBox]并计算每个文字的offset
   */
  private performLayoutTextOffset(paint: Painter, startOffset: Vector) {
    const texts: Array<string> = Array.from(this.text);
    let after: TextPoint;
    for (const text of texts) {
      const textPoint = this.insertTextToList(text, paint, after);
      after = textPoint;
      if (!this.firstTextPoint) {
        this.firstTextPoint = textPoint;
      }
    }
    this.performLayoutRow(this.firstTextPoint, startOffset, null, true);
  }
  /**
   * 传入一个[TextPoint],这个对象将会是渲染的第一位，接下来会一只next下去，布局的将会是从左到右进行，不会出现换行
   * next的offset将会基于前一个offset而重新计算,直至next==null 或者 到达 maRange
   */
  private performLayoutRow(
    textPoint: TextPoint,
    parentOffset?: Vector,
    maxRange?: number,
    initRow?: boolean
  ) {
    const symbolRegex = /\.|\(|\)|\（|\）|\!|\！/;
    let x: number = parentOffset?.x ?? 0;
    let currentPoint = textPoint;
    let range: number = 0;
    const headTextPointParentData = textPoint.parentData;
    while (currentPoint != null) {
      if (maxRange && (range += 1) > maxRange) return;
      const parentData = currentPoint?.parentData;
      const isOffset = !symbolRegex.test(currentPoint.text);
      const offset = Vector.zero;
      const box = parentData.box;
      if (TextPainter.isSpace(currentPoint.charCodePoint)) {
        if (initRow) {
          box.width += this.textStyle.wordSpace;
        }
      }
      const offsetY = headTextPointParentData.offset.y;
      offset.setXY(x, offsetY);
      parentData.offset.set(offset);
      parentData.column = headTextPointParentData.column;
      currentPoint = parentData.nextPointText;
      x += box.width;
      this.lastTextPoint = currentPoint ?? this.lastTextPoint;
    }
  }
  private getNextStartOffset(): Vector {
    if (this.textPoints.length === 0) return Vector.zero;
    const parentData = this.lastTextPoint?.parentData;
    if (!parentData) return Vector.zero;
    const lastOffset = parentData.offset.copy();
    const continueOffset = Vector.zero;
    continueOffset.add(lastOffset);
    continueOffset.add(
      new Vector(
        this.textStyle.fontSize,
        -(
          this.textStyle.fontSize +
          Math.max(0, this.textStyle.lineHeight - this.textStyle.fontSize)
        )
      )
    );
    return continueOffset;
  }
  private insertTextToList(
    text: string,
    paint: Painter,
    after?: TextPoint
  ): TextPoint {
    const textMetrics = this.getMeasureText(paint, text);
    const box = this.getTextBox(textMetrics);
    const textPoint = new TextPoint(text);
    const parentData = textPoint.parentData;
    parentData.box = box;
    if (after) {
      textPoint.parentData.prePointText = after;
      after.parentData.nextPointText = textPoint;
    }
    textPoint.parentData = parentData;
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
  paint(paint: Painter, offset: Vector = Vector.zero): Vector {
    if (this.textPoints) {
      paint.fillStyle = this.textStyle.color;
      this.textPoints.forEach((_) => {
        if(_.hidden)return;
        const parentData = _.parentData;
        paint.fillText(
          _.text,
          parentData.offset.x + offset.x,
          parentData.offset.y + offset.y
        );
        if (_.text === " ") {
          paint.beginPath();
          paint.rect(
            parentData.offset.x + offset.x,
            parentData.offset.y + offset.y - parentData.box.height - 2,
            parentData.box.width,
            parentData.box.height
          );
          paint.strokeStyle = "orange";
          paint.stroke();
          paint.closePath();
        } else if (_.text !== " ") {
          paint.beginPath();
          paint.rect(
            parentData.offset.x + offset.x,
            parentData.offset.y + offset.y - parentData.box.height,
            parentData.box.width,
            parentData.box.height
          );
          paint.strokeStyle = "#ccc";
          paint.closePath();
          paint.stroke();
        }
      });
    }
    return this.getNextStartOffset();
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
