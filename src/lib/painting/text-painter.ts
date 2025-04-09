import Painter, { PaintingStyle } from "@/lib/painting/painter";
import Rect, { Offset, Size } from "@/lib/basic/rect";
import { GenPlatformConfig } from "../core/platform";
import { Color } from "./color";
import {
  FontStyle,
  FontWeight,
  Shadow,
  TextAlign,
  TextDecoration,
  TextDecorationStyle,
  TextDirection,
  TextOverflow,
} from "../core/base-types";
import { TextSelection } from "../services/text-editing";

const _kDefaultFontSize: number = 14.0;
const _kDefaultEllipsis: string = "…";
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
  abstract build(builder: ParagraphBuilder): void;
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
  textAlign?: TextAlign;
  textDirection?: TextDirection;
  maxLines?: number;
  ellipsis?: string;
  height?: number;
  fontFamily?: string;
}

export class ParagraphStyle implements ParagraphStyleOption {
  textAlign: TextAlign = TextAlign.unset;
  textDirection: TextDirection = TextDirection.ltr;
  /**
   * 该属性接收一个正整数用于限制文字最大行数。当文字实际最大行数超过[maxLines]时将不再继续被布局渲染，详见函数  [Paragraph.performConstraintsWidth]
   */
  maxLines: number = Infinity;
  /**
   * 接收自定义ellipsis的字符串，用于自定义在文字超出后的ellipsis效果。
   * 替换逻辑详见 [Paragraph.replaceEllipsis]
   */
  ellipsis?: string;
  height?: number = 0;
  fontFamily: string = "serif";

  constructor(option?: ParagraphStyleOption) {
    if (option) {
      this.textAlign = option.textAlign ?? this.textAlign;
      this.textDirection = option.textDirection ?? this.textDirection;
      this.maxLines = option.maxLines ?? this.maxLines;
      this.ellipsis = option.ellipsis;
      this.height = option.height;
      this.fontFamily = option.fontFamily ?? this.fontFamily;
    }
  }
  public getParagraphStyle(
    paragraphStyle: Partial<ParagraphStyleOption> = {}
  ): ParagraphStyle {
    return new ParagraphStyle({
      textAlign: paragraphStyle?.textAlign ?? this.textAlign,
      textDirection: paragraphStyle?.textDirection ?? this.textDirection,
      fontFamily: paragraphStyle?.fontFamily ?? this.fontFamily,
      height: paragraphStyle?.height ?? this.height,
      ellipsis: paragraphStyle.ellipsis ?? this.ellipsis,
      maxLines: paragraphStyle?.maxLines ?? this.maxLines,
    });
  }
}

interface TextDecorationOption {
  decoration: TextDecoration;
  decorationStyle: TextDecorationStyle;
  decorationColor: Color;
}
interface TextStyleOption extends ParagraphStyleOption, TextDecorationOption {
  color: Color;
  fontSize: number;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  letterSpacing: number;
  wordSpacing: number;
  foreground: Painter;
  shadow: Shadow;
  overflow: TextOverflow;
}

