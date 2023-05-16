import Button from "../abstract/button";
import ViewObject, { toJSONInterface } from "../abstract/view-object";
import canvasConfig from "../config/canvasConfig";
import GestiConfig from "../config/gestiConfig";
import { ViewObjectFamily } from "../enums";
import Painter from "../painter";
import Rect from "../rect";
/**
 * 文字
 */
class TextBox extends ViewObject {
  family: ViewObjectFamily=ViewObjectFamily.text;
  async export(): Promise<Object> {
    const json: toJSONInterface = {
      viewObjType: "text",
      options: {
        text: this._text,
        options: {
          fontSize: this.fontsize,
          color: this._color,
          spacing: this._spacing,
          fontFamily: this._fontFamily,
          linesMarks: this.linesMarks,
          lineWidth: this.lineWidth,
          lineColor: this.lineColor,
          lineOffsetY: this.lineOffsetY,
          lineHeight: this.lineHeight,
          width: this.width,
          height: this.height,
        },
        ...this.getBaseInfo(),
      },
    };
    return json;
  }
  private _text: string = "";
  private fontsize: number = 36;
  private _painter: Painter;
  private _fontFamily = "微软雅黑";
  private _spacing: number = 0;
  private _spacing_scale: number = 0;
  private _color: string = "black";
  //划线从 奇数画到偶数，所以一般成对出现
  private linesMarks: Array<number> = [];
  //下划线宽度
  private lineWidth: number = 1;
  //文字间距高度
  private lineHeight: number = 0;
  //下划线在Y轴上的偏移量
  private lineOffsetY: number = 0;
  private lineColor: string = "black";
  private _options: textOptions;
  private lineOneHotMark: Array<number> = [];
  //行？
  private column: number = 0;
  //初始化默认传入高度
  private height: number = 0;
  private width: number = 0;
  //划线状态，1是从起点开始中 2是已经画完上一个线段了，等待下一次
  private currentLineState: 1 | 2 | 3 | 4 | 0 | 5 = 0;
  constructor(text: string, options?: textOptions) {
    super();
    this._painter=canvasConfig.globalPaint;
    this._options = options;
    this.initPrototypes(text, options);
    this.initColumns();

    //自定义操作
    this.custom();
  }

  //@Override
  public custom(): void {
    
  }

