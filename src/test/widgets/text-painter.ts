import Painter from "@/core/lib/painter";
import { TextDirection } from "./basic";
import Vector from "@/core/lib/vector";
import { Size } from "@/core/lib/rect";

export enum TextAlign {
  start,
  end,
  center,
  justify,
  unset,
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
  textAlign: TextAlign = TextAlign.unset;
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
  lineHeight: number;

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

abstract class TreeNode<T> {
  public preNode: T;
  public nextNode: T;
  public parentNode: T;
}

class TextPointParentData extends TreeNode<TextPoint> {
  public column: number;
  public offset: Vector = Vector.zero;
  public box: TextBox;
  public broCount: number = 1;
  public wordCountWidth: number = 0;
  public baseLineOffsetY: number = 0;
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

type ParagraphLayouted = {
  height: number;
  nextStartOffset: Vector;
};
interface Rowed {
  textPoints: TextPoint[];
  countWidth: number;
  maxLineHeight: number;
  minLineHeight: number;
}

class ParagraphParentData extends TreeNode<Paragraph> {}

/**
 * 段落
 */
export class Paragraph {
  parentData: ParagraphParentData = new ParagraphParentData();
  textStyle: TextStyle = new TextStyle();
  text: string;
  boxes: TextBox[];
  textPoints: TextPoint[] = [];
  public lastTextPoint: TextPoint;
  public firstTextPoint: TextPoint;
  protected size: Size = Size.zero;
  get width(): number {
    return this.size.width;
  }
  get height(): number {
    return this.size.height;
  }
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
    this.performConstraintsWidth(constraints);
    this.performLayoutOffsetYByColumn();
    this.performLayoutTextAlignment(constraints);
    return {
      height: this.height,
      nextStartOffset: this.getNextStartOffset(),
    };
  }
  private applyTextStyle(paint: Painter) {
    console.log("设置字体大小", `bold ${this.textStyle.fontSize}px serif`);
    paint.font = `bold ${this.textStyle.fontSize}px serif`;
  }
  public handleCompileWord() {
    let current = this.firstTextPoint;
    let currentHead = this.firstTextPoint;
    let wordCount = 0;
    while (current != null) {
      const parentData = current.parentData;
      const nextBroTextPoint = parentData.nextNode;
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
  }
  public getRowByColumn(rowIndex: number): Rowed {
    const rows: Map<number, Rowed> = TextPainter.getRowsByNodeTree(
      this.firstTextPoint
    );
    return rows.get(rowIndex);
  }
  public performLayoutTextAlignment(constraints: ParagraphConstraints) {
    if (this.textStyle.textAlign === TextAlign.unset) return;
    const rows = TextPainter.getRowsByNodeTree(this.firstTextPoint);
    const keys = [...rows.keys()];
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      const row = rows.get(Number(key));
      this.applyLayoutAlignByRow(row, constraints, index === keys.length - 1);
    }
  }
  public applyLayoutAlignByRow(
    row: Rowed,
    constraints: ParagraphConstraints,
    isLastRow: boolean = false
  ) {
    const maxWidth = constraints.width;
    let leadingSpace: number = 0;
    let betweenSpace: number = 0;
    const wordList = row.textPoints;
    const countWidth = row.countWidth;
    const freeSpace = Math.max(maxWidth - countWidth, 0);
    const canLayout: boolean = freeSpace > 0;
    const wordCount: number = wordList.reduce<number>(
      (count: number, textPoint: TextPoint) => {
        return (
          count + (textPoint.parentData.broCount && !textPoint.hidden ? 1 : 0)
        );
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
        if (isLastRow || freeSpace > this.textStyle.fontSize * 2) {
          betweenSpace = 0;
          leadingSpace = 0;
        }
        break;
    }
    let positionX: number = leadingSpace;
    if (!canLayout) return;
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
  public performConstraintsWidth(
    constraints: ParagraphConstraints,
    lastSubDeltaX: number = 0,
    lastColumn: number = 0
  ) {
    let maxHeight = 0;
    let maxWidth = 0;
    let column = 1,
      subDeltaX = lastSubDeltaX;
    const constraintsWidth = constraints.width;
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
      const overflow = constraintsWidth - textOffsetX;
      if (overflow < 0 || TextPainter.isNewline(codePoint)) {
        subDeltaX = offset.x * -1;
        column++;
        lastColumn += 1;
      }
      const deltaY = 0;
      let deltaX = subDeltaX + offset.x;
      offset.setXY(deltaX, deltaY);
      maxHeight = Math.max(deltaY, maxHeight);
      maxWidth = Math.max(deltaX, maxWidth);
      parentData.column = lastColumn;
      index += broCount || 1;
      this.performLayoutRow(textPoint, offset, broCount);
      textPoint.parentData = parentData;
    }
    this.size.setHeight(maxHeight);
    this.size.setWidth(maxWidth);
    return {
      column: lastColumn,
      subDeltaX,
    };
  }
  public performLayoutOffsetYByColumn(lastHeight: number = 0) {
    let currentPoint = this.firstTextPoint;
    while (currentPoint != null) {
      const parentData = currentPoint?.parentData;
      const column = parentData.column;
      const y = column * parentData.box.lineHeight + lastHeight;
      parentData.offset.setXY(parentData.offset.x, y);
      currentPoint = parentData.nextNode;
    }
  }
  /**
   *  将文字处理为[TextBox]并计算每个文字的offset
   */
  public performLayoutTextOffset(paint: Painter, startOffset: Vector) {
    this.applyTextStyle(paint);
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
   * 该方法只会出现在初始化布局时或布局单词链表对象时。在初始化时会负责将line-height、word-space计算入排版中
   * 传入一个[TextPoint],这个对象将会是渲染的第一位，接下来会一只next下去，布局的将会是从左到右进行，不会出现换行
   * next的offset将会基于前一个offset而重新计算,直至next==null 或者 到达 maRange
   */
  public performLayoutRow(
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
    const lineHeight: number = this.textStyle.lineHeight;
    while (currentPoint != null) {
      if (maxRange && (range += 1) > maxRange) return;
      const parentData = currentPoint?.parentData;
      const offset = Vector.zero;
      const box = parentData.box;
      if (initRow) {
        box.lineHeight = lineHeight;
        if (TextPainter.isSpace(currentPoint.charCodePoint)) {
          box.width += this.textStyle.wordSpace;
        }
      }
      const offsetY = headTextPointParentData.offset.y;
      offset.setXY(x, offsetY);
      parentData.offset.set(offset);
      parentData.column = headTextPointParentData.column;
      currentPoint = parentData.nextNode;
      x += box.width;
      this.lastTextPoint = currentPoint ?? this.lastTextPoint;
    }
  }
  public getNextStartOffset(): Vector {
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
      textPoint.parentData.preNode = after;
      after.parentData.nextNode = textPoint;
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
  public paint(
    paint: Painter,
    offset: Vector = Vector.zero,
    debugRect: boolean = false
  ): Vector {
    if (this.textPoints) {
      paint.fillStyle = this.textStyle.color;
      paint.font = `${this.textStyle.fontSize}px serif`;
      this.performPaint(paint, offset, debugRect);
    }
    return this.getNextStartOffset();
  }

  private performPaint(paint: Painter, offset: Vector, debugRect: boolean) {
    let child = this.firstTextPoint;
    while (child != null) {
      const parentData = child.parentData;
      const { x, y } = parentData.offset;
      const currentX = x + offset.x,
        currentY = y + offset.y;
      const { width, height, lineHeight } = parentData.box;
      if (child.hidden) {
        child = parentData.nextNode;
        continue;
      }
      let baselineY =
        currentY - (lineHeight - height) * 0.5 + parentData.baseLineOffsetY; //Math.max(currentY - lineHeight * 0.4, 0); // 假设基线在行高的75%位置，这个比例可以调整
      // if(((lineHeight-height)*.5<height)){
      //   baselineY =currentY-(lineHeight-height)*.5
      // }
      paint.fillText(child.text, currentX, baselineY);
      if (debugRect) {
        if (TextPainter.isSpace(child.charCodePoint)) {
          paint.beginPath();
          paint.rect(currentX, currentY - lineHeight, width, lineHeight);
          paint.strokeStyle = "orange";
          paint.stroke();
          paint.closePath();
        } else {
          paint.beginPath();
          paint.rect(currentX, currentY - lineHeight, width, lineHeight);
          paint.strokeStyle = "#ccc";
          paint.closePath();
          paint.stroke();
        }
      }

      child = parentData.nextNode;
    }
  }
}

/**
 * 文本排版算法：Flutter 使用一系列排版算法来计算文字的位置和大小。这些算法考虑了文本的样式、字体、字号、行高等因素，并根据文本的上下文关系来确定每个文字的准确位置。Flutter 的文本排版算法是高度优化的，能够在短时间内处理大量文字，并保持良好的性能。

文本样式处理：在文本流中，每个文字都可以具有自己的样式，比如字体、字号、颜色、下划线等。Flutter 的文本流机制能够有效地处理不同样式的文字，并根据需要进行合并或分割，以确保最终的文字布局和渲染是正确的。

嵌套文本处理：Flutter 支持嵌套文本，即将一个 TextSpan 放在另一个 TextSpan 的内部。在文本流中，嵌套文本被视为一个整体，并由递归算法处理。这意味着嵌套文本中的每个层级都会经过相同的排版算法，以确保整个文本链的布局和渲染都是正确的。

文本行的生成：在文本流中，文本通常被分为多行进行排版。Flutter 的文本流机制会根据容器的宽度和文本的内容，将文本分割成适当的行，并确定每行的起始位置和结束位置。这样做可以确保文本在水平方向上自动换行，并根据需要进行对齐。

文本渲染：最终，Flutter 的文本流机制会将计算出的文本布局信息传递给底层的渲染引擎（例如 Skia），以便实际渲染文本到屏幕上。渲染引擎会将文本转换为实际的像素数据，并在屏幕上绘制出来，完成整个文本流的布局和渲染过程。

111111222233333 3
1.结合字号、行高确定横向布局
2.宽度约束生成行，标记每个文字所在的column，用于后面alignment对其
3.alignment对齐

11111122
2233333
3.

*/
export class MulParagraph extends Paragraph {
  private firstChild: Paragraph;
  constructor(children: Paragraph[]) {
    super();
    this.addAll(children);
  }
  addAll(children: Paragraph[]) {
    let lastChild: Paragraph;
    children.forEach((_) => {
      if (!this.firstChild) {
        this.firstChild = _;
      }
      this.addChild(_, lastChild);
      lastChild = _;
    });
  }
  addChild(paragraph: Paragraph, after: Paragraph) {
    paragraph.parentData.preNode = after;
    if (after) after.parentData.nextNode = paragraph;
  }
  layout(
    constraints: ParagraphConstraints,
    paint: Painter,
    startOffset?: Vector
  ): Partial<ParagraphLayouted> {
    this.applyPerformLayoutHorizontalOffset(paint, startOffset);
    const maxColumn = this.applyPerformLayoutConstraints(constraints);
    this.handleLevelRowsLineHeight(maxColumn);
    this.applyAlignText(maxColumn, constraints);
    return {};
  }
  /**
   *抹平指定Row内所有TextPoint的line-height并将具有差异的TextPoint的基线Y偏移量校准给line-height较小的一方
   *
   **/
  private handleLevelRowsLineHeight(maxColumn: number) {
    const rows = this.getRows(maxColumn);
    let preColumnHeight: number = 0;
    rows.forEach((row) => {
      let maxLineHeightTextPoint: TextPoint;
      if (row.maxLineHeight !== row.minLineHeight) {
        maxLineHeightTextPoint = maxLineHeightTextPoint = row.textPoints.find(
          (_) => _.parentData.box.lineHeight === row.maxLineHeight
        );
      }
      row.textPoints.forEach((textPoint) => {
        const parentData = textPoint.parentData;
        const box = parentData.box;
        const maxBox = maxLineHeightTextPoint?.parentData?.box || box;
        const offsetBaseLineY =maxBox.height - box.height;
        box.lineHeight = row.maxLineHeight;
        let y = parentData.box.lineHeight + preColumnHeight;
        if (offsetBaseLineY != 0) {
          parentData.baseLineOffsetY = offsetBaseLineY*.5;
        }
        parentData.offset.setXY(parentData.offset.x, y);
      });
      preColumnHeight += row.maxLineHeight;
    });
  }
  private getRows(maxColumn: number) {
    let child = this.firstChild;
    const textPoints = new Array<TextPoint>();
    while (child != null) {
      const parentData = child.parentData;
      for (let column = 1; column <= maxColumn; column++) {
        const row = child.getRowByColumn(column);
        if (row) {
          textPoints.push(...row.textPoints);
        }
      }
      child = parentData.nextNode;
    }
    return TextPainter.getRowsByArray(textPoints);
  }
  public applyAlignText(maxColumn: number, constraints: ParagraphConstraints) {
    const rows = this.getRows(maxColumn);
    const keys = [...rows.keys()];
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      const row = rows.get(Number(key));
      this.applyLayoutAlignByRow(row, constraints, index === keys.length - 1);
    }
  }
  private applyPerformLayoutConstraints(
    constraints: ParagraphConstraints
  ): number {
    let child = this.firstChild;
    let lastedOffset: number = 0;
    let lastedColumn: number = 1;
    let height: number = 0;
    while (child != null) {
      const parentData = child.parentData;
      const { column, subDeltaX } = child.performConstraintsWidth(
        constraints,
        lastedOffset,
        lastedColumn
      );
      height = child.getNextStartOffset().y;
      lastedColumn = column;
      lastedOffset = subDeltaX;
      this.size.setHeight(
        Math.max(this.size.height - child.height, 0) + child.height
      );
      this.size.setWidth(Math.min(this.size.width, constraints.width));
      child = parentData.nextNode;
    }

    //最大行数
    return lastedColumn;
  }
  private applyPerformLayoutHorizontalOffset(
    paint: Painter,
    startOffset: Vector
  ) {
    let child = this.firstChild;
    let lastedOffset: Vector = Vector.zero;
    while (child != null) {
      const parentData = child.parentData;
      child.performLayoutTextOffset(paint, lastedOffset);
      child.handleCompileWord();
      lastedOffset = child.getNextStartOffset();

      child = parentData.nextNode;
    }
  }
  public paint(paint: Painter, offset: Vector = Vector.zero): Vector {
    let child = this.firstChild;
    let lastedOffset: Vector = Vector.zero;
    let lastedLineHeight: number = child.textStyle.lineHeight;
    while (child != null) {
      const parentData = child.parentData;
      const currentLineHeight = child.textStyle.lineHeight;
      const subLinHeight = Math.min(lastedLineHeight - currentLineHeight, 0);
      lastedOffset = child.paint(
        paint,
        Vector.add(offset, new Vector(0, 0)), //subLinHeight
        true
      );
      lastedLineHeight = child.textStyle.lineHeight;
      child = parentData.nextNode;
    }
    return Vector.zero;
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
  //通过Array获取rows数据
  public static getRowsByArray(arr: TextPoint[]): Map<number, Rowed> {
    const rows: Map<number, Rowed> = new Map();
    arr.forEach((textPoint) => {
      const parentData = textPoint.parentData;
      const column = parentData.column;
      let row = rows.get(column);
      if (!row) {
        row = {
          textPoints: [],
          countWidth: 0,
          maxLineHeight: 0,
          minLineHeight: Infinity,
        };
      }
      row.countWidth += parentData.box.width;
      row.maxLineHeight = Math.max(
        row.maxLineHeight,
        parentData.box.lineHeight
      );
      row.minLineHeight = Math.min(
        row.maxLineHeight,
        parentData.box.lineHeight
      );
      //行末空格忽略
      const nextIndex = arr.indexOf(textPoint) + 1;
      const next = nextIndex < arr.length ? arr[nextIndex] : null;
      if (
        next?.parentData.column != column &&
        TextPainter.isSpace(textPoint.charCodePoint)
      ) {
        row.countWidth -= parentData.box.width;
        textPoint.hiddenTextPoint();
      } else {
        row.textPoints.push(textPoint);
      }
      rows.set(column, row);
    });

    return rows;
  }

  //通过Node树获取rows数据
  public static getRowsByNodeTree(
    startTextPoint: TextPoint
  ): Map<number, Rowed> {
    let textPoint = startTextPoint;
    const rows: Map<number, Rowed> = new Map();
    while (textPoint != null) {
      const parentData = textPoint.parentData;
      const next = parentData.nextNode;
      const column = parentData.column;
      let row = rows.get(column);
      if (!row) {
        row = {
          textPoints: [],
          countWidth: 0,
          maxLineHeight: 0,
          minLineHeight: Infinity,
        };
      }
      row.countWidth += parentData.box.width;
      row.maxLineHeight = Math.max(
        row.maxLineHeight,
        parentData.box.lineHeight
      );
      row.minLineHeight = Math.min(
        row.maxLineHeight,
        parentData.box.lineHeight
      );
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
      rows.set(column, row);
      textPoint = next;
    }
    return rows;
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
