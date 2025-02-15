
export class Offset {
  offsetX: number;
  offsetY: number;
  get x(): number {
    return this.offsetX;
  }
  get y(): number {
    return this.offsetY;
  }
  set x(value: number) {
    this.offsetX = value;
  }
  set y(value: number) {
    this.offsetY = value;
  }
  constructor(offsetX: number, offsetY: number) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
  static get zero(): Offset {
    return new Offset(0, 0);
  }
  toVector(): Vector {
    return new Vector(this.offsetX, this.offsetY);
  }
  copy(): Offset {
    return new Offset(this.offsetX, this.offsetY);
  }
  add(offset:Offset):Offset{
    return new Offset(this.offsetX + offset.x, this.offsetY + offset.y);
  }
}

class Vector extends Offset{
  constructor(x: number, y: number) {
    super(x,y);
    this.x = x;
    this.y = y;
  }
  public add(v: Vector): Vector {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  sub(v: Vector) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  mult(v: Vector) {
    this.x *= v.x;
    this.y *= v.y;
    return this;
  }
  multNumber(n: number): Vector {
    this.x *= n;
    this.y *= n;
    return this;
  }
  div(v: Vector) {
    this.x /= v.x;
    this.y /= v.y;
    return this;
  }
  divNumber(n: number): Vector {
    this.x /= n;
    this.y /= n;
    return this;
  }
  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  dist(v: Vector) {
    let dx = this.x - v.x;
    let dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  normalize() {
    let len = this.mag();
    this.x /= len;
    this.y /= len;
    return this;
  }
  clampX(min: number, max: number) {
    this.x = Math.min(Math.max(this.x, min), max);
  }
  clampY(min: number, max: number) {
    this.y = Math.min(Math.max(this.y, min), max);
  }
  clamp(c: [max: number, min: number]) {
    let [max, min] = c;
    this.x = Math.min(Math.max(this.x, min), max);
    this.y = Math.min(Math.max(this.y, min), max);
  }
  copy() {
    return new Vector(this.x, this.y);
  }
  set(v: Vector) {
    this.x = v.x;
    this.y = v.y;
  }
  setXY(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  toJson(): { x: number; y: number } {
    return {
      x: this.x,
      y: this.y,
    };
  }
  half(): Vector {
    this.x *= 0.5;
    this.y *= 0.5;
    return this;
  }
  troweling(): Vector {
    this.x = this.x >> 0;
    this.y = this.y >> 0;
    return this;
  }
  equals(v: Vector): boolean {
    return v.x == this.x && v.y == this.y;
  }
  toArray(): number[] {
    return [this.x, this.y];
  }
  toZero(): void {
    this.x = 0;
    this.y = 0;
  }
  double(): Vector {
    this.x *= 2;
    this.y *= 2;
    return this;
  }
  negate(): Vector {
    this.x *= -1;
    this.y *= -1;
    return this;
  }
  static dist(v1: Vector, v2: Vector) {
    let sub = Vector.sub(v1, v2);
    return Vector.mag(sub);
  }
  static mag(v: Vector) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }
  static sub(v1: Vector, v2: Vector) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
  }
  static add(v1: Vector, v2: Vector) {
    return new Vector(v1.x + v2.x, v1.y + v2.y);
  }
  static mult(v: Vector, factor: number): Vector {
    return new Vector(v.x * factor, v.y * factor);
  }
  static troweling(v: Vector) {
    v.x = v.x >> 0;
    v.y = v.y >> 0;
    return v;
  }
  static get zero(): Vector {
    return new Vector(0, 0);
  }
}
export default Vector;
