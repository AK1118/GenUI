import Painter from "@/core/lib/painter";
import Alignment from "@/core/lib/painting/alignment";
import { Size } from "@/core/lib/rect";
import { BoxConstraints } from "@/core/lib/rendering/constraints";
import Vector from "@/core/lib/vector";
import {
  BoundsRRect,
  BoundsRect,
  ClipRRectOption,
  ExpandedOption,
  FlexOption,
  LayoutSizes,
  MultiChildRenderViewOption,
  PositionedOption,
  Radius,
  RenderViewOption,
  SingleChildRenderViewOption,
  StackOption,
} from "@/types/widget";
import { TextOverflow, TextPainter, TextSpan } from "./text-painter";
import { PipelineOwner } from "./binding";

export enum Clip {
  none,
  //使用硬边裁剪
  hardEdge,
  //使用抗锯齿裁剪
  antiAlias,
}
export enum Axis {
  horizontal,

  vertical,
}
export enum MainAxisAlignment {
  start,

  end,

  center,

  spaceBetween,

  spaceAround,

  spaceEvenly,
}

export enum CrossAxisAlignment {
  start,
  end,
  center,
  stretch,
  baseline,
}

export enum StackFit {
  /**
   * 这表示 Stack 组件会放宽传递给它的约束。换句话说，非定位子组件可以根据自己的需要在 Stack 区域内自由调整大小。举个例子，如果 Stack 的约束要求它的大小是 350x600，那么非定位子组件可以在宽度和高度上都在 0 到 350 和 0 到 600 的范围内调整
   */
  loose,
  /**
   * 这表示 Stack 组件会将传递给它的约束放大到允许的最大尺寸。举个例子，如果 Stack 的约束是宽度在 10 到 100 的范围内，高度在 0 到 600 的范围内，那么非定位子组件都会被调整为 100 像素宽和 600 像素高。
   */
  expand,
  /**
   * 这表示 Stack 组件会将从父组件传递给它的约束不加修改地传递给非定位子组件。举个例子，如果一个 Stack 作为 Row 的 Expanded 子组件，那么水平约束会是紧密的，而垂直约束会是松散的。
   */
  passthrough,
}
export enum TextDirection {
  /// The text flows from right to left (e.g. Arabic, Hebrew).
  rtl,

  /// The text flows from left to right (e.g., English, French).
  ltr,
}
// 存储父节点的某些数据
class ParentData {}

export class BoxParentData extends ParentData {
  offset: Vector = Vector.zero;
}

export class ContainerRenderViewParentData<
  ChildType extends RenderView
> extends BoxParentData {
  previousSibling?: ChildType;
  nextSibling?: ChildType;
}

export class FlexParentData extends ContainerRenderViewParentData<RenderView> {
  constructor() {
    super();
  }
  flex: number;
}

export abstract class AbstractNode {
  private _owner: Object;
  private _parent: AbstractNode;
  get owner() {
    return this._owner;
  }
  get parent() {
    return this._parent;
  }
  set parent(value: AbstractNode) {
    this._parent = value;
  }
  protected dropChild(child: AbstractNode) {
    if (!child) return;
    child!.parent = null;
    if (this.owner) {
      child?.detach();
    }
  }
  protected adoptChild(child: AbstractNode) {
    if (!child) return;
    child!.parent = this;
    if (this.owner) {
      child?.attach(this.owner);
    }
  }
  get attached(): boolean {
    return !!this.owner;
  }
  attach(owner: Object) {
    if (this._owner) return;
    this._owner = owner;
  }
  detach() {
    if (!this.owner) return;
    this._owner = null;
  }
}

