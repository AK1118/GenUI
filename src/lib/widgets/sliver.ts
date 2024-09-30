import { BuildContext, Element } from "../basic/elements";
import {
  RenderObjectElement,
  RenderObjectWidget,
  Widget,
} from "../basic/framework";
import { Axis, AxisDirection } from "../core/base-types";
import { HitTestResult } from "../gesture/hit_test";
import Vector from "../math/vector";
import {
  ContainerRenderViewDelegate,
  ContainerRenderViewParentData,
  PaintingContext,
  RenderBox,
} from "../render-object/basic";
import {
  AbstractNode,
  ParentData,
  RenderView,
} from "../render-object/render-object";
import {
  RenderSliver,
  SliverConstraints,
  SliverGeometry,
} from "../render-object/slivers";
import { BoxConstraints } from "../rendering/constraints";

export class SliverMultiBoxAdaptorParentData<
  ChildType extends RenderView
> extends ContainerRenderViewParentData<ChildType> {
  public index: number;
  public keepAlive: boolean;
  public layoutOffset: number;
}

export abstract class RenderSliverBoxChildManager {
  abstract createChild(index: number, after?: RenderBox);
  abstract removeChild(child: RenderBox): void;
  abstract didAdoptChild(child: RenderBox): void;
  abstract estimateMaxScrollOffset(
    constraints: SliverConstraints,
    firstIndex?: number,
    lastIndex?: number,
    leadingScrollOffset?: number,
    trailingScrollOffset?: number
  ): number;
  abstract didStartLayout(): void;
  abstract didFinishLayout(): void;
  abstract get childCount(): number;
  abstract setDidUnderflow(value: boolean): void;
}

export abstract class SliverChildDelegate {
  abstract build(context: BuildContext, index: number): Widget;
}

type SliverChildBuilderDelegateBuilder = (
  context: BuildContext,
  index: number
) => Widget;

interface SliverChildBuilderDelegateArguments {
  builder: SliverChildBuilderDelegateBuilder;
  childCount?: number | null;
}

export class SliverChildBuilderDelegate extends SliverChildDelegate {
  private builder: SliverChildBuilderDelegateBuilder;
  private childCount?: number | null;
  constructor(args: Partial<SliverChildBuilderDelegateArguments>) {
    super();
    this.builder = args?.builder;
    this.childCount = args?.childCount;
  }
  build(context: BuildContext, index: number): Widget {
    return this.builder(context, index);
  }
}

export class SliverMultiBoxAdaptorElement
  extends RenderObjectElement
  implements RenderSliverBoxChildManager
{
  private childElement: Map<number, Element> = new Map();
  private currentlyUpdatingChildIndex: number = 0;
  private currentBeforeChild: RenderBox;
  constructor(private childDelegate: SliverChildDelegate, widget: Widget) {
    super(widget);
  }
  createChild(index: number, after?: RenderBox): void {
    const built = this.childDelegate.build(this, index);
    const oldChildElement = this.childElement.get(index);
    this.currentlyUpdatingChildIndex = index;
    const newChild = this.updateChild(oldChildElement, built, index);
    if (newChild != null) {
      this.childElement.set(index, newChild);
    } else {
      this.childElement.delete(index);
    }
    this.currentBeforeChild = newChild.renderView as RenderBox;
  }
  removeChild(child: RenderBox): void {
    const index=this.renderObject.indexOf(child);
    const element=this.childElement.get(index);
    element.unmount();
    this.childElement.delete(index);
    this.currentlyUpdatingChildIndex=index;
    this.currentBeforeChild= this.renderObject.parentDataOf(this.currentBeforeChild).previousSibling;
  }
  didAdoptChild(child: RenderBox): void {
    const parentData =
      child.parentData as SliverMultiBoxAdaptorParentData<RenderBox>;
    parentData.index = this.currentlyUpdatingChildIndex;
  }
  estimateMaxScrollOffset(
    constraints: SliverConstraints,
    firstIndex?: number,
    lastIndex?: number,
    leadingScrollOffset?: number,
    trailingScrollOffset?: number
  ): number {
    return Infinity;
  }
  didStartLayout(): void {
    throw new Error("Method not implemented.");
  }
  didFinishLayout(): void {
    throw new Error("Method not implemented.");
  }
  get childCount(): number {
    throw new Error("Method not implemented.");
  }
  setDidUnderflow(value: boolean): void {
    throw new Error("Method not implemented.");
  }
  get renderObject(): SliverMultiBoxAdaptorRenderView {
    return super.renderView as SliverMultiBoxAdaptorRenderView;
  }
  insertRenderObjectChild(child: RenderBox, slot?: Object): void {
    this.renderObject.insert(child, this.currentBeforeChild);
  }
  protected performRebuild(): void {
    super.performRebuild();
  }
}

