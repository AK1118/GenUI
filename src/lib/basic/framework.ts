import {
  BoxParentData,
  ColoredRender,
  ConstrainedBoxRender,
  MultiChildRenderView,
  ParentData,
  ParentDataRenderView,
  RenderView,
  RootRenderView,
} from "../render-object/basic";
import { PipelineOwner, RendererBinding } from "./binding";
import { BuildContext, BuildOwner, Element } from "./elements";

abstract class Key {}
export interface SingleChildRenderObjectWidgetOption {
  child: Widget;
}
export interface MultiChildRenderObjectWidgetOption {
  children: Array<Widget>;
}
export abstract class Widget {
  public key: string = Math.random().toString(16).substring(3);
  abstract createElement(): Element;
  get runtimeType(): unknown {
    return this.constructor;
  }
}

/**
 * abstract class ComponentElement
 * 属于组件节点类，其派生类有StatelessElement 和 State、StatefulElement等，它的widget主要通过ComponentWidget类的build函数来获得
 * 返回的Widget组件，且build函数需要派生类自己实现，见StatelessElement例如用户自己构建UI一般就需要用到该类
 */
export abstract class ComponentElement extends Element {
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.firstBuild();
  }
  protected performRebuild(): void {
    this._performRebuild();
  }
  private _performRebuild(): void {
    const built = this.build();
    super.performRebuild();
    this.child = this.updateChild(this.child, built, this.slot);
  }
  abstract build(): Widget;
}

export abstract class ProxyElement extends ComponentElement {
  update(newWidget: Widget): void {
    const oldWidget = { ...this.widget } as ProxyWidget;
    if (this.widget?.key === newWidget?.key) return;
    super.update(newWidget);
    if (this.widget.key !== newWidget?.key) return;
    this.updated(oldWidget);
    this.rebuild(true);
  }
  updated(oldWidget: ProxyWidget) {
    this.notifyClients(oldWidget);
  }
  abstract notifyClients(oldWidget: ProxyWidget);
}

export abstract class ProxyWidget extends Widget {
  constructor(child?: Widget) {
    super();
    this.child = child;
  }
  public child: Widget;
}

class StatelessElement extends ComponentElement {
  constructor(widget: Widget) {
    super(widget);
  }
  update(newWidget: Widget): void {
    super.update(newWidget);
    this.rebuild(true);
  }
  public build(): Widget {
    return (this.widget as StatelessWidget).build(this);
  }
}

export abstract class StatelessWidget extends Widget {
  createElement(): Element {
    return new StatelessElement(this);
  }
  abstract build(context: BuildContext): Widget;
}

class StatefulElement extends ComponentElement {
  constructor(widget: StatefulWidget) {
    super(widget);
    this.state = widget.createState();
    this.state.element = this;
  }
  private state: State;
  protected firstBuild(): void {
    this.state.initState();
    super.firstBuild();
  }
  update(newWidget: Widget): void {
    super.update(newWidget);
    this.rebuild(true);
  }
  build(): Widget {
    return this.state.build(this);
  }
}

export abstract class StatefulWidget extends Widget {
  abstract createState(): State;
  createElement(): Element {
    return new StatefulElement(this);
  }
}

export abstract class State {
  private _element: Element;
  get element(): Element {
    return this._element;
  }
  set element(element: Element) {
    this._element = element;
  }
  public initState(): void {}
  protected setState(fn: VoidFunction): void {
    fn();
    this.element.markNeedsBuild();
  }
  abstract build(context: BuildContext): Widget;
}

/**
 *  与ComponentElement不同，该类需要返回一个RenderView提供渲染，它是基础渲染单位类
 * 在构建时需要将Widget的build方法返回的RenderView赋值给child
 *
 */
