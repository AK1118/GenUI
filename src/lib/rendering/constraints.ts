/*
 * @Author: AK1118 
 * @Date: 2024-08-23 17:22:27 
 * @Last Modified by:   AK1118 
 * @Last Modified time: 2024-08-23 17:22:27 
 */
import { Size } from "@/lib/basic/rect";
import Vector from "../math/vector";

export abstract class Constraints {}

/// [RenderBox] 布局的不可变布局约束。
///
/// 当且仅当满足以下所有条件时，[Size] 从 [BoxConstraints]
/// 关系成立：
///
/// * [minWidth] <= [Size.width] <= [maxWidth]
/// * [minHeight] <= [Size.height] <= [maxHeight]
///
/// 约束本身必须满足这些关系：
///
/// * 0.0 <= [minWidth] <= [maxWidth] <= [double.infinity]
/// * 0.0 <= [minHeight] <= [maxHeight] <= [double.infinity]
///
/// [double.infinity] 是每个约束的合法值。
class BoxConstraints extends Constraints {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  constructor(
    option: {
      minWidth?: number;
      minHeight?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ) {
    super();
    this.minWidth = option?.minWidth ?? 0;
    this.minHeight = option?.minHeight ?? 0;
    this.maxHeight = option.maxHeight ?? Infinity;
    this.maxWidth = option.maxWidth ?? Infinity;
  }

  get hasTightWidth(): boolean {
    return this.minWidth > this.maxWidth;
  }
  get hasTightHeight(): boolean {
    return this.minHeight > this.maxHeight;
  }
  get isTight(): boolean {
    return this.hasTightHeight && this.hasTightWidth;
  }
  get hasInfiniteWidth(): boolean {
    return this.minWidth >= Infinity;
  }
  get hasInfiniteHeight(): boolean {
    return this.minHeight >= Infinity;
  }
  get hasBoundedWidth(): boolean {
    return this.maxWidth < Infinity;
  }
  get hasBoundedHeight(): boolean {
    return this.maxHeight < Infinity;
  }

  equals(constraints: BoxConstraints): boolean {
    return (
      this.minHeight == constraints.minHeight &&
      this.maxHeight === constraints.maxHeight &&
      this.minWidth === constraints.minWidth &&
      this.maxWidth === constraints.maxWidth
    );
  }
  static expand(width?:number,height?:number):BoxConstraints{
    return new BoxConstraints({
      minWidth: width??Infinity,
      maxWidth: width??Infinity,
      minHeight: height??Infinity,
      maxHeight: height??Infinity
    });
  }
  /**
   * 返回一个新的约束盒，约束盒的大小是此约束盒缩小 edges
   */
  deflate(edges: Vector): BoxConstraints {
    const horizontal = edges.x;
    const vertical = edges.y;
    const deflatedMinWidth = Math.max(0.0, this.minWidth - horizontal);
    const deflatedMinHeight = Math.max(0.0, this.minHeight - vertical);
    return new BoxConstraints({
      minWidth: deflatedMinWidth,
      maxWidth: Math.max(deflatedMinWidth, this.maxWidth - horizontal),
      minHeight: deflatedMinHeight,
      maxHeight: Math.max(deflatedMinHeight, this.maxHeight - vertical),
    });
  }

  tighten(width?: number, height?: number): BoxConstraints {
    const minWidth = this.minWidth,
      minHeight = this.minHeight,
      maxWidth = this.maxWidth,
      maxHeight = this.maxHeight;
    return new BoxConstraints({
      minWidth:
        width == null ? minWidth : this.clamp(width, minWidth, maxWidth),
      maxWidth:
        width == null ? maxWidth : this.clamp(width, minWidth, maxWidth),
      minHeight:
        height == null ? minHeight : this.clamp(height, minHeight, maxHeight),
      maxHeight:
        height == null ? maxHeight : this.clamp(height, minHeight, maxHeight),
    });
  }
  public enforce(constraints: BoxConstraints): BoxConstraints {
    return new BoxConstraints({
      minWidth: this.clamp(
        this.minWidth,
        constraints.minWidth,
        constraints.maxWidth
      ),
      maxWidth: this.clamp(
        this.maxWidth,
        constraints.minWidth,
        constraints.maxWidth
      ),
      minHeight: this.clamp(
        this.minHeight,
        constraints.minHeight,
        constraints.maxHeight
      ),
      maxHeight: this.clamp(
        this.maxHeight,
        constraints.minHeight,
        constraints.maxHeight
      ),
    });
  }

  public constrainWidth(width: number): number {
    return this.clamp(width, this.minWidth, this.maxWidth);
  }
  public constrainHeight(height: number): number {
    return this.clamp(height, this.minHeight, this.maxHeight);
  }
  public constrain(size: Size): Size {
    return new Size(
      this.constrainWidth(size.width),
      this.constrainHeight(size.height)
    );
  }
  public clamp(value: number, min: number, max: number): number {
    if (min > max || Number.isNaN(max) || Number.isNaN(min))
      throw Error("Invalid value.");
    if (value < min) return min;
    if (value > max) return max;
    if (Number.isNaN(value)) return max;
    return value;
    // return Math.max(min, Math.min(value, max));
  }

  static get zero(): BoxConstraints {
    return new BoxConstraints();
  }

  static tightFor(width?: number, height?: number): BoxConstraints {
    return new BoxConstraints({
      maxHeight: height ?? Infinity,
      maxWidth: width ?? Infinity,
      minHeight: height ?? 0,
      minWidth: width ?? 0,
    });
  }

  public loosen(): BoxConstraints {
    return new BoxConstraints({
      minWidth: 0,
      maxWidth: this.maxWidth,
      minHeight: 0,
      maxHeight: this.maxHeight,
    });
  }
}

export default Constraints;
export { BoxConstraints };
