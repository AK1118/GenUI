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
  StatefulRenderView,
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
import {
  Align,
  BuildContext,
  ColoredBox,
  Element,
  LimitedBox,
  Padding,
  RenderViewElement,
  SizedBox,
  State,
  StatefulView,
  StatelessView,
} from "./widgets/elements";

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

class Less extends StatelessView {
  constructor() {
    super();
  }
  build(context: BuildContext): Element {
    return new ColoredBox(
      "white",
      new Padding({
        padding: {
          top: 90,
          left: 10,
          bottom: 10,
          right: 10,
        },
        child: new ColoredBox("#ccc", new SizedBox(30, 30)),
      })
    );
  }
}

class TestView extends StatefulView {
  createState(): State {
    return new TestViewState();
  }
}
class TestViewState extends State {
  private color: string = "#ccc";
  private size: Size = new Size(100, 100);
  private delta: number = 3;
  initState(): void {
    this.color = "white";
    // setInterval(() => {
    //   g.clearRect(0, 0, 1000, 1000);
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
    if (this.size.width > 200 || this.size.width <= 0) {
      this.delta *= -1;
    }
    requestAnimationFrame(() => {
      g.clearRect(0, 0, 1000, 1000);
      this.setState(() => {
        this.size.setWidth(this.size.width + this.delta);
        this.size.setHeight(this.size.height + this.delta);
      });
      this.handleAnimate();
    });
  }
  build(context: BuildContext): RenderViewElement {
    return new Padding({
      padding: {
        top: 0,
        left: 20,
        bottom: 10,
        right: 10,
      },
      child: new ColoredBox(
        "white",
        new Padding({
          padding: {
            top: 10,
            left: 10,
            bottom: 10,
            right: 10,
          },
          child: new ColoredBox(
            "#ccc",
            new Padding({
              padding: {
                top: 10,
                left: 10,
                bottom: 10,
                right: 10,
              },
              child: new ColoredBox(
                "white",
                new SizedBox(
                  this.size.width,
                  this.size.height,
                  // new ColoredBox("orange", new LimitedBox(20, 20))
                  // new Align(
                  //   new ColoredBox("orange", new LimitedBox(20, 20)),
                  //   Alignment.center
                  // )
                )
              ),
            })
          ),
        })
      ),
    });
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
// setTimeout(()=>{
//   Binding.getInstance().schedulerBinding.ensureVisualUpdate();
// },3000)
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
