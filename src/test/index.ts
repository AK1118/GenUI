import { CloseIcon, DefaultIcon, ImageIcon, LockIcon } from "@/composite/icons";
import ViewObject from "@/core/abstract/view-object";
import GestiController from "@/core/lib/controller";
import LineGradientDecoration from "@/core/lib/graphics/gradients/lineGradientDecoration";
import Painter, { PaintingStyle } from "@/core/lib/painter";
import Alignment from "@/core/lib/painting/alignment";
import BoxFit from "@/core/lib/painting/box-fit";
import Plugins from "@/core/lib/plugins";
import OffScreenCanvasGenerator from "@/core/lib/plugins/offScreenCanvasGenerator";
import { RenderViewWidget } from "@/core/lib/rendering/widget";
import Vector from "@/core/lib/vector";
import CustomButton from "@/core/viewObject/buttons/eventButton";
import DragButton from "@/core/viewObject/buttons/dragbutton";
import RotateButton from "@/core/viewObject/buttons/rotateButton";
import SizeButton from "@/core/viewObject/buttons/sizeButton";
import RectCrop from "@/core/viewObject/crop/rect-crop";
import Polygon from "@/core/viewObject/graphics/polygon";
// import Circle from "@/core/viewObject/graphics/circle";
import Rectangle, {
  InteractiveImage,
} from "@/core/viewObject/graphics/rectangle";
import Group from "@/core/viewObject/group";
import RectClipMask from "@/core/viewObject/mask/rect-clip-mask";
import TextArea from "@/core/viewObject/text/text-area";
import WriteRect from "@/core/viewObject/write/rect";
import { Size } from "@/core/lib/rect";
import {
  createGesti,
  importAll,
  exportAll,
  doCenter,
  loadToGesti,
  useGraffitiWrite,
  doUpdate,
} from "@/hooks/index";
import Gesti, {
  ARButton,
  CloseButton,
  EventButton,
  HorizonButton,
  ImageBox,
  LockButton,
  MirrorButton,
  TextBox,
  UnLockButton,
  VerticalButton,
  XImage,
} from "@/index";
import { BoxDecorationOption } from "@/types/graphics";
import { waitingLoadImg } from "@/utils/canvas";
import ScreenUtils from "@/utils/screenUtils/ScreenUtils";
import { RenderObject } from "@/core/interfaces/render-object";
import { BoxConstraints } from "@/core/lib/rendering/constraints";
import {
  Align,
  Axis,
  BoxParentData,
  Clip,
  ClipRRect,
  ClipRect,
  ColoredRender,
  ContainerRenderViewParentData,
  CrossAxisAlignment,
  Expanded,
  Flex,
  FlexParentData,
  MainAxisAlignment,
  MultiChildRenderView,
  PaintingContext,
  ParentDataRenderView,
  RenderView,
  SingleChildRenderView,
  SizeRender,
  StackFit,
  Stack,
  Positioned,
  ParagraphView,
  RootRenderView,
  PaddingRenderView,
  RectTLRB,
  PaddingOption,
  PlaceholderRenderView,
} from "./widgets/basic";
import {
  MultiChildRenderViewOption,
  PositionedOption,
  RenderBox,
  RenderViewOption,
  SingleChildRenderViewOption,
} from "@/types/widget";
import {
  FontStyle,
  FontWeight,
  MulParagraph,
  Paragraph,
  ParagraphConstraints,
  TextAlign,
  TextDecoration,
  TextDecorationStyle,
  TextOverflow,
  TextPainter,
  TextSpan,
  TextStyle,
} from "./widgets/text-painter";
import {
  Binding,
  ElementBinding,
  PipelineOwner,
  RendererBinding,
  SchedulerBinding,
} from "./widgets/binding";

/**
 * 假如全屏 360，    分成750份
 * dpr=3
 *
 * 手机大小 为 400
 * 画布样式为 390*390
 * 但是dpr为400*3=1200，表示中心点在  600,需要解决这个偏移量，因为偏移量其实为 200*200，偏移量比值，
 *
 * 导入时dpr 2 ,自己的dpr 3
 * 但是dpr用于：
 * 视图层：控制画布大小，scale缩放
 * 操作层：将输入事件映射到实际画布内
 *
 * 输入时与画布大小无关，与设计稿有关
 *
 *
 */
Gesti.installPlugin("pako", require("pako"));

const canvas: HTMLCanvasElement = document.querySelector("#canvas");
const img2: HTMLImageElement = document.querySelector("#bg");

