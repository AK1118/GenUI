import { CloseIcon, DefaultIcon, ImageIcon, LockIcon } from "@/composite/icons";
import ViewObject from "@/core/abstract/view-object";
import GestiController from "@/core/lib/controller";
import LineGradientDecoration from "@/core/lib/graphics/gradients/lineGradientDecoration";
import Painter, { PaintingStyle } from "@/core/lib/painter";
import Alignment from "@/core/lib/painting/alignment";
import BoxFit from "@/core/lib/painting/box-fit";
import Plugins from "@/core/lib/plugins";
import OffScreenCanvasGenerator from "@/core/lib/plugins/offScreenCanvasGenerator";
import { RenderViewElement } from "@/core/lib/rendering/element";
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
  Padding,
  PaintingContext,
  ParentDataRenderView,
  RenderView,
  SingleChildRenderView,
  SizeRender,
  StackFit,
  Stack,
  Positioned,
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
  MulParagraph,
  Paragraph,
  ParagraphConstraints,
  TextAlign,
  TextDecoration,
  TextDecorationStyle,
  TextPainter,
  TextSpan,
  TextStyle,
} from "./widgets/text-painter";

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

class View {
  private renderer: RenderView;

  build(): RenderView {
    return new SizeRender(
      canvas.width,
      canvas.height,
      new Stack({
        children: [
          new Expanded({
            flex: 1,
            child: new ColoredRender("orange", new SizeRender(50, 50)),
          }),
          new ColoredRender("white", new SizeRender(20, 20)),
          new Positioned({
            bottom: 10,
            top: 10,
            child: new ColoredRender("red", new SizeRender(10, 10)),
          }),
        ],
        alignment: Alignment.center,
      })
    );
  }
  mount() {
    this.renderer = this.build();
  }
  layout() {
    this.renderer.layout(BoxConstraints.zero);
    console.log(this.renderer);
  }
  render(context: PaintingContext) {
    this.renderer.render(context);
  }
}

// const view = new View();
// console.log(view);
// view.mount();
// view.layout();
// view.render(new PaintingContext(new Painter(g)));

// },30000)

// let linHeightScale=5;
// // setInterval(()=>{
//   g.clearRect(0,0,1000,1000)
//   linHeightScale+=.1;
//   const fontSize = 10;
// const paintY =10;
// const paintX = 10;

// const texts = `😀你可以根据需要在数组中继续添加新的段落👊`;
// const paragraph = new Paragraph();
// const paragraph2 = new Paragraph();
// const paragraph3 = new Paragraph();
// paragraph.addText(texts);
// paragraph2.addText(`测试`);
// paragraph3.addText(`你可以根据需要在数组中继续添加新的段落你可以根据需要在数组中继续添加新的段落你可以根据需要在数组中继续添加新的段落,Hello.this is my order test.`);
// const textStyle = new TextStyle({
//   textAlign: TextAlign.unset,
//   fontSize: fontSize,
//   lineHeight: fontSize*1.5,
//   wordSpace: 0,
//   letterSpacing: 0,
// });

// paragraph.pushStyle(textStyle);
// const fontSize2=20;
// paragraph2.pushStyle({
//   ...textStyle,
//   color:'orange',
//   fontSize: fontSize2,
//   lineHeight: fontSize2*linHeightScale,
// });
// paragraph3.pushStyle({
//   ...textStyle,
//   color:'black'
// });

// const constraints=new ParagraphConstraints(200)

// const mul = new MulParagraph([paragraph, paragraph2, paragraph3]);
// mul.pushStyle(
//   new TextStyle(
//     {textAlign:TextAlign.start,wordSpace:20},
//   ),
// );
// mul.layout(constraints, new Painter(g));
// g.fillStyle = "white";
// g.fillRect(paintX, paintY, constraints.width, Math.max(mul.height, fontSize));
// g.fillStyle = "black";
// mul.paint(new Painter(g), new Vector(paintX, paintY));
// if(linHeightScale>=5)linHeightScale=0;
Painter.setPaint(g);
const forge=new Painter();
const forge2=new Painter();
forge2.fillStyle="blue";
forge.style=PaintingStyle.stroke;
forge.lineWidth=1;
forge.strokeStyle="#ccc"
const textSpan = new TextSpan({
  text: "😀你可以根据需要在数组中继续添加新的段落👊",
  textStyle: new TextStyle({
    textAlign: TextAlign.start,
    wordSpacing: 0,
    fontSize: 20,
    color: "red",
    fontFamily: "楷体",
    fontStyle: FontStyle.italic,
    decoration:TextDecoration.underline,
    decorationStyle:TextDecorationStyle.dashed,
    decorationColor:'orange',
    foreground:forge,
  }),
  children: [
    new TextSpan({
      text: "Aenean rutrum tempor ligula, at luctus ligula auctor vestibulum",
      textStyle: new TextStyle({
        color: "orange",
        fontSize:20,
        decorationStyle:TextDecorationStyle.solid,
        decorationColor:"black",
      }),
    }),
    new TextSpan({
      text: "☠你可以根据需要在数组中继续添加新的段落👊",
      textStyle: new TextStyle({
        decorationColor:'blue',
        foreground:forge2
      }),
    }),
  ],
});

const textPainter = new TextPainter(textSpan, new Painter(g));

textPainter.layout(200, 200);
textPainter.paint(new Painter(g), new Vector(30, 30));

