import Painter from "@/core/lib/painter";
import Alignment from "@/core/lib/painting/alignment";
import { Size } from "@/core/lib/rect";
import { BoxConstraints } from "@/core/lib/rendering/constraints";
import Vector from "@/core/lib/vector";
import { BoundsRRect, BoundsRect, ClipRRectOption, PositionedOption, Radius, SingleChildRenderViewOption } from "@/types/widget";

enum Clip {
  none,
  hardEdge,
  antiAlias,
}

//原子渲染对象，可以有层级渲染，没有renderbox，依赖于context传输的大小来渲染
export abstract class RenderView {
  protected size: Size = Size.zero;
  abstract render(context: PaintingContext, offset?: Vector): void;
  //默认大小等于子大小，被子撑开
  abstract layout(constraints: BoxConstraints): void;
}

export class SingleChildRenderView extends RenderView {
  protected child: RenderView;
  protected constrain: BoxConstraints = BoxConstraints.zero;
  constructor(child?: RenderView) {
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
  constructor(color?: string, child?: RenderView) {
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
  constructor(width: number, height: number, child?: RenderView) {
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
  constructor(padding: number, child?: RenderView) {
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
  constructor(alignment: Alignment, child?: RenderView) {
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
  constructor(option:Partial<ClipRRectOption>) {
    const {child,borderRadius}=option;
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

export abstract class MultiChildRenderView extends RenderView {
  protected children: RenderView[];
  constructor(children?: RenderView[]) {
    super();
    this.children = children;
  }
  render(context: PaintingContext, offset?: Vector): void {}
  layout(constraints: BoxConstraints): void {
    this.size = constraints.constrain(Size.zero);
    this.children?.forEach((child, index) => {
      this.performLayoutChild(child, constraints);
    });
  }
  performLayoutChild(child: RenderView, constraints: BoxConstraints): void {
    child.layout(constraints);
  }
}



export class Stack extends MultiChildRenderView {
  constructor(children: RenderView[]) {
    super(children);
  }
  render(context: PaintingContext, offset?: Vector): void {
    this.children?.forEach((child) => {
      context.paintChild(child, offset);
    });
    super.render(context, offset);
  }
}