export abstract class RenderObjectElement extends Element {
  private ancestorRenderObjectElement: RenderObjectElement;
  set renderView(value: RenderView) {
    this._renderView = value;
  }
  get renderView(): RenderView {
    return this._renderView;
  }
  public findRenderObject(): RenderView {
    return this.renderView;
  }
  /**
  * 挂载时将 @renderView 创建并保存，且 @renderView 只能被创建一次
    更新时只需要根据 @RenderObjectWidget 的派生类实现方法 @updateRenderObject 更新@renderView 属性
  * @param parent 
  * @param newSlot 
  */
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    const built = this.widget;
    this.renderView = (built as RenderObjectWidget).createRenderObject();
    this.attachRenderObject(newSlot);
  }
  update(newWidget: Widget): void {
    super.update(newWidget);
    this._performRebuild();
  }
  protected performRebuild(): void {
    this._performRebuild();
  }
  private _performRebuild(): void {
    const built = this.widget;
    (built as RenderObjectWidget).updateRenderObject(this, this.renderView);
    super.performRebuild();
  }
  protected findAncestorParentDataElement(): ParentDataElement {
    let ancestor: Element = this.parent;
    let result: ParentDataElement;
    while (ancestor != null) {
      if (ancestor instanceof ParentDataElement) {
        result = ancestor;
        break;
      }
      ancestor = ancestor.parent;
    }
    return result;
  }
  protected findAncestorRenderObjectElement(): RenderObjectElement {
    let ancestor: Element = this.parent;
    while (ancestor != null) {
      if (ancestor instanceof RenderObjectElement) {
        return ancestor as RenderObjectElement;
      }
      ancestor = ancestor.parent;
    }
    return ancestor as RenderObjectElement;
  }
  abstract insertRenderObjectChild(child: RenderView, slot?: Object): void;
  /**
   * 查找祖最近的先的 @RenderObjectElement 并插入子节点 @renderView
   * 在 @Element 树中并不是全部都由 @RenderObjectElement 构成，所以需要查找最近的 @RenderObjectElement
   * 以便生成RenderView渲染树
   */
  protected attachRenderObject(newSlot?: Object): void {
    if (this.ancestorRenderObjectElement) return;
    this.ancestorRenderObjectElement = this.findAncestorRenderObjectElement();
    this.ancestorRenderObjectElement?.insertRenderObjectChild(
      this.renderView,
      newSlot
    );
    const parentDataElement = this.findAncestorParentDataElement();
    if (parentDataElement) {
      this.updateParentData(parentDataElement.widget as ParentDataWidget);
    }
  }
  public updateParentData(parentDataWidget: ParentDataWidget): void {
    parentDataWidget.applyParentData(this.renderView as ParentDataRenderView);
  }
  visitChildren(visitor: (child: Element) => void): void {
    visitor(this.child);
  }
  updateChildren(
    oldChildren: Array<Element>,
    newWidgets: Array<Widget>
  ): Array<Element> {
    let oldChildrenTop = 0;
    let oldChildrenBottom = oldChildren.length - 1;
    let newChildrenTop = 0;
    let newChildrenBottom = newWidgets.length - 1;
    const newChildren: Array<Element> = new Array(newWidgets.length).fill(null);

    let previousChild: Element | null = null;

    // Update the top of the list
    while (
      oldChildrenTop <= oldChildrenBottom &&
      newChildrenTop <= newChildrenBottom
    ) {
      let oldChild = oldChildren[oldChildrenTop];
      const newWidget = newWidgets[newChildrenTop];

      if (oldChild == null || !this.canUpdate(oldChild.widget, newWidget)) {
        break;
      }

      const newChild = this.updateChild(oldChild, newWidget, previousChild);
      newChildren[newChildrenTop] = newChild;
      previousChild = newChild;
      newChildrenTop += 1;
      oldChildrenTop += 1;
    }

    // Update the bottom of the list
    while (
      oldChildrenTop <= oldChildrenBottom &&
      newChildrenTop <= newChildrenBottom
    ) {
      let oldChild = oldChildren[oldChildrenBottom];
      const newWidget = newWidgets[newChildrenBottom];

      if (oldChild == null || !this.canUpdate(oldChild.widget, newWidget)) {
        break;
      }

      const newChild = this.updateChild(oldChild, newWidget, previousChild);
      newChildren[newChildrenBottom] = newChild;
      previousChild = newChild;
      newChildrenBottom -= 1;
      oldChildrenBottom -= 1;
    }

    // Handle the remaining middle part
    while (newChildrenTop <= newChildrenBottom) {
      const newWidget = newWidgets[newChildrenTop];
      const newChild = this.updateChild(null, newWidget, previousChild);
      newChildren[newChildrenTop] = newChild;
      previousChild = newChild;
      newChildrenTop += 1;
    }
    return newChildren;
  }
}

export class SingleChildRenderObjectElement extends RenderObjectElement {
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.firstBuild();
  }

  protected performRebuild(): void {
    this.child = this.updateChild(
      this.child,
      (this.widget as SingleChildRenderObjectWidget).child
    );
    super.performRebuild();
  }
  update(newWidget: Widget): void {
    super.update(newWidget);
    this.child = this.updateChild(
      this.child,
      (this.widget as SingleChildRenderObjectWidget).child
    );
  }
  insertRenderObjectChild(child: RenderView, slot?: Object): void {
    this.renderView.child = child;
  }
}

export abstract class RenderObjectWidget extends Widget {
  public child: Widget;
  constructor(child?: Widget, key?: Key) {
    super();
    this.child = child;
  }
  abstract createRenderObject(): RenderView;
  abstract updateRenderObject(
    context: BuildContext,
    renderView: RenderView
  ): void;
}

