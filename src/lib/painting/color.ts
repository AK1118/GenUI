import { clamp } from "../math/math";

export class Color {
  constructor(private value: number=0) {
    if (value < 0 || value > 0xffffffff) {
      throw new Error(
        `Color value must be between 0 and 4294967295.But got ${value}`
      );
    }
  }
  /**
   * 红色取值 0~255
   */
  get red(): number {
    return (0x00ff0000 & this.value) >>> 16;
  }
  /**
   * 绿色取值 0~255
   */
  get green(): number {
    return (0x0000ff00 & this.value) >>> 8;
  }
  /**
   * 蓝色取值 0~255
   */
  get blue(): number {
    return (0x000000ff & this.value) >>> 0;
  }
  /**
   * alpha取值 0~255
   */
  get alpha(): number {
    return (0xff000000 & this.value) >>> 24;
  }
  /**
   * 通过指定 alpha 来创建一个新的颜色实例
   * @param alpha - 新的 alpha 值 (0~255)
   */
  withAlpha(alpha: number): Color {
    const newValue = ((this.value & 0x00ffffff) | ((alpha & 0xff) << 24))>>>0;
    return new Color(newValue);
  }
  /**
   * 通过指定 opacity 来创建一个新的颜色实例
   * @param opacity - 新的 opacity 值 [0~1]
   */
  withOpacity(opacity: number): Color {
    opacity=Math.min(1,Math.max(0,opacity));
    return this.withAlpha(opacity * 0xff);
  }
  /**
   * 通过指定 red 来创建一个新的颜色实例，值范围[0~255]
   */
  withRed(red: number): Color {
    return Color.fromRGBA(red, this.green, this.blue, this.alpha);
  }
  /** 
   * 通过指定 green 来创建一个新的颜色实例,值范围[0~255]
   * */
  withGreen(green: number): Color {
    return Color.fromRGBA(this.red, green, this.blue, this.alpha);
  }
  /**
   * 通过指定 blue 来创建一个新的颜色实例，值范围[0~255]
   */
  withBlue(blue: number): Color {
    return Color.fromRGBA(this.red, this.green, blue, this.alpha);
  }
  lerp(other: Color, t: number): Color {
    return Color.lerp(this, other, t);
  }
  /**
   * 不透明度取值 0~1
   */
  get opacity(): number {
    return this.alpha / 0xff;
  }
  get rgba(): string {
    return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.opacity})`;
  }
  get rgb(): string {
    return `rgb(${this.red}, ${this.green}, ${this.blue})`;
  }
  get color(): number {
    return this.value;
  }

  equals(value: Color): boolean {
    if (!value) return false;
    return value.color === this.color;
  }
  /**
   * 从start颜色插值到end, 返回一个颜色实例
   * 例如从黑色到白色取之间1/2时间的颜色:
   * ``` typescript
   * Color.lerp(Colors.black, Colors.white, 0.5);
   * ```
   */
  static lerp(start: Color, end: Color, t: number): Color {
    const lerpInt = (start: number, end: number, t: number) => {
      return Math.floor(start + (end - start) * t);
    };
    const newR = lerpInt(start.red, end.red, t);
    const newG = lerpInt(start.green, end.green, t);
    const newB = lerpInt(start.blue, end.blue, t);
    const newAlpha = lerpInt(start.alpha, end.alpha, t);
    return Color.fromRGBA(clamp(newR,0,255), clamp(newG,0,255), clamp(newB,0,255), clamp(newAlpha,0,255));
  }
  /**
   * 通过指定 r,g,b,a 来创建一个新的颜色实例
   * 例如创建红色颜色:
   * ``` typescript
   * Color.fromRGBA(255, 0, 0, 1)
   * ```
   */
  static fromRGBA(r: number, g: number, b: number, a: number): Color {
    //>>>0做了无符号右移
    return new Color(
      (((a & 0xff) << 24 >>>0) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff))>>>0
    );
  }
}

export abstract class Colors {
  static get black(): Color {
    return new Color(0xff000000);
  }
  static get white(): Color {
    return new Color(0xffffffff);
  }
  static get red(): Color {
    return new Color(0xffff0000);
  }
  static get green(): Color {
    return new Color(0xff00ff00);
  }
  static get blue(): Color {
    return new Color(0xff0000ff);
  }
  static get yellow(): Color {
    return new Color(0xffffff00);
  }
  static get cyan(): Color {
    return new Color(0xff00ffff);
  }
  static get magenta(): Color {
    return new Color(0xffff00ff);
  }
  static get transparent(): Color {
    return new Color(0x00000000);
  }
  static get gray(): Color {
    return new Color(0xff808080);
  }
  static get darkGray(): Color {
    return new Color(0xffa9a9a9);
  }
  static get orange(): Color {
    return new Color(0xffffa500);
  }
  static get pink(): Color {
    return new Color(0xffffc0cb);
  }
}
