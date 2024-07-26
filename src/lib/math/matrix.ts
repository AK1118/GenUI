export abstract class Matrix {
    protected _matrix: Array<Array<number>>;
    constructor(rows: number, cols: number) {
      this._matrix = new Array<Array<number>>(rows);
      for (let i = 0; i < rows; i++) {
        this._matrix[i] = new Array<number>(cols).fill(0);
      }
    }
    public getMatrix(): Array<Array<number>> {
      return this._matrix;
    }
    public setValue(row: number, col: number, value: number) {
      this._matrix[row][col] = value;
    }
  }
  
  export class Matrix2 extends Matrix {
    constructor() {
      super(2, 2);
    }
    public multiply(other: Matrix2): Matrix2 {
      const result = new Matrix2();
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          result.setValue(i, j, this._matrix[i][0] * other._matrix[0][j] + this._matrix[i][1] * other._matrix[1][j]);
        }
      }
      return result;
    }
  }
  
  export class Matrix3 extends Matrix {
    constructor() {
      super(3, 3);
    }
    public multiply(other: Matrix3): Matrix3 {
      const result = new Matrix3();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          result.setValue(i, j, this._matrix[i][0] * other._matrix[0][j] + this._matrix[i][1] * other._matrix[1][j] + this._matrix[i][2] * other._matrix[2][j]);
        }
      }
      return result;
    }
    
  }
  
  export class Matrix4 extends Matrix {
    constructor() {
      super(4, 4);
    }
    public multiply(other: Matrix4): Matrix4 {
      const result = new Matrix4();
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          result.setValue(i, j, this._matrix[i][0] * other._matrix[0][j] + this._matrix[i][1] * other._matrix[1][j] + this._matrix[i][2] * other._matrix[2][j] + this._matrix[i][3] * other._matrix[3][j]);
        }
      }
      return result;
    }
  }
  