export class TextStyle
  extends ParagraphStyle
  implements TextStyleOption, TextDecorationOption
{
  color: Color;
  fontSize: number;
  fontWeight: FontWeight = FontWeight.normal;
  fontStyle: FontStyle = FontStyle.normal;
  letterSpacing: number = 0;
  wordSpacing: number = 0;
  decoration: TextDecoration = TextDecoration.none;
  decorationStyle: TextDecorationStyle = TextDecorationStyle.solid;
  decorationColor: Color;
  foreground: Painter;
  shadow: Shadow;
  /**
   * 当父节点设置了绝对的size时，超出安全返回的文字不会被进行裁剪和ellipsis,除非设置overflow属性为[TextOverflow.clip]或是[TextOverflow.ellipsis]，
    需要注意的是[TextOverflow.ellipsis] 必须设置maxLines才会正常运行。
    当父节点设置了绝对的size，且overflow是[TextOverflow.clip],文字将会被裁剪。仅保留安全区域内的文字内容
    若当前textStyle设置了maxLines且overflow是[TextOverflow.ellipsis]，超出的文字内容将会被…替代。
    例子，以下内容将会裁剪掉超出部分，但不会再在末尾渲染 …
    将overflow: TextOverflow.clip, 替换为 overflow: TextOverflow.ellipsis, 超出部分将会被…替代。
    new SizeRender(
      290,
      100,
      new ParagraphView({
        text: new TextSpan({
          text: "The @media CSS at-rule can be used to apply part of a style sheet based on the result of one or more media queries. With it, you specify a media query and a block of CSS to apply to the document if and only if the media query matches the device on which the content is being used.😊",
          textStyle: new TextStyle({
            color: "black",
            maxLines: 5,
            overflow: TextOverflow.clip,
          }),
        }),
      })
    )
   */
  overflow: TextOverflow;
  constructor(option?: Partial<TextStyleOption>) {
    super(option);
    if (option) {
      this.color = option.color ?? this.color;
      this.fontSize = option.fontSize ?? this.fontSize;
      this.fontWeight = option.fontWeight ?? this.fontWeight;
      this.fontStyle = option.fontStyle ?? this.fontStyle;
      this.letterSpacing = option.letterSpacing ?? this.letterSpacing;
      this.wordSpacing = option.wordSpacing ?? this.wordSpacing;
      this.decoration = option.decoration ?? this.decoration;
      this.decorationStyle = option?.decorationStyle ?? this.decorationStyle;
      this.decorationColor = option?.decorationColor ?? this.decorationColor;
      this.foreground = option?.foreground;
      this.overflow = option?.overflow;
      this.shadow = option?.shadow;

      // this.fontSize??=14;
      this.height ??= (this.fontSize ?? _kDefaultFontSize) * 1.4; //默认
      this.decorationColor ??= new Color(0xff000000);

      if (this.foreground && this.color) {
        throw Error(
          "The 'foreground' and 'color' cannot exist at the same time."
        );
      } else if (!this.foreground && !this.color) {
        this.color = new Color(0xff000000);
      }
    }
  }

  public getTextStyle(style?: Partial<TextStyleOption>): TextStyle {
    return new TextStyle({
      color: style?.color ?? this.color,
      fontSize: style?.fontSize ?? this.fontSize ?? _kDefaultFontSize,
      fontWeight: style?.fontWeight ?? this.fontWeight,
      fontStyle: style?.fontStyle ?? this.fontStyle,
      letterSpacing: style?.letterSpacing ?? this.letterSpacing,
      wordSpacing: style?.wordSpacing ?? this.wordSpacing,
      decoration: style?.decoration ?? this.decoration,
      decorationStyle: style?.decorationStyle ?? this.decorationStyle,
      decorationColor: style?.decorationColor ?? this.decorationColor,
      foreground: style?.color ? null : style?.foreground ?? this.foreground, // 注意：如果 TextStyle 支持这个属性
      shadow: style?.shadow ?? this.shadow, // 注意：如果 TextStyle 支持这个属性
      overflow: style?.overflow ?? this.overflow,
    });
  }
  public apply(style?: Partial<TextStyleOption>): TextStyle {
    return new TextStyle({
      color: style?.color ?? this.color,
      fontSize: style?.fontSize ?? this.fontSize,
      fontWeight: style?.fontWeight ?? this.fontWeight,
      fontStyle: style?.fontStyle ?? this.fontStyle,
      letterSpacing: style?.letterSpacing ?? this.letterSpacing,
      wordSpacing: style?.wordSpacing ?? this.wordSpacing,
      decoration: style?.decoration ?? this.decoration,
      decorationStyle: style?.decorationStyle ?? this.decorationStyle,
      decorationColor: style?.decorationColor ?? this.decorationColor,
      foreground: style?.foreground, // 注意：如果 TextStyle 支持这个属性
      shadow: style?.shadow ?? this.shadow, // 注意：如果 TextStyle 支持这个属性
      overflow: style?.overflow ?? this.overflow,
    });
  }
  public copyWith(style?: Partial<TextStyleOption>): TextStyle {
    return new TextStyle({
      color: style?.color ?? this.color,
      fontSize: style?.fontSize ?? this.fontSize,
      fontWeight: style?.fontWeight ?? this.fontWeight,
      fontStyle: style?.fontStyle ?? this.fontStyle,
      letterSpacing: style?.letterSpacing ?? this.letterSpacing,
      wordSpacing: style?.wordSpacing ?? this.wordSpacing,
      decoration: style?.decoration ?? this.decoration,
      decorationStyle: style?.decorationStyle ?? this.decorationStyle,
      decorationColor: style?.decorationColor ?? this.decorationColor,
      foreground: style?.foreground ?? this.foreground, // 注意：如果 TextStyle 支持这个属性
      shadow: style?.shadow ?? this.shadow, // 注意：如果 TextStyle 支持这个属性
      overflow: style?.overflow ?? this.overflow,
    });
  }
}

class TextBox extends Rect {
  direction: TextDirection;
  lineHeight: number;
  constructor(width: number, height: number, direction: TextDirection) {
    super(0, 0, width, height);
    this.direction = direction;
  }
  static fromLTRBD(
    width: number,
    height: number,
    direction: TextDirection
  ): TextBox {
    return new TextBox(width, height, direction);
  }

  copy(): TextBox {
    const newTextBox = new TextBox(this.width, this.height, this.direction);
    newTextBox.lineHeight = this.lineHeight;
    newTextBox.offset = this.offset;
    return newTextBox;
  }
}

abstract class TreeNode<T> {
  public preNode: T;
  public nextNode: T;
  public parentNode: T;
}

class TextPointParentData extends TreeNode<TextPoint> {
  public index: number = 0;
  public column: number;
  get offset(): Offset {
    return this.box.offset;
  }
  set offset(value: Offset) {
    this.box.offset = value;
  }
  public box: TextBox;
  public broCount: number = 1;
  public wordCountWidth: number = 0;
  public baseLineOffsetY: number = 0;
  /**
   * 在渲染上的盒子，某些特定字符与box可能不太一致
   * 例如：换行符 参考 @Paragraph.performLayoutTextOffset 方法内的  _.parentData.visualBox.width=constraints.width;
   */
  public visualBox:TextBox;
}

