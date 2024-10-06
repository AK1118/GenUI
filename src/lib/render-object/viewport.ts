import { Offset, Size } from "../basic/rect";
import {
  AnimationController,
  AnimationStatus,
  Curve,
  Simulation,
} from "../core/animation";
import {
  Axis,
  AxisDirection,
  Clip,
  GrowthDirection,
  ScrollDirection,
} from "../core/base-types";
import { ChangeNotifier } from "../core/change-notifier";
import { ScrollPhysics } from "../core/scroll-physics";
import { HitTestResult } from "../gesture/hit_test";
import { Matrix4 } from "../math/matrix";
import Vector from "../math/vector";
import {
  ContainerRenderViewParentData,
  MultiChildRenderView,
  PaintingContext,
} from "./basic";
import { RenderView } from "./render-object";
import {
  axisDirectionIsReversed,
  axisDirectionToAxis,
  RenderSliver,
  SliverConstraints,
  SliverGeometry,
} from "./slivers";
import MatrixUtils from "../utils/matrixUtils";
import VelocityTracker from "../utils/velocity-ticker";
import { Duration } from "../core/duration";
import { Key, SimpleKey } from "../basic/key";

export abstract class ViewPortOffset extends ChangeNotifier {
  private _pixels: number = 0;
  get pixels(): number {
    return this._pixels;
  }
  public setPixels(value: number): void {
    if(value == this._pixels) return;
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
  initPixels: number;
}

export abstract class ScrollPosition extends ViewPortOffset {
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
    this.correctBy(args?.initPixels ?? 0);
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
    return (
      this.pixels < this._minScrollExtent || this.pixels > this._maxScrollExtent
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
  private updateScrollDirection(delta: number): void {
    if (delta === 0) {
      this._scrollDirection = ScrollDirection.idle;
    } else {
      this._scrollDirection =
        delta > 0 ? ScrollDirection.forward : ScrollDirection.reverse;
    }
    this.didUpdateScrollDirection(this._scrollDirection);
  }
  protected didUpdateScrollDirection(scrollDirection: ScrollDirection): void {}
  public jumpTo(value: number): void {
    if (value === this.pixels) return;
    const offset = value - this.pixels;
    this.correctBy(offset);
    this.didEndScroll();
    this.notifyListeners();
  }
  animateTo(offset: number, duration: Duration, curve: Curve): Promise<void> {
    return Promise.resolve();
  }
  protected didEndScroll(): void {
    this.updateScrollDirection(0);
  }
  applyViewportDimension(viewportDimension: number): boolean {
    this._viewportDimension = viewportDimension;
    return true;
  }
  private pendingDimensions:boolean=false;
  applyContentDimension(
    minScrollExtent: number,
    maxScrollExtent: number
  ): boolean {
    if(minScrollExtent!==this._minScrollExtent||maxScrollExtent!==this._maxScrollExtent){
      this.pendingDimensions=true;
    }
    this._minScrollExtent = minScrollExtent;
    this._maxScrollExtent = maxScrollExtent;
    if(this.pendingDimensions){
      this.applyNewDimensions();  
    }
    return true;
  }
  /**
   * 更新新的尺寸后
   */
  applyNewDimensions() {
    this.pendingDimensions=false;
  }
  public applyBoundaryConditions(newPixels: number): number {
    const result = this.physics.applyBoundaryConditions(this, newPixels);
    return result;
  }

  public setPixels(newPixels: number): void {
    if (newPixels === this.pixels) {
      this.updateScrollDirection(0);
      return;
    }
    const delta: number = newPixels - this.pixels;
    this.updateScrollDirection(delta);
    const correctScroll = this.applyBoundaryConditions(newPixels);
    const pixels: number = newPixels - correctScroll;
    super.setPixels(pixels);
  }

  public applyUserOffset(offset: Offset): number {
    const mainAxisOffset = getMainAxisDirectionOffset(
      this._axisDirection,
      offset
    );
    return this.physics.applyPhysicsToUserOffset(this, mainAxisOffset);
  }

  public createBallisticSimulation(velocity: number): Simulation {
    //速度不足时不需要创建模拟器
    if (Math.abs(velocity) < 20) {
      return;
    }
    return this.physics?.createBallisticSimulation(this, velocity);
  }
  abstract scrollEnd(): void;
  abstract scrollStart(): void;
  abstract scrollUpdate(position: Offset);
  abstract pointerScroll(offset: Offset): void;
}

export class ScrollPositionWithSingleContext extends ScrollPosition {
  key:SimpleKey=new SimpleKey();
  private velocityTicker: VelocityTracker = new VelocityTracker(
    new Duration({
      milliseconds: 3000,
    })
  );
  private animationController = new AnimationController({});
  pointerScroll(offset: Offset): void {
    const delta = this.applyUserOffset(offset);
    this.setPixels(this.pixels + delta);
  }
  get velocity(): number {
    return this.animationController.velocity;
  }
  public goBallistic(velocity:number) {
  
    const simulation = this.createBallisticSimulation(velocity);
    if (simulation) {
      this.animationController.animateWidthSimulation(simulation);
      this.animationController.addListener(() => {
        this.setPixels(this.animationController.value);
      });
    }
  }
  animateTo(offset: number, duration: Duration, curve: Curve): Promise<void> {
    return new Promise((resolve, eject) => {
      if (duration.value === 0) {
        this.jumpTo(offset);
        resolve();
      }
      this.animationController = new AnimationController({
        begin: this.pixels,
        end: offset,
        duration: duration,
        curve: curve,
      });
      this.animationController.addListener(() => {
        this.setPixels(this.animationController.value);
      });
      this.animationController.addStatusListener(() => {
        if (
          this.animationController.status === AnimationStatus.dismissed ||
          this.animationController.status === AnimationStatus.completed
        ) {
          resolve();
        }
      });
      this.animationController.forward();
    });
  }
  applyNewDimensions(): void {
      super.applyNewDimensions();
      this.goBallistic(this.animationController.velocity??0);
  }
  scrollEnd(): void {
    const velocityOffset = this.velocityTicker.getVelocity();
    const velocity = getMainAxisDirectionOffset(
      this.axisDirection,
      velocityOffset
    );
    this.goBallistic(velocity);
  }
  scrollUpdate(position: Offset) {
    this.velocityTicker.addPosition(position);
  }
  scrollStart(): void {
    this.animationController.stop();
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

export class SliverPhysicalParentData extends ContainerRenderViewParentData<RenderSliver> {
  paintOffset: Offset = Offset.zero;
}

export interface ViewPortArguments {
  center: RenderSliver;
  axisDirection: AxisDirection;
  crossDirection: AxisDirection;
}

export interface RenderViewPortArguments {
  offset: ViewPortOffset;
  axisDirection: AxisDirection;
}

export class RenderViewPortBase extends MultiChildRenderView<RenderSliver> {
  protected _offset: ViewPortOffset;
  protected center: RenderSliver;
  private _axisDirection: AxisDirection = AxisDirection.down;
  private _crossDirection: AxisDirection = AxisDirection.left;
  protected maxScrollExtent: number = 0;
  protected minScrollExtent: number = 0;
  private markNeedsLayoutBind: () => void;
  private anchor: number = 0;
  constructor(args: Partial<RenderViewPortArguments>) {
    super();
    this.offset = args?.offset;
    this.axisDirection = args?.axisDirection;
    this.markNeedsLayoutBind=this.markNeedsLayout.bind(this);
  }
  get axisDirection(): AxisDirection {
    return this._axisDirection;
  }
  get axis(): Axis {
    return axisDirectionToAxis(this.axisDirection);
  }
  get crossDirection(): AxisDirection {
    return this._crossDirection;
  }
  set axisDirection(value: AxisDirection) {
    this._axisDirection = value;
    this.markNeedsLayout();
  }
  set offset(value: ViewPortOffset) {
    this._offset = value;
    this.offset?.removeListener(this.markNeedsLayoutBind);
    this.offset?.addListener(this.markNeedsLayoutBind);
    this.markNeedsLayout();
  }
  get offset(): ViewPortOffset {
    return this._offset;
  }
  protected setupParentData(child: RenderView): void {
    child.parentData = new SliverPhysicalParentData();
  }
  performLayout(): void {
    if (!this.center) {
      this.center = this.firstChild;
    }
    this.size = this.constraints.constrain(Size.zero);

    let mainAxisExtent: number = 0;
    let crossAxisExtent: number = 0;

    if (this.axis === Axis.horizontal) {
      this.offset.applyViewportDimension(this.size.width);
      mainAxisExtent = this.size.width;
      crossAxisExtent = this.size.height;
    } else if (this.axis === Axis.vertical) {
      this.offset.applyViewportDimension(this.size.height);
      mainAxisExtent = this.size.height;
      crossAxisExtent = this.size.width;
    }

    if ((this.size.width === 0 && this.size.height === 0) || !this.center) {
      this.offset.applyContentDimension(0, 0);
    }

    this.computeLayoutScrollOffset(mainAxisExtent, crossAxisExtent);

    /**
     * 设置滚动器的滚动范围，滚动最小为0，最大为滚动元素的最大高度减去视口高度
     * 必须在 @performLayoutSliverChild 执行完毕后再调用，且 @maxScrollExtent 不为 0
     */
    this.offset.applyContentDimension(
      0,
      Math.max(0, this.maxScrollExtent - mainAxisExtent)
    );
  }

  protected computeLayoutScrollOffset(
    mainAxisExtent: number,
    crossAxisExtent: number
  ): void {
    const scrollOffset = this.offset.pixels;
    const nextChild = (child: RenderSliver) => {
      const parentData: SliverPhysicalParentData =
        child.parentData as SliverPhysicalParentData;
      return parentData?.nextSibling;
    };

    this.performLayoutSliverChild(
      this.center,
      scrollOffset,
      Math.max(0, -scrollOffset),
      mainAxisExtent,
      mainAxisExtent,
      crossAxisExtent,
      GrowthDirection.forward,
      nextChild,
      mainAxisExtent,
      this.axisDirection,
      0
    );
  }

  protected performLayoutSliverChild(
    child: RenderSliver,
    //已滚动偏移量,视口top到滚动元素第一个的距离
    scrollOffset: number,
    //布局开始偏移量
    layoutOffset: number,
    remainingPaintExtent: number,
    mainAxisExtent: number,
    crossAxisExtent: number,
    growthDirection: GrowthDirection,
    another: (child: RenderSliver) => NonNullable<RenderSliver>,
    remainingCacheExtent: number,
    axisDirection: AxisDirection,
    cacheOrigin: number
  ): number {
    let current: RenderSliver = child;
    let precedingScrollExtent: number = 0;
    const initialLayoutOffset: number = layoutOffset;
    this.maxScrollExtent = 0;
    let count = 0;
    while (current) {
      const sliverScrollOffset = scrollOffset <= 0.0 ? 0.0 : scrollOffset;
      const correctedCacheOrigin = Math.max(cacheOrigin, -sliverScrollOffset);
      const cacheExtentCorrection: number = cacheOrigin - correctedCacheOrigin;

      const constraints = new SliverConstraints({
        axisDirection: axisDirection,
        growthDirection: growthDirection,
        userScrollDirection: this.offset.userScrollDirection,
        scrollOffset: sliverScrollOffset,
        precedingScrollExtent: precedingScrollExtent,
        overlap: 0,
        remainingPaintExtent:
          remainingPaintExtent - layoutOffset + initialLayoutOffset,
        crossAxisExtent: crossAxisExtent,
        crossAxisDirection: this.crossDirection,
        viewportMainAxisExtent: mainAxisExtent,
        remainingCacheExtent: Math.max(
          0.0,
          remainingCacheExtent + cacheExtentCorrection
        ),
        cacheOrigin: correctedCacheOrigin,
      });

      current.layout(constraints, true);
      const childLayoutGeometry = current.geometry;

      const effectiveLayoutOffset = layoutOffset;

      if (childLayoutGeometry.visible || scrollOffset > 0) {
        this.updateChildLayoutOffset(
          current,
          effectiveLayoutOffset,
          growthDirection
        );
      }

      scrollOffset -= childLayoutGeometry.scrollExtent;
      layoutOffset += childLayoutGeometry.layoutExtent;
      precedingScrollExtent += childLayoutGeometry.scrollExtent;

      count += 1;
      this.maxScrollExtent += childLayoutGeometry.scrollExtent;
      current = another(current);
    }

    return 0;
  }

  protected updateChildLayoutOffset(
    child: RenderSliver,
    layoutOffset: number,
    growthDirection: GrowthDirection
  ) {
    const parentData: SliverPhysicalParentData =
      child.parentData as SliverPhysicalParentData;
    if (parentData) {
      parentData.paintOffset = this.computeAbsolutePaintOffset(
        child,
        layoutOffset,
        growthDirection
      );
    }
  }
  protected computeAbsolutePaintOffset(
    child: RenderSliver,
    layoutOffset: number,
    growthDirection: GrowthDirection
  ): Offset {
    switch (this.axisDirection) {
      case AxisDirection.up:
        return new Offset(
          0.0,
          this.size.height - (layoutOffset + child.geometry!.paintExtent)
        );
      case AxisDirection.right:
        return new Offset(layoutOffset, 0.0);
      case AxisDirection.down:
        return new Offset(0.0, layoutOffset);
      case AxisDirection.left:
        return new Offset(
          this.size.width - (layoutOffset + child.geometry!.paintExtent),
          0.0
        );
    }
  }

  private paintContents(context: PaintingContext, offset?: Vector) {
    let count = 0;
    this.visitChildren((child: RenderSliver) => {
      if (child?.geometry?.visible) {
        count += 1;
        const parentData: SliverPhysicalParentData =
          child.parentData as SliverPhysicalParentData;
        context.paintChild(
          child,
          new Vector(
            offset.x + parentData.paintOffset.offsetX,
            offset.y + parentData.paintOffset.offsetY
          )
        );
      }
    });
  }

  public hitTestChildren(result: HitTestResult, position: Vector): boolean {
    let current: RenderSliver = this.firstChild;
    while (current) {
      const parentData: SliverPhysicalParentData =
        current.parentData as SliverPhysicalParentData;
      const transform = Matrix4.zero
        .identity()
        .translate(
          -parentData.paintOffset.offsetX,
          -parentData.paintOffset.offsetY
        );
      const isHit = current.hitTest(
        result,
        MatrixUtils.transformPoint(transform, position)
      );
      if (isHit) return true;
      current = parentData?.nextSibling as RenderSliver;
    }
    return false;
  }

  render(context: PaintingContext, offset?: Vector): void {
    context.clipRectAndPaint(
      Clip.hardEdge,
      {
        width: this.size.width,
        height: this.size.height,
        y: offset?.y || 0,
        x: offset?.x || 0,
      },
      () => {
        this.paintContents(context, offset);
      }
    );
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    context.clipRectAndPaint(
      Clip.hardEdge,
      {
        width: this.size.width,
        height: this.size.height,
        y: offset?.y || 0,
        x: offset?.x || 0,
      },
      () => {
        this.paintContents(context, offset);
      }
    );
  }
}

export class RenderViewPort extends RenderViewPortBase {
  private cachedMaxScrollExtent: number = 0;
  // set offset(value: ViewPortOffset) {
  //   this._offset = value;
  //   this.offset?.addListener(this.markNeedsLayout.bind(this));
  //   this.markNeedsLayout();
  //   this.cachedMaxScrollExtent = 0;
  // }
  // get offset(): ViewPortOffset {
  //   return this._offset;
  // }
  constructor(args: Partial<RenderViewPortArguments>) {
    super(args);
    this.offset = args?.offset;
    this.axisDirection = args?.axisDirection;
  }
  protected computeLayoutScrollOffset(
    mainAxisExtent: number,
    crossAxisExtent: number
  ): void {
    const scrollOffset = this.offset.pixels;
    const nextChild = (child: RenderSliver) => {
      const parentData: SliverPhysicalParentData =
        child.parentData as SliverPhysicalParentData;
      return parentData?.nextSibling;
    };
    const previousChild = (child: RenderSliver) => {
      const parentData: SliverPhysicalParentData =
        child.parentData as SliverPhysicalParentData;
      return parentData?.previousSibling;
    };
    let index = 0;
    this.visitChildren((child: RenderSliver) => {
      if (child) {
        child.index = index++;
      }
    });

    let layoutStartChild = this.center;
    while (layoutStartChild) {
      const geometry = layoutStartChild.geometry;
      if (!geometry) break;
      const scrollExtent = geometry.scrollExtent;
      const offset =
        scrollOffset - (this.lastScrolledMaxScrollExtent + scrollExtent);
      if (offset > 0) break;
      this.visitChildren((child: RenderSliver) => {
        if (child?.geometry) child.geometry!.visible = false;
      });
      const preChild = previousChild(layoutStartChild);
      if (!preChild || preChild === layoutStartChild) break;
      const preChildGeometry = preChild.geometry;
      layoutStartChild = preChild;
      this.lastScrolledMaxScrollExtent -= preChildGeometry.scrollExtent;
      this.lastScrolledMaxScrollExtent = Math.max(
        0,
        this.lastScrolledMaxScrollExtent
      );
    }

    this.performLayoutSliverChild(
      layoutStartChild,
      scrollOffset - this.lastScrolledMaxScrollExtent,
      Math.max(0, -scrollOffset),
      mainAxisExtent,
      mainAxisExtent,
      crossAxisExtent,
      GrowthDirection.forward,
      nextChild,
      mainAxisExtent,
      this.axisDirection,
      0
    );
    /**
     * 设置滚动器的滚动范围，滚动最小为0，最大为滚动元素的最大高度减去视口高度
     * 必须在 @performLayoutSliverChild 执行完毕后再调用，且 @maxScrollExtent 不为 0
     */
    this.offset.applyContentDimension(
      0,
      Math.max(0, this.maxScrollExtent - mainAxisExtent)
    );
  }

  //最后一个被item对象时的最大可滚动距离
  private lastScrolledMaxScrollExtent: number = 0;
  //最后一个被item对象
  private lastScrolledChild: RenderSliver;
  private handleUpdateVisualChildOrder(
    child: RenderSliver,
    childLayoutGeometry: SliverGeometry,
    sliverScrollOffset: number,
    currentMaxScrollExtent: number
  ): boolean {
    //视口上方|左边被卷入的item
    if (
      childLayoutGeometry.scrollExtent - sliverScrollOffset <= 0 &&
      !childLayoutGeometry.visible
    ) {
      const layoutHead = (child.parentData as SliverPhysicalParentData)
        ?.previousSibling;
      if (layoutHead) {
        this.lastScrolledChild = layoutHead;
        this.lastScrolledMaxScrollExtent =
          currentMaxScrollExtent - layoutHead.geometry.scrollExtent;
      } else {
        this.lastScrolledChild = this.center;
      }
    } else if (!childLayoutGeometry.visible) {
      //视口下方|右边未显示的item
      return false;
    } else if (childLayoutGeometry.visible) {
    }
    return true;
  }
}
