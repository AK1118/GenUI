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
} from "@/types/widget";

export enum Clip {
  none,
  hardEdge,
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
  abstract layout(constraints: BoxConstraints, parentUseSize?: boolean): void;
  abstract performLayout(
    constraints: BoxConstraints,
    parentUseSize?: boolean
  ): void;
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
}

abstract class RenderBox extends RenderView {
  protected setupParentData(child: RenderView): void {
    child.parentData = new BoxParentData();
  }
}

//parentData设置
export abstract class ParentDataRenderView<
  P extends ParentData
> extends RenderView {
  public parentData: P;
  constructor(child?: RenderBox) {
    super();
    this.child = child;
  }
  abstract applyParentData(renderObject: RenderView): void;
  layout(constraints: BoxConstraints, parentUseSize?: boolean): void {
    if (this.child) {
      this.child.layout(constraints, parentUseSize);
      this.size = (this.child as unknown as SingleChildRenderView).size;
    } else {
      this.size = constraints.constrain(Size.zero);
    }
    this.performLayout(constraints, parentUseSize);
  }
  performLayout(constraints: BoxConstraints, parentUseSize?: boolean): void {}
  render(context: PaintingContext, offset?: Vector) {
    context.paintChild(this.child!, offset);
  }
}

export abstract class SingleChildRenderView extends RenderBox {
  protected constrain: BoxConstraints = BoxConstraints.zero;
  constructor(child?: RenderBox) {
    super();
    this.child = child;
  }
  render(context: PaintingContext, offset?: Vector) {
    context.paintChild(this.child!, offset);
  }
  //默认大小等于子大小，被子撑开
  layout(constraints: BoxConstraints, parentUseSize?: boolean): void {
    if (this.child) {
      this.child.layout(constraints, parentUseSize);
      this.size = (this.child as unknown as SingleChildRenderView).size;
    } else {
      this.size = constraints.constrain(Size.zero);
    }
    this.performLayout(constraints, parentUseSize);
  }
  performLayout(constraints: BoxConstraints, parentUseSize?: boolean): void {}
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

  layout(constraints: BoxConstraints, parentUseSize?: boolean): void {
    super.layout(this.additionalConstraints.enforce(constraints), true);
  }
}

export class Padding extends SingleChildRenderView {
  private padding: number = 0;
  constructor(padding: number, child?: RenderBox) {
    super(child);
    this.padding = padding;
  }
  performLayout(constraints: BoxConstraints): void {
    /**
     * 增量约束
     * padding box最大约束
     */
    const additionalConstraints = new BoxConstraints({
      minWidth: Math.max(
        this.padding * 2,
        constraints.minWidth + this.padding * -2
      ),
      minHeight: this.padding * 2,
      maxWidth: Math.max(
        this.padding * 2,
        constraints.maxWidth + this.padding * -2
      ),
      maxHeight: Math.max(
        this.padding * 2,
        constraints.maxHeight + this.padding * -2
      ),
    });
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
  performLayout(constraints: BoxConstraints): void {
    const parentSize = constraints.constrain(Size.zero);
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
  paintChild(child: RenderView, offset?: Vector): void {
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
}

export class Expanded extends ParentDataRenderView<FlexParentData> {
  private flex: number;
  constructor(option?: Partial<ExpandedOption & RenderViewOption>) {
    const { child, flex } = option ?? {};
    super(child);
    this.flex = flex;
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
    this.direction = direction;
    this.mainAxisAlignment = mainAxisAlignment!;
    this.crossAxisAlignment = crossAxisAlignment!;
  }

  layout(constraints: BoxConstraints): void {
    super.layout(constraints);
  }

  performLayout(constraints: BoxConstraints): void {
    const computeSize: LayoutSizes = this.computeSize(constraints);
    if (this.direction === Axis.horizontal) {
      this.size = constraints.constrain(
        new Size(computeSize.mainSize, computeSize.crossSize)
      );
    } else if (this.direction === Axis.vertical) {
      this.size = constraints.constrain(
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

      switch (this.crossAxisAlignment) {
        case CrossAxisAlignment.start:
        case CrossAxisAlignment.end:
          childCrossPosition = computeSize.crossSize - childCrossSize;
          break;
        case CrossAxisAlignment.center:
          childCrossPosition =
            computeSize.crossSize * 0.5 - childCrossSize * 0.5;
          break;
        case CrossAxisAlignment.stretch:
          childCrossPosition = 0;
          break;
        case CrossAxisAlignment.baseline:
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
          this.direction === Axis.horizontal &&
            (innerConstraint = BoxConstraints.tightFor(
              0,
              constraints.maxHeight
            ));
          this.direction === Axis.vertical &&
            (innerConstraint = BoxConstraints.tightFor(
              constraints.maxWidth,
              0
            ));
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
                minHeight: constraints.minHeight,
              });
            } else if (this.direction === Axis.vertical) {
              innerConstraint = new BoxConstraints({
                minHeight: minChildExtend,
                maxHeight: maxChildExtent,
                maxWidth: constraints.maxWidth,
                minWidth: constraints.minWidth,
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
