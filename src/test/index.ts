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
import {
  Align,
  Axis,
  ClipRRect,
  ColoredRender,
  ContainerRenderViewParentData,
  CrossAxisAlignment,
  FlexParentData,
  MainAxisAlignment,
  MultiChildRenderView,
  Padding,
  PaintingContext,
  Positioned,
  RenderView,
  SingleChildRenderView,
  SizeRender,
  Stack,
} from "./widgets/basic";
import RenderBox from "@/core/lib/rendering/renderbox";
import { MultiChildRenderViewOption } from "@/types/widget";

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
      new Padding(
        10,
        new Flex({
          direction: Axis.horizontal,
          children: [
            new ColoredRender("orange", new SizeRender(20, 20)),
            new ColoredRender("white", new SizeRender(20, 20)),
            new ColoredRender("red", new SizeRender(10, 10)),
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

interface FlexOption {
  direction: Axis;
}

interface LayoutSizes {
  mainSize: number;
  crossSize: number;
  allocatedSize: number;
}
class Flex extends MultiChildRenderView {
  private direction: Axis = Axis.horizontal;
  private mainAxisAlignment: MainAxisAlignment = MainAxisAlignment.start;
  private crossAxisAlignment: CrossAxisAlignment = CrossAxisAlignment.start;
  constructor(option: Partial<FlexOption & MultiChildRenderViewOption>) {
    const { direction, children } = option;
    super(children);
    this.direction = direction;
  }

  layout(constraints: BoxConstraints): void {
    super.layout(constraints);
  }

  performLayout(constraints: BoxConstraints): void {
    super.performLayout(constraints);
    this.computeSize(constraints);

    // const actualSizeDelta=
    // let leadingSpace:number=0;
    // let betweenSpace:number=0;
    // switch(this.mainAxisAlignment){
    //   case MainAxisAlignment.start:break;
    //   case MainAxisAlignment.end:
    //   case MainAxisAlignment.center:
    //   case MainAxisAlignment.spaceBetween:
    //   case MainAxisAlignment.spaceAround:
    //   case MainAxisAlignment.spaceEvenly:
    // }

    // child = this.firstChild;
    // while (child != null) {
    //   const parentData =
    //     child.parentData as ContainerRenderViewParentData<RenderView>;
    //   const preChild = parentData.previousSibling as RenderView;
    //   if (preChild) {
    //     const preParentData =
    //       preChild?.parentData as ContainerRenderViewParentData<RenderView>;
    //     if (this.direction === Axis.horizontal) {
    //       parentData.offset = new Vector(
    //         parentData.offset.x + preChild.size.width + preParentData.offset.x,
    //         parentData.offset.y
    //       );
    //     } else if (this.direction === Axis.vertical) {
    //       parentData.offset = new Vector(
    //         parentData.offset.x,
    //         parentData.offset.y + preChild.size.height + preParentData.offset.y
    //       );
    //     }
    //     console.log("偏移子", preChild, preParentData);
    //   }
    //   child = parentData?.nextSibling;
    // }
    //根据布局主轴方向设置盒子大小
    // if (this.direction == Axis.horizontal) {
    //   this.size = constraints.constrain(
    //     new Size(this.allocatedSize, this.crossSize)
    //   );
    //   this.allocatedSize = this.size.width;
    //   this.crossSize = this.size.height;
    // } else if (this.direction === Axis.vertical) {
    //   this.size = constraints.constrain(
    //     new Size(this.crossSize, this.allocatedSize)
    //   );
    //   this.allocatedSize = this.size.height;
    //   this.crossSize = this.size.width;
    // }
  }

  private computeSize(constraints: BoxConstraints): LayoutSizes {
    let totalFlex: number = 0,
      maxMainSize: number = 0,
      canFlex: boolean,
      child = this.firstChild,
      childCount: number = 0,
      crossSize: number = 0,
      allocatedSize: number = 0;

    maxMainSize=(this.direction===Axis.horizontal)?constraints.minWidth:constraints.minWidth;

    console.log("最大宽度",maxMainSize)

    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      const childSize = child?.size || Size.zero;
      allocatedSize += this.getMainSize(childSize);
      crossSize = Math.max(crossSize, this.getCrossSize(childSize));
      child = parentData?.nextSibling;
      childCount += 1;
    }

    return {
      mainSize: 0,
      crossSize: crossSize,
      allocatedSize: allocatedSize,
    };
  }

  protected setupParentData(child: RenderView): void {
    child.parentData = new FlexParentData();
  }

  private getCrossSize(size: Size) {
    switch (this.direction) {
      case Axis.horizontal:
        return size.height;
      case Axis.vertical:
        return size.width;
    }
  }

  private getMainSize(size: Size) {
    switch (this.direction) {
      case Axis.horizontal:
        return size.width;
      case Axis.vertical:
        return size.height;
    }
  }
  render(context: PaintingContext, offset?: Vector): void {
    console.log(this.size);
    context.paint.fillRect(
      offset.x,
      offset.y,
      this.size.width,
      this.size.height
    );
    this.defaultRenderChild(context, offset);
  }
  private defaultRenderChild(context: PaintingContext, offset?: Vector) {
    let child = this.firstChild;
    while (child != null) {
      const parentData =
        child.parentData as ContainerRenderViewParentData<RenderView>;
      context.paintChild(
        child,
        Vector.add(parentData.offset ?? Vector.zero, offset ?? Vector.zero)
      );
      child = parentData?.nextSibling;
    }
  }
}

const view = new View();
console.log(view);
view.mount();
view.layout();
view.render(new PaintingContext(new Painter(g)));

//父默认宽高为子
