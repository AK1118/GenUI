import Painter from "@/lib/painting/painter";
import Alignment from "@/lib/painting/alignment";
import Rect, { Offset, Size } from "@/lib/basic/rect";
import Constraints, { BoxConstraints } from "@/lib/rendering/constraints";
import Vector from "@/lib/math/vector";
import { TextPainter, TextSpan } from "../painting/text-painter";
import { PipelineOwner, RendererBinding } from "../basic/binding";
import { Widget } from "../basic/framework";
import {
  HitTestEntry,
  HitTestResult,
  HitTestTarget,
} from "../gesture/hit_test";
import {
  CancelPointerEvent,
  DownPointerEvent,
  MovePointerEvent,
  PointerEvent,
  UpPointerEvent,
} from "../gesture/events";
import { Matrix, Matrix4 } from "../math/matrix";
import MatrixUtils from "../utils/matrixUtils";
import { BoxDecoration } from "../painting/decoration";
import {
  ImageDecoration,
  ImageDecorationArguments,
  ImageDecorationPainter,
} from "../painting/image";
import { ChangeNotifier } from "../core/change-notifier";
import {
  LayerHandler,
  OffsetLayer,
  ParentData,
  RenderView,
} from "./render-object";
import { ScrollPosition, ViewPortOffset } from "./viewport";
import {
  Axis,
  Clip,
  CrossAxisAlignment,
  MainAxisAlignment,
  Radius,
  StackFit,
  TextOverflow,
  WrapAlignment,
  WrapCrossAlignment,
} from "../core/base-types";
import { CustomClipper, CustomPainter } from "../rendering/custom";
import { Path2D } from "../rendering/path-2D";
import { Color } from "../painting/color";
import { BorderRadius } from "../painting/radius";
import { GenPlatformConfig } from "../core/platform";

export interface RenderViewOption {
  child: RenderBox;
}

export interface SingleChildRenderViewArguments<ChildType = RenderBox> {
  child: ChildType;
}

export interface MultiChildRenderViewOption {
  children: RenderBox[];
}

export interface PositionedArguments {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

export interface BoundsRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoundsRRect extends BoundsRect {
  radii: number | Iterable<number>;
}

export interface ClipRectArguments { }

export interface ClipRRectArguments extends ClipRectArguments {
  borderRadius: BorderRadius;
}

export interface FlexOption {
  direction: Axis;
  mainAxisAlignment: MainAxisAlignment;
  crossAxisAlignment: CrossAxisAlignment;
  spacing: number;
}

export interface LayoutSizes {
  mainSize: number;
  crossSize: number;
  allocatedSize: number;
}

export interface ExpandedArguments {
  flex: number;
}
export interface StackOption {
  fit: StackFit;
  alignment: Alignment;
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

export interface WrapOption {
  direction: Axis;
  spacing: number;
  runSpacing: number;
  alignment: WrapAlignment;
  runAlignment: WrapAlignment;
  crossAxisAlignment: WrapCrossAlignment;
}

export class BoxParentData extends ParentData {
  offset: Vector = Vector.zero;
}

export class ContainerRenderViewParentData<
  ChildType extends RenderView = RenderView
> extends BoxParentData {
  previousSibling?: ChildType;
  nextSibling?: ChildType;
}

export class FlexParentData extends ContainerRenderViewParentData<RenderView> {
  private _flex: number;
  public node: any;
  get flex(): number {
    return this._flex;
  }
  set flex(value: number) {
    this._flex = value;
  }
  constructor() {
    super();
  }
}

export abstract class RenderBox extends RenderView {
  protected _renderOffset: Offset = Offset.zero;
  get renderBounds(): Rect {
    return Rect.compose(this._renderOffset, this.size);
  }
  protected constraints: BoxConstraints = BoxConstraints.zero;
  layout(constraints: BoxConstraints, parentUseSize?: boolean): void {
    this.constraints = constraints;
    if (this.needsReLayout || parentUseSize) {
      this.performLayout();
    }
    this.needsReLayout = false;
    this.markNeedsPaint();
  }
  attach(owner: Object): void {
    super.attach(owner);
    if (!owner) return;
    this.needsReLayout = false;
    this.markNeedsLayout();
  }
  protected setupParentData(child: RenderView): void {
    child.parentData = new BoxParentData();
  }
  performResize(): void {
    this.performLayout();
  }
  computeDryLayout(constrains: BoxConstraints): Size {
    return Size.zero;
  }
  getDryLayout(constrains: BoxConstraints): Size {
    return this.computeDryLayout(constrains);
  }
  public hitTest(result: HitTestResult, position: Vector): boolean {
    if (this.hitTestSelf(result, position)) {
      const isHit =
        this.hitTestChildren(result, position) ||
        this.hitTestSelf(result, position);
      if (isHit) {
        result.add(new HitTestEntry(this));
        return true;
      }
    }
    return false;
  }
  public hitTestChildren(result: HitTestResult, position: Vector): boolean {
    // 调用默认方法处理子对象的碰撞检测
    return this.defaultHitTestChildren(result, position);
  }
  public hitTestSelf(result: HitTestResult, position: Vector): boolean {
    return this.size.contains(position);
  }
  protected defaultHitTestChildren(
    result: HitTestResult,
    position: Vector,
    transform: Matrix4 = Matrix4.zero.identity()
  ): boolean {
    let child = this.child;
    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      let transformed = Vector.sub(position, parentData.offset);
      transformed = MatrixUtils.transformPoint(transform, transformed);
      const isHit = child.hitTest(result, transformed);
      if (isHit) {
        return true;
        // result.add(new HitTestEntry(child));
      }
      child = parentData?.nextSibling;
    }
    return false;
  }
  applyPaintTransform(child: RenderView, transform: Matrix4): void {
    const childParentData = child?.parentData as BoxParentData;
    const offset: Vector = childParentData.offset;
    transform.translate(offset.x, offset.y);
  }
}

//parentData设置
export abstract class ParentDataRenderView<
  P extends ParentData = ParentData
> extends RenderBox {
  public parentData: P;
  constructor(child?: RenderBox) {
    super();
    this.child = child;
  }
  abstract applyParentData(renderObject: RenderView): void;
  updateParentData() {
    if (this.parentData) {
      this.applyParentData(this);
    }
  }
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
  /**
   * @mustCallSuper
   */
  performLayout(): void { }
  render(context: PaintingContext, offset?: Vector) {
    context.paintChild(this.child!, offset);
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    context.paintChildDebug(this.child!, offset);
    context.paintDefaultDebugBoundary(offset, this.child?.size ?? Size.zero);
  }
}

export abstract class SingleChildRenderView extends RenderBox {

