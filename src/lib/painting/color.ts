export default class Color {
  constructor(private value: number) {}
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
}

abstract class Colors {
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