const dev = window.devicePixelRatio;
console.log("DPR：", dev);
canvas.width = 300 * dev;
canvas.height = 300 * dev;
canvas.style.width = 300 + "px";
canvas.style.height = 300 + "px";
const g = canvas.getContext("2d", {
  // willReadFrequently: true,
});
// g.imageSmoothingEnabled = false;
Painter.setPaint(g);
Gesti.installPlugin(
  "offScreenBuilder",
  new OffScreenCanvasGenerator({
    //离屏画布构造器
    offScreenCanvasBuilder: (width, height) => {
      const a = new OffscreenCanvas(width, height);
      return a;
    },
    //离屏画笔构造器
    offScreenContextBuilder: (offScreenCanvas) => {
      return offScreenCanvas.getContext("2d");
    },
    //图片构造器
    imageBuilder: (url: string, width: number, height: number) => {
      console.log("图片", url);
      const img = new Image();
      img.src = url;
      img.crossOrigin = "anonymous";
      return img;
    },
  })
);

// const gesti = createGesti({
//   dashedLine: false,
//   auxiliary: false,
// });
// // Gesti.installPlugin("pako", require("pako"));
// console.log(canvas.width, canvas.height);
// gesti.initialization({
//   renderContext: g,
//   rect: {
//     canvasWidth: canvas.width,
//     canvasHeight: canvas.height,
//   },
// });
// // gesti.debug=true;
// const controller = gesti.controller;

// console.log("屏幕1大小", canvas.width, canvas.height);

// const screenUtil1 = controller.generateScreenUtils({
//   canvasHeight: canvas.height,
//   canvasWidth: canvas.width,
//   designWidth: 750,
//   designHeight: 750,
//   // devicePixelRatio: dev,
// });

//具有renderbox的对象，用来作为装载RenderObject的容器
/**
 *
 * Element 需要可被用户自定义树
 * 需要可被嵌套，所以每个Element都可选要child
 * child
 *
 *
 */