  //重写被选中后的样式
  public drawSelected(paint: Painter): void {
    const width = this.rect.size.width,
      height = this.rect.size.height;
    paint.fillStyle = GestiConfig.theme.textSelectedMaskBgColor;
    paint.fillRect(-width >> 1, -height >> 1, width, height);
    paint.fill();
  }
  private async initPrototypes(text: string, options: textOptions) {
    this._text = text;
    const {
      fontFamily = this._fontFamily,
      fontSize = this.fontsize,
      spacing = this._spacing,
      color = this._color,
      linesMarks = this.linesMarks,
      lineWidth = this.lineWidth,
      lineColor = this.lineColor,
      lineOffsetY = this.lineOffsetY,
      lineHeight = this.lineHeight,
      height,
      width,
    } = options ?? {};
    this._fontFamily = fontFamily;
    this.fontsize = fontSize;
    this._spacing = spacing;
    this._color = color;
    this.linesMarks = linesMarks;
    this.lineWidth = lineWidth;
    this.lineColor = lineColor;
    this.lineOffsetY = lineOffsetY;
    this.lineHeight = lineHeight;
    this.width = width;
    this.height = height;
    //计算出行距与字体大小的比例
    this._spacing_scale = this.fontsize / this._spacing;
    this._painter.font = this.fontsize + "px " + this._fontFamily;
    if (this.rect == null)
      this.rect = new Rect({
        width: width ?? this.getWidthSize(),
        height: height ?? this.fontsize,
        x: 0,
        y: 0,
      });
    //默认生成在画布中心
    this.center(canvasConfig.rect.size);
    this.init();
    this.initLine();
  }
  /**
   * 初始化划线
   */
  private initLine() {
    //初始化划线标记独热数组，用内存换运行速度
    this.lineOneHotMark = new Array(this._text.length).fill(0);
    for (let ndx = 0; ndx < this.lineOneHotMark.length; ndx++) {
      const markNdx = this.linesMarks.findIndex((mark) => mark == ndx);
      if (markNdx != -1) {
        this.lineOneHotMark[ndx] = (markNdx + 1) % 2 == 0 ? 2 : 1;
      }
    }
  }
  /**
   * 获取文本长度
   */
  private getWidthSize(): number {
    const metrics = this._painter.measureText(this._text);
    if (!metrics)
      return (
        this.fontsize * this._text.length + this._spacing * this._text.length
      );
    return metrics.width + this._spacing * this._text.length;
  }
  //@Override
  public drawImage(paint: Painter, isReRendered?: boolean): void {
    /**
     * 只用这个宽就行了，因为初始化时已经做好宽度处理，放大缩小是等比例方法缩小。
     */
    const width: number = this.rect.size.width;
    //渲染文本的高度，起始点
    const height = (this.fontsize >> 1) + (this.lineHeight >> 1);
    const textList: Array<string> = this._text.split("");
    const len = textList.length;
    //现在的宽度，渲染在currentWidth列
    let currentWidth = 0;
    this.column = 0;
    let oldColumn = this.column;
    paint.closePath();
    paint.beginPath();
    paint.fillStyle = this._color;
    //设置字体大小与风格
    paint.font = this.fontsize + "px " + this._fontFamily;
    const text_len = textList.length;
    for (let ndx = 0; ndx < text_len; ndx++) {
      const text = textList[ndx];
      const measureText = this._painter.measureText(text);
      const text_width = ~~measureText.width;
      const beforeText = this._text[ndx - 1];
      const nextText = this._text[ndx + 1];
      const spacing = this.fontsize / this._spacing_scale;
      const x = text_width + spacing;
      const rep = / &n/g;
      const isAutoColumn = rep.test(beforeText + text + nextText);
      /**
       * 宽度不足一个字体，接下来要换行才行，还未换行
       */
      if (
        width - currentWidth - x < text_width ||
        (isAutoColumn && this.column == oldColumn)
      ) {
        //上一个为1,且马上要被替换的必须为0
        if (
          this.currentLineState == 1 &&
          this.lineOneHotMark[ndx] == 0 &&
          this.lineOneHotMark[ndx - 1] != 4
        )
          this.lineOneHotMark[ndx] = 4;
      }

      //字数达到宽度后需要换行   或者出发换行字符
      if (currentWidth + x > width || isAutoColumn) {
        this.column += 1;
        currentWidth = 0;
      }
      const drawX = width * -0.5 + currentWidth;
      const drawY =
        (this.column == 0 ? height * 0 : height * (this.column * 2)) -
        (this.rect.size.height >> 1);

      //换行后需要连接起始点不在同意行的线段
      if (
        this.currentLineState == 1 &&
        this.column > oldColumn &&
        this.lineOneHotMark[ndx - 1] == 4 &&
        this.lineOneHotMark[ndx] == 0
      ) {
        this.lineOneHotMark[ndx] = 3;
        this.drawLine(x, ndx, drawX, drawY, paint, width, height, text_width);
        oldColumn = this.column;
      }
      if (!isAutoColumn) {
        const offsetY = height + (this.fontsize >> 1) - this.fontsize * 0.1;
        const offsetX = (x - text_width) >> 1;
        paint.fillText(text, drawX + offsetX, drawY + offsetY);
        currentWidth += x;
      }
      this.drawLine(x, ndx, drawX, drawY, paint, width, height, text_width);
      if (isAutoColumn) {
        ndx += 1;
        paint.stroke();
        continue;
      }
    }
    paint.stroke();
    paint.closePath();
    this.setData();
  }

