import Painter from "@/lib/painting/painter";
import Alignment from "@/lib/painting/alignment";
import { Offset, Size } from "@/lib/basic/rect";
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
  ImageSource,
} from "../painting/image";
import { ChangeNotifier } from "../core/change-notifier";
import {
  ColoredRender,
  ContainerRenderViewParentData,
  PaintingContext,
} from "./basic";
import { SliverConstraints, SliverGeometry } from "./slivers";

export class Layer {}
export class OffsetLayer {
  constructor(offset: Vector) {
    this.offset = offset;
  }
  offset: Vector;
}
export class LayerHandler<T extends Layer> {
  layer: T;
}

export class ParentData {}

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
  protected constraints: Constraints;
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
  /**
   * 派生类必须实现该方法才会被正常渲染，并且在渲染child时必须使用 `context.paintChild` 方法渲染child，这是
   * 必须的。
   */
  abstract render(context: PaintingContext, offset?: Vector): void;
  abstract debugRender(context: PaintingContext, offset?: Vector): void;
  //默认大小等于子大小，被子撑开
  abstract layout(constraints: Constraints, parentUseSize?: boolean): void;
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
    if (!this.owner) return;
    if (this.needsRePaint) return;
    const owner: PipelineOwner = this.owner as PipelineOwner;
    this.needsRePaint = true;
    if (this.isRepaintBoundary) {
      owner.pushNeedingPaint(this);
      owner.requestVisualUpdate();
    } else if (this.parent instanceof RenderView) {
      this.parent?.markNeedsPaint();
    }
    /**
     * 通知Child的重绘，@needsRePaint 在此之前已经被赋值true
     * child 在 @markNeedsPaint 时会调用父 @markNeedsPaint ，但是会判断 @needsRePaint 达到阻止循环调用，
     * 持续向下通知
     */
    this.visitChildren((child) => {
      child.markNeedsPaint();
    });
  }
  public markNeedsLayout() {
    if (!this.owner) return;
    if (this.needsReLayout) return;
    const owner: PipelineOwner = this.owner as PipelineOwner;
    this.needsReLayout = true;
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
    if (RendererBinding.instance.debug) {
      this.debugRender(context, offset);
    } else {
      this.render(context, offset);
    }
  }
  abstract performResize(): void;
  abstract computeDryLayout(constrains: BoxConstraints): Size;
  abstract getDryLayout(constrains: BoxConstraints): Size;
  public hitTest(result: HitTestResult, position: Vector): boolean {
    return;
  }
  handleEvent(event: PointerEvent, entry: HitTestEntry): void {}
  /**
   * 获取相对于ancestor的变换矩阵，如果没有指定ancestor则默认相对于root节点。
   * 子节点通过调用该方法获取所有父节点使用的变换矩阵，然后通过将I矩阵变换矩阵计算。
   * @applyPaintTransform 使用方法参考 @RenderTransformBox
   */
  getTransformTo(ancestor?: RenderView): Matrix4 {
    const ancestorSpecified = ancestor !== undefined;
    if (!this.attached) {
      throw new Error("RenderObject is not attached.");
    }

    if (!ancestor) {
      const rootNode = (this.owner as PipelineOwner)?.renderView;
      if (rootNode instanceof RenderView) {
        ancestor = rootNode;
      }
    }

    const renderers: Array<RenderView> = new Array();
    let renderer: RenderView = this;

    while (renderer !== ancestor) {
      renderers.push(renderer);
      if (!renderer.parent) {
        throw new Error("Failed to find ancestor in parent chain.");
      }
      renderer = renderer.parent as RenderView;
    }
    if (ancestorSpecified) {
      renderers.push(ancestor!);
    }
    const transform = new Matrix4().identity();
    for (let index = renderers.length - 1; index > 0; index--) {
      renderers[index].applyPaintTransform(renderers[index - 1], transform);
    }
    return transform;
  }
  localToGlobal(offset:Vector,ancestor?:RenderView){
    return MatrixUtils.transformPoint(this.getTransformTo(ancestor),offset);
  }
  applyPaintTransform(child: RenderView, transform: Matrix4): void {}
}