let debugCount = 0;
export class BuildOwner {
  private dirtyElementList: Array<Element> = [];
  public scheduleBuildFor(dirtyElement: Element) {
    this.dirtyElementList.push(dirtyElement);
    SchedulerBinding.instance.ensureVisualUpdate();
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

abstract class BuildContext {
  abstract get mounted(): boolean;
  abstract get view(): RenderView;
  abstract get size(): Size;
}

export abstract class Element extends BuildContext {
  public key: string = Math.random().toString(16).substring(3);
  public dirty: boolean = true;
  protected parent: Element;
  protected child: Element = null;
  public built: Element;
  public owner: BuildOwner;
  protected renderView: RenderView;
  protected depth: number = 0;
  constructor(child?: Element) {
    super();
    this.built = child;
  }
  get runtimeType(): unknown {
    return this.constructor;
  }
  get mounted(): boolean {
    return false;
  }
  get view(): RenderView {
    return this.renderView;
  }
  get size(): Size {
    return this.renderView.size;
  }
  public mount(parent?: Element, newSlot?: Object): void {
    if (!parent) return;
    this.parent = parent;
    this.owner = parent?.owner;
    this.depth = parent?.depth + 1;
  }
  abstract createRenderView(context: BuildContext): RenderView;
  public static sort(a: Element, b: Element) {
    return a.depth - b.depth;
  }
  public insertRenderViewChild(child?: RenderView) {
    if (!this.renderView) return;
    this.renderView.child = child;
  }
  public attachRenderObject(newSlot?: Object) {
    this.insertRenderViewChild(this.child?.renderView);
    this.child?.attachRenderObject(newSlot);
  }
  private canUpdate(oldElement: Element, newElement: Element) {
    return newElement.runtimeType === oldElement.runtimeType;
  }
  // abstract updateRenderView():void;
  /**
   * 如果新child不为空，老child为空，直接赋值新child
   * 如果新child和老child的类型相同，不赋值新的child，改参数重新传递
   * 判断新来的child和本次的是不是同类型
   * 如果已经有了，old child是 ColoredBox->SizedBox，而new child也是ColoredBox->SizedBox ,就将new child的参数传递给 old child 的数据，
   * 那子呢？继续调用oldChild.updateChild,并将newChild传递下去
   *
   */
  protected updateChild(
    child?: Element,
    newElement?: Element,
    newSlot?: Object
  ): Element {
    if (!child && !newElement) return null;
    let newChild: Element;
    if (!child && newElement) {
      newChild = newElement;
      newChild.mount(this, newSlot);
      return newChild;
    }

    if (this.canUpdate(child, newElement)) {
      child.update(newElement);
      return child;
    }

    return newChild;
  }
  public performRenderViewLayout() {
    this.renderView.layout(BoxConstraints.zero);
  }
  public paint(paint: Painter) {
    this.renderView.render(new PaintingContext(paint));
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
  public assignOwner(owner: BuildOwner) {
    this.owner = owner;
  }
  public mount(parent?: Element, newSlot?: Object): void {
    this.renderView = this.createRenderView(this);
    this.attachPipelineOwner(RendererBinding.instance.pipelineOwner);

    this.child = this.updateChild(this.child, this.built, newSlot);
    super.mount(parent, newSlot);
    this.attachRenderObject(newSlot);
  }
  attachPipelineOwner(owner: PipelineOwner) {
    if (this.renderView) {
      this.renderView.attach(owner);
    }
  }
  attachToRenderTree(owner: BuildOwner) {
    if (!this.owner) {
      this.assignOwner(owner);
      this.mount();
      this.renderView.reassemble();
      this.owner.buildScope(this);
      // this.performRenderViewLayout();
      // this.paint(new Painter());
    } else {
      this.markNeedsBuild();
    }
  }
}
export class RootElementView extends RootElement {
  createRenderView(context: BuildContext): RenderView {
    return new RootRenderView();
  }
}

abstract class RenderViewElement extends Element {
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.renderView = this.createRenderView(this);
    this.attachRenderObject(newSlot);
  }
  update(newElement: Element): void {
    super.update(newElement);
    super.performRebuild();
  }
}

abstract class SingleChildElement extends RenderViewElement {
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.child = this.updateChild(this.child, this.built);
  }
  update(newElement: Element): void {
    super.update(newElement);
    this.updateRenderView(this, this.renderView);
    this.child = this.updateChild(this.child, newElement.built);
  }
}

class SizedBox extends SingleChildElement {
  public width: number;
  public height: number;
  constructor(width: number, height: number, child?: Element) {
    super(child);
    this.width = width;
    this.height = height;
  }
  createRenderView(context: BuildContext): RenderView {
    return new SizeRender(this.width, this.height);
  }
  protected updateRenderView(
    context: BuildContext,
    renderView: RenderView
  ): void {
    const sizedRender = renderView as SizeRender;
    sizedRender.width = this.width;
    sizedRender.height = this.height;
  }
  update(newElement: SizedBox): void {
    this.width = newElement.width;
    this.height = newElement.height;
    super.update(newElement);
  }
}

class ColoredBox extends SingleChildElement {
  private color: string;
  constructor(color: string, child?: View) {
    super(child);
    this.color = color;
  }
  protected updateRenderView(
    context: BuildContext,
    renderView: RenderView
  ): void {
    const coloredRender = renderView as ColoredRender;
    coloredRender.color = this.color;
  }
  createRenderView(context: BuildContext): RenderView {
    return new ColoredRender(this.color);
  }
  update(newElement: ColoredBox): void {
    this.color = newElement.color;
    super.update(newElement);
  }
}

interface SingleChildElementOption {
  child?: View;
}

class Padding extends SingleChildElement {
  private option: Partial<PaddingOption & SingleChildElementOption>;
  constructor(option: Partial<PaddingOption & SingleChildElementOption>) {
    super(option?.child);
    this.option = option;
  }
  createRenderView(context: BuildContext): RenderView {
    return new PaddingRenderView(this.option);
  }
}

abstract class BuildElement extends SingleChildElement {
  constructor() {
    super();
  }
  abstract build(context: BuildContext): Element;
  createRenderView(context: BuildContext): RenderView {
    return new PlaceholderRenderView();
  }
  public mount(parent?: Element, newSlot?: Object): void {
    super.mount(parent, newSlot);
    this.firstBuild();
  }
}

abstract class BuildLessView extends BuildElement {
  constructor() {
    super();
    this.built = this.build(this);
  }
}

abstract class StatelessView extends BuildLessView {}

abstract class StatefulView extends BuildElement {
  private state: State;
  private oldElement: Element;
  constructor() {
    super();
    this.state = this.createState();
  }
  abstract createState(): State;
  public mount(parent?: Element, newSlot?: Object): void {
    this.state = this.createState();
    this.state.element = this;
    super.mount(parent, newSlot);
  }
  protected firstBuild() {
    this.state.initState();
    super.firstBuild();
  }
  protected performRebuild(): void {
    super.performRebuild();
    this.built = this.build();
    this.child = this.updateChild(this.child, this.built);
  }
  build(): Element {
    return this.state.build(this);
  }
}

abstract class State<T extends RenderViewElement = RenderViewElement> {
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

class Less extends StatelessView {
  constructor() {
    super();
  }
  build(context: BuildContext): Element {
    return new ColoredBox("#ccc", new SizedBox(100, 100))
  }
}

class TestView extends StatefulView {
  createState(): State {
    return new TestViewState();
  }
}
class TestViewState extends State {
  private color: string = "#ccc";
  private size: Size = new Size(30, 30);
  private delta: number = 3;
  initState(): void {
    this.color = "white";
    // setInterval(() => {
    //   this.setState(() => {
    //     this.color = this.getRandomColor();
    //     this.size.setWidth(this.size.width + this.delta);
    //     this.size.setHeight(this.size.height + this.delta);
    //   });
    // }, 1000);
    // this.handleAnimate();
  }