  private initColumns() {
    /**
     * 只用这个宽就行了，因为初始化时已经做好宽度处理，放大缩小是等比例方法缩小。
     */
    const width: number = this.rect.size.width;
    //渲染文本的高度，起始点
    const height = (this.fontsize >> 1) + (this.lineHeight >> 1);
    const textList: Array<string> = this._text.split("");
    const len = textList.length;
    //现在的宽度，渲染在currentWidth列
    let currentWidth = 0;
    this.column = 0;
    //设置字体大小与风格
    this._painter.font = this.fontsize + "px " + this._fontFamily;
    const text_len = textList.length;
    for (let ndx = 0; ndx < text_len; ndx++) {
      const text = textList[ndx];
      const measureText = this._painter.measureText(text);
      const text_width = ~~measureText.width;
      const beforeText = this._text[ndx - 1];
      const nextText = this._text[ndx + 1];
      const spacing = this.fontsize / this._spacing_scale;
      const x = text_width + spacing;
      const rep = / &n/g;
      const isAutoColumn = rep.test(beforeText + text + nextText);

      //字数达到宽度后需要换行   或者出发换行字符
      if (currentWidth + x > width || isAutoColumn) {
        this.column += 1;
        currentWidth = 0;
      }

      if (!isAutoColumn) {
        currentWidth += x;
      }
      if (isAutoColumn) {
        ndx += 1;
        continue;
      }
    }
    this.setData();
    this.update(this._painter);
  }

  /**
   * @description 添加下划线,[start,end,start,end]
   * 当遍历line的下表为2偶数时，转为 lineTo,奇数转为moveTo
   * @param wordWidth
   * @param ndx
   * @param drawX
   * @param drawY
   * @param paint
   */
  private drawLine(
    wordWidth: number,
    ndx: number,
    drawX: number,
    drawY: number,
    paint: Painter,
    width: number,
    height: number,
    textWidth: number
  ) {
    const lineY: number =
      drawY +
      this.fontsize * 0.2 +
      this.lineOffsetY +
      this.lineHeight +
      this.fontsize;
    //使用标记，1是起始点，2是终点
    const code = this.lineOneHotMark[ndx];
    const beforeCode = this.lineOneHotMark[ndx - 1];
    paint.strokeStyle = this.lineColor;
    paint.lineWidth = this.lineWidth;
    if (code == 1 || code == 2) this.currentLineState = code as 1 | 2;

    if (code == 1)
      return paint.moveTo(drawX - (textWidth + this._spacing), lineY);
    if (code == 2 && beforeCode != 4) return paint.lineTo(drawX, lineY);
    if (code == 3) return paint.moveTo(drawX, lineY);
    if (code == 4 && beforeCode != 4 && beforeCode != 1)
      return paint.lineTo(drawX + (textWidth + this._spacing), lineY);
  }

  //@Override
  public didChangeScale(scale: number): void {
    this.initLine();
    this.setData();
    this.update(this._painter);
  }

  //更新文字内容
  public updateText(text: string, options?: textOptions): Promise<void> {
    return new Promise((r, j) => {
      //  console.log(text,options)
      this._text = text;
      this.initLine();
      this.initPrototypes(text, options);
      this.update(this._painter);
      r();
    });
  }

  public didFallback(): void {
    this.setData();
  }
  /**
   * @description 宽不随文字变化，但文字随宽变化,高度随字体变化
   */
  private async setData() {
    const padding = 10;
    const { size } = this.rect;
    let newHeight = (this.fontsize + this.lineHeight) * (this.column + 1);
    if (newHeight < size.height) {
      newHeight = size.height;
    }
    let newWidth = this.rect.size.width;
    if (newWidth >= canvasConfig.rect.size.width)
      newWidth = canvasConfig.rect.size.width;
    this.rect.setSize(newWidth, newHeight);
    this.resetButtons(["rotate"]);
    if (size.width <= this.fontsize + this._spacing)
      this.rect.setSize(this.fontsize + this._spacing, newHeight);
    return Promise.resolve();
  }
  get value(): any {
    return this._text;
  }
}

export default TextBox;