export class SliverMultiBoxAdaptorWidget extends RenderObjectWidget {
  protected childDelegate: SliverChildDelegate;
  constructor(childDelegate: SliverChildDelegate) {
    super();
    this.childDelegate = childDelegate;
  }
  createRenderObject(context: BuildContext): RenderView {
    const manager = context as SliverMultiBoxAdaptorElement;
    return new SliverMultiBoxAdaptorRenderView(manager);
  }

  updateRenderObject(
    context: BuildContext,
    renderView: SliverMultiBoxAdaptorRenderView
  ): void {}

  createElement(): Element {
    return new SliverMultiBoxAdaptorElement(this.childDelegate, this);
  }
}

type ChildType = RenderBox;
type ParentDataType = SliverMultiBoxAdaptorParentData<ChildType>;
export class SliverMultiBoxAdaptorRenderView extends RenderSliver {
  constructor(protected childManager: RenderSliverBoxChildManager) {
    super();
  }
  protected lastChild: ChildType;
  protected firstChild: ChildType;
  protected childCount: number = 0;
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
  protected adoptChild(child: AbstractNode): void {
    super.adoptChild(child);
    this.childManager.didAdoptChild(child as ChildType);
  }
  remove(child: RenderView) {
    this.removeFromChildList(child);
    this.dropChild(child);
  }
  private removeFromChildList(child: RenderView) {
    if(!child)return;
    const childParentData = child.parentData! as ParentDataType;
    if (!childParentData) return;
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
    let currentParentData = child.parentData as ParentDataType;
    let firstChildParentData = this.firstChild?.parentData as ParentDataType;
    let afterParentData = after?.parentData as ParentDataType;
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
  public parentDataOf(child: RenderView): ParentDataType {
    return child.parentData as ParentDataType;
  }
  visitChildren(visitor: (child: RenderView) => void): void {
    let child = this.firstChild;
    while (child != null) {
      const parentData = child.parentData as ParentDataType;
      visitor(child);
      child = parentData?.nextSibling;
    }
  }

  protected setupParentData(child: RenderView): void {
    if (child.parentData instanceof SliverMultiBoxAdaptorParentData) {
      return;
    }
    child.parentData = new SliverMultiBoxAdaptorParentData();
  }
  addInitialChild(index: number = 0, layoutOffset = 0): void {
    this.createOrObtainChild(index, null);
  }
  private createOrObtainChild(index: number, after: RenderBox) {
    this.childManager.createChild(index, after);
  }
  childAfter(child: ChildType): ChildType {
    const childParentData = child.parentData! as ParentDataType;
    return childParentData.nextSibling;
  }
  public indexOf(child: RenderBox): number {
    if (!child) return 0;
    return this.parentDataOf(child).index;
  }
  protected insertAndLayoutChild(
    childConstraints: BoxConstraints,
    after: RenderBox,
    parentUseSize: boolean = false
  ): RenderBox {
    if (!after) return;
    const index = this.indexOf(after) + 1;
    this.createOrObtainChild(index, after);
    const child = this.childAfter(after);
    if (child && this.indexOf(child) == index) {
      child.layout(childConstraints, parentUseSize);
    }
    return child;
  }
  protected paintExtentOf(child: RenderBox): number {
    switch (this.constraints.axis) {
      case Axis.horizontal:
        return child.size.width;
      case Axis.vertical:
        return child.size.height;
    }
  }
  renderChildren(context: PaintingContext, offset?: Vector): void {
    if (!this.firstChild) return;
    let mainAxisUint: Vector, crossAxisUint: Vector, originOffset: Vector;
    let addExtent: boolean = false;
    const scrollOffset = this.constraints.scrollOffset;

    switch (this.constraints.axisDirection) {
      case AxisDirection.up:
        mainAxisUint = new Vector(0, 1);
        crossAxisUint = new Vector(1, 0);
        originOffset = new Vector(0, this.constraints.scrollOffset).add(offset);
        addExtent = true;
        break;
      case AxisDirection.down:
        mainAxisUint = new Vector(0, 1);
        crossAxisUint = new Vector(1, 0);
        addExtent = false;
        originOffset = offset.copy();
        break;
      case AxisDirection.left:
        mainAxisUint = new Vector(-1, 0);
        crossAxisUint = new Vector(0, 1);
        originOffset = new Vector(this.constraints.scrollOffset, 0).add(offset);
        addExtent = true;
        break;
      case AxisDirection.right:
        mainAxisUint = new Vector(1, 0);
        crossAxisUint = new Vector(0, 1);
        originOffset = offset;
        addExtent = false;
        break;
    }
    this.visitChildren((child: RenderBox) => {
      const mainAxisDelta = this.childScrollOffset(child) - scrollOffset;
      const crossAxisDelta = 0;
      const childOffset = new Vector(
        originOffset.x +
          mainAxisUint.x * mainAxisDelta +
          crossAxisUint.x * crossAxisDelta,
        originOffset.y +
          mainAxisUint.y * mainAxisDelta +
          crossAxisUint.y * crossAxisDelta
      );
      if (addExtent) {
        childOffset.x += mainAxisUint.x * this.paintExtentOf(child);
        childOffset.y += mainAxisUint.y * this.paintExtentOf(child);
      }
      if (
        mainAxisDelta < this.constraints.remainingPaintExtent &&
        mainAxisDelta + this.paintExtentOf(child) > 0
      ) {
        context.paintChild(child, childOffset);
      }
    });
  }
  render(context: PaintingContext, offset?: Vector): void {
    super.render(context, offset);
    this.renderChildren(context, offset);
  }
  protected childScrollOffset(child: RenderBox): number {
    const parentData = this.parentDataOf(child);
    return parentData.layoutOffset;
  }
  /**
   * 回收不需要的child
   * @leadingGarbage 回收的leadingChild数量,即可视窗口上方的child(AxisDirection.down举例)，leadingGarbage为0表示不回收
   * @trailingGarbage 回收的trailingChild数量,即可视窗口下方的child,直至数据链末尾
   */
  protected garbageCollect(
    leadingGarbage: number,
    trailingGarbage: number
  ): void {
    while (trailingGarbage) {
      this.destroyChild(this.lastChild);
      trailingGarbage -= 1;
    }
  }
  private destroyChild(child: RenderBox) {
    this.childManager.removeChild(child);
    this.remove(child);
  }
}

export class SliverListRenderView extends SliverMultiBoxAdaptorRenderView {
  performLayout(): void {
    const scrollOffset = this.constraints.scrollOffset;
    const remainingPaintExtent = this.constraints.remainingPaintExtent;
    const targetEndScrollOffset = scrollOffset + remainingPaintExtent;
    const constraints = this.constraints.asBoxConstraints();

    if (!this.firstChild) {
      this.addInitialChild();
    }

    let leadingChildWithLayout: RenderBox, trailingChildWithLayout: RenderBox;
    let earliestUsefulChild: RenderBox = this.firstChild;

    if (scrollOffset === 0) {
      earliestUsefulChild.layout(constraints, true);
      const parentData = this.parentDataOf(earliestUsefulChild);
      parentData.layoutOffset = 0;
      earliestUsefulChild.parentData = parentData;
      leadingChildWithLayout = earliestUsefulChild;
      trailingChildWithLayout = earliestUsefulChild;
    }

    let child = earliestUsefulChild;
    let endScrollOffset: number =
      this.paintExtentOf(earliestUsefulChild) +
      this.childScrollOffset(earliestUsefulChild);

    let index = this.indexOf(earliestUsefulChild);
    while (endScrollOffset < targetEndScrollOffset) {
      index += 1;
      //子链还没形成，需要插入新的child生成子链
      child = this.childAfter(child);
      if (!child && index !== this.indexOf(this.firstChild)) {
        child = this.insertAndLayoutChild(
          constraints,
          trailingChildWithLayout,
          true
        );
      }else{
        // console.log(index,"有",child)
      }
      if (!child) break;
      trailingChildWithLayout = child;
      const parentData = this.parentDataOf(child);
      parentData.layoutOffset = endScrollOffset;
      child.parentData = parentData;
      endScrollOffset =
        this.childScrollOffset(child) + this.paintExtentOf(child);
    }

    let trailingGarbage = 0;
    if(child){
      child=this.childAfter(child);
      while (child != null) {
        child = this.childAfter(child);
        trailingGarbage += 1;
      }
    }

    this.garbageCollect(0, trailingGarbage );

    let estimatedMaxScrollOffset = 0;
    estimatedMaxScrollOffset = this.childManager.estimateMaxScrollOffset(
      this.constraints,
      this.indexOf(this.firstChild),
      this.indexOf(this.lastChild),
      this.childScrollOffset(this.firstChild),
      endScrollOffset
    );
    this.geometry = new SliverGeometry({
      scrollExtent: estimatedMaxScrollOffset,
      paintExtent: endScrollOffset - this.childScrollOffset(this.firstChild),
      maxPaintExtent: estimatedMaxScrollOffset,
      cacheExtent: 50,
    });
  }
}

export class SliverList extends SliverMultiBoxAdaptorWidget {
  constructor(childDelegate: SliverChildDelegate) {
    super(childDelegate);
  }
  createRenderObject(context: BuildContext): RenderView {
    const manager = context as SliverMultiBoxAdaptorElement;
    return new SliverListRenderView(manager);
  }
}