//原子渲染对象，可以有层级渲染，没有renderbox，依赖于context传输的大小来渲染
export abstract class RenderView extends AbstractNode {
  private _child?: RenderView;
  public parentData: ParentData = null;
  public _size: Size = Size.zero;
  get size(): Size {
    return this._size;
  }
  set size(size: Size) {
    this._size = size;
  }
  get mounted(): boolean {
    return true;
  }
  get view(): RenderView {
    return this;
  }
  abstract render(context: PaintingContext, offset?: Vector): void;
  abstract debugRender(context: PaintingContext, offset?: Vector): void;
  //默认大小等于子大小，被子撑开
  abstract layout(constraints: BoxConstraints, parentUseSize?: boolean): void;
  abstract performLayout(): void;
  protected dropChild(child: AbstractNode): void {
    super.dropChild(child);
  }
  protected adoptChild(child: AbstractNode): void {
    if (!child) return;
    console.log("插入",this,child)
    this.setupParentData(child as RenderView);
    super.adoptChild(child);
  }
  get child(): RenderView {
    return this._child;
  }
  set child(value: RenderView) {
    this.dropChild(value);
    this._child = value;
    this.adoptChild(value);
  }
  /**
   * 为child设置parentData类型，子类可重写该方法便于自定义。
   * 默认parentData
   * @param child
   */
  protected setupParentData(child: RenderView) {
    if (child.parentData instanceof ParentData) {
      child.parentData = new ParentData();
    }
  }
  protected markNeedsPaint() {
    if (!this.owner) return;
    const owner: PipelineOwner = this.owner as PipelineOwner;
    owner.pushNeedingPaint(this);
  }
  protected markNeedsLayout() {
    if (!this.owner) return;
    const owner: PipelineOwner = this.owner as PipelineOwner;
    owner.pushNeedingLayout(this);
  }
  public layoutWithoutResize() {
    this.performLayout();
    this.markNeedsPaint();
  }
}

abstract class RenderBox extends RenderView {
  protected constraints: BoxConstraints = BoxConstraints.zero;
  layout(constraints: BoxConstraints, parentUseSize?: boolean): void {
    this.constraints = constraints;
  }
  protected setupParentData(child: RenderView): void {
    child.parentData = new BoxParentData();
  }
}

//parentData设置
export abstract class ParentDataRenderView<
  P extends ParentData
> extends RenderBox {
  public parentData: P;
  constructor(child?: RenderBox) {
    super();
    this.child = child;
  }
  abstract applyParentData(renderObject: RenderView): void;
  layout(constraints: BoxConstraints, parentUseSize?: boolean): void {
    super.layout(constraints, parentUseSize);
    if (this.child) {
      this.child.layout(constraints, parentUseSize);
      this.size = (this.child as unknown as SingleChildRenderView).size;
    } else {
      this.size = constraints.constrain(Size.zero);
    }
    this.performLayout();
  }
  performLayout(): void {}
  render(context: PaintingContext, offset?: Vector) {
    context.paintChild(this.child!, offset);
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    context.paintChildDebug(this.child!, offset);
  }
}

export abstract class SingleChildRenderView extends RenderBox {
  constructor(child?: RenderBox) {
    super();
    this.child = child;
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    const parentData: BoxParentData = this.child?.parentData as BoxParentData;
    if (offset && parentData) {
      offset.add(parentData.offset);
    }
    context.paintChildDebug(this.child!, offset);
  }
  render(context: PaintingContext, offset?: Vector) {
    const parentData: BoxParentData = this.child?.parentData as BoxParentData;
    if (offset && parentData) {
      offset.add(parentData.offset);
    }
    context.paintChild(this.child!, offset);
  }
  //默认大小等于子大小，被子撑开
  layout(constraints: BoxConstraints, parentUseSize?: boolean): void {
    super.layout(constraints, parentUseSize);
    if (this.child) {
      this.child.layout(constraints, parentUseSize);
      this.size = (this.child as unknown as SingleChildRenderView).size;
    } else {
      this.size = constraints.constrain(Size.zero);
    }
    this.performLayout();
  }
  performLayout(): void {}
}

export class ColoredRender extends SingleChildRenderView {
  private color: string;
  constructor(color?: string, child?: RenderBox) {
    super(child);
    this.color = color;
  }
  performLayout(): void {
    if (!this.child) {
      this.size = Size.zero;
    }
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    this.render(context, offset);
  }
  render(context: PaintingContext, offset?: Vector): void {
    const paint = context.paint;
    const parentData: BoxParentData = this.parentData as BoxParentData;
    paint.beginPath();
    paint.fillStyle = this.color;
    paint.fillRect(
      offset?.x ?? 0,
      offset?.y ?? 0,
      this.size.width,
      this.size.height
    );
    paint.closePath();
    super.render(context, offset);
  }
}