  constructor(child?: RenderBox) {
    super();
    this.child = child;
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    if (this.child) {
      const parentData: BoxParentData = this.child?.parentData as BoxParentData;
      let resultOffset = Vector.zero;
      if (offset && parentData) {
        resultOffset = Vector.add(offset, parentData.offset);
      }
      context.paintChildDebug(this.child!, resultOffset);
    }
    this.checkRenderBoundary(context, offset);
  }
  render(context: PaintingContext, offset?: Vector) {
    this._renderOffset = offset;
    if (this.child) {
      const parentData: BoxParentData = this.child?.parentData as BoxParentData;
      let resultOffset = Vector.zero;
      if (offset && parentData) {
        resultOffset = Vector.add(offset, parentData.offset);
      }
      context.paintChild(this.child!, resultOffset);
    }
    this.checkRenderBoundary(context, offset);
  }
  /**
   * # 检查边界溢出情况，并绘制超出部分
   *   - 绘制超出父容器部分的背景色域，并绘制条纹效果
   *   - 检测范围 [RenderBox] ,它不具备滚动特性。
   * @param context 
   * @param offset 
   * @returns 
   */
  private checkRenderBoundary(context: PaintingContext, offset: Offset) {
    if (!this.parent || !(this.parent instanceof RenderBox)) return;
    const parentSize = this.parent.renderBounds;
    const { x, y } = offset;
    const { width, height } = this.size;
    const { width: maxWidth, height: maxHeight, x: parentX, y: parentY } = parentSize;
    const paint = context.paint;

    paint.save();
    paint.fillStyle = "yellow";

    // 下方溢出 (Bottom Overflow)
    const bottomOverflow = height - maxHeight;
    if (bottomOverflow > 0) {
      
    console.log("下发溢出",x)
      const paintAlertOffset = y + height - bottomOverflow - 20;
      paint.fillRect(x, paintAlertOffset, width, 20);
      this.drawSkewedStripes(paint, x, paintAlertOffset, width, bottomOverflow, "vertical");
    }

    // 上方溢出 (Top Overflow)
    // if (y < 0) {
    //   console.log("上方溢出", this);
    //   paint.fillRect(x, y, width, Math.abs(y));
    //   this.drawSkewedStripes(paint, x, y, width, Math.abs(y), "vertical");
    // }

    // 左侧溢出 (Left Overflow)
    // console.log(x)
    // if (x < 0) {
    //   console.log("左侧溢出", this);
    //   paint.fillRect(x, y, Math.abs(x), height);
    //   this.drawSkewedStripes(paint, x, y, Math.abs(x), height, "horizontal");
    // }

    // 右侧溢出 (Right Overflow)
    const rightOverflow = width - maxWidth;
    if (rightOverflow > 0) {
      const paintAlertOffset = x + width - rightOverflow - 20;
      paint.fillRect(paintAlertOffset, y, 20, height);
      this.drawSkewedStripes(paint, paintAlertOffset, y, rightOverflow, height, "horizontal");
    }
    paint.restore();
  }

  /**
   * 绘制倾斜的条纹用于警示溢出区域
   * @param paint 画笔对象
   * @param x 溢出矩形的 x 坐标
   * @param y 溢出矩形的 y 坐标
   * @param width 溢出区域宽度
   * @param height 溢出区域高度
   * @param direction "horizontal" | "vertical"
   */
  private drawSkewedStripes(paint: Painter, x: number, y: number, width: number, height: number, direction: "horizontal" | "vertical") {
    paint.save();
    paint.rect(x, y, width, height);
    paint.clip();
    paint.fillStyle = "black";
    const translate = new Matrix4();
    if (direction === "vertical") {
      translate.translate(0, y).skewX(-0.8);
      paint.transform(translate.matrix);
      for (let i = 0; i < width / 10 + 1; i++) {
        paint.fillRect(x, 0, 10, 20);
        paint.translate(20, 0);
      }
    } else {
      translate.translate(x, 0).skewY(-0.8);
      paint.transform(translate.matrix);
      for (let i = 0; i < height / 10 + 1; i++) {
        paint.save();
        paint.fillRect(0, y, 20, 10);
        paint.restore();
        paint.translate(0, 20);
      }
    }
    paint.restore();
  }

  performLayout(): void {
    if (this.child) {
      this.child.layout(this.constraints, true);
      this.size = (this.child as unknown as SingleChildRenderView).size;
    } else {
      this.size = this.constraints.constrain(Size.zero);
    }
    if (!this.layerHandler) {
      this.layerHandler = new LayerHandler<OffsetLayer>();
      this.layerHandler.layer = new OffsetLayer(Vector.zero);
    }
    const parentData = this
      .parentData as ContainerRenderViewParentData<RenderView>;
    if (parentData) {
      const offset = parentData?.offset;
      this.layerHandler.layer.offset = offset || Vector.zero;
    }
  }
  layout(constraints: BoxConstraints, parentUseSize?: boolean): void {
    super.layout(constraints, parentUseSize);
  }
}

export class LimitedBoxRender extends SingleChildRenderView {
  private _maxWidth: number;
  private _maxHeight: number;
  constructor(maxWidth?: number, maxHeight?: number, child?: RenderBox) {
    super(child);
    this._maxWidth = maxWidth;
    this._maxHeight = maxHeight;
  }
  get maxWidth(): number {
    return this._maxWidth;
  }
  get maxHeight(): number {
    return this._maxHeight;
  }
  setMaxSize(maxWidth: number, maxHeight: number) {
    this._maxWidth = maxWidth;
    this._maxHeight = maxHeight;
    this.markNeedsLayout();
    this.markNeedsPaint();
  }
  performLayout(): void {
    if (this.child) {
      const constrain = this.constraints.enforce(
        BoxConstraints.tightFor(this.maxWidth, this.maxHeight)
      );
      this.child.layout(constrain);
      this.size = this.child.size;
    } else {
      this.size = BoxConstraints.tightFor(this.maxWidth, this.maxHeight)
        .enforce(this.constraints.loosen())
        .constrain(Size.zero);
    }
  }
}

export class ColoredRender extends SingleChildRenderView {
  public _color: Color;

