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
  abstract translateValues(): void;
  abstract identity(): Matrix;
  abstract scale(...args: Array<number>): void;
  abstract multiply(matrix: Matrix): void;
}
export class Matrix4 extends Matrix {
  constructor() {
    super(4, 4);
  }
  /**
   * other * this
   */
  multiply(other: Matrix) {
    const matrix = [...this.matrix];
    const result = new Array<number>(16);
    const m00 = matrix[0];
    const m01 = matrix[4];
    const m02 = matrix[8];
    const m03 = matrix[12];
    const m10 = matrix[1];
    const m11 = matrix[5];
    const m12 = matrix[9];
    const m13 = matrix[13];
    const m20 = matrix[2];
    const m21 = matrix[6];
    const m22 = matrix[10];
    const m23 = matrix[14];
    const m30 = matrix[3];
    const m31 = matrix[7];
    const m32 = matrix[11];
    const m33 = matrix[15];
    const argStorage = other.matrix;
    const n00 = argStorage[0];
    const n01 = argStorage[4];
    const n02 = argStorage[8];
    const n03 = argStorage[12];
    const n10 = argStorage[1];
    const n11 = argStorage[5];
    const n12 = argStorage[9];
    const n13 = argStorage[13];
    const n20 = argStorage[2];
    const n21 = argStorage[6];
    const n22 = argStorage[10];
    const n23 = argStorage[14];
    const n30 = argStorage[3];
    const n31 = argStorage[7];
    const n32 = argStorage[11];
    const n33 = argStorage[15];
    result[0] = m00 * n00 + m01 * n10 + m02 * n20 + m03 * n30;
    result[4] = m00 * n01 + m01 * n11 + m02 * n21 + m03 * n31;
    result[8] = m00 * n02 + m01 * n12 + m02 * n22 + m03 * n32;
    result[12] = m00 * n03 + m01 * n13 + m02 * n23 + m03 * n33;
    result[1] = m10 * n00 + m11 * n10 + m12 * n20 + m13 * n30;
    result[5] = m10 * n01 + m11 * n11 + m12 * n21 + m13 * n31;
    result[9] = m10 * n02 + m11 * n12 + m12 * n22 + m13 * n32;
    result[13] = m10 * n03 + m11 * n13 + m12 * n23 + m13 * n33;
    result[2] = m20 * n00 + m21 * n10 + m22 * n20 + m23 * n30;
    result[6] = m20 * n01 + m21 * n11 + m22 * n21 + m23 * n31;
    result[10] = m20 * n02 + m21 * n12 + m22 * n22 + m23 * n32;
    result[14] = m20 * n03 + m21 * n13 + m22 * n23 + m23 * n33;
    result[3] = m30 * n00 + m31 * n10 + m32 * n20 + m33 * n30;
    result[7] = m30 * n01 + m31 * n11 + m32 * n21 + m33 * n31;
    result[11] = m30 * n02 + m31 * n12 + m32 * n22 + m33 * n32;
    result[15] = m30 * n03 + m31 * n13 + m32 * n23 + m33 * n33;
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

  scaleValues(sx = 1, sy = 1, sz = 1) {
    this.matrix[0] = sx;
    this.matrix[5] = sy;
    this.matrix[10] = sz;
    this.matrix[15] = 1;
  }
  scale(sx = 1, sy = 1, sz = 1) {
    const scale = Matrix4.zero.identity();
    scale.scaleValues(sx, sy, sz);
    this.multiply(scale);
  }
  translateValues(x: number = 0, y: number = 0, z: number = 0) {
    this.matrix[12] = x;
    this.matrix[13] = y;
    this.matrix[14] = z;
  }
  translate(x: number = 0, y: number = 0, z: number = 0): Matrix4 {
    const translation = Matrix4.zero.identity();
    translation.translateValues(x, y, z);
    this.multiply(translation);
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
  rotateY(angle: number): void {
    const cosAngle: number = cos(angle);
    const sinAngle: number = sin(angle);
    const transform = Matrix4.zero.identity();
    const matrix = transform.matrix;
    matrix[0] = cosAngle;
    matrix[2] = -sinAngle;
    matrix[8] = sinAngle;
    matrix[10] = cosAngle;
    this.multiply(transform);
  }
  rotateX(angle: number): void {
    const cosAngle: number = cos(angle);
    const sinAngle: number = sin(angle);
    const transform = Matrix4.zero.identity();
    const matrix = transform.matrix;
    matrix[5] = cosAngle;
    matrix[6] = sinAngle;
    matrix[9] = -sinAngle;
    matrix[10] = cosAngle;
    this.multiply(transform);
  }
  /**
   * 这个求逆矩阵的算法是基于分块矩阵的方法，通过计算矩阵的子式（即矩阵的最小子矩阵的行列式）来求逆矩阵。
   * 这个方法和初级计算法（高斯消元法）以及伴随矩阵法（利用代数余子式的转置矩阵）不同。具体来说，这个方法利用了一些矩阵的性质，分解了矩阵并计算了一系列的子式和行列式来求得逆矩阵。
      以下是这个算法的基本步骤：
      计算子式：首先计算矩阵的2x2子式（b00到b11）。这些子式是通过原矩阵中4个元素的乘积与差计算得到的。
      计算行列式：使用计算得到的子式计算原矩阵的行列式（det）。如果行列式为0，则矩阵不可逆。
      求逆矩阵元素：根据计算得到的子式和行列式，逐个计算逆矩阵的元素。
      返回逆矩阵：将计算得到的逆矩阵结果存储在一个新矩阵中并返回。
      这个算法比直接计算伴随矩阵和行列式的传统方法更有效，因为它减少了重复计算，直接利用子式的计算结果来求逆矩阵。
   */
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
