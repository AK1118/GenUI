import {
  ColoredRender,
  ConstrainedBoxRender,
  RenderView,
  RootRenderView,
} from "./basic";
import { PipelineOwner, RendererBinding } from "./binding";
import { BuildContext, ConstrainedBox, Element } from "./elements";

abstract class Key {}

export abstract class Widget {
  abstract createElement(): Element;
}

/**
 * abstract class ComponentElement
 * 属于组件节点类，其派生类有StatelessElement 和 State、StatefulElement等，它的widget主要通过ComponentWidget类的build函数来获得
 * 返回的Widget组件，且build函数需要派生类自己实现，见StatelessElement例如用户自己构建UI一般就需要用到该类
 */
abstract class ComponentElement extends Element {
  constructor(widget: Widget) {
    super(widget);
  }
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
  }
  protected performRebuild(): void {
    super.performRebuild();
    const built = this.build();
    this.child = this.updateChild(this.child, built);
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

abstract class StatelessWidget extends Widget {
  createElement(): Element {
    return new StatelessElement(this);
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
  update(newElement: Element): void {
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
}

class SingleChildRenderObjectElement extends RenderObjectElement {
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.child = this.updateChild(
      this.child,
      (this.widget as SingleChildRenderObjectWidget).child
    );
  }
  insertRenderObjectChild(child: RenderView, slot?: Object): void {
    console.log(this.renderView, "插入", child);
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

export class ColoredBox extends SingleChildRenderObjectWidget {
  private color: string;
  constructor(color: string, child?: Widget) {
    super(child);
    this.color = color;
  }
  createRenderObject(): RenderView {
    return new ColoredRender(this.color);
  }
  updateRenderObject(context: BuildContext, renderView: RenderView) {
    (renderView as ColoredRender).color = this.color;
  }
}

export class SizeBox extends SingleChildRenderObjectWidget {
  private width: number;
  private height: number;
  constructor(width?: number, height?: number, child?: Widget) {
    super(child);
    this.width = width;
    this.height = height;
  }
  createRenderObject(): RenderView {
    return new ConstrainedBoxRender(this.width, this.height);
  }
  updateRenderObject(context: BuildContext, renderView: RenderView) {
    (renderView as ConstrainedBoxRender).setSize(this.width, this.height);
  }
}

export class RootWidget extends SingleChildRenderObjectWidget {
  private owner: PipelineOwner = RendererBinding.instance.pipelineOwner;
  createRenderObject(): RenderView {
    const view = new RootRenderView();
    view.attach(this.owner);
    return view;
  }
  updateRenderObject(context: BuildContext, renderView: RenderView) {}
}
