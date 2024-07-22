import { PlaceholderRenderView, RenderView } from "@/lib/render-object/basic";
import { Size } from "./rect";
import { RenderObjectElement, Widget } from "./framework";
import { ElementBinding, SchedulerBinding } from "./binding";

export class BuildOwner {
  private dirtyElementList: Array<Element> = [];
  public scheduleBuildFor(dirtyElement: Element) {
    if (dirtyElement.lifecycle === ElementLifecycle.active) {
      this.dirtyElementList.push(dirtyElement);
      SchedulerBinding.instance.ensureVisualUpdate();
    }
  }
  public buildScope(context: BuildContext) {
    this.dirtyElementList.sort(Element.sort);
    let index: number = 0;
    const count = this.dirtyElementList.length;

    while (index < count) {
      const element: Element = this.dirtyElementList[index];
      if (element) {
        element.rebuild();
      }
      index += 1;
    }
    this.dirtyElementList = [];
  }
}

export abstract class BuildContext {
  abstract get mounted(): boolean;
  // abstract get view(): RenderView;
  get size(): Size {
    return null;
  }
  public findRenderView(): RenderView {
    return null;
  }
}
// ELEMENTS

enum ElementLifecycle {
  //元素的初始状态。此状态表示元素刚刚被创建，尚未激活或参与任何活动。
  initial,
  //元素处于活动状态，可以正常运行和响应各种事件或操作。
  active,
  //元素处于非活动状态，可能由于暂时不需要而被暂停。
  inactive,
  //元素已失效，不再使用。此状态表示元素已经完成了其生命周期，应该被清理或销毁。
  defunct,
}
type ChildVisitorCallback = (child: Element) => void;
export abstract class Element extends BuildContext {
  public key: string = Math.random().toString(16).substring(3);
  public lifecycle: ElementLifecycle = ElementLifecycle.initial;
  public dirty: boolean = true;
  public parent: Element;
  protected child: Element = null;
  private _widget: Widget;
  public owner: BuildOwner;
  protected depth: number = 0;
  private _slot: Object;
  public _renderView: RenderView;
  set renderView(value: RenderView) {
    this._renderView = value;
  }
  public findRenderView(): RenderView {
    return this.renderView;
  }
  /**
   * 当组件生成 @RenderView 时,可能会出现子级为@ComponentElement ,此时需要
   * 向下查找将最近的 @RenderViewElement 作为@renderView
   */
  get renderView(): RenderView {
    let current: Element = this;
    while (current) {
      if (current?._renderView) {
        return current._renderView;
      } else {
        current.visitChildren((child) => {
          current = child;
        });
      }
    }
    return null;
  }
  constructor(widget?: Widget) {
    super();
    this._widget = widget;
    ElementBinding.incrementElementCount();
  }
  set slot(value: Object) {
    this._slot = value;
  }
  get slot(): Object {
    return this._slot;
  }
  get widget(): Widget {
    return this._widget;
  }
  get runtimeType(): unknown {
    return this.constructor;
  }
  get mounted(): boolean {
    return this.widget !== null;
  }
  public mount(parent?: Element, newSlot?: Object): void {
    if (!parent) return;
    this.parent = parent;
    this.owner = parent?.owner;
    this.depth = parent?.depth + 1;
    this.slot = newSlot;
    this.lifecycle = ElementLifecycle.active;
    this.markNeedsBuild();
  }
  public static sort(a: Element, b: Element) {
    return a.depth - b.depth;
  }
  protected canUpdate(oldWidget: Widget, newWidget: Widget) {
    return newWidget?.runtimeType === oldWidget?.runtimeType;
  }
  // abstract updateRenderView():void;
  /**
   * 如果新child不为空，老child为空，直接赋值新child
   * 如果新child和老child的类型相同，不赋值新的child，改参数重新传递
   * 判断新来的child和本次的是不是同类型
   * 如果已经有了，old child是 ColoredBox->ConstrainedBox，而new child也是ColoredBox->ConstrainedBox ,就将new child的参数传递给 old child 的数据，
   * 那子呢？继续调用oldChild.updateChild,并将newChild传递下去
   *
   */
  protected updateChild(
    child?: Element,
    newWidget?: Widget,
    newSlot?: Object
  ): Element {
    if (!child && !newWidget) return null;
    let newChild: Element = child;
    if (!child && newWidget) {
      const built = newWidget;
      if (!built) return newChild;
      newChild = built.createElement();
      newChild.mount(this, newSlot);
      return newChild;
    }
    if (this.canUpdate(child.widget, newWidget)) {
      child.update(newWidget);
      return child;
    }
    return newChild;
  }
  public markNeedsBuild() {
    if (this.dirty) return;
    this.dirty = true;
    this?.owner.scheduleBuildFor(this);
  }
  /**
   * 根据dirty状态，决定是否需要重新构建
   * 也可通过force参数强制重新构建，默认情况下force为false
   * @param force
   * @returns
   */
  public rebuild(force: boolean = false) {
    if (!this.dirty && !force) return;
    this.performRebuild();
  }
  protected performRebuild() {
    if (!this.dirty) return;
    this.dirty = false;
  }
  protected firstBuild() {
    this.rebuild();
  }
  setTestWidget(newWidget: Widget) {
    this._widget = newWidget;
  }
  update(newWidget: Widget) {
    this._widget = newWidget;
  }
  reassemble() {
    this.markNeedsBuild();
    this.visitChildren((child) => {
      if (child) {
        child.reassemble();
      }
    });
  }
  protected attachRenderObject(newSlot?: Object): void {
    this.visitChildren((child) => {
      child.attachRenderObject(newSlot);
    });
  }
  visitChildren(visitor: ChildVisitorCallback) {
    visitor(this.child);
  }
}

abstract class View extends Element {}

export abstract class RootElement extends Element {
  // private renderView: RenderView;
  private root: Element;
  public assignOwner(owner: BuildOwner) {
    this.owner = owner;
  }
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.firstBuild();
  }
  update(newWidget: Widget): void {
    this._performBuild();
  }
  private _performBuild() {
    this.root = this.widget.createElement();
    this.root.mount(this);
    this.renderView = (this.root as RenderObjectElement).findRenderObject();
  }
  protected performRebuild(): void {
    this._performBuild();
  }
  attachToRenderTree(owner: BuildOwner) {
    if (!this.owner) {
      this.assignOwner(owner);
      this.mount();
      this.renderView.layout(null, false);
      this.owner.buildScope(this);
    } else {
      this.markNeedsBuild();
    }
  }
}
