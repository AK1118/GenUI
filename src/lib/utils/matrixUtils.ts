import { Matrix4 } from "../math/matrix";
import Vector from "../math/vector";

class MatrixUtils {
  /**
   * 获取平移矩阵，如果矩阵不是平移矩阵则返回null
   * 且矩阵为初始变换矩阵，只有平移数据
   * @param transform
   * @returns
   */
  static getAsTranslation(transform: Matrix4): Vector {
    const values = transform.matrix;
    if (
      values[0] == 1.0 && // col 1
      values[1] == 0.0 &&
      values[2] == 0.0 &&
      values[3] == 0.0 &&
      values[4] == 0.0 && // col 2
      values[5] == 1.0 &&
      values[6] == 0.0 &&
      values[7] == 0.0 &&
      values[8] == 0.0 && // col 3
      values[9] == 0.0 &&
      values[10] == 1.0 &&
      values[11] == 0.0 &&
      values[14] == 0.0 &&
      values[15] == 1.0
    ) {
      return new Vector(values[12], values[13]);
    }
    return null;
  }
  static getAsScale(transform: Matrix4): number {
    const values = transform.matrix;
    if (
      values[1] == 0.0 &&
      values[2] == 0.0 &&
      values[3] == 0.0 &&
      values[4] == 0.0 &&
      values[6] == 0.0 &&
      values[7] == 0.0 &&
      values[8] == 0.0 && // col 3
      values[9] == 0.0 &&
      values[10] == 1.0 &&
      values[11] == 0.0 &&
      values[12] == 0.0 && // col 4
      values[13] == 0.0 &&
      values[14] == 0.0 &&
      values[15] == 1.0 &&
      values[0] == values[5]
    ) {
      return values[0];
    }
    return null;
  }

  static transformPoint(transform: Matrix4, point: Vector): Vector {
    const storage = transform.matrix;
    const x = point.x;
    const y = point.y;

    const rx = storage[0] * x + storage[4] * y + storage[12];
    const ry = storage[1] * x + storage[5] * y + storage[13];
    const rw = storage[3] * x + storage[7] * y + storage[15];
    if (rw == 1.0) {
      return new Vector(rx, ry);
    } else {
      return new Vector(rx / rw, ry / rw);
    }
  }
}

export default MatrixUtils;
