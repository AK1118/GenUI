import { BoxConstraints } from "@/lib/rendering/constraints";
import {
  AlignRenderView,
  ColoredRender,
  LimitedBoxRender,
  MultiChildRenderView,
  PaddingOption,
  PaddingRenderView,
  PaintingContext,
  PlaceholderRenderView,
  RenderView,
  RootRenderView,
  ConstrainedBoxRender,
  StatefulRenderView,
  ParagraphView,
  StatelessRenderView,
} from "./basic";
import Painter from "@/lib/painting/painter";
import { PipelineOwner, RendererBinding, SchedulerBinding } from "./binding";
import Alignment from "@/lib/painting/alignment";
import { TextSpan, TextStyle } from "./text-painter";
import { Size } from "./basic/rect";
import { Widget } from "@/test/index";
import {
  RenderObjectElement,
  RenderObjectWidget,
  SingleChildRenderObjectWidget,
} from "./framework";

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
export abstract class Element extends BuildContext {
  public key: string = Math.random().toString(16).substring(3);
  public lifecycle: ElementLifecycle = ElementLifecycle.initial;
  public dirty: boolean = true;
  public parent: Element;
  protected child: Element = null;
  private _widget: Widget;
  public owner: BuildOwner;
  protected depth: number = 0;
  constructor(widget?: Widget) {
    super();
    this._widget = widget;
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
    this.lifecycle = ElementLifecycle.active;
  }
  public static sort(a: Element, b: Element) {
    return a.depth - b.depth;
  }
  private canUpdate(oldElement: Element, newElement: Element) {
    return newElement?.runtimeType === oldElement?.runtimeType;
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
    if (this.canUpdate(child, newChild)) {
      child.update(newChild);
      return child;
    }

    return newChild;
  }
  public markNeedsBuild() {
    if (this.dirty) return;
    this.dirty = true;
    this?.owner.scheduleBuildFor(this);
  }
  public rebuild() {
    if (!this.dirty) return;
    this.performRebuild();
  }
  protected performRebuild() {
    if (!this.dirty) return;
    this.dirty = false;
  }
  protected firstBuild() {
    this.rebuild();
  }
  protected updateRenderView(
    context: BuildContext,
    renderView: RenderView
  ): void {}
  update(newElement: Element) {}
}

abstract class View extends Element {}

export abstract class RootElement extends Element {
  private renderView: RenderView;
  private root: Element;
  public assignOwner(owner: BuildOwner) {
    this.owner = owner;
  }
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.firstBuild();
  }
  update(newElement: Element): void {
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
      this.renderView.reassemble();
      this.owner.buildScope(this);
    } else {
      this.markNeedsBuild();
    }
  }
}
export class RootElementView extends RootElement {}

export abstract class RenderViewElement extends Element {
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
  }
  update(newElement: Element): void {
    super.update(newElement);
    super.performRebuild();
  }
}

export abstract class SingleChildElement extends RenderViewElement {
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.child = this.updateChild(this.child, this.widget);
  }
  update(newElement: Element): void {
    super.update(newElement);
    // this.updateRenderView(this, this.renderView);
    this.child = this.updateChild(this.child, newElement.widget);
    this.markNeedsBuild();
  }
}

export class ConstrainedBox extends SingleChildElement {
  public width: number;
  public height: number;
  constructor(width: number, height: number, child?: Element) {
    super();
    this.width = width;
    this.height = height;
  }
  createRenderView(context: BuildContext): RenderView {
    return new ConstrainedBoxRender(this.width, this.height);
  }
  protected updateRenderView(
    context: BuildContext,
    renderView: RenderView
  ): void {
    const sizedRender = renderView as ConstrainedBoxRender;
    sizedRender.setSize(this.width, this.height);
  }
  update(newElement: ConstrainedBox): void {
    this.width = newElement.width;
    this.height = newElement.height;
    super.update(newElement);
  }
}

export class LimitedBox extends SingleChildElement {
  private maxWidth: number;
  private maxHeight: number;
  constructor(maxWidth?: number, maxHeight?: number, child?: View) {
    super();
    this.maxWidth = maxWidth;
    this.maxHeight = maxHeight;
  }
  createRenderView(context: BuildContext): RenderView {
    return new LimitedBoxRender(this.maxWidth, this.maxHeight);
  }
  protected updateRenderView(
    context: BuildContext,
    renderView: RenderView
  ): void {
    const sizedRender = renderView as LimitedBoxRender;
    sizedRender.setMaxSize(this.maxWidth, this.maxHeight);
  }
  update(newElement: LimitedBox): void {
    this.maxWidth = newElement.maxWidth;
    this.maxHeight = newElement.maxHeight;
    super.update(newElement);
  }
}