//尺寸约束 不负责渲染
export class SizeRender extends SingleChildRenderView {
  private additionalConstraints: BoxConstraints;
  constructor(width: number, height: number, child?: RenderBox) {
    super(child);
    this.additionalConstraints = new BoxConstraints({
      maxWidth: width,
      maxHeight: height,
      minWidth: width,
      minHeight: height,
    });
  }
  performLayout(): void {
    if (this.child) {
      this.child.layout(
        this.additionalConstraints.enforce(this.constraints),
        true
      );
      this.size = this.child.size;
    } else {
      this.size = this.additionalConstraints
        .enforce(this.constraints)
        .constrain(Size.zero);
    }
  }
}

export interface RectTLRB<T = number> {
  left: T;
  right: T;
  top: T;
  bottom: T;
}

export interface PaddingOption {
  padding: Partial<RectTLRB>;
}
export class PaddingRenderView extends SingleChildRenderView {
  private padding: Partial<RectTLRB> = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };
  constructor(option?: Partial<PaddingOption & SingleChildRenderViewOption>) {
    super(option?.child);
    this.padding = option?.padding;
  }

  performLayout(): void {
    const horizontal = (this.padding?.left || 0) + (this.padding?.right || 0);
    const vertical = (this.padding?.top || 0) + (this.padding?.bottom || 0);
    if (!this.child) {
      this.size = new Size(
        Math.max(this.constraints.maxWidth, horizontal),
        vertical
      );
      return;
    }
    const innerConstraint: BoxConstraints = this.constraints.deflate(
      new Vector(horizontal, vertical)
    );
    const childParent: BoxParentData = this.child.parentData as BoxParentData;
    this.child.layout(innerConstraint, true);

    childParent.offset = new Vector(
      this.padding?.left || 0,
      this.padding?.top || 0
    );

    this.size = this.constraints.constrain(
      new Size(
        horizontal + this.child.size.width,
        vertical + this.child.size.height
      )
    );
  }
}

export class Align extends SingleChildRenderView {
  private alignment: Alignment;
  private offset: Vector = Vector.zero;
  constructor(alignment: Alignment, child?: RenderBox) {
    super(child);
    this.alignment = alignment;
  }
  performLayout(): void {
    const parentSize = this.constraints.constrain(Size.zero);
    this.offset = this.alignment.inscribe(this.size, parentSize);
    this.offset.clamp([this.offset.x, 0]);
  }
  render(context: PaintingContext, offset?: Vector): void {
    super.render(
      context,
      offset ? Vector.add(offset, this.offset) : this.offset
    );
  }
}

export class ClipRRect extends SingleChildRenderView {
  private borderRadius: Radius;
  constructor(option: Partial<ClipRRectOption>) {
    const { child, borderRadius } = option;
    super(child);
    this.borderRadius = borderRadius;
  }
  render(context: PaintingContext, offset?: Vector): void {
    context.clipRRectAndPaint(
      Clip.hardEdge,
      {
        x: offset?.x ?? 0,
        y: offset?.y ?? 0,
        width: this.size.width,
        height: this.size.height,
        radii: this.borderRadius,
      },
      () => {
        super.render(context, offset);
      }
    );
  }
}

export class ClipRect extends SingleChildRenderView {
  render(context: PaintingContext, offset?: Vector): void {
    context.clipRectAndPaint(
      Clip.hardEdge,
      {
        x: offset?.x ?? 0,
        y: offset?.y ?? 0,
        width: this.size.width,
        height: this.size.height,
      },
      () => {
        super.render(context, offset);
      }
    );
  }
}

