import { BuildContext, Element } from "../basic/elements";
import {
  RenderObjectElement,
  RenderObjectWidget,
  Widget,
} from "../basic/framework";
import { RenderBox } from "../render-object/basic";
import { ParentData, RenderView } from "../render-object/render-object";
import {
  RenderSliver,
  SliverConstraints,
  SliverGeometry,
} from "../render-object/slivers";

export class SliverMultiBoxAdaptorParentData extends ParentData {
  public index: number;
  public keepAlive: boolean;
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
  }
  removeChild(child: RenderBox): void {
    throw new Error("Method not implemented.");
  }
  didAdoptChild(child: RenderBox): void {
    throw new Error("Method not implemented.");
  }
  estimateMaxScrollOffset(
    constraints: SliverConstraints,
    firstIndex?: number,
    lastIndex?: number,
    leadingScrollOffset?: number,
    trailingScrollOffset?: number
  ): number {
    throw new Error("Method not implemented.");
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
  insertRenderObjectChild(child: RenderView, slot?: Object): void {
    
  }
}

export class SliverMultiBoxAdaptorWidget extends RenderObjectWidget {
  constructor(private childDelegate: SliverChildDelegate) {
    super();
  }
  createRenderObject(context:BuildContext): RenderView {
    const manager=context as SliverMultiBoxAdaptorElement;
    return new SliverMultiBoxAdaptorRenderView(manager);
  }
  updateRenderObject(
    context: BuildContext,
    renderView: SliverMultiBoxAdaptorRenderView
  ): void {
    // renderView.
  }
  
 
  createElement(): Element {
    return new SliverMultiBoxAdaptorElement(this.childDelegate, this);
  }
}

export class SliverMultiBoxAdaptorRenderView extends RenderSliver {
  protected firstChild: RenderBox;
  protected lastChild: RenderBox;
  constructor(private childManager:RenderSliverBoxChildManager) {
    super();
  }
  protected setupParentData(child: RenderView): void {
    if (child.parentData instanceof SliverMultiBoxAdaptorParentData) {
      return;
    }
    child.parentData = new SliverMultiBoxAdaptorParentData();
  }
  addInitialChild(index: number=0, layoutOffset=0): void {
    this.createOrObtainChild(index, null);
  }
  private createOrObtainChild(index: number, after:RenderBox) {
    this.childManager.createChild(index, after);
  }
  performLayout(): void {
    const constraints = this.constraints.asBoxConstraints();
    console.log("布局", constraints, this.firstChild);
    if(!this.firstChild){
        this.addInitialChild();
    }
    this.geometry = new SliverGeometry({
      scrollExtent: 100,
      paintExtent: 50,
      maxPaintExtent: 100,
      cacheExtent: 50,
    });
  }
}

export class SliverList extends SliverMultiBoxAdaptorWidget {}