export class Align extends SingleChildElement {
  private alignment: Alignment = Alignment.center;
  constructor(child?: View, alignment?: Alignment) {
    super();
    this.alignment = alignment;
  }
  createRenderView(context: BuildContext): RenderView {
    return new AlignRenderView(this.alignment);
  }
  protected updateRenderView(
    context: BuildContext,
    renderView: RenderView
  ): void {
    const alignRender = renderView as AlignRenderView;
    alignRender.alignment = this.alignment;
  }
  update(newElement: Align): void {
    this.alignment = newElement.alignment;
    super.update(newElement);
  }
}

interface SingleChildElementOption {
  child?: View;
}

export class Padding extends SingleChildElement {
  private option: Partial<PaddingOption & SingleChildElementOption>;
  constructor(option: Partial<PaddingOption & SingleChildElementOption>) {
    super();
    this.option = option;
  }
  createRenderView(context: BuildContext): RenderView {
    return new PaddingRenderView(this.option);
  }
  protected updateRenderView(
    context: BuildContext,
    renderView: RenderView
  ): void {
    const paddingRenderView = renderView as PaddingRenderView;
    paddingRenderView.padding = this.option?.padding;
  }
  update(newElement: Padding): void {
    this.option = newElement.option;
    super.update(newElement);
  }
}

export abstract class BuildElement extends SingleChildElement {
  // abstract build(context: BuildContext): Element;
  abstract createRenderView(context: BuildContext): RenderView;
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.firstBuild();
  }
}

export abstract class StatelessView extends BuildElement {
  createRenderView(context: BuildContext): RenderView {
    return new StatelessRenderView();
  }
  protected updateRenderView(
    context: BuildContext,
    renderView: RenderView
  ): void {
    const paragraphView = renderView as StatelessRenderView;
    paragraphView.markRepaint();
  }
  update(newElement: Element): void {
    super.update(newElement);
  }
}

// export class Text extends StatelessView {
//   public textStr: string = "";
//   public textStyle: TextStyle = new TextStyle({
//     fontSize: 14,
//   });
//   constructor(textStr: string, textStyle?: TextStyle) {
//     super();
//     this.textStr = textStr;
//     this.textStyle = textStyle ?? this.textStyle;
//     this.built = this.build(this);
//     //  this.built=new ColoredBox(textStr, new LimitedBox(100, 100));
//   }
//   build(context: BuildContext): Element {
//     return new TextRich(
//       new TextSpan({
//         text: this.textStr,
//         textStyle: this.textStyle,
//       })
//     );
//     // return new ColoredBox(this.color, new LimitedBox(100, 100));
//   }
// }

export abstract class StatefulView extends BuildElement {
  private state: State;
  private oldElement: Element;
  constructor() {
    super();
    this.state = this.createState();
  }
  createRenderView(context: BuildContext): RenderView {
    return new StatefulRenderView();
  }
  abstract createState(): State;
  public mount(parent?: Element, newSlot?: Object): void {
    this.state = this.createState();
    // this.state.element = this;
    super.mount(parent, newSlot);
  }
  protected firstBuild() {
    this.state.initState();
    super.firstBuild();
  }
  protected performRebuild(): void {
    super.performRebuild();
    this.child = this.updateChild(this.child, this.widget);
  }
  // build(): Element {
  //   return this.state.build(this);
  // }
}

export abstract class State<T extends RenderViewElement = RenderViewElement> {
  private _element: Element;
  get element(): Element {
    return this._element;
  }
  set element(element: Element) {
    this._element = element;
  }
  abstract build(context: BuildContext): T;
  initState() {}
  protected setState(fn: VoidFunction): void {
    fn();
    this.element.markNeedsBuild();
  }
}

export class TextRich extends SingleChildElement {
  public text: TextSpan;
  constructor(text: TextSpan) {
    super();
    this.text = text;
  }
  createRenderView(context: BuildContext): RenderView {
    return new ParagraphView({ text: this.text });
  }
  protected updateRenderView(
    context: BuildContext,
    renderView: RenderView
  ): void {
    const paragraphView = renderView as ParagraphView;
    paragraphView.text = this.text;
  }
  update(newElement: TextRich): void {
    this.text = newElement.text;
    super.update(newElement);
  }
}

class MultiChildElement extends Element {
  createRenderView(context: BuildContext): RenderView {
    return new PlaceholderRenderView();
  }
}
