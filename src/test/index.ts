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

interface ParagraphViewOption {
  text: TextSpan;
}

class ParagraphView extends SingleChildRenderView {
  private textPainter: TextPainter;
  private text: TextSpan;
  private needClip: boolean;

  constructor(option?: ParagraphViewOption) {
    super();
    const { text } = option;
    this.text = text;
  }
  performLayout(constraints: BoxConstraints, parentUseSize?: boolean): void {
    this.textPainter = new TextPainter(this.text);
    this.textPainter.layout(constraints.minWidth, constraints.maxWidth);
    const textSize = this.textPainter.size;
    this.size = constraints.constrain(textSize);

    switch (this.text.style.getTextStyle().overflow) {
      case TextOverflow.clip:
        this.needClip =
          textSize.height > this.size.height ||
          textSize.width > this.size.width;
        break;
      case TextOverflow.ellipsis:
      case TextOverflow.visible:
    }
  }
  render(context: PaintingContext, offset?: Vector): void {
    if (this.needClip) {
      context.clipRectAndPaint(
        Clip.antiAlias,
        {
          x: offset?.x ?? 0,
          y: offset?.y ?? 0,
          width: this.size.width,
          height: this.size.height,
        },
        () => {
          this.textPainter.paint(context.paint, offset);
        }
      );
    }

    this.textPainter.paint(context.paint, offset);
  }
}

class View {
  private renderer: RenderView;

  build(): RenderView {
    return new SizeRender(
      canvas.width,
      canvas.height,
      new Align(
        Alignment.center,
        new Flex({
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.center,
          // mainAxisAlignment:MainAxisAlignment.spaceBetween,
          direction: Axis.vertical,
          children: [
            // new Expanded({
            //   flex: 1,
            //   child: new ColoredRender("orange", new SizeRender(10, 10)),
            // }),
            // new Expanded({
            //   flex: 2,
            //   child: new ColoredRender("red", new SizeRender(10, 10)),
            // }),
            new SizeRender(
              100,
              null,
              new ParagraphView({
                text: new TextSpan({
                  text: "根据,需…要在数组中继续添加新的段落你可以根据需要在数组中继续添加新的段落你可以根据需要在数组中继续添加新的段落😊",
                  textStyle: new TextStyle({
                    color: "black",
                    fontSize: 20,
                    maxLines:3,
                    // overflow: TextOverflow.clip,
                  }),
                  // children:[
                  //   new TextSpan({
                  //     text:"根据需要在数组中继续添加新的段落你可以根据需要在数组中继续添加新的段落你可以根据需要在数组中继续添加新的段落😊"
                  //   }),
                  //   new TextSpan({
                  //     text:"根据需要在数组中继续添加新的段落你可以根据需要在数组中继续添加新的段落你可以根据需要在数组中继续添加新的段落😊"
                  //   })
                  // ]
                }),
              })
            ),
            new ColoredRender("green", new SizeRender(10, 10)),
            new ColoredRender("orange", new SizeRender(10, 20)),
            new ColoredRender("red", new SizeRender(10, 30)),
            // new Expanded({
            //   flex: 3,
            //   child: new ColoredRender("green", new SizeRender(10, 10)),
            // }),
          ],
        })
      )
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

const view = new View();
console.log(view);
view.mount();
view.layout();
view.render(new PaintingContext(new Painter(g)));

const forge = new Painter();
forge.fillStyle = "black";
forge.style = PaintingStyle.fill;

const textSpan = new TextSpan({
  text: "你可以根据需要在数组中继续添加新的段落你可以根据需要在数组中继续添加新的段落你可以根据需要在数组中继续添加新的段落😊",
  textStyle: new TextStyle({
    textAlign: TextAlign.unset,
    wordSpacing: 10,
    fontSize: 20,
    letterSpacing: 0,
    fontWeight: FontWeight.bold,
    decoration: TextDecoration.underline,
    decorationStyle: TextDecorationStyle.dashed,
    decorationColor: "orange",
    maxLines: 2,
    color: "white",
    overflow: TextOverflow.clip,
    // foreground: forge,
  }),
  children: [
    new TextSpan({
      text: "什么",
    }),
    new TextSpan({
      text: "g.fillRect(paintX, paintY, constraints.width, Math.max(mul.height, fontSize));",
      // textStyle: new TextStyle({
      //   color: "red",
      //   foreground:null,
      //   fontSize:50,
      //   // decoration:TextDecoration.lineThrough
      // }),
    }),
  ],
});

// const textPainter = new TextPainter(textSpan, new Painter(g));

// const offset=new Vector(30,30);
// textPainter.layout(200, 200);
// console.log("最后大小",textPainter.size)
// g.fillStyle="#ccc";
// g.fillRect(offset.x,offset.y,textPainter.size.width,textPainter.size.height);
// textPainter.paint(new Painter(g), offset);