abstract class ClipContext {
  private _paint: Painter;
  constructor(paint: Painter) {
    this._paint = paint;
  }
  get paint(): Painter {
    return this._paint;
  }
  private clipAndPaint(
    clipCall: VoidFunction,
    clipBehavior: Clip,
    paintClipPath: VoidFunction,
    painter: VoidFunction
  ) {
    this.paint.save();
    if (clipBehavior != Clip.none) {
      paintClipPath();
      clipCall();
    }
    painter();
    this.paint.restore();
  }

  public clipRRectAndPaint(
    clipBehavior: Clip,
    bounds: BoundsRRect,
    painter: VoidFunction
  ) {
    this.clipAndPaint(
      () => this.paint.clip(),
      clipBehavior,
      () => {
        const { x, y, width, height, radii } = bounds;
        this.paint.roundRect(x, y, width, height, radii);
      },
      painter
    );
  }

  public clipRectAndPaint(
    clipBehavior: Clip,
    bounds: BoundsRect,
    painter: VoidFunction
  ) {
    this.clipAndPaint(
      () => this.paint.clip(),
      clipBehavior,
      () => {
        const { x, y, width, height } = bounds;
        this.paint.rect(x, y, width, height);
      },
      painter
    );
  }
}

export class PaintingContext extends ClipContext {
  paintChildDebug(child: RenderView, offset: Vector = Vector.zero): void {
    child?.debugRender(this, offset);
  }
  paintChild(child: RenderView, offset: Vector = Vector.zero): void {
    child?.render(this, offset);
  }
}

export abstract class MultiChildRenderView extends RenderBox {
  protected lastChild: RenderView;
  protected firstChild: RenderView;
  protected childCount: number = 0;
  constructor(children?: RenderView[]) {
    super();
    this.addAll(children);
  }
  public addAll(value: RenderView[]) {
    value.forEach((_) => this.insert(_, this.lastChild));
  }
  private insert(renderView: RenderView, after?: RenderView) {
    //设置父节点
    this.adoptChild(renderView);
    //插入兄弟列表
    this.insertIntoList(renderView, after);
    this.childCount += 1;
    if (renderView instanceof ParentDataRenderView) {
      renderView?.applyParentData(renderView);
    }
  }
  private insertIntoList(child: RenderView, after?: RenderView) {
    let currentParentData =
      child.parentData as ContainerRenderViewParentData<RenderView>;
    let firstChildParentData = this.firstChild
      ?.parentData as ContainerRenderViewParentData<RenderView>;
    let afterParentData =
      after?.parentData as ContainerRenderViewParentData<RenderView>;

    if (after == null) {
      this.firstChild = child;
      this.lastChild = child;
    } else {
      if (!firstChildParentData?.nextSibling && this.firstChild) {
        firstChildParentData.nextSibling = child;
        this.firstChild.parentData = firstChildParentData!;
      }
      afterParentData.nextSibling = child;
      after.parentData = afterParentData;
      currentParentData.previousSibling = after;
      child.parentData = currentParentData;
      this.lastChild = child;
    }
  }
  render(context: PaintingContext, offset?: Vector): void {
    this.defaultRenderChild(context, offset);
  }

  debugRender(context: PaintingContext, offset?: Vector): void {
    this.defaultRenderChildDebug(context, offset);
  }
  layout(constraints: BoxConstraints): void {
    super.layout(constraints);
    this.performLayout();
  }
  performLayout(): void {
    this.size = this.constraints.constrain(Size.zero);
    let child = this.firstChild;
    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      this.performLayoutChild(child, this.constraints);
      child = parentData?.nextSibling;
    }
  }
  performLayoutChild(child: RenderView, constraints: BoxConstraints): void {
    child.layout(constraints);
  }
  protected getChildList(): RenderView[] {
    const children: RenderView[] = [];
    let child = this.firstChild;
    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      children.push(child);
      child = parentData?.nextSibling;
    }
    return children;
  }
  protected defaultRenderChild(context: PaintingContext, offset?: Vector) {
    let child = this.firstChild;
    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      context.paintChild(
        child,
        Vector.add(parentData.offset ?? Vector.zero, offset ?? Vector.zero)
      );
      child = parentData?.nextSibling;
    }
  }
  protected defaultRenderChildDebug(context: PaintingContext, offset?: Vector) {
    let child = this.firstChild;
    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      context.paintChildDebug(
        child,
        Vector.add(parentData.offset ?? Vector.zero, offset ?? Vector.zero)
      );
      child = parentData?.nextSibling;
    }
  }
}