  constructor(color?: Color, child?: RenderBox) {
    super(child);
    this.color = color;
  }
  set color(color: Color) {
    if (!color || this._color === color) return;
    this._color = color;
    this.markNeedsPaint();
  }
  get color(): Color {
    return this._color;
  }
  // performLayout(): void {
  //   // super.performLayout();
  //   // this.child?.layout(this.constraints);
  //   // if (!this.child) {
  //   //   this.size = Size.zero;
  //   //   return;
  //   // }
  //   // this.size = this.child?.size??Size.zero;
  //   if(this.child){
  //     this.child.layout()
  //   }
  // }
  performResize(): void {
    this.size = this.child?.getDryLayout(this.constraints);
  }
  render(context: PaintingContext, offset?: Vector): void {
    const paint = context.paint;
    paint.save();
    paint.beginPath();
    paint.fillStyle = this.color.rgba;
    paint.fillRect(
      offset?.x ?? 0,
      offset?.y ?? 0,
      this.size.width,
      this.size.height
    );
    paint.closePath();
    paint.restore();
    super.render(context, offset);
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    super.debugRender(context, offset);
  }
}

export interface ConstrainedBoxRenderArguments {
  additionalConstraints: BoxConstraints;
}

//尺寸约束 不负责渲染
export class ConstrainedBoxRender extends SingleChildRenderView {
  public _width: number;
  public _height: number;
  private _additionalConstraints: BoxConstraints;
  constructor(
    option: Partial<
      ConstrainedBoxRenderArguments & SingleChildRenderViewArguments
    >
  ) {
    super(option?.child);
    this.additionalConstraints =
      option?.additionalConstraints || BoxConstraints.zero;
  }
  get additionalConstraints(): BoxConstraints {
    return this._additionalConstraints;
  }
  set additionalConstraints(constraints: BoxConstraints) {
    if (this._additionalConstraints === constraints) return;
    this._additionalConstraints = constraints;
    this.markNeedsLayout();
  }
  computeDryLayout(constrains: BoxConstraints): Size {
    if (this.child) {
      this.child.layout(this.additionalConstraints.enforce(constrains), true);
      return this.child.size;
    } else {
      return this.additionalConstraints
        .enforce(this.constraints)
        .constrain(Size.zero);
    }
  }
  set width(width: number) {
    this._width = width;
  }
  set height(height: number) {
    this._height = height;
  }
  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
  performUpdateAdditional(
    width: number = this.width,
    height: number = this.height
  ): void {
    this.additionalConstraints = new BoxConstraints({
      maxWidth: width,
      maxHeight: height,
      minWidth: width,
      minHeight: height,
    });
    this.markNeedsLayout();
    // this.markNeedsPaint();
  }

  performLayout(): void {
    this.size = this.computeDryLayout(this.constraints);
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    context.paintDefaultDebugBoundary(offset, this.size);
    super.debugRender(context, offset);
  }
}

// export class PaddingRenderView extends SingleChildRenderView{
//   private _padding: Partial<RectTLRB> = {
//         left: 0,
//         right: 0,
//         top: 0,
//         bottom: 0,
//       };
//       get padding() {
//         return this._padding;
//       }
//       set padding(padding) {
//         this._padding = padding;
//         this.markNeedsLayout();
//       }
//       constructor(
//         option?: Partial<PaddingOption & SingleChildRenderViewArguments>
//       ) {
//         super(option?.child);
//         this.padding = option?.padding;
//       }
// }

export class PaddingRenderView extends SingleChildRenderView {
  private _padding: Partial<RectTLRB> = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };
  get padding() {
    return this._padding;
  }
  set padding(padding) {
    this._padding = padding;
    this.markNeedsLayout();
  }
  constructor(
    option?: Partial<PaddingOption & SingleChildRenderViewArguments>
  ) {
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
  computeDryLayout(constrains: BoxConstraints): Size {
    return this.size;
  }
  render(context: PaintingContext, offset?: Vector): void {
    super.render(context, offset);
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    super.debugRender(context, offset);
  }
}
export interface AlignArguments {
  alignment: Alignment;
}
export class AlignRenderView extends SingleChildRenderView {
  private _alignment: Alignment = Alignment.center;
  constructor(
    option: Partial<AlignArguments & SingleChildRenderViewArguments>
  ) {
    super(option?.child);
    this.alignment = option?.alignment;
  }
  set alignment(alignment: Alignment) {
    this._alignment = alignment ?? this._alignment;
    this.markNeedsLayout();
  }
  get alignment(): Alignment {
    return this._alignment;
  }
  performLayout(): void {
    const constrain = this.constraints;
    if (this.child) {
      this.child.layout(constrain.loosen(), true);
      this.size = constrain.constrain(
        new Size(this.child.size.width, this.child.size.height)
      );
      this.alignChild();
    } else {
      this.size = constrain.constrain(new Size(Infinity, Infinity));
    }
  }
  private alignChild() {
    const parentSize = this.constraints.constrain(Size.zero);
    const parentData = this.child?.parentData as ContainerRenderViewParentData;
    const offset = this.alignment.inscribe(this.child.size, parentSize);
    offset.clampX(0, parentSize.width);
    offset.clampY(0, parentSize.height);
    parentData.offset = offset;
    this.child.parentData = parentData;
  }
  render(context: PaintingContext, offset?: Vector): void {
    super.render(context, offset);
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    context.paintEmptyDebugBoundary(offset, this.size);
    super.debugRender(context, offset);
  }
}

export class ClipRectRenderView extends ConstrainedBoxRender {
  performLayout(): void {
    if (this.width === undefined && this.height === undefined) {
      this.child.layout(this.constraints);
      this.size = this.child.size;
    } else {
      this.child.layout(this.constraints);
      super.performLayout();
    }
  }
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

export interface SizedBoxOption {
  width: number;
  height: number;
}

export class ClipRRectRenderView extends ClipRectRenderView {
  private _borderRadius: BorderRadius;
  constructor(
    option: Partial<
      SizedBoxOption & ClipRRectArguments & SingleChildRenderViewArguments
    >
  ) {
    const { borderRadius } = option;
    super(option);
    this.borderRadius = borderRadius;
  }
  get borderRadius(): BorderRadius {
    return this._borderRadius;
  }
  set borderRadius(borderRadius: BorderRadius) {
    this._borderRadius = borderRadius;
    this.markNeedsPaint();
  }
  performLayout(): void {
    super.performLayout();
  }
  render(context: PaintingContext, offset?: Vector): void {
    context.clipRRectAndPaint(
      Clip.hardEdge,
      {
        x: offset?.x ?? 0,
        y: offset?.y ?? 0,
        width: this.size.width,
        height: this.size.height,
        radii: this.borderRadius.radius,
      },
      () => {
        super.render(context, offset);
      }
    );
  }
}

export abstract class ClipContext {
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
    painter: VoidFunction,
    bounds: BoundsRect
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
      painter,
      bounds
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
      painter,
      bounds
    );
  }

  public clipPath(
    clipBehavior: Clip,
    bounds: BoundsRect,
    clipPath: Path2D,
    painter: VoidFunction
  ) {
    this.clipAndPaint(
      () => this.paint.clip(),
      clipBehavior,
      () => {
        clipPath.render(this.paint, new Size(bounds.width, bounds.height));
      },
      painter,
      bounds
    );
  }
}

