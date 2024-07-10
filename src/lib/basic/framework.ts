import {
  ColoredRender,
  ConstrainedBoxRender,
  RenderView,
  RootRenderView,
} from "../render-object/basic";
import { BuildContext, Element } from "./elements";

abstract class Key {}

export abstract class Widget {
  public key: string = Math.random().toString(16).substring(3);
  abstract createElement(): Element;
}

/**
 * abstract class ComponentElement
 * 属于组件节点类，其派生类有StatelessElement 和 State、StatefulElement等，它的widget主要通过ComponentWidget类的build函数来获得
 * 返回的Widget组件，且build函数需要派生类自己实现，见StatelessElement例如用户自己构建UI一般就需要用到该类
 */
abstract class ComponentElement extends Element {
  private aa: Widget;
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.firstBuild();
  }
  protected performRebuild(): void {
    this._performRebuild();
  }
  update(newWidget: Widget): void {
    super.update(newWidget);
    this._performRebuild();
  }
  private _performRebuild(): void {
    const built = this.build();
    this.child = this.updateChild(this.child, built);
    super.performRebuild();
  }
  abstract build(): Widget;
}

class StatelessElement extends ComponentElement {
  constructor(widget: Widget) {
    super(widget);
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
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
  }
  protected firstBuild(): void {
    this.state.initState();
    super.firstBuild();
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
  protected renderView: RenderView;
  public findRenderObject(): RenderView {
    return this.renderView;
  }
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    const built = this.widget;
    this.renderView = (built as RenderObjectWidget).createRenderObject();
    this.attachRenderObject(newSlot);
    super.performRebuild();
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
  protected attachRenderObject(newSlot?: Object): void {
    if (this.ancestorRenderObjectElement) return;
    this.ancestorRenderObjectElement = this.findAncestorRenderObjectElement();
    this.ancestorRenderObjectElement?.insertRenderObjectChild(
      this.renderView,
      newSlot
    );
  }
  visitChildren(visitor: (child: Element) => void): void {
      visitor(this.child);
  }
}

class SingleChildRenderObjectElement extends RenderObjectElement {
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.firstBuild();
  }

  protected performRebuild(): void {
    console.log("构建");
    this.child = this.updateChild(
      this.child,
      (this.widget as SingleChildRenderObjectWidget).child
    );
    super.performRebuild();
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