export class Expanded extends ParentDataRenderView<FlexParentData> {
  private flex: number;
  constructor(option?: Partial<ExpandedOption & RenderViewOption>) {
    const { child, flex } = option ?? {};
    super(child);
    this.flex = flex;
  }
  layout(constraints: BoxConstraints, parentUseSize?: boolean): void {
    super.layout(constraints, true);
  }
  applyParentData(renderObject: RenderView): void {
    if (renderObject.parentData instanceof FlexParentData) {
      renderObject.parentData.flex = this.flex;
    }
  }
}
export class Flex extends MultiChildRenderView {
  private overflow: number = 0;
  private direction: Axis = Axis.horizontal;
  private mainAxisAlignment: MainAxisAlignment = MainAxisAlignment.start;
  private crossAxisAlignment: CrossAxisAlignment = CrossAxisAlignment.start;
  constructor(option: Partial<FlexOption & MultiChildRenderViewOption>) {
    const { direction, children, mainAxisAlignment, crossAxisAlignment } =
      option;
    super(children);
    this.direction = direction ?? this.direction;
    this.mainAxisAlignment = mainAxisAlignment ?? this.mainAxisAlignment;
    this.crossAxisAlignment = crossAxisAlignment ?? this.crossAxisAlignment;
  }
  performLayout(): void {
    const computeSize: LayoutSizes = this.computeSize(this.constraints);
    console.log(computeSize);
    if (this.direction === Axis.horizontal) {
      this.size = this.constraints.constrain(
        new Size(computeSize.mainSize, computeSize.crossSize)
      );
    } else if (this.direction === Axis.vertical) {
      this.size = this.constraints.constrain(
        new Size(computeSize.crossSize, computeSize.mainSize)
      );
    }

    //实际剩余大小
    const actualSizeDetail: number =
      computeSize.mainSize - computeSize.allocatedSize;
    //当实际剩余大小为负数时判断为溢出
    this.overflow = Math.max(0, actualSizeDetail * -1);
    //剩余空间
    const remainingSpace: number = Math.max(0, actualSizeDetail);
    let leadingSpace: number = 0;
    let betweenSpace: number = 0;
    /**
     * 根据剩余空间计算leading 和 between
     * 例如总宽度为 200，元素50有1个，实际剩余等于200-50=150;
     * 假设为center,算法为  leadingSpace = remainingSpace *.5;也就是 75开始布局
     */
    switch (this.mainAxisAlignment) {
      case MainAxisAlignment.start:
        break;
      case MainAxisAlignment.end:
        leadingSpace = remainingSpace;
        break;
      case MainAxisAlignment.center:
        leadingSpace = remainingSpace * 0.5;
        break;
      case MainAxisAlignment.spaceBetween:
        betweenSpace = remainingSpace / (this.childCount - 1);
        break;
      case MainAxisAlignment.spaceAround:
        betweenSpace = remainingSpace / this.childCount;
        leadingSpace = betweenSpace * 0.5;
        break;
      case MainAxisAlignment.spaceEvenly:
        betweenSpace = remainingSpace / (this.childCount + 1);
        leadingSpace = betweenSpace;
    }

    let child = this.firstChild;
    let childMainPosition: number = leadingSpace,
      childCrossPosition: number = 0;

    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;

      const childMainSize = this.getMainSize(child.size),
        childCrossSize = this.getCrossSize(child.size);

      const crossSize = this.getCrossSize(this.size);
      switch (this.crossAxisAlignment) {
        case CrossAxisAlignment.start:
          break;
        case CrossAxisAlignment.end:
          childCrossPosition = crossSize - childCrossSize;
          break;
        case CrossAxisAlignment.center:
          childCrossPosition = crossSize * 0.5 - childCrossSize * 0.5;
          break;
        case CrossAxisAlignment.stretch:
          childCrossPosition = 0;
          break;
        case CrossAxisAlignment.baseline:
          childCrossPosition =
            computeSize.crossSize * 0.5 - childCrossSize * 0.5;
      }
      if (this.direction === Axis.horizontal) {
        parentData.offset = new Vector(childMainPosition, childCrossPosition);
      } else if (this.direction === Axis.vertical) {
        parentData.offset = new Vector(childCrossPosition, childMainPosition);
      }
      childMainPosition += childMainSize + betweenSpace;
      child = parentData?.nextSibling;
    }
  }

  private computeSize(constraints: BoxConstraints): LayoutSizes {
    let totalFlex: number = 0,
      maxMainSize: number = 0,
      canFlex: boolean,
      child = this.firstChild,
      crossSize: number = 0,
      allocatedSize: number = 0;

    maxMainSize =
      this.direction === Axis.horizontal
        ? constraints.maxWidth
        : constraints.maxHeight;
    //盒子主轴值无限时不能被flex布局
    canFlex = maxMainSize < Infinity;

    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      let innerConstraint: BoxConstraints = BoxConstraints.zero;
      const flex = this.getFlex(child);
      if (flex > 0) {
        totalFlex += flex;
      } else {
        //当设置了cross方向也需要拉伸时,子盒子约束需要设置为max = min = parent.max
        if (this.crossAxisAlignment === CrossAxisAlignment.stretch) {
          if (this.direction === Axis.horizontal) {
            innerConstraint = BoxConstraints.tightFor(
              null,
              constraints.maxHeight
            );
          } else if (this.direction === Axis.vertical) {
            innerConstraint = BoxConstraints.tightFor(
              constraints.maxWidth,
              null
            );
          }
        } else {
          //cross未设置拉伸，仅设置子盒子 max
          if (this.direction === Axis.horizontal) {
            innerConstraint = new BoxConstraints({
              maxHeight: constraints.maxHeight,
            });
          } else if (this.direction === Axis.vertical) {
            innerConstraint = new BoxConstraints({
              maxWidth: constraints.maxWidth,
            });
          }
        }
        child.layout(innerConstraint);
        const childSize = child?.size || Size.zero;
        allocatedSize += this.getMainSize(childSize);
        crossSize = Math.max(crossSize, this.getCrossSize(childSize));
      }

      child = parentData?.nextSibling;
    }

    //弹性布局计算
    if (totalFlex > 0) {
      //剩余空间
      const freeSpace = Math.max(0, canFlex ? maxMainSize : 0) - allocatedSize;
      //弹性盒子平均值
      const freePerSpace: number = freeSpace / totalFlex;
      child = this.firstChild;
      while (child != null) {
        const flex = this.getFlex(child);
        if (flex > 0) {
          //子盒子最大约束
          const maxChildExtent: number = canFlex
            ? flex * freePerSpace
            : Infinity;
          //最小约束
          const minChildExtend: number = maxChildExtent;
          let innerConstraint: BoxConstraints = BoxConstraints.zero;
          //交叉方向填满
          if (this.crossAxisAlignment === CrossAxisAlignment.stretch) {
            if (this.direction === Axis.horizontal) {
              innerConstraint = new BoxConstraints({
                maxWidth: maxChildExtent,
                minWidth: minChildExtend,
                minHeight: constraints.maxHeight,
                maxHeight: constraints.maxHeight,
              });
            } else if (this.direction === Axis.vertical) {
              innerConstraint = new BoxConstraints({
                maxWidth: constraints.maxWidth,
                minWidth: constraints.maxWidth,
                minHeight: minChildExtend,
                maxHeight: maxChildExtent,
              });
            }
          } else {
            if (this.direction === Axis.horizontal) {
              innerConstraint = new BoxConstraints({
                minWidth: minChildExtend,
                maxWidth: maxChildExtent,
                maxHeight: constraints.maxHeight,
                minHeight: 0,
              });
            } else if (this.direction === Axis.vertical) {
              innerConstraint = new BoxConstraints({
                minHeight: minChildExtend,
                maxHeight: maxChildExtent,
                maxWidth: constraints.minWidth,
                minWidth: 0,
              });
            }
          }
          child.layout(innerConstraint);
        }
        //刷新布局后子盒子大小
        allocatedSize += this.getMainSize(child.size);
        crossSize = Math.max(crossSize, this.getCrossSize(child.size));
        const parentData =
          child.parentData as ContainerRenderViewParentData<RenderView>;
        child = parentData.nextSibling;
      }
    }

    const idealSize: number = canFlex ? maxMainSize : allocatedSize;
    return {
      mainSize: idealSize,
      crossSize: crossSize,
      allocatedSize: allocatedSize,
    };
  }
  private getFlex(child: RenderView): number {
    if (child.parentData instanceof FlexParentData) {
      return child.parentData.flex ?? 0;
    }
    return 0;
  }
  protected setupParentData(child: RenderView): void {
    child.parentData = new FlexParentData();
  }

  private getCrossSize(size: Size) {
    switch (this.direction) {
      case Axis.horizontal:
        return size.height;
      case Axis.vertical:
        return size.width;
    }
  }

  private getMainSize(size: Size) {
    switch (this.direction) {
      case Axis.horizontal:
        return size.width;
      case Axis.vertical:
        return size.height;
    }
  }
}

