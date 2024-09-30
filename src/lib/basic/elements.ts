import { PlaceholderRenderView } from "@/lib/render-object/basic";
import { Size } from "./rect";
import { RenderObjectElement, Widget } from "./framework";
import { ElementBinding, SchedulerBinding } from "./binding";
import { GlobalKey, Key } from "./key";
import { RenderView } from "../render-object/render-object";

export class InactiveElement {
  private _elements: Set<Element> = new Set();
  get elements(): Set<Element> {
    return this._elements;
  }
  count(): number {
    return this.elements.size;
  }
  /**
   * 在帧构建完成后，清空所有未被重复使用的节点，该方法只能在 @ElementBinding.drawFrame 调用。
   */
  clear() {
    this.elements.forEach((element) => {
      if (element.lifecycleState !== ElementLifecycle.inactive) return;
      this.unmount(element);
    });
    this.elements.clear();
  }
  remove(child: Element) {
    this.elements.delete(child);
  }
  private performDeactivate(element: Element) {
    if (element.lifecycleState !== ElementLifecycle.inactive) return;
    element.visitChildren((child) => {
      this.performDeactivate(child);
    });
    element.deactivate();
  }
  add(child: Element) {
    if (child.lifecycleState !== ElementLifecycle.active) return;
    if (this.including(child)) return;
    this.performDeactivate(child);
    this.elements.add(child);
  }
  including(child: Element): boolean {
    return this.elements.has(child);
  }
  private unmount(element: Element) {
    if (!element) return;
    element.unmount();
  }
}

export class BuildOwner {
  private dirtyElementList: Array<Element> = [];
  public readonly inactiveElements: InactiveElement = new InactiveElement();
  public scheduleBuildFor(dirtyElement: Element) {
    if (dirtyElement.lifecycleState === ElementLifecycle.active) {
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
  private globalKeys: Map<GlobalKey, Element> = new Map();
  public registerGlobalKey(key: GlobalKey, element: Element) {
    if (this.globalKeys.has(key)) return;
    this.globalKeys.set(key, element);
  }
  public getElementByGlobalKey(key: GlobalKey): Element {
    return this.globalKeys.get(key);
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
  initial = "initial",
  //元素处于活动状态，可以正常运行和响应各种事件或操作。
  active = "active",
  //元素暂时从树中分离，但可能会重新连接到树
  inactive = "inactive",
  //元素已失效，不再使用。此状态表示元素已经完成了其生命周期，应该被清理或销毁。
  defunct = "defunct",
}
type ChildVisitorCallback = (child: Element) => void;
export abstract class Element extends BuildContext {
  public key: Key;
  public lifecycleState: ElementLifecycle = ElementLifecycle.initial;
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
  set widget(value: Widget) {
    this._widget = value;
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
    this.lifecycleState = ElementLifecycle.active;
    const key = this.widget?.key;
    if (key instanceof GlobalKey) {
      this.owner?.registerGlobalKey(key, this);
    }
    this.markNeedsBuild();
  }
  /**
   * @MustCallSuper
   */
  public unmount() {
    if (this.lifecycleState === ElementLifecycle.defunct) return;
    this.lifecycleState = ElementLifecycle.defunct;
    this.widget = null;
    this.renderView = null;
    this.visitChildren(child=>{
      if(!child)return;
      child.unmount();
    });
    ElementBinding.decrementElementCount();
  }
  public static sort(a: Element, b: Element) {
    return a.depth - b.depth;
  }
  protected canUpdate(oldWidget: Widget, newWidget: Widget) {
    return (
      newWidget?.runtimeType === oldWidget?.runtimeType &&
      newWidget?.key === oldWidget?.key
    );
  }
  protected detachRenderView() {
    this.visitChildren((child: Element) => {
      child?.detachRenderView();
    });
    this.slot = null;
  }
  public deactivate() {
    this.lifecycleState = ElementLifecycle.inactive;
  }
  protected deactivateChild(child: Element) {
    child.parent = null;
    child.detachRenderView();
    this.owner.inactiveElements.add(child);
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
    //新对象没有子节点，移除旧子节点
    if (child && !newWidget) {
      this.deactivateChild(child);
      return null;
    }
    let newChild: Element = child;
    if (!child && newWidget) {
      newChild = this.inflateWidget(newWidget, newSlot);
      return newChild;
    }
    if (this.canUpdate(child.widget, newWidget)) {
      child.update(newWidget);
      return child;
    } else {
      this.deactivateChild(child);
    }
    return newChild;
  }
  /**
   * 通过 @newWidget 获取最新的 @Element 并返回, @newSlot 对于 @SingleChildObjectElement 永远为null,
   * 它不需要像 @MultiChildObjectElement 一样通过 @newSlot 传递给子节点并插入 children list。
   *
   * 在获取最新的 @Element 之前，还需要判断 @newWidget 的key 是否为空，如果为空，则直接创建新的 @Element
   * 如果不为空，且类型为 @GlobalKey 类型，则通过 @GlobalKey 获取旧的 @Element 并重复使用，当然这个旧的 @Element
   * 的状态必须是 @ElementLifecycle.inactive 。
   */
  protected inflateWidget(newWidget: Widget, newSlot?: Object): Element {
    let newChild: Element;
    const built = newWidget;
    if (!built) return newChild;
    const key = built?.key;
    if (key instanceof GlobalKey) {
      newChild = this.retakeInactiveElement(key, newWidget);
      if (newChild) {
        newChild.activeWithParent(this, newSlot);
        const updateChild = this.updateChild(newChild, newWidget, newSlot);
        return updateChild;
      }
    }
    newChild = built.createElement();
    newChild.mount(this, newSlot);
    return newChild;
  }
  private retakeInactiveElement(key: GlobalKey, newWidget: Widget): Element {
    const element = key.currentElement;
    if (!element) return;
    if (!this.canUpdate(element.widget, newWidget)) return;
    this.owner.inactiveElements.remove(element);
    return element;
  }
  private activeWithParent(parent: Element, newSlot?: Object) {
    this.parent = parent;
    this.updateDepth(parent?.depth);
    this.activeRecursively(this);
    this.attachRenderObject(newSlot);
  }
  protected activeRecursively(element: Element) {
    if (element.lifecycleState !== ElementLifecycle.inactive) return;
    element.activate();
    this.visitChildren((child) => {
      this.activeRecursively(child);
    });
  }
  protected activate() {
    this.lifecycleState = ElementLifecycle.active;
    this.markNeedsBuild();
  }
  protected updateDepth(parentDepth: number) {
    const expectedDepth = parentDepth + 1;
    if (this.depth < expectedDepth) {
      this.depth = expectedDepth;
      this.visitChildren((child: Element) => {
        child?.updateDepth(expectedDepth);
      });
    }
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
    if(this.child){
      visitor(this.child);
    }
  }
}

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
