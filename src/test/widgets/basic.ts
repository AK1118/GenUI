import Painter from "@/core/lib/painter";
import Alignment from "@/core/lib/painting/alignment";
import { Size } from "@/core/lib/rect";
import { BoxConstraints } from "@/core/lib/rendering/constraints";
import Vector from "@/core/lib/vector";
import {
  BoundsRRect,
  BoundsRect,
  ClipRRectOption,
  PositionedOption,
  Radius,
  SingleChildRenderViewOption,
} from "@/types/widget";

export enum Clip {
  none,
  hardEdge,
  antiAlias,
}
export enum Axis {
  /// Left and right.
  horizontal,
  /// Up and down.
  vertical,
}
export enum MainAxisAlignment {
  /// Place the children as close to the start of the main axis as possible.
  ///
  /// If this value is used in a horizontal direction, a [TextDirection] must be
  /// available to determine if the start is the left or the right.
  ///
  /// If this value is used in a vertical direction, a [VerticalDirection] must be
  /// available to determine if the start is the top or the bottom.
  start,

  /// Place the children as close to the end of the main axis as possible.
  ///
  /// If this value is used in a horizontal direction, a [TextDirection] must be
  /// available to determine if the end is the left or the right.
  ///
  /// If this value is used in a vertical direction, a [VerticalDirection] must be
  /// available to determine if the end is the top or the bottom.
  end,

  /// Place the children as close to the middle of the main axis as possible.
  center,

  /// Place the free space evenly between the children.
  spaceBetween,

  /// Place the free space evenly between the children as well as half of that
  /// space before and after the first and last child.
  spaceAround,

  /// Place the free space evenly between the children as well as before and
  /// after the first and last child.
  spaceEvenly,
}

export enum CrossAxisAlignment {
  /// Place the children with their start edge aligned with the start side of
  /// the cross axis.
  ///
  /// For example, in a column (a flex with a vertical axis) whose
  /// [TextDirection] is [TextDirection.ltr], this aligns the left edge of the
  /// children along the left edge of the column.
  ///
  /// If this value is used in a horizontal direction, a [TextDirection] must be
  /// available to determine if the start is the left or the right.
  ///
  /// If this value is used in a vertical direction, a [VerticalDirection] must be
  /// available to determine if the start is the top or the bottom.
  start,

  /// Place the children as close to the end of the cross axis as possible.
  ///
  /// For example, in a column (a flex with a vertical axis) whose
  /// [TextDirection] is [TextDirection.ltr], this aligns the right edge of the
  /// children along the right edge of the column.
  ///
  /// If this value is used in a horizontal direction, a [TextDirection] must be
  /// available to determine if the end is the left or the right.
  ///
  /// If this value is used in a vertical direction, a [VerticalDirection] must be
  /// available to determine if the end is the top or the bottom.
  end,

  /// Place the children so that their centers align with the middle of the
  /// cross axis.
  ///
  /// This is the default cross-axis alignment.
  center,

  /// Require the children to fill the cross axis.
  ///
  /// This causes the constraints passed to the children to be tight in the
  /// cross axis.
  stretch,