export class Stack extends MultiChildRenderView {
  fit: StackFit = StackFit.loose;
  alignment: Alignment = Alignment.topLeft;
  constructor(option: Partial<StackOption & MultiChildRenderViewOption>) {
    const { children, alignment, fit } = option;
    super(children);
    this.alignment = alignment ?? this.alignment;
    this.fit = fit ?? this.fit;
  }
  private computeSize(constraints: BoxConstraints): Size {
    //未被定位子组件约束盒子
    let nonPositionedConstraints: BoxConstraints = BoxConstraints.zero;
    //是否有未定位的组件
    let hasNonPositionChild: boolean = false;
    switch (this.fit) {
      case StackFit.loose:
        nonPositionedConstraints = new BoxConstraints({
          maxWidth: constraints.maxWidth,
          maxHeight: constraints.maxHeight,
        });
        break;
      case StackFit.expand:
        //子盒子填充父盒子100%
        nonPositionedConstraints = new BoxConstraints({
          minWidth: constraints.minWidth,
          minHeight: constraints.minHeight,
          maxWidth: constraints.minWidth,
          maxHeight: constraints.minHeight,
        });
      case StackFit.passthrough:
        nonPositionedConstraints = constraints;
    }

    //记录stack内child的最大值
    let width = constraints.minWidth,
      height = constraints.minHeight;
    let child = this.firstChild;
    while (child != null) {
      const parentData = child.parentData as StackParentData;
      if (!parentData.isPositioned) {
        hasNonPositionChild = true;
        child.layout(nonPositionedConstraints, true);
        const childSize = child.size;
        width = Math.max(width, childSize.width);
        height = Math.max(height, childSize.height);
      }
      child = parentData.nextSibling;
    }

    if (hasNonPositionChild) {
      return new Size(width, height);
    }

    return constraints.constrain(Size.zero);
  }
  /**
   * 未定位的组件随align 对其布局
   *
   */
  performLayout(): void {
    this.size = this.computeSize(this.constraints);
    let child = this.firstChild;
    while (child != null) {
      const parentData = child.parentData as StackParentData;
      if (!parentData.isPositioned) {
        parentData.offset = this.alignment.inscribe(child.size, this.size);
      } else {
        this.layoutPositionedChild(
          child,
          parentData,
          this.size,
          this.alignment
        );
      }
      child = parentData.nextSibling;
    }
  }
  private layoutPositionedChild(
    child: RenderView,
    parentData: StackParentData,
    size: Size,
    alignment: Alignment
  ) {
    let childConstraints = BoxConstraints.zero;

    if (parentData.left != null && parentData.right != null) {
      childConstraints = childConstraints.tighten(
        size.width - parentData.right - parentData.left
      );
    } else if (parentData.width != null) {
      childConstraints = childConstraints.tighten(parentData.width);
    }

    if (parentData.top != null && parentData.bottom != null) {
      childConstraints = childConstraints.tighten(
        null,
        size.height - parentData.top - parentData.bottom
      );
    } else if (parentData.height != null) {
      childConstraints = childConstraints.tighten(null, parentData.height);
    }

    child.layout(childConstraints, true);

    let x: number = 0;
    if (parentData.left != null) {
      x = parentData.left;
    } else if (parentData.right != null) {
      x = size.width - parentData.right - child.size.width;
    } else {
      x = alignment.inscribe(child.size, size).x;
    }

    let y: number = 0;
    if (parentData.top != null) {
      y = parentData.top;
    } else if (parentData.bottom != null) {
      y = size.height - parentData.bottom - child.size.height;
    } else {
      y = alignment.inscribe(child.size, size).y;
    }

    parentData.offset = new Vector(x, y);
  }
  protected setupParentData(child: RenderView): void {
    child.parentData = new StackParentData();
  }
}

