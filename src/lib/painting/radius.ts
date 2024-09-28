import { Radius } from "../core/base-types";

interface BorderRadiusArguments {
  /**
   * 左上角圆角
   */
  topLeft: number;
  /**
   * 右上角圆角
   */
  topRight: number;
  /**
   * 左下角圆角
   */
  bottomLeft: number;
  /**
   * 右下角圆角
   */
  bottomRight: number;
}

/**
 * 边框圆角数值类，用于指定 Box 的四个边的圆角。
 * 常用于 @BoxDecoration 的 @borderRadius 属性。
 *
 * 使用方法示例:
 * ```typescript
 * new Container({
 *     decoration: new BoxDecoration({
 *         borderRadius: BorderRadius.all(10)
 *     }),
 *     height: 10,
 *     color: Colors.white,
 * })
 * ```
 */
export class BorderRadius implements BorderRadiusArguments {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
  constructor(option: Partial<BorderRadiusArguments>) {
    this.topLeft = option.topLeft || 0;
    this.topRight = option.topRight || 0;
    this.bottomLeft = option.bottomLeft || 0;
    this.bottomRight = option.bottomRight || 0;
  }
  /**
   * 将四个角都设置为相同的圆角
   * 例如将四个角都设置为 10
   * ```typescript
   *  BorderRadius.all(10)
   * ```
   */
  static all(radius: number): BorderRadius {
    return new BorderRadius({
      topLeft: radius,
      topRight: radius,
      bottomLeft: radius,
      bottomRight: radius,
    });
  }
  /**
   * 将四个角分别设置为不同的圆角，如果未指定，则默认为0
   * 例如将左上角设置为 10
   * ```typescript
   * BorderRadius.only(
   *    {
   *      topLeft: 10
   *    }
   * )
   * ```
   */
  static only(option: Partial<BorderRadiusArguments>): BorderRadius {
    return new BorderRadius(option);
  }
  static get zero(): BorderRadius {
    return new BorderRadius({
      topLeft: 0,
      topRight: 0,
      bottomLeft: 0,
      bottomRight: 0,
    });
  }
  isNone(): boolean {
    return (
      this.topLeft === 0 &&
      this.topRight === 0 &&
      this.bottomLeft === 0 &&
      this.bottomRight === 0
    );
  }
  static equals(a: BorderRadius, b: BorderRadius): boolean {
    return (
      a.topLeft === b.topLeft &&
      a.topRight === b.topRight &&
      a.bottomLeft === b.bottomLeft &&
      a.bottomRight === b.bottomRight
    );
  }
  public equals(a: BorderRadius): boolean {
    return BorderRadius.equals(this, a);
  }
  get radius(): Radius {
    return [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight];
  }
}
