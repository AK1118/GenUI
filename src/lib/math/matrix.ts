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
  inverted(): Matrix4 {
    const m = this.matrix;
    const result = new Array(16);

    const a00 = m[0],
      a01 = m[1],
      a02 = m[2],
      a03 = m[3];
    const a10 = m[4],
      a11 = m[5],
      a12 = m[6],
      a13 = m[7];
    const a20 = m[8],
      a21 = m[9],
      a22 = m[10],
      a23 = m[11];
    const a30 = m[12],
      a31 = m[13],
      a32 = m[14],
      a33 = m[15];

    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;

    const det =
      b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
      throw new Error("Matrix cannot be inverted");
    }

    const invDet = 1.0 / det;

    result[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
    result[1] = (a02 * b10 - a01 * b11 - a03 * b09) * invDet;
    result[2] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
    result[3] = (a22 * b04 - a21 * b05 - a23 * b03) * invDet;
    result[4] = (a12 * b08 - a10 * b11 - a13 * b07) * invDet;
    result[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
    result[6] = (a32 * b02 - a30 * b05 - a33 * b01) * invDet;
    result[7] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
    result[8] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
    result[9] = (a01 * b08 - a00 * b10 - a03 * b06) * invDet;
    result[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
    result[11] = (a21 * b02 - a20 * b04 - a23 * b00) * invDet;
    result[12] = (a11 * b07 - a10 * b09 - a12 * b06) * invDet;
    result[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
    result[14] = (a31 * b01 - a30 * b03 - a32 * b00) * invDet;
    result[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;

    this.setMatrix(result);

    return this;
  }
}