class StackParentData extends ContainerRenderViewParentData<RenderView> {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;

  get isPositioned(): boolean {
    return (
      this.top != null ||
      this.right != null ||
      this.bottom != null ||
      this.left != null ||
      this.width != null ||
      this.height != null
    );
  }
}

export class Positioned extends ParentDataRenderView<StackParentData> {
  private top: number;
  private left: number;
  private right: number;
  private bottom: number;
  private width: number;
  private height: number;
  constructor(option: Partial<PositionedOption & SingleChildRenderViewOption>) {
    const { child, top, bottom, left, right, width, height } = option;
    super(child);
    this.top = top;
    this.bottom = bottom;
    this.left = left;
    this.right = right;
    this.width = width;
    this.height = height;
  }
  applyParentData(renderObject: RenderView): void {
    if (renderObject.parentData instanceof StackParentData) {
      const parentData = renderObject.parentData;
      parentData.left = this.left;
      parentData.right = this.right;
      parentData.bottom = this.bottom;
      parentData.top = this.top;
      parentData.width = this.width;
      parentData.height = this.height;
    }
  }
  render(context: PaintingContext, offset?: Vector): void {
    context.paintChild(this.child, offset);
  }
}

export interface ParagraphViewOption {
  text: TextSpan;
}

export class ParagraphView extends SingleChildRenderView {
  private textPainter: TextPainter;
  private text: TextSpan;
  private needClip: boolean;

