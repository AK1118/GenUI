import Painter from "@/core/lib/painter";
import { Size } from "@/core/lib/rect";
import { BoxConstraints } from "@/core/lib/rendering/constraints";
import Vector from "@/core/lib/vector";

//原子渲染对象，可以有层级渲染，没有renderbox，依赖于context传输的大小来渲染
export abstract class RenderView {
  render(context: PaintingContext, offset?: Vector) {
    this.renderChild(context, offset);
  }
  //默认大小等于子大小，被子撑开
  abstract layout(constraints: BoxConstraints): void;

  abstract renderChild(context: PaintingContext, offset?: Vector);
}

export class SingleChildRenderView extends RenderView {
  protected child: RenderView;
  protected size: Size = Size.zero;
  protected constrain: BoxConstraints = BoxConstraints.zero;
  constructor(child?: RenderView) {
    super();
    this.child = child;
  }
  render(context: PaintingContext, offset?: Vector) {
    this.renderChild(context, offset);
  }
  renderChild(context: PaintingContext, offset?: Vector) {
    this.child?.render(context, offset);
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
    paint.fillStyle = this.color;
    paint.fillRect(
      offset?.x ?? 0,
      offset?.y ?? 0,
      this.size.width,
      this.size.height
    );
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

export class PaintingContext {
  private _paint: Painter;
  constructor(paint: Painter) {
    this._paint = paint;
  }
  get paint(): Painter {
    return this._paint;
  }
  paintChild(child: RenderView, offset?: Vector): void {
    child.render(this, offset);
  }
}