export class PaintingContext extends ClipContext {
  private estimatedBounds: Rect;
  constructor(paint: Painter, estimatedBounds: Rect) {
    super(paint);
    this.estimatedBounds = estimatedBounds;
  }
  paintChildDebug(child: RenderView, offset: Vector = Vector.zero): void {
    child?.debugRender(this, offset);
  }
  paintChild(child: RenderView, offset: Vector = Vector.zero): void {
    child?.paintWidthContext(this, offset);
  }
  /**
   * 使用该方法将child矩形矩阵转换
   * @effectiveTransform 矩阵来自偏移矩阵+效果矩阵，原点为(0,0)，这意味着在使用
   * transform 之前需要将原点移动到 @offset 位置，并在变换完毕后将原点移动回来
   */
  pushTransform(offset: Vector, transform: Matrix4, render: VoidFunction) {
    const effectiveTransform = Matrix4.zero
      .identity()
      .translate(offset.x, offset.y)
      .multiply(transform)
      .translate(-offset.x, -offset.y);
    let matrix = effectiveTransform.matrix;
    this.paint.save();
    this.paint.beginPath();
    this.paint.transform(matrix);
    render();
    this.paint.closePath();
    this.paint.restore();
  }
  paintDefaultDebugBoundary(offset: Vector, size: Size) {
    this.paint.strokeStyle = "orange";
    this.paint.strokeRect(offset.x, offset.y, size.width, size.height);
  }
  paintEmptyDebugBoundary(offset: Vector, size: Size) {
    const space = 30;
    const count = ~~(size.width / space);
    for (let i = 0; i < count + 1; i++) {
      this.paint.strokeStyle = "rgba(31, 137, 219,.01)";
      this.paint.moveTo(i * space, offset.y);
      this.paint.lineTo(i * space, offset.y + size.height);
      this.paint.moveTo(offset.x, i * space);
      this.paint.lineTo(offset.x + size.width, i * space);
      this.paint.stroke();
    }
  }
}

