import { cos, sin } from "./math";

export abstract class Matrix {
  constructor(rows: number, cols: number) {
    this._matrix = new Array(rows * cols).fill(0);
    this.identity();
  }
  protected _matrix: Array<number>;
  get matrix(): Array<number> {
    return this._matrix;
  }

  public getMatrix(): Array<number> {
    return this._matrix;
  }
  setMatrix(matrix: Array<number>): Matrix {
    this._matrix = matrix;
    return this;
  }
  setValue(index: number, value: number) {
    this._matrix[index] = value;
  }
  abstract translate(...args: Array<number>): void;
  abstract identity(): Matrix;
  abstract scale(...args: Array<number>): void;
  abstract multiply(matrix: Matrix): void;
}
export class Matrix4 extends Matrix {
  multiply(other: Matrix) {
    const result = Matrix4.zero.matrix;
    const a = this.matrix;
    const b = other.getMatrix();

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        result[row * 4 + col] =
          a[row * 4 + 0] * b[0 * 4 + col] +
          a[row * 4 + 1] * b[1 * 4 + col] +
          a[row * 4 + 2] * b[2 * 4 + col] +
          a[row * 4 + 3] * b[3 * 4 + col];
      }
    }
    this.setMatrix(result);
    return this;
  }
  identity(): Matrix4 {
    this.setMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    return this;
  }

  static get zero(): Matrix4 {
    const matrix: Matrix4 = new Matrix4();
    return matrix;
  }
  constructor() {
    super(4, 4);
  }
  scale(sx = 1, sy = 1, sz = 1) {
    this.matrix[0] = sx;
    this.matrix[5] = sy;
    this.matrix[10] = sz;
    this.matrix[15] = 1;
  }
  translate(x: number = 0, y: number = 0, z: number = 0): Matrix4 {
    this.matrix[12] += x;
    this.matrix[13] += y;
    this.matrix[14] += z;
    return this;
  }
  rotateZ(angle: number): void {
    const cosAngle: number = cos(angle);
    const sinAngle: number = sin(angle);
    const t1 = this._matrix[0] * cosAngle + this._matrix[4] * sinAngle;
    const t2 = this._matrix[1] * cosAngle + this._matrix[5] * sinAngle;
    const t3 = this._matrix[2] * cosAngle + this._matrix[6] * sinAngle;
    const t4 = this._matrix[3] * cosAngle + this._matrix[7] * sinAngle;
    const t5 = this._matrix[0] * -sinAngle + this._matrix[4] * cosAngle;
    const t6 = this._matrix[1] * -sinAngle + this._matrix[5] * cosAngle;
    const t7 = this._matrix[2] * -sinAngle + this._matrix[6] * cosAngle;
    const t8 = this._matrix[3] * -sinAngle + this._matrix[7] * cosAngle;
    this._matrix[0] = t1;
    this._matrix[1] = t2;
    this._matrix[2] = t3;
    this._matrix[3] = t4;
    this._matrix[4] = t5;
    this._matrix[5] = t6;
    this._matrix[6] = t7;
    this._matrix[7] = t8;
  }
}
