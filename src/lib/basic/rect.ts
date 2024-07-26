import Vector from "../math/vector";

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
  contains(offset:Vector):boolean{
    return offset.x >= 0.0 && offset.x < this.width && offset.y >= 0.0 && offset.y < this.height;
  }
}

export class Offset {
  offsetX: number;
  offsetY: number;
  constructor(offsetX: number, offsetY: number) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
  static zero(): Offset {
    return new Offset(0, 0);
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
}

export default Rect;
