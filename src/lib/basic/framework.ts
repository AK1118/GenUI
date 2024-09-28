import {
  BoxParentData,
  ColoredRender,
  ConstrainedBoxRender,
  MultiChildRenderView,
  ParentDataRenderView,
  RootRenderView,
} from "../render-object/basic";
import { ParentData, RenderView } from "../render-object/render-object";
import { clone } from "../utils/utils";
import { PipelineOwner, RendererBinding } from "./binding";
import { BuildContext, BuildOwner, Element } from "./elements";
import { Key } from "./key";

export abstract class BindingBase {
  constructor() {
    this.initInstance();
  }
  protected initInstance() {}
}

export interface WidgetArguments {
  key: Key;
}
export interface SingleChildRenderObjectWidgetArguments
  extends WidgetArguments {
  child: Widget;
}
export interface MultiChildRenderObjectWidgetArguments extends WidgetArguments {
  children: Array<Widget>;
}
export abstract class Widget {
  public key: Key;
  abstract createElement(): Element;
  get runtimeType(): unknown {
    return this.constructor;
  }
  constructor(key?: Key) {
    if(key&&!(key instanceof Key)){
      throw new Error("key must be instance of Key")
    }
    this.key = key;
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
    super.update(newWidget);
    this.updated(oldWidget);
    this.rebuild(true);
  }
  updated(oldWidget: ProxyWidget) {
    this.notifyClients(oldWidget);
  }
  abstract notifyClients(oldWidget: ProxyWidget);
}

export abstract class ProxyWidget extends Widget {
  constructor(child?: Widget, key?: Key) {
    super(key);
    this.child = child;
  }
  public child: Widget;
}

class StatelessElement extends ComponentElement {
  constructor(widget: Widget, key?: Key) {
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
    const oldWidget = this.widget;
    this.state.didUpdateWidget(oldWidget);
    super.update(newWidget);
    this.rebuild(true);
  }
  build(): Widget {
    return this.state.build(this);
  }
  public unmount(): void {
    super.unmount();
    this.state?.unmount();
  }
}

export abstract class StatefulWidget extends Widget {
  abstract createState(): State;
  createElement(): Element {
    return new StatefulElement(this);
  }
}

