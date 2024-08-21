import Painter from "@/lib/painting/painter";
import Alignment from "@/lib/painting/alignment";
import { Size } from "@/lib/basic/rect";
import { BoxConstraints } from "@/lib/rendering/constraints";
import Vector from "@/lib/math/vector";
import { TextOverflow, TextPainter, TextSpan } from "../text-painter";
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

export enum Clip {
  none = "none",
  //使用硬边裁剪
  hardEdge = "hardEdge",
  //使用抗锯齿裁剪
  antiAlias = "antiAlias",
}
export enum Axis {
  horizontal = "horizontal",
  vertical = "vertical",
}
export enum MainAxisAlignment {
  start = "start",
  end = "end",
  center = "center",
  spaceBetween = "spaceBetween",
  spaceAround = "spaceAround",
  spaceEvenly = "spaceEvenly",
}

export enum CrossAxisAlignment {
  start = "start",
  end = "end",
  center = "center",
  stretch = "stretch",
  baseline = "baseline",
}

export enum StackFit {
  /**
   * 这表示 Stack 组件会放宽传递给它的约束。换句话说，非定位子组件可以根据自己的需要在 Stack 区域内自由调整大小。举个例子，如果 Stack 的约束要求它的大小是 350x600，那么非定位子组件可以在宽度和高度上都在 0 到 350 和 0 到 600 的范围内调整
   */
  loose = "loose",
  /**
   * 这表示 Stack 组件会将传递给它的约束放大到允许的最大尺寸。举个例子，如果 Stack 的约束是宽度在 10 到 100 的范围内，高度在 0 到 600 的范围内，那么非定位子组件都会被调整为 100 像素宽和 600 像素高。
   */
  expand = "expand",
  /**
   * 这表示 Stack 组件会将从父组件传递给它的约束不加修改地传递给非定位子组件。举个例子，如果一个 Stack 作为 Row 的 Expanded 子组件，那么水平约束会是紧密的，而垂直约束会是松散的。
   */
  passthrough = "passthrough",
}

export enum TextDirection {
  /// The text flows from right to left (e.g. Arabic, Hebrew).
  rtl = "rtl",
  /// The text flows from left to right (e.g., English, French).
  ltr = "ltr",
}
export enum WrapAlignment {
  start = "start",
  end = "end",
  center = "center",
  spaceBetween = "spaceBetween",
  spaceAround = "spaceAround",
  spaceEvenly = "spaceEvenly",
}
export enum WrapCrossAlignment {
  start = "start",
  end = "end",
  center = "center",
}

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

export interface ClipRectArguments {}

export interface ClipRRectArguments extends ClipRectArguments {
  borderRadius: Radius;
}

export interface FlexOption {
  direction: Axis;
  mainAxisAlignment: MainAxisAlignment;
  crossAxisAlignment: CrossAxisAlignment;
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

class Layer {}
class OffsetLayer {
  constructor(offset: Vector) {
    this.offset = offset;
  }
  offset: Vector;
}
class LayerHandler<T extends Layer> {
  layer: T;
}

// 存储父节点的某些数据
export class ParentData {}

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
  constructor() {
    super();
  }
  flex: number;
}