  /// Place the children along the cross axis such that their baselines match.
  ///
  /// Because baselines are always horizontal, this alignment is intended for
  /// horizontal main axes. If the main axis is vertical, then this value is
  /// treated like [start].
  ///
  /// For horizontal main axes, if the minimum height constraint passed to the
  /// flex layout exceeds the intrinsic height of the cross axis, children will
  /// be aligned as close to the top as they can be while honoring the baseline
  /// alignment. In other words, the extra space will be below all the children.
  ///
  /// Children who report no baseline will be top-aligned.
  baseline,
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

abstract class AbstractNode {
  private _parent: AbstractNode;
  get parent() {
    return this._parent;
  }
  set parent(value: AbstractNode) {
    this._parent = value;
  }
  protected dropChild(child: AbstractNode) {
    if (!child) return;
    child!.parent = null;
  }
  protected adoptChild(child: AbstractNode) {
    if (!child) return;
    child!.parent = this;
  }
}

//原子渲染对象，可以有层级渲染，没有renderbox，依赖于context传输的大小来渲染
export abstract class RenderView extends AbstractNode {
  private _child?: RenderView;
  public parentData: ParentData = null;
  public size: Size = Size.zero;
  abstract render(context: PaintingContext, offset?: Vector): void;
  //默认大小等于子大小，被子撑开
  abstract layout(constraints: BoxConstraints): void;
  protected dropChild(child: AbstractNode): void {
    super.dropChild(child);
  }
  protected adoptChild(child: AbstractNode): void {
    if (!child) return;
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
  protected setupParentData(child: RenderView) {
    if (child.parentData instanceof ParentData) {
      child.parentData = new ParentData();
    }
  }
}

abstract class RenderBox extends RenderView {
  protected setupParentData(child: RenderView): void {
    child.parentData = new BoxParentData();
  }
}

export class SingleChildRenderView extends RenderBox {
  protected constrain: BoxConstraints = BoxConstraints.zero;
  constructor(child?: RenderBox) {
    super();
    this.child = child;
  }
  render(context: PaintingContext, offset?: Vector) {
    context.paintChild(this.child!, offset);
  }
  //默认大小等于子大小，被子撑开
  layout(constraints: BoxConstraints): void {
    if (this.child) {
      this.child.layout(constraints);
      this.size = (this.child as unknown as SingleChildRenderView).size;
    } else {
      this.size = constraints.constrain(Size.zero);
    }
  }
}

export class ColoredRender extends SingleChildRenderView {
  private color: string;
  constructor(color?: string, child?: RenderBox) {
    super(child);
    this.color = color;
  }
  render(context: PaintingContext, offset?: Vector): void {
    const paint = context.paint;
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
  layout(constraints: BoxConstraints): void {
    super.layout(this.additionalConstraints);
    this.size = this.additionalConstraints.constrain(Size.zero);
  }
  render(context: PaintingContext, offset?: Vector): void {
    super.render(context, offset);
  }
}

export class Padding extends SingleChildRenderView {
  private padding: number = 0;
  constructor(padding: number, child?: RenderBox) {
    super(child);
    this.padding = padding;
  }
  layout(constraints: BoxConstraints): void {
    /**
     * 增量约束
     * padding box最大约束
     */
    const additionalConstraints = new BoxConstraints({
      minWidth: constraints.minWidth + this.padding * -2,
      minHeight: this.padding * -2, //高度不需要约束，如果加上 约束盒子高度会默认为父约束盒高度
    });
    super.layout(additionalConstraints);
    this.size = new Size(
      Math.max(constraints.constrainWidth(this.size.width), this.padding * 2),
      this.size.height + this.padding * 2
    );
  }
  render(context: PaintingContext, offset?: Vector): void {
    // 计算新的偏移量
    const paddedOffsetX = offset ? offset?.x + this.padding : this.padding;
    const paddedOffsetY = offset ? offset?.y + this.padding : this.padding;
    super.render(context, new Vector(paddedOffsetX, paddedOffsetY));
  }
}

export class Align extends SingleChildRenderView {
  private alignment: Alignment;
  private offset: Vector = Vector.zero;
  constructor(alignment: Alignment, child?: RenderBox) {
    super(child);
    this.alignment = alignment;
  }
  layout(constraints: BoxConstraints): void {
    super.layout(constraints);
    const parentSize = constraints.constrain(Size.zero);
    this.offset = this.alignment.inscribe(this.size, parentSize);
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
  paintChild(child: RenderView, offset?: Vector): void {
    child?.render(this, offset);
  }
}

export class Positioned extends SingleChildRenderView {
  private position: Vector = Vector.zero;
  private isBottom: boolean;
  private isRight: boolean;
  constructor(option: Partial<PositionedOption & SingleChildRenderViewOption>) {
    const { child } = option;
    super(child);
    this.updatePosition(option);
  }
  private updatePosition(positionValues: Partial<PositionedOption>) {
    let { top, bottom, left, right } = positionValues;
    let x = top,
      y = left;
    if (top == null && bottom != null) {
      y = bottom;
      this.isBottom = true;
    }
    if (left == null && right != null) {
      x = right;
      this.isRight = true;
    }
    this.position.setXY(x || 0, y || 0);
  }
  layout(constraints: BoxConstraints): void {
    super.layout(constraints);
    const parentSize = constraints.constrain(Size.zero);
    this.isBottom &&
      this.position.setXY(
        this.position.x,
        parentSize.height - (this.position.y + this.size.height)
      );
    this.isRight &&
      this.position.setXY(
        parentSize.width - (this.position.x + this.size.width),
        this.position.y
      );
  }
  render(context: PaintingContext, offset?: Vector): void {
    context.paintChild(
      this.child,
      offset ? Vector.add(this.position, offset) : offset
    );
  }
}

export abstract class MultiChildRenderView extends RenderBox {
  protected lastChild: RenderView;
  protected firstChild: RenderView;
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
  render(context: PaintingContext, offset?: Vector): void {}
  layout(constraints: BoxConstraints): void {
    this.performLayout(constraints);
  }
  performLayout(constraints: BoxConstraints): void {
    this.size = constraints.constrain(Size.zero);
    let child = this.firstChild;
    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      this.performLayoutChild(child, constraints);
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
}

export class Stack extends MultiChildRenderView {
  constructor(children: RenderView[]) {
    super(children);
  }
  render(context: PaintingContext, offset?: Vector): void {
    let child = this.firstChild;
    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      context.paintChild(child, offset);
      child = parentData?.nextSibling;
    }
    super.render(context, offset);
  }
}
