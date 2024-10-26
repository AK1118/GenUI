import Vector, { Offset } from "../math/vector";
export { Offset } from "../math/vector";

export class Size {
  private _width: number;
  private _height: number;
  constructor(width: number, height: number) {
    this._width = isNaN(width) ? 0 : width;
    this._height = isNaN(height) ? 0 : height;
  }
  static get zero(): Size {
    return new Size(0, 0);
  }
  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
  set width(value: number) {
    this._width = value;
  }
  set height(value: number) {
    this._height = value;
  }
  toVector() {
    return new Vector(this._width, this._height);
  }
  half(): Size {
    this.width *= 0.5;
    this.height *= 0.5;
    return this;
  }
  copy(): Size {
    return new Size(this._width, this._height);
  }
  equals(size: Size | { width?: number; height?: number }): boolean {
    return size?.width === this._width && size?.height === this._height;
  }
  public setWidth(width: number): void {
    this._width = width;
  }
  public setHeight(height: number): void {
    this._height = height;
  }
  public toObject(): {
    width: number;
    height: number;
  } {
    return {
      width: this._width,
      height: this._height,
    };
  }
  contains(offset: Offset): boolean {
    return (
      offset.x >= 0.0 &&
      offset.x < this.width &&
      offset.y >= 0.0 &&
      offset.y < this.height
    );
  }
}

class Rect {
  private _x: number;
  private _y: number;
  private _width: number;
  private _height: number;
  constructor(x?: number, y?: number, width?: number, height?: number) {
    this._x = isNaN(x) ? 0 : x;
    this._y = isNaN(y) ? 0 : y;
    this._width = isNaN(width) ? 0 : width;
    this._height = isNaN(height) ? 0 : height;
  }
  public update({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
  }: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) {
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
  }
  get x(): number {
    return this._x;
  }
  get y(): number {
    return this._y;
  }
  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
  set x(value: number) {
    this._x = value;
  }
  set y(value: number) {
    this._y = value;
  }
  set width(value: number) {
    this._width = value;
  }
  set height(value: number) {
    this._height = value;
  }
  static get zero(): Rect {
    return new Rect(0, 0, 0, 0);
  }
  get left(): number {
    return this._x;
  }
  get right(): number {
    return this._x + this._width;
  }
  get top(): number {
    return this._y;
  }
  get bottom(): number {
    return this._y + this._height;
  }
  public contains(point: Offset): boolean {
    return (
      point.x >= this.left &&
      point.x < this.right &&
      point.y >= this.top &&
      point.y < this.bottom
    );
  }
  get size(): Size {
    return new Size(this._width, this._height);
  }
  get offset(): Offset {
    return new Offset(this._x, this._y);
  }
  set offset(value: Offset) {
    this._x = value.offsetX;
    this._y = value.offsetY;
  }
  static merge(offset: Offset | Vector, size: Size): Rect {
    return new Rect(offset.x, offset.y, size.width, size.height);
  }
  /**
   * 获取矩形较短的一边的长度
   */
  get shortestSide(): number {
    return Math.min(Math.abs(this.width), Math.abs(this.height));
  }

  /**
   * 获取矩形较长的一边的长度
   */
  get longestSide(): number {
    return Math.max(Math.abs(this.width), Math.abs(this.height));
  }
  copy() {
    return new Rect(this._x, this._y, this._width, this._height);
  }
}

export default Rect;