  getRandomColor(): string {
    // 生成一个随机的颜色值
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  handleAnimate() {
    if (this.size.width > 300 || this.size.width <= 0) {
      this.delta *= -1;
    }
    requestAnimationFrame(() => {
      g.clearRect(0, 0, 300, 300);
      this.setState(() => {
        this.color = "orange";
        this.size.setWidth(this.size.width + this.delta);
        this.size.setHeight(this.size.height + this.delta);
      });
      this.handleAnimate();
    });
  }
  build(context: BuildContext): RenderViewElement {
    return new ColoredBox(
      this.color,
      new SizedBox(this.size.width, this.size.height,new Less()),
    );
  }
}

const view = new TestView();

const runApp = (rootElement: Element) => {
  const binding = Binding.getInstance();
  binding.elementBinding.attachRootWidget(rootElement);
  console.log(rootElement);
  // RendererBinding.instance.drawFrame();
};

runApp(view);

// abstract class StateFulRender extends Element {
//   private renderer: RenderView;
//   private paintingContext: PaintingContext;
//   private state: State;
//   constructor() {
//     super();
//     this.state = this.createState();
//   }
//   get mounted(): boolean {
//     return this.renderer != null;
//   }
//   get buildContext(): BuildContext {
//     return this;
//   }
//   render(context: PaintingContext, offset?: Vector): void {
//     if (!this.paintingContext) {
//       this.paintingContext = context;
//     }
//     this.renderer.render(context, offset);
//   }
//   debugRender(context: PaintingContext, offset?: Vector): void {
//     if (!this.paintingContext) {
//       this.paintingContext = context;
//     }
//     this.renderer.debugRender(context, offset);
//   }
//   performLayout(constraints: BoxConstraints, parentUseSize?: boolean): void {
//     this.renderer.layout(constraints, parentUseSize);
//   }
//   applyInitState(state: State) {
//     state.initState();
//   }
//   mount(parent?: Element, newSlot?: Object): void {
//     this.state = this.createState();
//     super.mount(parent, newSlot);
//   }
//   build(context: BuildContext): Element {
//     return this.build(this);
//   }
//   createRenderView(): RenderView {
//     throw new Error("Method not implemented.");
//   }
//   protected firstBuild() {
//     this.applyInitState(this.state);
//     super.firstBuild();
//   }
//   protected performReBuild() {
//     this.renderer = this.state.build(this);
//     super.performReBuild();
//   }
//   protected abstract createState(): State;
// }

// class TestView extends StateFulRender {
//   constructor() {
//     super();
//   }
//   protected createState(): State<StateFulRender> {
//     return new TestViewState();
//   }
// }
// class TestViewState extends State<StateFulRender> {
//   private count: number = 0;

//   build(context: BuildContext): RenderView {
//     this.setState(() => {});

//     return
//   }
// }

// class View extends Element {
//   private renderer: RenderView;
//   private debug: boolean = true;
//   private context: PaintingContext = new PaintingContext(new Painter());
//   constructor() {
//     super();
//   }
//   layout() {
//     this.renderer.layout(BoxConstraints.zero);
//   }
//   createRenderView(): RenderView {
//     throw new Error("Method not implemented.");
//   }
//   build(context: BuildContext): Element {
//     throw new Error("Method not implemented.");
//   }

//   render(context: PaintingContext = this.context) {
//     if (this.debug) {
//       this.renderer.debugRender(context);
//       context.clipRectAndPaint(
//         Clip.antiAlias,
//         {
//           x: 0,
//           y: 0,
//           width: 60,
//           height: 20,
//         },
//         () => {
//           context.paint.fillStyle = "rgba(255,0,0,.3)";
//           context.paint.fillRect(0, 0, 40, 16);
//           context.paint.fillStyle = "white";
//           context.paint.fillText("Debug", 2, 12);
//         }
//       );
//     } else {
//       this.renderer.render(context);
//     }
//     // this.renderer.render(context);
//     //this.renderer.debugRender(context);
//   }
// }

// // const view = new View();
// // console.log(view);
// // view.mount();
// // view.layout();
// // view.render(new PaintingContext(new Painter(g)));