  constructor(option?: ParagraphViewOption) {
    super();
    const { text } = option;
    this.text = text;
  }
  performLayout(): void {
    this.textPainter = new TextPainter(this.text);
    this.textPainter.layout(
      this.constraints.minWidth,
      this.constraints.maxWidth
    );
    const textSize = this.textPainter.size;
    this.size = this.constraints.constrain(textSize);

    switch (this.text.style.getTextStyle().overflow) {
      case TextOverflow.clip:
        this.needClip =
          textSize.height > this.size.height ||
          textSize.width > this.size.width;
        break;
      case TextOverflow.ellipsis:
      case TextOverflow.visible:
    }
  }
  render(context: PaintingContext, offset?: Vector): void {
    if (!context.paint) return;
    if (this.needClip) {
      context.clipRectAndPaint(
        Clip.antiAlias,
        {
          x: offset?.x ?? 0,
          y: offset?.y ?? 0,
          width: this.size.width,
          height: this.size.height,
        },
        () => {
          this.textPainter.paint(context?.paint, offset);
        }
      );
    } else {
      this.textPainter.paint(context?.paint, offset);
    }
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    if (this.needClip) {
      context.clipRectAndPaint(
        Clip.antiAlias,
        {
          x: offset?.x ?? 0,
          y: offset?.y ?? 0,
          width: this.size.width,
          height: this.size.height,
        },
        () => {
          this.textPainter.paint(context.paint, offset, true);
        }
      );
    } else {
      this.textPainter.paint(context.paint, offset, true);
    }
  }
  mount(parent?: RenderView, newSlot?: Object): void {}
}

export class RootRenderView extends SingleChildRenderView {}