export abstract class AbstractNode {
  public key: string = Math.random().toString(16).substring(3);
  private _owner: Object;
  private _parent: AbstractNode;
  private _depth: number = 0;
  get owner() {
    return this._owner;
  }
  get parent() {
    return this._parent;
  }
  set parent(value: AbstractNode) {
    this._parent = value;
  }
  get depth(): number {
    return this._depth;
  }
  set depth(value: number) {
    this._depth = value;
  }
  protected reDepthChild(child: AbstractNode) {
    if (!child) return;
    child.depth = this.depth + 1;
    child?.reDepthChildren?.();
  }
  protected reDepthChildren() {}
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
    this.reDepthChild(child);
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
type ChildVisitorCallback = (child: RenderView) => void;
//原子渲染对象，可以有层级渲染，没有renderbox，依赖于context传输的大小来渲染
export abstract class RenderView extends AbstractNode implements HitTestTarget {
  public layerHandler: LayerHandler<OffsetLayer>;
  private _child?: RenderView;
  private _firstChild?: RenderView;
  /**
   * 定义渲染伴随数据，即父节点数据，用于 @ParentDataElement 使用，被作为 @ParentDataElement 的 子节点时
   * 会被定义类型，默认类型为 @ParentData ，在不同常见会被父节点的 @setupParentData 赋予不同的类型,达到自定义效果。
   * 例如在 @Stack 内会被 @StackParentData 赋值，在 @Flex 内会被 @FlexParentData 赋值。
   */
  public parentData: ParentData = null;
  public _size: Size = Size.zero;
  public needsRePaint: boolean = false;
  public needsReLayout: boolean = false;
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
  get isRepaintBoundary(): boolean {
    return false;
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
    this._firstChild = this._child;
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
  public markNeedsPaint() {
    //console.log("被调用标记渲染", this);
    if (!this.owner) return;
    if (this.needsRePaint) return;
    const owner: PipelineOwner = this.owner as PipelineOwner;
    this.needsRePaint = true;
    if (this.isRepaintBoundary) {
      owner.pushNeedingPaint(this);
      owner.requestVisualUpdate();
      //console.log("边界", this);
    } else if (this.parent instanceof RenderView) {
      //console.log("标记父", this);
      this.parent?.markNeedsPaint();
    }
  }
  public markNeedsLayout() {
    if (!this.owner) return;
    if (this.needsReLayout) return;
    const owner: PipelineOwner = this.owner as PipelineOwner;
    this.needsReLayout = true;
    // owner.pushNeedingLayout(this);
    if (this.isRepaintBoundary) {
      owner.pushNeedingLayout(this);
      owner?.requestVisualUpdate();
    } else if (this.parent instanceof RenderView) {
      this.parent.markNeedsLayout();
    } else {
      owner.pushNeedingLayout(this);
    }
  }
  public layoutWithoutResize() {
    this.performResize();
    // this.performResize();
    this.needsReLayout = false;
    this.markNeedsPaint();
  }
  public reassemble() {
    this.markNeedsLayout();
    this.markNeedsPaint();
    this.visitChildren((child) => {
      if (child) {
        child.reassemble();
      }
    });
  }
  visitChildren(visitor: ChildVisitorCallback) {
    let child = this._firstChild;
    while (child) {
      const parentData =
        child?.parentData as ContainerRenderViewParentData<RenderView>;
      visitor(child);
      child = parentData?.nextSibling;
    }
  }
  paintWidthContext(context: PaintingContext, offset?: Vector): void {
    if (!this.needsRePaint) return;
    this.needsRePaint = false;
    this.render(context, offset);
    if (RendererBinding.instance.debug) {
      this.debugRender(context, offset);
    }
  }
  abstract performResize(): void;
  abstract computeDryLayout(constrains: BoxConstraints): Size;
  abstract getDryLayout(constrains: BoxConstraints): Size;
  public hitTest(result: HitTestResult, position: Vector): boolean {
    return;
  }
  handleEvent(event: PointerEvent, entry: HitTestEntry): void {}
}

export abstract class RenderBox extends RenderView {
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
    return this.defaultHitTestChildren(result, position);
  }
  public hitTestSelf(result: HitTestResult, position: Vector): boolean {
    return this.size.contains(position);
  }
  protected defaultHitTestChildren(
    result: HitTestResult,
    position: Vector
  ): boolean {
    let child = this.child;
    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      const transformed = Vector.sub(position, parentData.offset);
      const isHit = child.hitTest(result, transformed);
      if (isHit) {
        return true;
        // result.add(new HitTestEntry(child));
      }
      child = parentData?.nextSibling;
    }
    return false;
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
  performLayout(): void {}
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
    const parentData: BoxParentData = this.child?.parentData as BoxParentData;
    if (offset && parentData) {
      offset.add(parentData.offset);
    }
    context.paintChildDebug(this.child!, offset);
  }
  render(context: PaintingContext, offset?: Vector) {
    if (this.child) {
      const parentData: BoxParentData = this.child?.parentData as BoxParentData;
      let resultOffset = Vector.zero;
      if (offset && parentData) {
        resultOffset = Vector.add(offset, parentData.offset);
      }
      context.paintChild(this.child!, resultOffset);
    }
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
  public _color: string;

  constructor(color?: string, child?: RenderBox) {
    super(child);
    this.color = color;
  }
  set color(color: string) {
    if (!color || this._color === color) return;
    this._color = color;
    this.markNeedsPaint();
  }
  get color(): string {
    return this._color;
  }
  performLayout(): void {
    super.performLayout();
    this.child?.layout(this.constraints.loosen());
    if (!this.child) {
      this.size = Size.zero;
    }
    this.size = this.child.size;
  }
  performResize(): void {
    this.size = this.child?.getDryLayout(this.constraints);
  }
  render(context: PaintingContext, offset?: Vector): void {
    const paint = context.paint;
    paint.save();
    paint.beginPath();
    paint.fillStyle = this.color;
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
  //宽高不能各自都拥有标记，由于单次标记限制会导致某一方失效
  // public setSize(width: number = this.width, height: number = this.height) {
  //   this.width = width;
  //   this.height = height;
  //   this.performUpdateAdditional(width, height);
  // }
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
      return  this.child.size;
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
    this.markNeedsPaint();
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

export interface SizedBoxOption{
  width:number,
  height:number
}

export class ClipRRectRenderView extends ClipRectRenderView {
  private _borderRadius: Radius;
  constructor(
    option: Partial<
      SizedBoxOption & ClipRRectArguments & SingleChildRenderViewArguments
    >
  ) {
    const { borderRadius } = option;
    super(option);
    this.borderRadius = borderRadius;
  }
  get borderRadius(): Radius {
    return this._borderRadius;
  }
  set borderRadius(borderRadius: Radius) {
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
        radii: this.borderRadius,
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

export abstract class MultiChildRenderView extends RenderBox {
  protected lastChild: RenderView;
  protected firstChild: RenderView;
  protected childCount: number = 0;
  constructor(children?: RenderView[]) {
    super();
    if (children) {
      this.addAll(children);
    }
  }
  protected defaultHitTestChildren(
    result: HitTestResult,
    position: Vector
  ): boolean {
    let child = this.lastChild;
    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      const transformed = Vector.sub(position, parentData.offset);
      const isHit = child.hitTest(result, transformed);
      if (isHit) {
        return true;
        // result.add(new HitTestEntry(child));
      }
      child = parentData?.previousSibling;
    }
    return false;
  }
  public addAll(value: RenderView[]) {
    value?.forEach((_) => this.insert(_, this.lastChild));
  }
  public insert(renderView: RenderView, after?: RenderView) {
    //设置父节点
    this.adoptChild(renderView);
    //插入兄弟列表
    this.insertIntoList(renderView, after);
    this.childCount += 1;
    // if (renderView instanceof ParentDataRenderView) {
    //   renderView?.applyParentData(renderView);
    // }
  }
  remove(child: RenderView) {
    this.removeFromChildList(child);
    this.dropChild(child);
  }
  private removeFromChildList(child: RenderView) {
    const childParentData =
      child.parentData! as ContainerRenderViewParentData<RenderView>;
    if (this.childCount <= 0) return;
    if (childParentData.previousSibling == null) {
      this.firstChild = childParentData.nextSibling;
    } else {
      const childPreviousSiblingParentData = childParentData.previousSibling!
        .parentData! as ContainerRenderViewParentData<RenderView>;
      childPreviousSiblingParentData.nextSibling = childParentData.nextSibling;
    }
    if (childParentData.nextSibling == null) {
      this.lastChild = childParentData.previousSibling;
    } else {
      const childNextSiblingParentData = childParentData.nextSibling!
        .parentData! as ContainerRenderViewParentData<RenderView>;
      childNextSiblingParentData.previousSibling =
        childParentData.previousSibling;
    }
    childParentData.previousSibling = null;
    childParentData.nextSibling = null;
    this.childCount -= 1;
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
export class FlexRenderView extends MultiChildRenderView {
  private overflow: number = 0;
  public _direction: Axis = Axis.horizontal;
  public _mainAxisAlignment: MainAxisAlignment = MainAxisAlignment.start;
  public _crossAxisAlignment: CrossAxisAlignment = CrossAxisAlignment.start;
  constructor(option: Partial<FlexOption & MultiChildRenderViewOption>) {
    const { direction, children, mainAxisAlignment, crossAxisAlignment } =
      option;
    super(children);
    this.direction = direction;
    this.mainAxisAlignment = mainAxisAlignment;
    this.crossAxisAlignment = crossAxisAlignment;
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
  get direction(): Axis {
    return this._direction;
  }
  get mainAxisAlignment(): MainAxisAlignment {
    return this._mainAxisAlignment;
  }
  get crossAxisAlignment(): CrossAxisAlignment {
    return this._crossAxisAlignment;
  }
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

    let child = this.firstChild;
    let childMainPosition: number = leadingSpace,
      childCrossPosition: number = 0;
    let childCount = 0;
    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
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

export class PlaceholderRenderView extends SingleChildRenderView {}

class WrapParentData extends ContainerRenderViewParentData {
  runIndex: number = 0;
}

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
    //当前处理main
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
      if (
        currentChildNdx > 0 &&
        runMainAxisExtent + childMainAxisExtent + this.spacing > mainAxisLimit
      ) {
        mainAxisExtent += runMainAxisExtent;
        crossAxisExtent += runCrossAxisExtent + this.runSpacing;
        runMetrics.push(
          new RunMetrics(
            runMainAxisExtent,
            runCrossAxisExtent + this.runSpacing,
            currentChildNdx
          )
        );
        runMainAxisExtent = 0;
        runCrossAxisExtent = 0;
        currentChildNdx = 0;
      }
      runMainAxisExtent += childMainAxisExtent;
      runCrossAxisExtent = Math.max(runCrossAxisExtent, childCrossAxisExtent);
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
      crossAxisExtent += runCrossAxisExtent + this.runSpacing;
      runMetrics.push(
        new RunMetrics(
          runMainAxisExtent,
          runCrossAxisExtent + this.runSpacing,
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
    // console.log(transformedPosition);
    const childParentData = this.child
      ?.parentData as ContainerRenderViewParentData;
    const invertedTransform = this.effectiveTransform.inverted();
    if (childParentData) {
      const transformedPosition = MatrixUtils.transformPoint(
        invertedTransform,
        position
      );
      return this.child.hitTest(result, transformedPosition); //this.child.size.contains(transformedPosition);
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
