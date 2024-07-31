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
}

export default MatrixUtils;