export abstract class State<T extends StatefulWidget = StatefulWidget> {
  private _element: Element;
  get widget(): T {
    return this.element?.widget as T;
  }
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
  public unmount() {}
  public didUpdateWidget(oldWidget: Widget) {}
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
    this.renderView = (built as RenderObjectWidget).createRenderObject(this);
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
  /**
   * 查找祖先 @ParentDataElement 节点，且查找过程中不允许出现parent是 @RenderObjectElement
   * 如parent是 @RenderObjectElement 不做出操作，会导致深度子节点都会被执行 @updateParentData 方法
   */
  protected findAncestorParentDataElement(): ParentDataElement {
    let ancestor: Element = this.parent;
    let result: ParentDataElement;
    while (ancestor != null&&!(ancestor instanceof RenderObjectElement)) {
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
  /**
   * 从祖先的 @RenderObjectElement 中移除子节点
   * 并将 @ancestorRenderObjectElement 置为null
   */
  protected detachRenderView(): void {
    if (this.ancestorRenderObjectElement) {
      this.ancestorRenderObjectElement.removeRenderViewChild(
        this.renderView,
        this.slot
      );
      this.ancestorRenderObjectElement = null;
    }
    this.slot = null;
  }
  protected removeRenderViewChild(child: RenderView, slot?: Object): void {}
  /**
   * 这个方法 updateChildren 的目的是将一组旧的元素数组（oldChildren）与新的小部件数组（newWidgets）进行比较，
   * 并更新旧的元素以生成一个新的元素数组（newChildren），从而反映新小部件的变化。
   * 这个方法通过从底部到顶部和从顶部到底部的方式进行差异检测和更新。
   */
  updateChildren(
    oldChildren: Array<Element>,
    newWidgets: Array<Widget>
  ): Array<Element> {
    /**
     * bottom [0,1,2,3,4,5,6,7,8,9,...] top   old
     * bottom [0,1,2,3] top  new
     * 即后来居上
     */
    let oldChildrenTop = 0; // 旧元素数组的顶部指针
    let oldChildrenBottom = oldChildren.length - 1; // 旧元素数组的底部指针
    let newChildrenTop = 0; // 新小部件数组的顶部指针
    let newChildrenBottom = newWidgets.length - 1; // 新小部件数组的底部指针
    const newChildren: Array<Element> = new Array(newWidgets.length).fill(null); // 初始化新的元素数组，长度为新小部件数组的长度，初始填充为空

    let previousChild: Element | null = null; // 用于存储前一个更新的元素，以便在更新下一个元素时使用

    /**
     * bottom -> top
     * 从数组底部开始向上diff，如果相同位置的 @oldChild 不为空，且 @oldChild.widget 与 @newWidget 相同，则直接使用并更新
     * 如不满足其中条件跳出循环
     */
    while (
      oldChildrenTop <= oldChildrenBottom &&
      newChildrenTop <= newChildrenBottom
    ) {
      let oldChild = oldChildren[oldChildrenTop]; // 获取旧数组顶部的元素
      const newWidget = newWidgets[newChildrenTop]; // 获取新数组顶部的小部件
      if (oldChild == null && !this.canUpdate(oldChild?.widget, newWidget)) {
        break; // 如果旧元素为空且不能更新，跳出循环
      }

      const newChild = this.updateChild(oldChild, newWidget, previousChild); // 更新旧元素
      newChildren[newChildrenTop] = newChild; // 将更新后的元素放入新的数组中
      previousChild = newChild; // 更新previousChild为当前的newChild
      newChildrenTop += 1; // 新数组顶部指针向上移动
      oldChildrenTop += 1; // 旧数组顶部指针向上移动
    }

    // Update the bottom of the list
    // 从数组顶部开始向下diff，逻辑同上
    while (
      oldChildrenTop <= oldChildrenBottom &&
      newChildrenTop <= newChildrenBottom
    ) {
      let oldChild = oldChildren[oldChildrenBottom]; // 获取旧数组底部的元素
      const newWidget = newWidgets[newChildrenBottom]; // 获取新数组底部的小部件

      if (oldChild == null && !this.canUpdate(oldChild?.widget, newWidget)) {
        break; // 如果旧元素为空且不能更新，跳出循环
      }

      const newChild = this.updateChild(oldChild, newWidget, previousChild); // 更新旧元素
      newChildren[newChildrenBottom] = newChild; // 将更新后的元素放入新的数组中
      previousChild = newChild; // 更新previousChild为当前的newChild
      newChildrenBottom -= 1; // 新数组底部指针向下移动
      oldChildrenBottom -= 1; // 旧数组底部指针向下移动
    }

    // Handle the remaining middle part
    // 处理中间剩余部分的新小部件
    while (newChildrenTop <= newChildrenBottom) {
      const newWidget = newWidgets[newChildrenTop]; // 获取新数组顶部的小部件
      const newChild = this.updateChild(null, newWidget, previousChild); // 创建新的元素
      newChildren[newChildrenTop] = newChild; // 将新的元素放入新的数组中
      previousChild = newChild; // 更新previousChild为当前的newChild
      newChildrenTop += 1; // 新数组顶部指针向上移动
    }
    return newChildren; // 返回新的元素数组
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
  protected removeRenderViewChild(child: RenderView, slot?: Object): void {
    if (this.renderView.child === child) {
      this.renderView.child = null;
      child.parent = null;
    }
  }
}

export abstract class RenderObjectWidget extends Widget {
  public child: Widget;
  constructor(child?: Widget, key?: Key) {
    super(key);
    this.child = child;
  }
  abstract createRenderObject(context?:BuildContext): RenderView;
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
  protected removeRenderViewChild(child: RenderView, slot?: Object): void {
    if (child.parent === this.renderView) {
      (this.renderView as MultiChildRenderView).remove(child);
    }
  }
}

export abstract class MultiChildRenderObjectWidget extends RenderObjectWidget {
  public children: Array<Widget>;
  constructor(children: Array<Widget>, key?: Key) {
    super(null, key);
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
    this.renderView = (built as RenderObjectWidget).createRenderObject(this);
    const pipOwner: PipelineOwner = RendererBinding.instance.pipelineOwner;
    this.renderView.attach(pipOwner);
    pipOwner.attachNode(this.renderView);
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
  /**
   * 使用子节点的 @updateParentData 方法通过 @widget 更新 @parentData 属性,
   * 此处的 @widget 属性是 @ParentDataWidget 的子类，例如 @Positioned 、 @Expanded 等。
   *
   * @updateParentData 方法是 @RenderObjectElement 独有的方法，所以需要判断类型满足时才能直接调用，
   * 如条件不满足时，即 child 为其他类型，则需要调用超类 @Element 的 @visitChildren 方法，通过向下查找子节点
   * 遍历叶子节点，调用 @updateParentData 方法。
   *
   */
  applyParentData(widget: ParentDataWidget<T>): void {
    const applyParentDataToChild = (child: Element) => {
      if (child instanceof RenderObjectElement) {
        child.updateParentData(widget);
      } else {
        child.visitChildren(applyParentDataToChild);
      }
    };
    this.visitChildren(applyParentDataToChild);
  }
  notifyClients(oldWidget: ProxyWidget) {
    this.applyParentData(this.widget as ParentDataWidget<T>);
  }
}

export abstract class ParentDataWidget<
  T extends ParentData = ParentData
> extends ProxyWidget {
  public createElement(): Element {
    return new ParentDataElement<T>(this);
  }
  /**
   * 更新 @parentData 属性，由于需要更新的是 @parentData 属性，传入 @child 是一个普通的 @RenderView 对象，
   * 即所有 @RenderView 的派生类都有可能被传入，且它们都已经实现了 @createRenderView 方法。
   * 详见 @RenderView 的 @parentData 属性
   */
  abstract applyParentData(child: ParentDataRenderView<T>): void;
}
