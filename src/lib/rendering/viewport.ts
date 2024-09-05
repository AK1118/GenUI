import { Offset } from "../basic/rect";
import { Simulation } from "../core/animation";
import { Axis } from "../core/base-types";
import { ChangeNotifier } from "../core/change-notifier";
import { ScrollPhysics } from "../core/scroll-physics";
import {
  AxisDirection,
  axisDirectionIsReversed,
  axisDirectionToAxis,
  ScrollDirection,
} from "../render-object/slivers";

export abstract class ViewPortOffset extends ChangeNotifier {
  private _pixels: number = 0;
  get pixels(): number {
    return this._pixels;
  }
  public setPixels(value: number): void {
    this._pixels = value;
    this.notifyListeners();
  }
  abstract get userScrollDirection(): ScrollDirection;
  abstract applyViewportDimension(viewportDimension: number): boolean;
  abstract applyContentDimension(
    minScrollExtent: number,
    maxScrollExtent: number
  ): boolean;
  /**
   * 矫正偏移量，该方法不会触发notifyListeners,仅用于偏移量的矫正
   */
  correctBy(value: number): void {
    this._pixels += value;
  }
}

interface ScrollPositionArguments {
  physics: ScrollPhysics;
  axisDirection: AxisDirection;
}

export class ScrollPosition extends ViewPortOffset {
  private physics: ScrollPhysics;
  private _scrollDirection: ScrollDirection = ScrollDirection.idle;
  private _axisDirection: AxisDirection = AxisDirection.down;
  private _minScrollExtent: number = 0;
  private _maxScrollExtent: number = 0;
  private _viewportDimension: number = 0;
  private oldPixels: number = 0;
  constructor(args: Partial<ScrollPositionArguments>) {
    super();
    this.physics = args?.physics;
    this._axisDirection = args?.axisDirection;
  }

  get viewportDimension(): number {
    return this._viewportDimension;
  }
  get axisDirection(): AxisDirection {
    return this._axisDirection;
  }
  get scrollDirection(): ScrollDirection {
    return this._scrollDirection;
  }
  get minScrollExtent(): number {
    return this._minScrollExtent;
  }
  get maxScrollExtent(): number {
    return this._maxScrollExtent;
  }
  get userScrollDirection(): ScrollDirection {
    return ScrollDirection.forward;
  }
  get atEdge(): boolean {
    return (
      this.pixels == this._minScrollExtent ||
      this.pixels == this._maxScrollExtent
    );
  }
  get outOfRange(): boolean {
    return this.pixels < this._minScrollExtent || this.pixels > this._maxScrollExtent;
  }
  get axis(): Axis {
    return axisDirectionToAxis(this.axisDirection);
  }
  get extentBefore(): number {
    return Math.max(0, this.pixels - this.minScrollExtent);
  }
  get extentAfter(): number {
    return Math.max(0, this._maxScrollExtent - this.pixels);
  }
  private updateScrollDirection(delta:number):void{
    if(delta===0){
      this._scrollDirection=ScrollDirection.idle;
    }
    if(delta<0){
      this._scrollDirection=(this.axisDirection===AxisDirection.down||this.axisDirection===AxisDirection.right)?ScrollDirection.reverse:ScrollDirection.forward;
    }
    if(delta>0){
      this._scrollDirection=(this.axisDirection===AxisDirection.down||this.axisDirection===AxisDirection.right)?ScrollDirection.forward:ScrollDirection.reverse;
    }
  }
  applyViewportDimension(viewportDimension: number): boolean {
    this._viewportDimension = viewportDimension;
    return true;
  }
  applyContentDimension(
    minScrollExtent: number,
    maxScrollExtent: number
  ): boolean {
    this._minScrollExtent = minScrollExtent;
    this._maxScrollExtent = maxScrollExtent;
    return true;
  }
  public applyBoundaryConditions(newPixels: number): number {
    const result = this.physics.applyBoundaryConditions(this, newPixels);
    return result;
  }

  public setPixels(newPixels: number): void {
    if (newPixels === this.pixels) {
      this.updateScrollDirection(0);
      return;
    };
    const delta: number = newPixels - this.pixels;
    this.updateScrollDirection(delta);
    const correctScroll = this.applyBoundaryConditions(newPixels);
    const pixels: number = newPixels - correctScroll;
    super.setPixels(pixels);
    this.oldPixels=pixels;
  }

  public applyUserOffset(offset: Offset): number {
    const mainAxisOffset = getMainAxisDirectionOffset(
      this._axisDirection,
      offset
    );
    return this.physics.applyPhysicsToUserOffset(this, mainAxisOffset);
  }

  public createBallisticSimulation(velocityOffset: Offset): Simulation {
    const velocity = getMainAxisDirectionOffset(
      this._axisDirection,
      velocityOffset
    );
    //速度不足时不需要创建模拟器
    if(Math.abs(velocity)<20){
      return;
    }
    return this.physics?.createBallisticSimulation(this, velocity);
  }
}

/**
 * 获取主轴方向偏移量
 */
const getMainAxisDirectionOffset = (
  axisDirection: AxisDirection,
  offset: Offset
): number => {
  let mainDirectionOffset = 0;
  switch (axisDirectionToAxis(axisDirection)) {
    case Axis.horizontal:
      mainDirectionOffset = offset.offsetX;
      break;
    case Axis.vertical:
      mainDirectionOffset = offset.offsetY;
      break;
  }
  if (axisDirectionIsReversed(axisDirection)) {
    mainDirectionOffset *= -1;
  }
  return mainDirectionOffset;
};
