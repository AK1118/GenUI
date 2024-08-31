import { Offset } from "../basic/rect";
import { ChangeNotifier } from "../core/change-notifier";
import { ScrollPhysics } from "../core/scroll-physics";
import { Axis } from "../render-object/basic";
import {
  AxisDirection,
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
  get axis(): Axis {
    return axisDirectionToAxis(this.axisDirection);
  }
  get extentBefore(): number {
    return Math.max(0, this.pixels - this.minScrollExtent);
  }
  get extentAfter(): number {
    return Math.max(0, this._maxScrollExtent - this.pixels);
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
    const result=this.physics.applyBoundaryConditions(this, newPixels);
    return result;
  }

  public setPixels(newPixels: number): void {
    if (newPixels === this.pixels) return;
    const delta: number = newPixels - this.pixels;
    const correctScroll = this.applyBoundaryConditions(newPixels);
    const pixels: number = newPixels - correctScroll;
    super.setPixels(pixels);
  }
}