export abstract class ContainerRenderViewDelegate<ChildType extends RenderView, ParentDataType extends ContainerRenderViewParentData<ChildType>>
  extends RenderBox {
  protected lastChild: ChildType;
  protected firstChild: ChildType;
  protected childCount: number = 0;
  constructor(children?: ChildType[]) {
    super();
    if (children) {
      this.addAll(children);
    }
  }
  protected defaultHitTestChildren(
    result: HitTestResult,
    position: Vector,
    transform: Matrix4 = Matrix4.zero.identity()
  ): boolean {
    let child = this.lastChild;
    while (child != null) {
      const parentData =
        child.parentData as ParentDataType;
      let transformed = Vector.sub(position, parentData.offset);
      transformed = MatrixUtils.transformPoint(transform, transformed);
      const isHit = child.hitTest(result, transformed);
      if (isHit) {
        return true;
      }
      child = parentData?.previousSibling;
    }
    return false;
  }
  public addAll(value: ChildType[]) {
    value?.forEach((_) => this.insert(_, this.lastChild));
  }
  public insert(renderView: ChildType, after?: ChildType) {
    //设置父节点
    this.adoptChild(renderView);
    //插入兄弟列表
    this.insertIntoList(renderView, after);
    this.childCount += 1;
  }
  remove(child: RenderView) {
    this.removeFromChildList(child);
    this.dropChild(child);
  }
  private removeFromChildList(child: RenderView) {
    const childParentData =
      child.parentData! as ParentDataType;
    if (this.childCount <= 0) return;
    if (childParentData.previousSibling == null) {
      this.firstChild = childParentData.nextSibling;
    } else {
      const childPreviousSiblingParentData = childParentData.previousSibling!
        .parentData! as ParentDataType;
      childPreviousSiblingParentData.nextSibling = childParentData.nextSibling;
    }
    if (childParentData.nextSibling == null) {
      this.lastChild = childParentData.previousSibling;
    } else {
      const childNextSiblingParentData = childParentData.nextSibling!
        .parentData! as ParentDataType;
      childNextSiblingParentData.previousSibling =
        childParentData.previousSibling;
    }
    childParentData.previousSibling = null;
    childParentData.nextSibling = null;
    this.childCount -= 1;
  }
  private insertIntoList(child: ChildType, after?: ChildType) {
    let currentParentData =
      child.parentData as ParentDataType;
    let firstChildParentData = this.firstChild
      ?.parentData as ParentDataType;
    let afterParentData =
      after?.parentData as ParentDataType;
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
  protected parentDataOf(child: RenderView): ParentDataType {
    return child.parentData as ParentDataType;
  }
  visitChildren(visitor: (child: RenderView) => void): void {
    let child = this.firstChild;
    while (child != null) {
      const parentData =
        child.parentData as ParentDataType;
      visitor(child);
      child = parentData?.nextSibling;
    }
  }
}

export abstract class MultiChildRenderView<ChildType extends RenderView = RenderView, ParentDataType extends ContainerRenderViewParentData<ChildType> = ContainerRenderViewParentData<ChildType>>
  extends ContainerRenderViewDelegate<ChildType, ParentDataType> {

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
      const parentData = this.parentDataOf(child);
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
      const parentData = this.parentDataOf(child);
      children.push(child);
      child = parentData?.nextSibling;
    }
    return children;
  }
  protected defaultRenderChild(context: PaintingContext, offset?: Vector) {
    let child = this.firstChild;
    while (child != null) {
      const parentData = this.parentDataOf(child);
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
      const parentData = this.parentDataOf(child);
      context.paintChildDebug(
        child,
        Vector.add(parentData.offset ?? Vector.zero, offset ?? Vector.zero)
      );
      child = parentData?.nextSibling;
    }
  }
  public hitTest(result: HitTestResult, position: Vector): boolean {
    return super.hitTest(result, position)
  }
}
export class FlexRenderView extends MultiChildRenderView<RenderView, ContainerRenderViewParentData<RenderView>> {
  private overflow: number = 0;
  public _direction: Axis = Axis.horizontal;
  public _mainAxisAlignment: MainAxisAlignment = MainAxisAlignment.start;
  public _crossAxisAlignment: CrossAxisAlignment = CrossAxisAlignment.start;
  private _spacing: number = 0;
  constructor(option: Partial<FlexOption & MultiChildRenderViewOption>) {
    const { direction, children, mainAxisAlignment, crossAxisAlignment, spacing } =
      option;
    super(children);
    this.direction = direction;
    this.mainAxisAlignment = mainAxisAlignment;
    this.crossAxisAlignment = crossAxisAlignment;
    this.spacing = spacing ?? 0;
  }
  set direction(value: Axis) {
    if (!value || this._direction === value) return;
    this._direction = value;
    this.markNeedsLayout();
  }
  set mainAxisAlignment(value: MainAxisAlignment) {
    if (!value || this._mainAxisAlignment === value) return;
    this._mainAxisAlignment = value;
    this.markNeedsLayout();
  }
  set crossAxisAlignment(value: CrossAxisAlignment) {
    if (!value || this._crossAxisAlignment === value) return;
    this._crossAxisAlignment = value;
    this.markNeedsLayout();
  }
  set spacing(value: number) {
    if (value == this.spacing) return;
    this._spacing = value;
    this.markNeedsLayout();
  }
  get direction(): Axis {
    return this._direction;
  }
  get mainAxisAlignment(): MainAxisAlignment {
    return this._mainAxisAlignment;
  }
  get crossAxisAlignment(): CrossAxisAlignment {
    return this._crossAxisAlignment;
  }
  get spacing(): number { return this._spacing; }
  performLayout(): void {
    const computeSize: LayoutSizes = this.computeSize(this.constraints);
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
    // 每个子元素之间的间距加上间距
    betweenSpace += this.spacing;
    let child = this.firstChild;
    let childMainPosition: number = leadingSpace,
      childCrossPosition: number = 0;
    let childCount = 0;
    while (child != null) {
      const parentData = child.parentData as ContainerRenderViewParentData;
      childCount += 1;
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
      allocatedSize: number = 0,
      spacing = this.spacing;
    maxMainSize =
      this.direction === Axis.horizontal
        ? constraints.maxWidth
        : constraints.maxHeight;
    //盒子主轴值无限时不能被flex布局
    canFlex = maxMainSize < Infinity;

    let currentChildNdx: number = 0;
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
        // 子盒子间距处理
        // 间距的累加次数应该始终保持为childCount-1，因为最后一个不需要累加间距
        if (currentChildNdx > 0) {
          allocatedSize += spacing;
        }
        crossSize = Math.max(crossSize, this.getCrossSize(childSize));
        currentChildNdx += 1;
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
    const parentData = new FlexParentData();
    parentData.node = child;
    child.parentData = parentData;

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

export class StackRenderView extends MultiChildRenderView {
  private _fit: StackFit = StackFit.loose;
  private _alignment: Alignment = Alignment.topLeft;
  constructor(option: Partial<StackOption & MultiChildRenderViewOption>) {
    const { children, alignment, fit } = option;
    super(children);
    this.alignment = alignment ?? this.alignment;
    this.fit = fit ?? this.fit;
  }
  get alignment(): Alignment {
    return this._alignment;
  }
  set alignment(value: Alignment) {
    if (value === this._alignment) return;
    this._alignment = value;
    this.markNeedsLayout();
  }
  get fit(): StackFit {
    return this._fit;
  }
  set fit(value: StackFit) {
    if (value === this._fit) return;
    this._fit = value;
    this.markNeedsLayout();
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

export class StackParentData extends ContainerRenderViewParentData<RenderView> {
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

export interface ParagraphViewOption {
  text: TextSpan;
}

export class ParagraphView extends SingleChildRenderView {
  private textPainter: TextPainter;
  private _text: TextSpan;
  private needClip: boolean;
  constructor(option?: ParagraphViewOption) {
    super();
    const { text } = option;
    this.text = text;
  }
  set text(text: TextSpan) {
    if (this._text === text) return;
    if (this._text?.text === text?.text) return;

    this._text = text;
    this.markNeedsLayout();
    this.markNeedsPaint();
  }

  get text(): TextSpan {
    return this._text;
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
          context.paintDefaultDebugBoundary(offset, this.size);
        }
      );
    } else {
      this.textPainter.paint(context.paint, offset, true);
    }
    super.debugRender(context, offset);
  }
}

export class RootRenderView extends SingleChildRenderView {
  get isRepaintBoundary(): boolean {
    return true;
  }
  scheduleFirstFrame() {
    this.markNeedsLayout();
    this.markNeedsPaint();
  }
}

export class StatefulRenderView extends SingleChildRenderView {
  get isRepaintBoundary(): boolean {
    return true;
  }
}

export class StatelessRenderView extends SingleChildRenderView {
  get isRepaintBoundary(): boolean {
    return true;
  }
  public markRepaint() {
    this.markNeedsPaint();
  }
}

export class PlaceholderRenderView extends SingleChildRenderView { }

class WrapParentData extends ContainerRenderViewParentData {
  runIndex: number = 0;
}

/**
 * # @WrapRenderView 布局几何数据
 *   - 存储每一行的高度和宽度，以及子元素数量等信息，用于后续的布局计算。
 */
class RunMetrics {
  constructor(
    mainAxisExtent: number,
    crossAxisExtent: number,
    childCount: number
  ) {
    this.mainAxisExtent = mainAxisExtent;
    this.crossAxisExtent = crossAxisExtent;
    this.childCount = childCount;
  }
  mainAxisExtent: number = 0;
  crossAxisExtent: number = 0;
  childCount: number = 0;
}

export class WrapRenderView extends MultiChildRenderView {
  private _direction: Axis = Axis.horizontal;
  private _spacing: number = 0;
  private _runSpacing: number = 0;
  private _alignment: WrapAlignment = WrapAlignment.start;
  private _runAlignment: WrapAlignment = WrapAlignment.start;
  private _crossAxisAlignment: WrapCrossAlignment = WrapCrossAlignment.start;

  constructor(option: Partial<WrapOption>) {
    super();
    this.direction = option?.direction ?? Axis.horizontal;
    this.spacing = option?.spacing ?? 0;
    this.runSpacing = option?.runSpacing ?? 0;
    this.alignment = option?.alignment ?? WrapAlignment.start;
    this.runAlignment = option?.runAlignment ?? WrapAlignment.start;
    this.crossAxisAlignment =
      option?.crossAxisAlignment ?? WrapCrossAlignment.start;
  }

  get direction(): Axis {
    return this._direction;
  }
  set direction(value: Axis) {
    if (this._direction === value) {
      return;
    }
    this._direction = value;
    this.markNeedsLayout();
  }
  get spacing(): number {
    return this._spacing;
  }
  set spacing(value: number) {
    if (this._spacing === value) {
      return;
    }
    this._spacing = value;
    this.markNeedsLayout();
  }
  get runSpacing(): number {
    return this._runSpacing;
  }
  set runSpacing(value: number) {
    if (this._runSpacing === value) {
      return;
    }
    this._runSpacing = value;
    this.markNeedsLayout();
  }
  get alignment(): WrapAlignment {
    return this._alignment;
  }
  set alignment(value: WrapAlignment) {
    if (this._alignment === value) {
      return;
    }
    this._alignment = value;
    this.markNeedsLayout();
  }
  get runAlignment(): WrapAlignment {
    return this._runAlignment;
  }
  set runAlignment(value: WrapAlignment) {
    if (this._runAlignment === value) {
      return;
    }
    this._runAlignment = value;
    this.markNeedsLayout();
  }
  get crossAxisAlignment(): WrapCrossAlignment {
    return this._crossAxisAlignment;
  }
  set crossAxisAlignment(value: WrapCrossAlignment) {
    if (this._crossAxisAlignment === value) {
      return;
    }
    this._crossAxisAlignment = value;
    this.markNeedsLayout();
  }

  private getMainAxisExtent(size: Size): number {
    if (this.direction === Axis.horizontal) {
      return size.width;
    } else if (this.direction === Axis.vertical) {
      return size.height;
    }
  }
  private getOffset(mainAxisOffset: number, crossAxisOffset: number): Vector {
    switch (this.direction) {
      case Axis.horizontal:
        return new Vector(mainAxisOffset, crossAxisOffset);
      case Axis.vertical:
        return new Vector(crossAxisOffset, mainAxisOffset);
    }
  }
  private getCrossAxisExtent(size: Size): number {
    if (this.direction === Axis.horizontal) {
      return size.height;
    } else if (this.direction === Axis.vertical) {
      return size.width;
    }
  }
  private getChildCrossAxisOffset(
    runCrossAxisExtent: number,
    childCrossAxisExtent: number
  ): number {
    const freeSpace: number = runCrossAxisExtent - childCrossAxisExtent;
    switch (this.crossAxisAlignment) {
      case WrapCrossAlignment.start:
        return 0.0;
      case WrapCrossAlignment.end:
        return freeSpace;
      case WrapCrossAlignment.center:
        return freeSpace / 2.0;
    }
  }
  performLayout(): void {
    const constraints = this.constraints;
    let childConstraints: BoxConstraints = BoxConstraints.zero;
    let mainAxisLimit: number = 0;
    switch (this.direction) {
      case Axis.horizontal:
        childConstraints = new BoxConstraints({
          maxWidth: constraints.maxWidth,
        });
        mainAxisLimit = constraints.maxWidth;
        break;
      case Axis.vertical:
        childConstraints = new BoxConstraints({
          maxHeight: constraints.maxHeight,
        });
        mainAxisLimit = constraints.maxHeight;
        break;
    }

    let child: RenderView = this.firstChild;
    /**
     * 存储children的大小，用于计算axis=horizontal时，@mainAxisExtent 记录的是children的宽度之和，
     * 用于计算axis=vertical时，@mainAxisExtent 记录的是children的高度之和。
     * @crossAxisExtent 是 @mainAxisExtent 的交叉方向轴和，即axis=horizontal时，@crossAxisExtent 记录的是children的高度之和。
     */
    let mainAxisExtent: number = 0;
    let crossAxisExtent: number = 0;
    /**
     * 运行时宽度，用于判断是否超出宽度，超出则换行
     * 用于计算axis=horizontal时，@runMainAxisExtent 记录的是当前行的宽度之和，与 @mainAxisExtent 不同的是，@runMainAxisExtent 记录的是当前行宽度之和，在换行
     * 后会被归零，
     */
    let runMainAxisExtent: number = 0;
    let runCrossAxisExtent: number = 0;
    //当前处理main序列索引,每换行后重置为0;每处理一个元素，currentChildNdx+1;
    let currentChildNdx: number = 0;
    /**
     * 对于处理的一个单位（即不同方向时的不同列|行），记录其大小，用于计算每个单元的偏移量，并需要记录每个单元的个数，用于计算每行|列的宽度
     */
    const runMetrics: Array<RunMetrics> = [];
    while (child) {
      child.layout(childConstraints, true);
      const childSize = child.size;
      const childMainAxisExtent = this.getMainAxisExtent(childSize);
      const childCrossAxisExtent = this.getCrossAxisExtent(childSize);
      // 换行处理
      if (
        currentChildNdx > 0 &&
        runMainAxisExtent + childMainAxisExtent + this.spacing > mainAxisLimit
      ) {
        mainAxisExtent += runMainAxisExtent;
        crossAxisExtent += runCrossAxisExtent + this.runSpacing;
        runMetrics.push(
          new RunMetrics(
            runMainAxisExtent,
            runCrossAxisExtent,
            currentChildNdx
          )
        );
        runMainAxisExtent = 0;
        runCrossAxisExtent = 0;
        currentChildNdx = 0;
      }
      runMainAxisExtent += childMainAxisExtent;
      runCrossAxisExtent = Math.max(runCrossAxisExtent, childCrossAxisExtent);
      // 如果不是第一个元素，则需要加上间距
      if (currentChildNdx > 0) {
        runMainAxisExtent += this.spacing;
      }
      currentChildNdx += 1;
      const parentData = child.parentData as WrapParentData;
      parentData.runIndex = runMetrics.length;
      child = parentData.nextSibling;
    }

    //最后一行,如果currentChildNdx不为0，说明最新的一行
    if (currentChildNdx > 0) {
      mainAxisExtent += runMainAxisExtent;
      crossAxisExtent += runCrossAxisExtent;
      runMetrics.push(
        new RunMetrics(
          runMainAxisExtent,
          runCrossAxisExtent,
          currentChildNdx
        )
      );
    }


    let containerMainAxisExtent: number = 0;
    let containerCrossAxisExtent: number = 0;
    if (this.direction === Axis.horizontal) {
      this.size = constraints.constrain(
        new Size(mainAxisExtent, crossAxisExtent)
      );
      containerMainAxisExtent = this.size.width;
      containerCrossAxisExtent = this.size.height;
    } else if (this.direction === Axis.vertical) {
      this.size = constraints.constrain(
        new Size(crossAxisExtent, mainAxisExtent)
      );
      containerMainAxisExtent = this.size.height;
      containerCrossAxisExtent = this.size.width;
    }
    const runLen = runMetrics.length;
    const crossAxisFreeSpace = Math.max(
      0,
      containerCrossAxisExtent - crossAxisExtent
    );

    let runLeading: number = 0;
    let runBetween: number = 0;
    switch (this.runAlignment) {
      case WrapAlignment.start:
        break;
      case WrapAlignment.end:
        runLeading = crossAxisFreeSpace;
        break;
      case WrapAlignment.center:
        runLeading = crossAxisFreeSpace * 0.5;
        break;
      case WrapAlignment.spaceBetween:
        runBetween = crossAxisFreeSpace / (runLen - 1);
        break;
      case WrapAlignment.spaceAround:
        runBetween = crossAxisFreeSpace / runLen;
        runLeading = runBetween * 0.5;
        break;
      case WrapAlignment.spaceEvenly:
        runBetween = crossAxisFreeSpace / (runLen + 1);
        runLeading = runBetween;
        break;
    }
    runBetween += this.runSpacing;
    let crossAxisOffset: number = runLeading;
    child = this.firstChild;
    for (let i = 0; i < runLen; i++) {
      const run: RunMetrics = runMetrics[i];
      const runMainAxisExtent = run.mainAxisExtent;
      const runCrossAxisExtent = run.crossAxisExtent;
      const runChildCount = run.childCount;
      const mainAxisFreeSpace = Math.max(
        0,
        containerMainAxisExtent - runMainAxisExtent
      );
      let runMainLeading: number = 0;
      let runMainBetween: number = 0;
      switch (this.alignment) {
        case WrapAlignment.start:
          break;
        case WrapAlignment.end:
          runMainLeading = mainAxisFreeSpace;
          break;
        case WrapAlignment.center:
          runMainLeading = mainAxisFreeSpace * 0.5;
          break;
        case WrapAlignment.spaceBetween:
          runMainBetween = mainAxisFreeSpace / (runChildCount - 1);
          break;
        case WrapAlignment.spaceAround:
          runMainBetween = mainAxisFreeSpace / runChildCount;
          runMainLeading = runMainBetween * 0.5;
          break;
        case WrapAlignment.spaceEvenly:
          runMainBetween = mainAxisFreeSpace / (runChildCount + 1);
          runMainLeading = runMainBetween;
          break;
      }
      runMainBetween += this.spacing;

      let childMainPosition: number = runMainLeading;
      while (child) {
        const parentData = child.parentData as WrapParentData;
        if (parentData.runIndex !== i) {
          break;
        }
        const childSize = child.size;
        const childMainAxisExtent = this.getMainAxisExtent(childSize);
        const childCrossAxisExtent = this.getCrossAxisExtent(childSize);
        const crossOffset = this.getChildCrossAxisOffset(
          runCrossAxisExtent,
          childCrossAxisExtent
        );
        const offset = this.getOffset(
          childMainPosition,
          crossAxisOffset + crossOffset
        );
        childMainPosition += childMainAxisExtent;
        childMainPosition += runMainBetween;
        parentData.offset = offset;
        child = parentData.nextSibling;
      }
      crossAxisOffset += runCrossAxisExtent + runBetween;
    }
  }
  private applyPerformChild(): Size {
    return Size.zero;
  }
  protected setupParentData(child: RenderView): void {
    child.parentData = new WrapParentData();
  }
}
export type onPointerDownCallback = (event: DownPointerEvent) => void;
export type onPointerMoveCallback = (event: MovePointerEvent) => void;
export type onPointerUpCallback = (event: UpPointerEvent) => void;
export type onPointerCancelCallback = (event: UpPointerEvent) => void;

export interface RenderPointerListenerArguments {
  onPointerDown: onPointerDownCallback;
  onPointerMove: onPointerMoveCallback;
  onPointerUp: onPointerUpCallback;
  onPointerCancel: onPointerCancelCallback;
}

export class RenderPointerListener extends SingleChildRenderView {
  private _onPointerDown: onPointerDownCallback;
  private _onPointerMove: onPointerMoveCallback;
  private _onPointerUp: onPointerUpCallback;
  private _onPointerCancel: onPointerCancelCallback;
  set onPointerDown(value: onPointerDownCallback) {
    this._onPointerDown = value;
  }
  set onPointerMove(value: onPointerMoveCallback) {
    this._onPointerMove = value;
  }
  set onPointerUp(value: onPointerUpCallback) {
    this._onPointerUp = value;
  }
  set onPointerCancel(value: onPointerCancelCallback) {
    this._onPointerCancel = value;
  }

  constructor(
    option: Partial<
      RenderPointerListenerArguments & SingleChildRenderViewArguments
    >
  ) {
    super(option?.child);
    this._onPointerDown = option?.onPointerDown;
    this._onPointerMove = option?.onPointerMove;
    this._onPointerUp = option?.onPointerUp;
    this._onPointerCancel = option?.onPointerCancel;
  }
  handleEvent(event: PointerEvent, entry: HitTestEntry): void {
    if (event instanceof DownPointerEvent) {
      this._onPointerDown?.(event);
    } else if (event instanceof MovePointerEvent) {
      this._onPointerMove?.(event);
    } else if (event instanceof UpPointerEvent) {
      this._onPointerUp?.(event);
    } else if (event instanceof CancelPointerEvent) {
      this._onPointerCancel?.(event);
    }
  }
  public hitTestSelf(result: HitTestResult, position: Vector): boolean {
    return this.hitTestChildren(result, position);
  }
}

export interface RenderTransformArguments {
  transform: Matrix4;
  origin: Vector;
  alignment: Alignment;
}

export class RenderTransformBox extends SingleChildRenderView {
  private _transform: Matrix4 = Matrix4.zero;
  private _origin: Vector;
  private _alignment: Alignment;
  set alignment(value: Alignment) {
    this._alignment = value;
    this.markNeedsPaint();
  }
  get alignment(): Alignment {
    return this._alignment;
  }
  set origin(value: Vector) {
    this._origin = value;
    this.markNeedsPaint();
  }
  get origin(): Vector {
    return this._origin;
  }
  set transform(value: Matrix4) {
    this._transform = value;
    this.markNeedsPaint();
  }
  get transform(): Matrix4 {
    return this._transform;
  }
  constructor(
    option: Partial<RenderTransformArguments & SingleChildRenderViewArguments>
  ) {
    super(option?.child);
    this.transform = option?.transform;
  }

  render(context: PaintingContext, offset?: Vector): void {
    if (this.child) {
      const childOffset = MatrixUtils.getAsTranslation(this.effectiveTransform);
      //检测是否只是平移
      if (childOffset == null || Vector.zero.equals(childOffset)) {
        context.pushTransform(offset, this.effectiveTransform, () => {
          context.paintChild(this.child, offset);
        });
      } else {
        super.render(context, childOffset.add(offset));
      }
    }
  }
  public hitTest(result: HitTestResult, position: Vector): boolean {
    return this.hitTestChildren(result, position);
  }
  /**
   */
  public hitTestChildren(result: HitTestResult, position: Vector): boolean {
    const childParentData = this.child
      ?.parentData as ContainerRenderViewParentData;
    const invertedTransform = this.effectiveTransform.inverted();
    if (childParentData) {
      const transformedPosition = MatrixUtils.transformPoint(
        invertedTransform,
        position
      );
      return this.child.hitTest(result, transformedPosition);
    }
    return false;
  }

  get originTransform(): Matrix4 {
    const result = Matrix4.zero.identity() as Matrix4;
    const alignment = this.alignment;
    const origin = this.origin;
    let translation = Vector.zero;
    if (!origin && !alignment) {
      return result;
    }
    if (origin) {
      result.translate(origin.x, origin.y);
    }
    if (alignment) {
      translation = alignment.alongSize(this.size).toVector();
      result.translate(translation.x, translation.y);
    }
    return result;
  }
  get effectiveTransform(): Matrix4 {
    const result = Matrix4.zero.identity() as Matrix4;
    const transform = Matrix4.zero.setMatrix([
      ...this.transform.matrix,
    ]) as Matrix4;

    const alignment = this.alignment;
    const origin = this.origin;
    let translation = Vector.zero;
    if (!origin && !alignment) {
      return transform;
    }
    if (origin) {
      result.translate(origin.x, origin.y);
    }
    if (alignment) {
      translation = alignment.alongSize(this.size).toVector();
      result.translate(translation.x, translation.y);
    }
    result.multiply(transform);
    if (alignment) {
      result.translate(-translation.x, -translation.y);
    }
    if (origin) {
      result.translate(-origin.x, -origin.y);
    }
    return result;
  }

  applyPaintTransform(child: RenderView, transform: Matrix4): void {
    transform.multiply(this.effectiveTransform);
  }
}

export class BoxDecorationRenderView extends SingleChildRenderView {
  private _decoration: BoxDecoration;
  constructor(decoration: BoxDecoration) {
    super();
    this._decoration = decoration;
  }
  set decoration(value: BoxDecoration) {
    this._decoration = value;
    this.markNeedsPaint();
  }
  get decoration(): BoxDecoration {
    return this._decoration;
  }
  render(context: PaintingContext, offset?: Vector): void {
    const boxPainter = this.decoration?.createBoxPainter(
      this.markNeedsPaint.bind(this)
    );
    if (boxPainter) {
      boxPainter.paint(context.paint, offset, this.size);
    }
    super.render(context, offset);
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    const boxPainter = this.decoration?.createBoxPainter(
      this.markNeedsPaint.bind(this)
    );
    if (boxPainter) {
      boxPainter.debugPaint(context.paint, offset, this.size);
    }
    super.debugRender(context, offset);
  }
}

export class ImageRenderView extends SingleChildRenderView {
  private decoration: ImageDecoration;
  private decorationPainter: ImageDecorationPainter;
  private _width: number;
  private _height: number;
  constructor(args: Partial<ImageDecorationArguments>) {
    super();
    this.decoration = new ImageDecoration(args);
    this.width = args?.width;
    this.height = args?.height;
  }

  set width(value: number) {
    if (value === this._width) return;
    this._width = value;
    this.markNeedsLayout();
  }

  set height(value: number) {
    if (value === this._height) return;
    this._height = value;
    this.markNeedsLayout();
  }

  set imageSource(value: Partial<ImageDecorationArguments>) {
    this.decoration = new ImageDecoration(value);
    this.decorationPainter = this.decoration.createBoxPainter(
      this.markNeedsLayout.bind(this)
    );
    this.markNeedsPaint();
  }
  performLayout(): void {
    // super.performLayout();
    const imageSize = new Size(
      // this.decorationPainter.width,
      // this.decorationPainter.height
      this._width ?? this.decorationPainter.width,
      this._height ?? this.decorationPainter.height,
    );
    this.constraints = BoxConstraints.tightFor(null, null).enforce(
      this.constraints
    );
    this.size =
      this.constraints.constrainSizeAndAttemptToPreserveAspectRatio(imageSize);
    this.decorationPainter.layout(this.size);
  }
  render(context: PaintingContext, offset?: Vector): void {
    this.decorationPainter.paint(context.paint, offset, this.size);
    super.render(context, offset);
  }
  debugRender(context: PaintingContext, offset?: Vector): void {
    this.decorationPainter.debugPaint(context.paint, offset, this.size);
    super.debugRender(context, offset);
  }
}

export interface CustomPaintArguments {
  painter: CustomPainter;
  foregroundPainter: CustomPainter;
}

export class CustomPaintRenderView extends SingleChildRenderView {
  private _painter: CustomPainter;
  private _foregroundPainter: CustomPainter;
  constructor(args: Partial<CustomPaintArguments>) {
    super();
    this._painter = args?.painter;
    this._foregroundPainter = args?.foregroundPainter;
  }
  set painter(value: CustomPainter) {
    this._painter = value;
    this.markNeedsPaint();
  }
  set foregroundPainter(value: CustomPainter) {
    this._foregroundPainter = value;
    this.markNeedsPaint();
  }

  render(context: PaintingContext, offset?: Vector): void {
    if (this._painter) {
      this.renderWidthPainter(context.paint, this._painter, offset);
    }
    super.render(context, offset);
    if (this._foregroundPainter) {
      this.renderWidthPainter(context.paint, this._foregroundPainter, offset);
    }
  }
  private renderWidthPainter(
    paint: Painter,
    painter: CustomPainter,
    offset: Vector = Vector.zero
  ) {
    paint.save();
    paint.translate(offset.x, offset.y);
    painter.render(paint, this.size);
    paint.restore();
  }
}

export interface CustomClipperArguments {
  clipper: CustomClipper;
  clipBehavior: Clip;
}

export abstract class CustomClipperRenderView extends SingleChildRenderView {
  protected clip: Path2D;
  private _clipper?: CustomClipper;
  private _clipBehavior: Clip = Clip.antiAlias;
  private markNeedsRePaintBind: VoidFunction;
  constructor(args: Partial<CustomClipperArguments>) {
    super();
    this.clipper = args?.clipper;
    this._clipBehavior = args?.clipBehavior;
    this.markNeedsRePaintBind = this.markNeedsPaint.bind(this);
  }
  set clipper(value: CustomClipper) {
    this._clipper?.removeListener(this.markNeedsRePaintBind);
    this._clipper = value;
    this._clipper?.addListener(this.markNeedsRePaintBind);
    this.markNeedsPaint();
  }
  get clipBehavior() {
    return this._clipBehavior;
  }
  get defaultPath() {
    return null;
  }
  protected updateClip(offset: Vector) {
    if (!this._clipper) {
      this.clip = this.defaultPath;
    }
    this.clip = this._clipper?.getClip(offset, this.size);
  }
  set clipBehavior(value: Clip) {
    this._clipBehavior = value;
    this.markNeedsPaint();
  }
}

export class ClipPathRenderView extends CustomClipperRenderView {
  get defaultPath(): Path2D {
    const path = new Path2D();
    path.rect(0, 0, this.size.width, this.size.height);
    return path;
  }
  render(context: PaintingContext, offset?: Vector): void {
    if (this.child) {
      this.updateClip(offset);
      const paint = context.paint;
      context.clipPath(
        this.clipBehavior,
        {
          x: offset?.x ?? 0,
          y: offset?.y ?? 0,
          width: this.size.width,
          height: this.size.height,
        },
        this.clip ?? this.defaultPath,
        () => {
          super.render(context, offset);
        }
      );
    }
  }
}