class TextPoint {
  parentData: TextPointParentData = new TextPointParentData();
  text: string;
  private isSpace: boolean = false;
  private _hidden: boolean = true;
  public hiddenTextPoint(): void {
    this._hidden = true;
  }
  disable() {
    this._hidden = true;
  }
  enable() {
    this._hidden = false;
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

interface Rowed {
  textPoints: TextPoint[];
  countWidth: number;
  maxLineHeight: number;
  minLineHeight: number;
}

class ParagraphParentData extends TreeNode<Paragraph> {}

abstract class ParagraphControl {
  getTextPointForOffset(offset: Offset): TextPoint {
    return null;
  }
  getTextBoxesForRange(selection: TextSelection): Array<TextBox> {
    return [];
  }
}

/**
 * 段落
 */
export class Paragraph extends ParagraphControl {
  public parentData: ParagraphParentData = new ParagraphParentData();
  public textStyle: TextStyle = new TextStyle();
  public text: string;
  private textPoints: TextPoint[] = [];
  private linePoints: Array<{
    start: Offset;
    end: Offset;
  }>;
  private lastTextPoint: TextPoint;
  private firstTextPoint: TextPoint;
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
   * 2.[performConstraintsWidth]约束排序，主要做换行等操作,根据文字特性判定换行规则
   * 3.[performLayoutOffsetYByColumn] 通过宽度约束行计算文字所在的y轴
   * 4.[performLayoutTextAlignment] 通过 [TextAlign] 进行对齐布局
   * 5.[performLayoutLinePoints] 对下划线进行布局，以行为单位，将行首行尾 [TextPoint] 坐标为基础计算下划线位置。
   */
  layout(
    constraints: ParagraphConstraints,
    paint: Painter,
    startOffset: Offset = Offset.zero
  ) {
    if (!this.text.length) return;
    //初始化切割文字
    this.performLayoutTextOffset(paint, startOffset,constraints);
    //合成单词
    this.handleCompileWord();
    this.performConstraintsWidth(constraints, 0, 1, this.textStyle.maxLines);
    this.performLayoutOffsetYByColumn();
    this.performLayoutTextAlignment(constraints);
    this.performLayoutLinePoints();
  }

  public performLayoutLinePoints() {
    if (this.textStyle.decoration == TextDecoration.none) return;
    const height = this.textStyle.fontSize;
    const rows = TextPainter.getRowsByNodeTree(this.firstTextPoint);
    const values = rows.values();
    let row: Rowed;
    this.linePoints = [];
    while (true) {
      const next = values.next();
      if (next.done) break;
      row = next.value;
      const textPoints = row.textPoints;
      const len = textPoints.length;
      if (len >= 1) {
        const textPoint = textPoints[0];
        const lineHeight = textPoint.parentData.box.lineHeight;
        const width = textPoint.parentData.box.width;
        const start = textPoint.parentData.offset.copy();
        const end = (
          len === 1 ? textPoint : textPoints[len - 1]
        ).parentData.offset.copy();
        end.x += width;
        let offsetY = 0;
        switch (this.textStyle.decoration) {
          case TextDecoration.underline:
            offsetY = (lineHeight - height) * -0.5;
            break;
          case TextDecoration.overline:
            offsetY = (lineHeight - height) * -0.5 - height;
            break;
          case TextDecoration.lineThrough:
            offsetY = (lineHeight - height) * -0.5 - height * 0.5;
            break;
        }
        start.y += offsetY + textPoint.parentData.baseLineOffsetY;
        end.y += offsetY + textPoint.parentData.baseLineOffsetY;
        this.linePoints.push({
          start,
          end,
        });
      }
    }
  }
  protected applyTextStyle(
    paint: Painter,
    callback?: (paint: Painter) => void
  ) {
    if (callback) paint.save();
    paint.font = `${this.textStyle.fontWeight} ${this.textStyle.fontStyle} ${~~(
      this.textStyle.fontSize ?? _kDefaultFontSize
    )}px ${this.textStyle.fontFamily}`;
    if (this.textStyle.shadow) {
      paint.setShadow(this.textStyle.shadow);
    }
    callback?.(paint);
    if (callback) {
      paint.restore();
    }
  }
  /**
   * 将字母合成为一个单词，并将整个单词宽度的和存储在首个字母
   */
  public handleCompileWord() {
    let current = this.firstTextPoint;
    let currentHead = this.firstTextPoint;
    let wordCount = 0;
    while (current != null) {
      const parentData = current.parentData;
      const currentTextCodePoint = current?.charCodePoint;
      //遇到空格中文跳过
      if (
        TextPainter.isNewline(currentTextCodePoint) ||
        TextPainter.isSpace(currentTextCodePoint) ||
        currentTextCodePoint > 256
      ) {
        //遇到空格或换行符，则重新开始计算单词宽度
        //所以wordCount = 0; 且该ParentData.broCount 默认为1，参考 @TextPointParentData.broCount
        parentData.broCount = 1;
        current = parentData.nextNode;
        currentHead = current;
        wordCount = 0;
        continue;
      } else {
        current = parentData.nextNode;
        currentHead.parentData.broCount = ++wordCount;
        //词缀无实际broCount
        if (wordCount >= 1 && current?.isWord) {
          current.parentData.broCount = 0;
        }
        currentHead.parentData.wordCountWidth += parentData.box.width;
      }
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
    if (!row) return;
    const maxWidth = constraints.width;
    let leadingSpace: number = 0;
    let betweenSpace: number = 0;
    const wordList = row?.textPoints;
    const countWidth = row?.countWidth;
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
        parentData.offset = new Offset(positionX, parentData.offset.y);
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
   * @param lastColumn 当前所在行数
   * @param isLastParagraph 标记是否为 [MulParagraph] 中的最后一个 [Paragraph],当为最后一段时，当前行数到达最大行数时必须立即停止向下布局。
   */
  public performConstraintsWidth(
    constraints: ParagraphConstraints,
    lastSubDeltaX: number = 0,
    lastColumn: number = 1,
    maxLine: number = Infinity
  ) {
    // let current = this.firstTextPoint;
    // while (current != null) {
    //   const parentData = current.parentData;
    //   const currentTextCodePoint = current?.charCodePoint;
    //   current = parentData.nextNode;
    // }
    if (lastColumn > maxLine)
      return {
        column: lastColumn,
        subDeltaX: lastSubDeltaX,
      };

    let subDeltaX = lastSubDeltaX;
    const constraintsWidth = constraints.width;
    const len = this.textPoints.length;
    let forwardColumnLastX=0;
    //遍历所有字符串，且index随每个字符的兄弟字符(broCount)增长，broCount最小为1，即每个字符至少占据一个位置
    for (let index = 0; index < len; index) {
      const textPoint = this.textPoints[index];
      const codePoint = textPoint.text.charCodeAt(0);
      const parentData = textPoint?.parentData;
      const broCount = parentData.broCount;
      let offset = parentData.offset;
      const box = parentData.box;
      let wordWidth = (parentData.wordCountWidth || box.width) + offset.x;
      const textOffsetX = wordWidth + subDeltaX;
      const overflow = constraintsWidth - textOffsetX;

      const nextTextPoint = this.textPoints[index + broCount];
      const nextCodePoint = nextTextPoint?.text?.charCodeAt(0);

      if (overflow < 0 || TextPainter.isNewline(codePoint)) {
        subDeltaX = offset.x * -1;
        if (lastColumn >= maxLine) {
          if (this.textStyle?.overflow === TextOverflow.ellipsis) {
            this.replaceEllipsis(textPoint.parentData.preNode);
          }
          lastColumn += 1;
          return {
            column: lastColumn,
            subDeltaX,
          };
        }
       
        lastColumn += 1;
      }
      let deltaX = subDeltaX + offset.x;
      offset = new Offset(deltaX, 0);
      parentData.column = lastColumn;
      if (TextPainter.isNewline(codePoint)) {
        parentData.column -= 1;
        offset.x=forwardColumnLastX;
        subDeltaX-=box.width;
      }
      index += broCount || 1;
      if (broCount !== 0) {
        this.performLayoutRow(textPoint, offset, broCount);
      }
      if(parentData.wordCountWidth===0){
        parentData.wordCountWidth=box.width;
      }
      textPoint.parentData = parentData;
      forwardColumnLastX=deltaX+parentData.wordCountWidth;
    }

    return {
      column: lastColumn,
      subDeltaX,
    };
  }
  //替换超出后文字...
  private replaceEllipsis(lastTextPoint: TextPoint) {
    if (!lastTextPoint) return;
    if (lastTextPoint) {
      //是否有自定义ellipsis字符传入
      const hasCustomEllipsis: boolean = !!this.textStyle.ellipsis;
      const ellipsis = this.textStyle.ellipsis ?? _kDefaultEllipsis;
      lastTextPoint.text = ellipsis;
      const preBox = lastTextPoint.parentData.box;
      const currentBox = this.getTextBox(
        this.getMeasureText(GenPlatformConfig.instance.painter, ellipsis)
      );
      currentBox.x=preBox.x;
      currentBox.lineHeight = preBox.lineHeight;
      if (hasCustomEllipsis) {
      } else {
        //使用默认字符时需要做对齐基线处理
        currentBox.height = preBox.lineHeight;
      }
      lastTextPoint.parentData.box = currentBox;
    }
  }
  public performLayoutOffsetYByColumn(lastHeight: number = 0) {
    let currentPoint = this.firstTextPoint;
    let maxHeight: number = 0;
    let maxWidth: number = 0;
    while (currentPoint != null) {
      const parentData = currentPoint?.parentData;
      const column = parentData.column;
      const y = column * parentData.box.lineHeight + lastHeight;
      parentData.offset = new Offset(parentData.offset.x, y);
      maxHeight = Math.max(isNaN(y) ? 0 : y, maxHeight);
      maxWidth = Math.max(maxWidth, parentData.offset.x + parentData.box.width);
      currentPoint = parentData.nextNode;
    }
    this.size.setHeight(maxHeight);
    this.size.setWidth(maxWidth);
  }
  /**
   *  将文字处理为[TextBox]并计算每个文字的offset
   */
  public performLayoutTextOffset(paint: Painter, startOffset: Offset,constraints:ParagraphConstraints) {
    // this.textPoints = [];
    // this.firstTextPoint = null;
    // this.lastTextPoint = null;
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
    //新换行符不应该包含宽度，所以需要特殊处理
    this.visitTexts((_) => {
      if (TextPainter.isNewline(_.charCodePoint)) {
        _.parentData.box.width = 0;
        _.parentData.visualBox.width=constraints.width;
      }
      return true;
    });
    this.performLayoutRow(this.firstTextPoint, startOffset, null, true);
  }
  /**
   * 该方法只会出现在初始化布局时或布局单词链表对象时。在初始化时会负责将line-height、word-space计算入排版中
   * 传入一个[TextPoint],这个对象将会是渲染的第一位，接下来会一只next下去，布局的将会是从左到右进行，不会出现换行
   * next的offset将会基于前一个offset而重新计算,直至next==null 或者 到达 maRange
   */
  public performLayoutRow(
    textPoint: TextPoint,
    parentOffset?: Offset,
    maxRange?: number,
    initRow?: boolean
  ) {
    let x: number = parentOffset?.x ?? 0;
    let currentPoint = textPoint;
    let range: number = 0;
    const headTextPointParentData = textPoint.parentData;
    while (currentPoint != null) {
      currentPoint.enable();
      if (maxRange && (range += 1) > maxRange) return;
      const parentData = currentPoint?.parentData;
      let offset = Offset.zero;
      const box = parentData.box;
      if (initRow) {
        if (TextPainter.isSpace(currentPoint.charCodePoint)) {
          box.width += this.textStyle.wordSpacing;
        }
      }
      const offsetY = headTextPointParentData.offset.y;
      offset = new Offset(x, offsetY);
      parentData.offset = offset;
      parentData.column = headTextPointParentData.column;
      currentPoint = parentData.nextNode;
      x += box.width;
      this.lastTextPoint = currentPoint ?? this.lastTextPoint;
    }
  }
  public getNextStartOffset(): Offset {
    if (this.textPoints.length === 0) return Offset.zero;
    const parentData = this.lastTextPoint?.parentData;
    if (!parentData) return Offset.zero;
    const lastOffset = parentData.offset.copy();
    const continueOffset = Offset.zero;
    continueOffset.x += lastOffset.x;
    continueOffset.y += lastOffset.y;
    const deltaOffset = new Offset(
      this.textStyle.fontSize,
      -(
        this.textStyle.fontSize +
        Math.max(0, this.textStyle.height - this.textStyle.fontSize)
      )
    );
    continueOffset.x += deltaOffset.x;
    continueOffset.y += deltaOffset.y;
    return continueOffset;
  }
  //文字序号从0开始
  private currentInsertTextPointIndex: number = 0;
  private insertTextToList(
    text: string,
    paint: Painter,
    after?: TextPoint
  ): TextPoint {
    const lineHeight: number = this.textStyle.height;
    const textMetrics = this.getMeasureText(paint, text);
    const box = this.getTextBox(textMetrics);
    const textPoint = new TextPoint(text);
    const parentData = textPoint.parentData;
    box.lineHeight=lineHeight;
    parentData.box = box;
    parentData.visualBox= box.copy();
    if (after) {
      textPoint.parentData.preNode = after;
      after.parentData.nextNode = textPoint;
    }
    parentData.index = this.currentInsertTextPointIndex;
    textPoint.parentData = parentData;
    textPoint.disable();
    this.textPoints.push(textPoint);
    this.currentInsertTextPointIndex++;
    return textPoint;
  }
  private getTextBox(textMetrics: any): TextBox {
    const letterSpacing = this.textStyle.letterSpacing;
    const isFirstChar = this.textPoints.length == 0;
    return TextBox.fromLTRBD(
      textMetrics.width + letterSpacing, //(isFirstChar ? 0 : letterSpacing),
      textMetrics.hangingBaseline ?? textMetrics.width,
      // textMetrics.actualBoundingBoxLeft,
      // textMetrics.actualBoundingBoxRight,
      // textMetrics.actualBoundingBoxDescent,
      // textMetrics.actualBoundingBoxAscent,
      this.textStyle.textDirection
    );
  }
  private getMeasureText(paint: Painter, text: string): TextMetrics {
    return paint.measureText(text);
  }
  public paint(
    paint: Painter,
    offset: Offset = Offset.zero,
    debugRect: boolean = false
  ): Offset {
    if (this.textPoints) {
      this.applyTextStyle(paint, (paint) => {
        if (this.textStyle.decorationStyle === TextDecorationStyle.dashed) {
          paint.setLineDash([5, 5]);
        }
        paint.strokeStyle = this.textStyle.decorationColor.rgba;
        this.performPaintLines(paint, offset);
      });

      this.applyTextStyle(paint, (paint) => {
        if (this.textStyle.foreground) {
          const paint = this.textStyle.foreground;
          this.performPaint(paint, offset, debugRect);
        } else {
          paint.fillStyle = this.textStyle.color.rgba;
          this.performPaint(paint, offset, debugRect);
        }
      });
    }
    return this.getNextStartOffset();
  }
  private performPaintLines(paint: Painter, offset: Offset) {
    if (!this.linePoints) return;
    paint.beginPath();
    this.linePoints.forEach((_) => {
      paint.moveTo(_.start.x + offset.x, _.start.y + offset.y);
      paint.lineTo(_.end.x + offset.x, _.end.y + offset.y);
    });
    paint.stroke();
    paint.closePath();
  }
  private performPaint(paint: Painter, offset: Offset, debugRect: boolean) {
    let child = this.firstTextPoint;
    while (child != null) {
      const parentData = child.parentData;
      const { x, y } = parentData.offset;
      const currentX = x + offset.x,
        currentY = y + offset.y;
      const { width, height, lineHeight } = parentData.visualBox;
      if (child.hidden) {
        child = parentData.nextNode;
        continue;
      }

      let baselineY =
        currentY - (lineHeight - height) * 0.5 + parentData.baseLineOffsetY;
      if (paint.style === PaintingStyle.fill) {
        paint.fillText(child.text, currentX, baselineY);
      } else {
        paint.strokeText(child.text, currentX, baselineY);
      }
      if (debugRect) {
        if (
          TextPainter.isSpace(child.charCodePoint) ||
          TextPainter.isNewline(child.charCodePoint)
        ) {
          paint.beginPath();
          paint.rect(currentX, currentY - lineHeight, width, lineHeight);
          if (TextPainter.isSpace(child.charCodePoint)) {
            paint.strokeStyle = "orange";
          } else {
            paint.strokeStyle = "skyblue";
          }
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
  public visitTexts(visitor: (textPoint: TextPoint) => boolean) {
    let child = this.firstTextPoint;
    while (child != null) {
      //为true则继续
      const isContinue = visitor(child);
      if (!isContinue) break;
      child = child.parentData?.nextNode;
    }
  }
  getTextPointForOffset(offset: Offset): TextPoint {
    let result: TextPoint;
    this.visitTexts((_textPoint) => {
      const parentData = _textPoint.parentData;
      const lineHeight = parentData.visualBox.lineHeight;
      const textRect = _textPoint?.parentData?.box;
      const rectWidth=_textPoint?.parentData?.visualBox.width;
      const rect = new Rect(
        textRect.x,
        textRect.y - lineHeight,
        rectWidth,
        lineHeight
      );
      const isContains = rect?.contains(offset);
      if (isContains) {
        result = _textPoint;
        return false;
      }
      return true;
    });
    if(TextPainter.isNewline(result?.charCodePoint)){
      const preNode= result.parentData?.preNode;
      if(preNode) return preNode;
    }
    if(!result){
      const lastNode= this.lastTextPoint;
      if(lastNode) return lastNode;
    }
    return result;
  }
  getTextBoxesForRange(selection: TextSelection): Array<TextBox> {
    const result = new Array();

    /**
     * 使用过滤返回规则
     * 例如回车符的偏移坐标需要永远保持x在0处
     * 返回的Box决定 textIndicator的渲染位置。
     * 参见 @EditTextRenderView
     */
    const customFilterRule=(textPoint:TextPoint):TextBox=>{
      const parentData = textPoint.parentData;
      const box = parentData.box.copy();
      if(TextPainter.isNewline(textPoint.text.charCodeAt(0))){
        box.offset=new Offset(0,box.offset.y+box.lineHeight);
      }
      return box;
    }

    this.visitTexts((textPoint) => {
      const parentData = textPoint.parentData;
      const index = parentData.index;
      if (index >= selection.start && index <= selection.end) {
        result.push(customFilterRule(textPoint));
      }
      return index <= selection.end;
    });
    return result;
  }


}

/**
 * 多行文本嵌套布局其实是将所有传入的 [Paragraph] (段落) 转为链表并进行后续布局。在布局时，它不会生成新的 [Paragraph] 和其他生成物，它仅仅是代理了 [Paragraph] 的
 * layout 方法。并将每个段落对象内的 [textPoint] 通过 [applyPerformLayoutConstraints] 约束分为若干行，并以行为单位进行后续布局和计算。
 *
 * 当 [Paragraph] 被作为嵌入段落传入是，意味着它本身的 [TextStyle] 会在某些情况下失效，并被 [MulParagraph] 控制。
 *
 *
 * [applyPerformLayoutHorizontalOffset] 方法将传入的文字从string转换为textPoint并横向水平布局，在该过程中不会出现任何换行，且该方法的startOffset参数是
 * 水平布局的其实坐标。当这个坐标的x不为0时，最开始的那一个文字将会从x处开始布局，并从该处开始，x将会一只递归下去直至string全部被水平布局。它是必须被调用的，
 * 往后的所有计算步骤都基于该方法的运行结果。
 *
 * [applyPerformLayoutConstraints] 方法至少接收一个 [ParagraphConstraints] 用于约束文字的最大宽度并返回约束后的文字最大行数。约束宽度决定着文字的换行时机，
 * 如果不执行该方法，所有文字将会保留水平布局状态，它是必须被调用的方法。
 *
 * [handleLevelRowsLineHeight] 方法至少接收一个最大行数参数，它需要通过这个参数获取该嵌套对象的所有文字行以便于后面更好的通过行为单位计算并抹平每行的行高和
 * 文字渲染基线偏移量。同时，这个方法内将会被计算出该嵌套文本的 [最大高度] 值，这是唯一能计算整个嵌套文本高度的方法，并且它是必须被调用的，否则文字将会塌陷为无高度box。
 *
 * [applyAlignText] 方法至少传入最大行数 [maxColumn] 和 [ParagraphConstraints]。它的作用在于它可以将指定的行通过 [textAlign] 对其。文字默认对其值是 [TextAlign.unset]
 * 即不做任何操作，也就是默认从左往右开始布局，并被宽度约束。该方法可选调用，在 [textAlign]值为 [TextAlign.unset] 不会出现明显效果。
 **/
export class MulParagraph extends Paragraph {
  private firstChild: Paragraph;
  private maxWidth: number = 0;
  private maxHeight: number = 0;
  constructor(children?: Paragraph[]) {
    super();
    this.addAll(children);
  }
  public addAll(children: Paragraph[]) {
    if (!children) return;
    let lastChild: Paragraph;
    children.forEach((_) => {
      if (!this.firstChild) {
        this.firstChild = _;
      }
      this.addChild(_, lastChild);
      lastChild = _;
    });
  }
  private addChild(paragraph: Paragraph, after: Paragraph) {
    paragraph.parentData.preNode = after;
    if (after) after.parentData.nextNode = paragraph;
  }
  layout(
    constraints: ParagraphConstraints,
    paint: Painter,
    startOffset?: Offset
  ) {
    this.applyPerformLayoutHorizontalOffset(paint, startOffset,constraints);
    const maxColumn = this.applyPerformLayoutConstraints(
      constraints,
      this.textStyle.maxLines
    );
    this.handleLevelRowsLineHeight(maxColumn);
    this.applyAlignText(maxColumn, constraints);
    this.applyPerformLayoutLinePoint();

    this.size = new Size(this.maxWidth, this.maxHeight);
  }
  private applyPerformLayoutLinePoint() {
    let child = this.firstChild;
    while (child != null) {
      const parentData = child.parentData;
      child.performLayoutLinePoints();
      child = parentData.nextNode;
    }
  }
  /**
   *抹平指定Row内所有TextPoint的line-height并将具有差异的TextPoint的基线Y偏移量校准给line-height较小的一方
   *
   **/
  private handleLevelRowsLineHeight(maxColumn: number) {
    const rows = this.getRows(maxColumn);
    let preColumnHeight: number = 0;
    let maxWidth: number = 0;
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
        const offsetBaseLineY = maxBox.height - box.height;
        box.lineHeight = row.maxLineHeight;
        let y = parentData.box.lineHeight + preColumnHeight;
        if (offsetBaseLineY != 0) {
          parentData.baseLineOffsetY = offsetBaseLineY * 0.5;
        }
        parentData.offset = new Offset(parentData.offset.x, y);
        const deltaWidth = parentData.offset.x + box.width;
        maxWidth = Math.max(maxWidth, isNaN(deltaWidth) ? 0 : deltaWidth);
      });
      preColumnHeight += row.maxLineHeight;
    });
    this.maxWidth = maxWidth;
    this.maxHeight = preColumnHeight;
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
  private applyAlignText(maxColumn: number, constraints: ParagraphConstraints) {
    const rows = this.getRows(maxColumn);
    const keys = [...rows.keys()];
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      const row = rows.get(Number(key));
      this.applyLayoutAlignByRow(row, constraints, index === keys.length - 1);
    }
  }
  private applyPerformLayoutConstraints(
    constraints: ParagraphConstraints,
    maxLines: number = Infinity
  ): number {
    let child = this.firstChild;
    let lastedOffset: number = 0;
    let lastedColumn: number = 1;
    while (child != null) {
      const parentData = child.parentData;
      const { column, subDeltaX } = child.performConstraintsWidth(
        constraints,
        lastedOffset,
        lastedColumn,
        maxLines
      );
      lastedColumn = column;
      lastedOffset = subDeltaX;
      child = parentData.nextNode;
    }
    //最大行数
    return lastedColumn;
  }
  private applyPerformLayoutHorizontalOffset(
    paint: Painter,
    startOffset: Offset = Offset.zero,
    constraints:ParagraphConstraints
  ) {
    let child = this.firstChild;
    let lastedOffset: Offset = startOffset;
    while (child != null) {
      const parentData = child.parentData;
      child.performLayoutTextOffset(paint, lastedOffset,constraints);
      child.handleCompileWord();
      lastedOffset = child.getNextStartOffset();
      child = parentData.nextNode;
    }
  }
  public paint(
    paint: Painter,
    offset: Offset = Offset.zero,
    debug: boolean = false
  ): Offset {
    let child = this.firstChild;
    let lastedOffset: Offset = Offset.zero;
    while (child != null) {
      const parentData = child.parentData;
      lastedOffset = child.paint(paint, offset, debug);
      child = parentData.nextNode;
    }
    return Offset.zero;
  }
}

interface TextElement {
  text: string;
  textStyle: TextStyle;
}

/**
 * 根据推入文字和样式生成一个 [Paragraph] 对象，当在被调用 build 函数后，该builder对象将不能再被使用
 * textStyles 栈用于存储被推入样式
 * elements 栈用于存储被推入文本，并将文本与对应的样式绑定
 * **/
class ParagraphBuilder {
  private paragraphStyle: ParagraphStyle;
  constructor(paragraphStyle: ParagraphStyle) {
    this.paragraphStyle = paragraphStyle;
  }
  private textStyles: Array<TextStyle> = [];
  private elements: Array<TextElement> = [];
  addText(text: string) {
    this.elements.push({
      text: text,
      textStyle: this.lastTextStyle,
    });
  }
  private get lastTextStyle(): TextStyle {
    const len = this.textStyles.length;
    if (len >= 1) {
      return this.textStyles[len - 1];
    }
    return null;
  }
  pushStyle(style: TextStyle) {
    if (this.lastTextStyle) {
      const newStyle: TextStyle = this.lastTextStyle?.apply({
        ...style,
      });
      this.textStyles.push(newStyle);
    } else {
      this.textStyles.push(style);
    }
  }
  /**
   * 保证样式只影响到子节点，在每次将自己推入后需要立即pop，避免污染其他
   * 段落样式
   **/
  pop() {
    this.textStyles.pop();
  }
  build(): Paragraph {
    let resultParagraphs: Paragraph;
    const paragraphs: Array<Paragraph> = [];
    for (const element of this.elements) {
      const paragraph = new Paragraph();
      paragraph.addText(element.text);
      paragraph.pushStyle(element.textStyle);
      resultParagraphs = paragraph;
      paragraphs.push(paragraph);
    }
    if (paragraphs.length > 1) {
      resultParagraphs = new MulParagraph(paragraphs);
      resultParagraphs.pushStyle(this.lastTextStyle);
    }

    // resultParagraphs.pushStyle(resultParagraphs.textStyle);
    resultParagraphs?.pushStyle({
      ...resultParagraphs.textStyle,
      ...this.paragraphStyle,
    } as TextStyle);
    return resultParagraphs;
  }
}

interface TextSpanOption {
  text: string;
  textStyle: TextStyle;
  children: InlineSpan[];
}
export class TextSpan extends InlineSpan {
  children: InlineSpan[];
  text: string;
  paragraph: Paragraph;
  style: TextStyle;
  constructor(option: Partial<TextSpanOption>) {
    super();
    const { textStyle, children, text } = option;
    this.style = textStyle ?? new TextStyle();
    this.children = children;
    this.text = text ?? " ";
  }

  build(builder: ParagraphBuilder): void {
    const hasStyle: boolean = this.style != null;
    if (hasStyle) {
      builder.pushStyle(this.style.getTextStyle());
    }
    if (this.text !== null) {
      builder.addText(this.text);
    }
    if (this.children) {
      for (const child of this.children) {
        child.build(builder);
      }
    }
    if (hasStyle) {
      builder.pop();
    }
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

export class TextPainter extends ParagraphControl {
  private text: TextSpan;
  private preTextSpan: TextSpan;
  private paragraph: Paragraph;
  private painter: Painter;
  public size: Size = Size.zero;
  get width(): number {
    return this.size.width;
  }
  get height(): number {
    return this.size.height;
  }
  constructor(
    text: TextSpan,
    painter: Painter = GenPlatformConfig.instance.painter
  ) {
    super();
    this.text = text;
    this.painter = painter;
  }
  private createParagraph() {
    const builder: ParagraphBuilder = new ParagraphBuilder(
      this.text.style.getParagraphStyle()
    );
    this.text.build(builder);
    this.paragraph = builder.build();
  }
  layout(minWidth: number = 0, maxWidth: number = Infinity) {
    if (this.isEqualsTextSpan()) {
      return;
    }
    if (!this.paragraph) {
      this.createParagraph();
    }
    this.paragraph.layout(new ParagraphConstraints(maxWidth), this.painter);
    this.size.setWidth(this.paragraph.width);
    this.size.setHeight(this.paragraph.height);
    this.preTextSpan = this.text;
  }
  paint(paint: Painter, offset: Offset = Offset.zero, debug: boolean = false) {
    this.paragraph.paint(paint, offset, debug);
  }
  private isEqualsTextSpan(): boolean {
    if (this.preTextSpan == null) return false;
    if (this.text === this.preTextSpan) {
      return true;
    }
    if (this.text.text === this.preTextSpan.text) {
      const preTextStyle = this.preTextSpan.style;
      const textStyle = this.text.style;
      return (
        preTextStyle.fontFamily === textStyle.fontFamily &&
        preTextStyle.fontSize === textStyle.fontSize &&
        preTextStyle.fontWeight === textStyle.fontWeight &&
        preTextStyle.fontStyle === textStyle.fontStyle &&
        preTextStyle.letterSpacing === textStyle.letterSpacing &&
        preTextStyle.wordSpacing === textStyle.wordSpacing &&
        preTextStyle.shadow === textStyle.shadow &&
        preTextStyle.decoration === textStyle.decoration
      );
    }
    return false;
  }
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
  getTextPointForOffset(offset: Offset): TextPoint {
    return this.paragraph.getTextPointForOffset(offset);
  }
  getTextBoxesForRange(selection: TextSelection): Array<TextBox> {
    return this.paragraph?.getTextBoxesForRange(selection).map((box) => {
      const textBox = box.copy();
      textBox.y -= textBox.lineHeight;
      textBox.height = textBox.lineHeight;
      return textBox;
    });
  }
}
