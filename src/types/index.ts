import { CloseIcon, DefaultIcon, ImageIcon, LockIcon } from "@/composite/icons";
import ViewObject from "@/core/abstract/view-object";
import GestiController from "@/core/lib/controller";
import LineGradientDecoration from "@/core/lib/graphics/gradients/lineGradientDecoration";
import Painter from "@/core/lib/painter";
import Alignment from "@/core/lib/painting/alignment";
import BoxFit from "@/core/lib/painting/box-fit";
import Plugins from "@/core/lib/plugins";
import OffScreenCanvasGenerator from "@/core/lib/plugins/offScreenCanvasGenerator";
import { RenderViewElement } from "@/core/lib/rendering/element";
import { Row } from "@/core/lib/rendering/flex";
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
      0,
      new EdgeInsetsRender(
        10,
        new ColoredRender(
          "#cccccc",
          new EdgeInsetsRender(
            10,
            new ColoredRender(
              "orange",
              new EdgeInsetsRender(
                10,
                new ColoredRender(
                  "#cccccc",
                  new EdgeInsetsRender(
                    10,
                    new ColoredRender(
                      "orange",
                      new EdgeInsetsRender(
                        10,
                        new ColoredRender("#cccccc", new EdgeInsetsRender(10))
                      )
                    )
                  )
                )
              )
            )
          )
        )
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
  render(paint: Painter) {
    this.renderer.render(paint);
  }
}

//原子渲染对象，可以有层级渲染，没有renderbox，依赖于context传输的大小来渲染
class RenderView {
  protected child: RenderView;
  protected size: Size = Size.zero;
  protected constrain: BoxConstraints = new BoxConstraints({
    minWidth: canvas.width,
    maxHeight: canvas.height,
    minHeight: canvas.height,
    maxWidth: canvas.width,
  });
  constructor(child?: RenderView) {
    this.child = child;
  }
  render(paint: Painter, offset?: Vector) {
    this.renderChild(paint, offset);
  }
  //默认大小等于子大小，被子撑开
  layout(constraints: BoxConstraints): void {
    if (this.child) {
      this.child.layout(constraints);
      this.size = this.child.size;
    } else {
      this.size = constraints.constrain(Size.zero);
    }
  }

  private renderChild(paint: Painter, offset?: Vector) {
    this.child?.render(paint, offset);
  }
}

class ColoredRender extends RenderView {
  private color: string;
  constructor(color?: string, child?: RenderView) {
    super(child);
    this.color = color;
  }
  render(paint: Painter, offset?: Vector): void {
    paint.fillStyle = this.color;
    paint.fillRect(
      offset?.x ?? 0,
      offset?.y ?? 0,
      this.size.width,
      this.size.height
    );
    super.render(paint, offset);
  }
}

//尺寸约束 不负责渲染
class SizeRender extends RenderView {
  private additionalConstraints: BoxConstraints;
  constructor(width: number, height: number, child?: RenderView) {
    super(child);
    this.additionalConstraints = new BoxConstraints({
      maxWidth: width,
      maxHeight: height,
      minWidth: width,
      minHeight: height,
    });
  }
  layout(constraints: BoxConstraints): void {
    super.layout(this.additionalConstraints);
    this.size = this.additionalConstraints.constrain(Size.zero);
  }
  render(paint: Painter, offset?: Vector): void {
    super.render(paint, offset);
  }
}

class EdgeInsetsRender extends RenderView {
  private padding: number = 0;
  constructor(padding: number, child?: RenderView) {
    super(child);
    this.padding = padding;
  }
  layout(constraints: BoxConstraints): void {
    /**
     * 增量约束
     * padding box最大约束
     */
    const additionalConstraints = new BoxConstraints({
      minWidth: constraints.minWidth + this.padding * -2,
      minHeight: this.padding * -2,//高度不需要约束，如果加上 约束盒子高度会默认为父约束盒高度
    });
    super.layout(additionalConstraints);
    this.size = new Size(
      Math.max(
        constraints.constrainWidth(this.size.width),
        this.padding * 2
      ),
      this.size.height + this.padding * 2
    );
  }
  render(paint: Painter, offset?: Vector): void {
    // 计算新的偏移量
    const paddedOffsetX = offset ? offset?.x + this.padding : this.padding;
    const paddedOffsetY = offset ? offset?.y + this.padding : this.padding;
    super.render(paint, new Vector(paddedOffsetX, paddedOffsetY));
  }
}

const view = new View();
console.log(view);
view.mount();
view.layout();
view.render(new Painter(g));

//父默认宽高为子