export abstract class SingleChildRenderObjectWidget extends RenderObjectWidget {
  createElement(): Element {
    return new SingleChildRenderObjectElement(this);
  }
}

/**
 * SinleChildRenderObjectElement 的insert为undefined，为什么
 */
export class MultiChildRenderObjectElement extends RenderObjectElement {
  private children: Array<Element>;
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);

    const widgetChildren: Array<Widget> = (
      this.widget as MultiChildRenderObjectWidget
    ).children;
    if (!widgetChildren) return;
    let previousChild: Element;
    const children: Array<Element> = new Array<Element>();
    if (widgetChildren.length === 4) {
      this.depth = 2;
    }
    widgetChildren.forEach((child, ndx) => {
      const newChild = this.updateChild(null, child, previousChild);
      if (newChild != null) {
        children.push(newChild);
      }
      previousChild = newChild;
    });
    this.children = children;
  }
  update(newWidget: Widget): void {
    super.update(newWidget);
    const widget: MultiChildRenderObjectWidget = this
      .widget as MultiChildRenderObjectWidget;
    this.children = this.updateChildren(this.children, widget.children);
  }
  visitChildren(visitor: (child: Element) => void): void {
    this.children.forEach(visitor);
  }
  insertRenderObjectChild(child: RenderView, slot?: Object): void {
    (this.renderView as MultiChildRenderView).insert(
      child,
      (slot as RenderObjectElement)?.renderView
    );
  }
}

export abstract class MultiChildRenderObjectWidget extends RenderObjectWidget {
  public children: Array<Widget>;
  constructor(children: Array<Widget>) {
    super();
    this.children = children;
  }
  createElement(): Element {
    return new MultiChildRenderObjectElement(this);
  }
}

export class RootRenderObjectElement extends SingleChildRenderObjectElement {
  public assignOwner(owner: BuildOwner) {
    this.owner = owner;
  }
  public mount(parent?: Element, newSlot?: Object): void {
    const built = this.widget;
    this.renderView = (built as RenderObjectWidget).createRenderObject();
    const pipOwner: PipelineOwner = RendererBinding.instance.pipelineOwner;
    this.renderView.attach(pipOwner);
    this.attachRenderObject(newSlot);
    this.firstBuild();
  }
  attachToRenderTree(owner: BuildOwner) {
    if (!this.owner) {
      this.assignOwner(owner);
      this.mount();
      // this.renderView.layout(null, false);
      // this.root.reassemble();
      (this.renderView as RootRenderView).scheduleFirstFrame();
      this.owner.buildScope(this);
    } else {
      this.markNeedsBuild();
    }
  }
}
/**
 * 带有数据(ParentData)的节点基类，例如 @Expanded 、 @Positioned 等。
 * 该节点不会在树中生成一个元素，而是将数据传递给子节点，且它派生自 @ComponentElement
 * 故不会生成 @RenderView 对象，反而是将子节点的 @RenderView 加入节点的ParentData数据。
 *
 * @parentData 是每一个 @RenderView 都有的一个属性,在一般情况下初始化为 @ParentData 实例，
 * 如父节点重写了 @setupParentData 方法，则子节点的 @parentData 属性会被创建为父节点指定的 @ParentData 的派生类 @ContainerRenderViewParentData ，详见
 * /render-object/basic.ts RenderView.setupParentData。
 *
 * @parentData 的初始化数据赋值一般发生在 @ParentDataWidget 类的 @applyParentData 方法中，该方法是初始化 @parentData 的方法，也是更新 @parentData 的方法,
 * 初始化调用时机参见 @RenderObjectElement @attachRenderObject 。
 * 更新调用时机参见 @ProxyElement @update 。
 *
 */
export class ParentDataElement<
  T extends ParentData = ParentData
> extends ProxyElement {
  build(): Widget {
    return (this.widget as RenderObjectWidget).child;
  }
  applyParentData(widget: ParentDataWidget): void {
    const applyParentDataToChild = (child: Element) => {
      if (child instanceof RenderObjectElement) {
        child.updateParentData(widget);
      } else if (child instanceof ParentDataElement) {
        child.visitChildren(applyParentDataToChild);
      }
    };
    this.visitChildren(applyParentDataToChild);
  }
  notifyClients(oldWidget: ProxyWidget) {
    this.applyParentData(this.widget as ParentDataWidget);
  }
}

export abstract class ParentDataWidget<
  T extends ParentData = ParentData
> extends ProxyWidget {
  public createElement(): Element {
    return new ParentDataElement<T>(this);
  }
  abstract applyParentData(child: ParentDataRenderView<T>): void;
}
