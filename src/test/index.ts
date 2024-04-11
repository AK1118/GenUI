import { DefaultIcon, ImageIcon, LockIcon } from "@/composite/icons";
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
import { Container, RenderViewWidget } from "@/core/lib/rendering/widget";
import Vector from "@/core/lib/vector";
import CustomButton from "@/core/viewObject/buttons/customButton";
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
  CloseButton,
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

const gesti = createGesti({
  dashedLine: false,
  auxiliary: false,
});
// Gesti.installPlugin("pako", require("pako"));
console.log(canvas.width, canvas.height);
gesti.initialization({
  renderContext: g,
  rect: {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
  },
});
// gesti.debug=true;
const controller = gesti.controller;
console.log("屏幕1大小", canvas.width, canvas.height);

const screenUtil1 = controller.generateScreenUtils({
  canvasHeight: canvas.height,
  canvasWidth: canvas.width,
  designWidth: 750,
  designHeight: 750,
  devicePixelRatio: dev,
});

const img: HTMLImageElement = document.querySelector("#dog");
// controller.setScreenUtil();
const ximage = new XImage({
  data: img,
  width: img.width,
  height: img.height,
  scale: 1,
  // url: img.src,
});
console.log("哈哈");
const imageBox = new ImageBox(ximage);
imageBox.setSize({
  width: screenUtil1.fullWidth,
  height: screenUtil1.fullHeight,
});
imageBox.setId("第一");
doCenter(imageBox);
// loadToGesti(imageBox);
controller.layerTop(imageBox);
imageBox.toBackground();
imageBox.setLayer(10);
const str = `你好，这是一篇英语短文1234567890 😄 ⚪ Redux
 maintainer Mark Erikson appeared on the "Learn with Jason" show
 to explain how we recommend using Redux today. The show includes
  a live-coded example app that shows how to use Redux Toolkit and
  React-Redux hooks with TypeScript, as well as the new RTK Query data
   fetching APIs.你好，这是一篇英语短文1234567890 😄 ⚪ Redux maintainer
   Mark Erikson appeared on the "Learn with Jason" show to explain how we
   recommend using Redux today. The show includes a live-coded example
   app that shows how to use Redux Toolkit and React-Redux hooks with
   TypeScript, as well as the new RTK Query data fetching APIs.`;
const str1 = `祝你前程似锦`;
const textBox2 = new TextBox(str1, {
  color: "white",
  fontSize: screenUtil1.setSp(60),
  weight: "bold",
  shadowBlur: 1,
  shadowColor: "#a12528",
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  maxWidth: 10000,
  fontFamily: "鸿雷行书简体",
});
const textBox = new TextBox(str1, {
  color: "red",
  weight: 900,
  fontSize: screenUtil1.setSp(10),
  // backgroundColor:'white',
  maxWidth: 300,
  fontStyle: "italic",
  fontFamily: "鸿雷行书简体",
});

const huanzi = new CustomButton({
  child: new TextBox("换字", {
    fontSize: screenUtil1.setSp(26),
  }),
});
huanzi.setSenseRadius(screenUtil1.setSp(36));
huanzi.setId("huanzi1");
textBox2.installMultipleButtons(
  [
    new DragButton(),
    new RotateButton({
      alignment: Alignment.topLeft,
    }),
    new MirrorButton({
      alignment: Alignment.bottomLeft,
    }),
    huanzi,
  ].map((_) => {
    _.setSenseRadius(screenUtil1.setSp(50));
    return _;
  })
);
textBox2.setId("text1");
// textBox2.setDecoration({
//   backgroundImage:null,
// })
// loadToGesti(textBox2);
textBox2.toCenter();
textBox2.setLayer(11);

const gradient = new LineGradientDecoration({
  colors: ["white", "black", "red"],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
});
console.log("序列", JSON.stringify(gradient));

const rect: Rectangle = new Rectangle({
  width: screenUtil1.setWidth(750),
  height: screenUtil1.setHeight(750),
  decoration: {
    // borderRadius: screenUtil1.setWidth(50),
    backgroundColor: "#ccc",
    // gradient: gradient,
    backgroundImage: new XImage({
      data: img2,
      width: img2.width,
      height: img2.height,
      url: img2.src,
    }),
  },
});
console.log(gesti);
console.log(rect.size);

doCenter(rect);
const drag = new DragButton({
  buttonOption: {
    alignment: Alignment.bottomRight,
  },
});

rect.setLayer(9);
rect.installButton(drag);
const huantu = new CustomButton({
  child: new TextBox("换图", {
    fontSize: screenUtil1.setSp(26),
  }),
});
huantu.setSenseRadius(screenUtil1.setSp(36));
huantu.setId("huantu1");
const buttons = [
  huantu,
  new RotateButton({
    alignment: Alignment.topLeft,
  }),
  new DragButton(),
  new MirrorButton({
    alignment: Alignment.bottomLeft,
  }),
];
buttons.forEach((_) => _.setSenseRadius(screenUtil1.setSp(50)));
// rect.installMultipleButtons(buttons);
// loadToGesti(rect);

const imageBox2 = new ImageBox(
  new XImage({
    data: img2,
    width: img2.width,
    height: img2.height,
    url: img2.src,
    scale: 0.5,
  })
);
imageBox2.installMultipleButtons(buttons);
imageBox2.setId("image1");
// loadToGesti(imageBox2);

const polygon = new Polygon({
  radius: screenUtil1.setSp(750),
  count: 5,
  decoration: {
    backgroundColor: "orange",
    // gradient: new LineGradientDecoration({
    //   colors: ["orange", "orange", "yellow"],
    //   begin: Alignment.topLeft,
    //   end: Alignment.bottomRight,
    // }),
    // backgroundImage:ximage
  },
});
const label: TextBox = new TextBox("你好", {
  color: "red",
  fontSize: screenUtil1.setSp(26),
});
const customButton = new CustomButton({
  child: label,
  onClick: () => {
    const duobianx: Polygon = controller.getViewObjectByIdSync("duobianx");
    duobianx.setDecoration({
      backgroundColor: ["red", "orange", "skyblue", "#ffffff"][
        ~~(Math.random() * 3)
      ],
    });
    duobianx.setCount(Math.floor(Math.random() * (10 - 3 + 1)) + 3);
  },
  option: {
    alignment: Alignment.topRight,
  },
});
customButton.setId("huanbian");
label.installButton(new DragButton());
polygon.setId("duobianx");
polygon.installMultipleButtons(
  [
    new HorizonButton("left"),
    new VerticalButton("top"),
    new VerticalButton("bottom"),
    new HorizonButton("right"),
    new DragButton(),
    customButton,
    new SizeButton(Alignment.topLeft),
    new MirrorButton({
      alignment: Alignment.bottomLeft,
    }),
  ].map((_) => {
    _.setSenseRadius(screenUtil1.setSp(50));
    return _;
  })
);
//loadToGesti(polygon);
polygon.toCenter();

// loadToGesti(aa);
const canvas2: HTMLCanvasElement = document.querySelector("#canvas2");
const canvas3: HTMLCanvasElement = document.querySelector("#canvas3");
const g3 = canvas3.getContext("2d", {
  willReadFrequently: true,
});

const g2 = canvas2.getContext("2d", {
  willReadFrequently: true,
});

canvas2.width = 200 * dev;
canvas2.height = 200 * dev;
canvas2.style.width = 200 + "px";
canvas2.style.height = 200 + "px";
canvas3.width = 1;
canvas3.height = 1;
const gesti2 = createGesti();
const gesti3 = createGesti();
const controller2 = gesti2.initialization({
  renderContext: g2,
  rect: {
    x: 0,
    y: canvas.height,
    canvasWidth: canvas2.width,
    canvasHeight: canvas2.height,
  },
});
console.log(controller2);

controller2.generateScreenUtils({
  devicePixelRatio: dev,
  designWidth: 750,
  designHeight: 750,
});
// gesti2.debug=true
gesti3.initialization({
  renderContext: g3,
  rect: {
    x: canvas3.getBoundingClientRect().left,
    y: canvas3.getBoundingClientRect().top,
    canvasWidth: canvas3.width * dev,
    canvasHeight: canvas3.height * dev,
  },
});

// const offScreenBuilder =
// Plugins.getPluginByKey<OffScreenCanvasBuilder>("offScreenBuilder");
// const offScreenCanvas = offScreenBuilder.buildOffScreenCanvas(1000, 1000);
// const offPainter = offScreenBuilder.buildOffScreenContext(offScreenCanvas);
// controller2.cancelEvent();
document.getElementById("import").addEventListener("click", () => {
  console.log("导入");
  gesti2.controller.cleanAll();
  gesti3.controller.cleanAll();

  const a = window.localStorage.getItem("aa");
  importAll(
    a,
    async (arr) => {
      arr.forEach((_) => {
        const huanbianButton = _.getButtonByIdSync<CustomButton>("huanbian");
        if (huanbianButton) {
          huanbianButton.onClick = () => {
            alert("哈哈哈");
          };
        }
      });
      return Promise.resolve(arr);
    },
    gesti2
  ).then((e) => {
    console.log(gesti2.controller.getScreenUtil());
    console.log("导入成功");
  });
  // importAll(a, null, gesti3).then((e) => {
  //   console.log("导入成功");
  // });
});

document.getElementById("export").addEventListener("click", () => {
  console.log("导出");
  controller.cancelAll();
  exportAll(gesti).then((json) => {
    console.log(json);
    window.localStorage.setItem("aa", json);
    console.log("导出成功");
    controller2.importAll(json).then((e) => {
      console.log("导入成功");
    });
  });
});

document.getElementById("input").addEventListener("input", (e: any) => {
  textBox2.setText(e.target?.value);
  console.log(e.target?.value);
});
controller.render();

async function main() {
  const text = new TextBox(`你好`, {
    fontSize: screenUtil1.setSp(300),
    stroke: true,
    fill: true,
    weight: "bold",
    strokeColor: "white",
    strokeLineWidth: screenUtil1.setSp(20),
    fillGradient: {
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: ["orange", "red"],
    },
    shadowBlur: 2,
    shadowColor: "#000",
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    fillShadow: true,
    strokeShadow: true,
  });
  text.installButton(new DragButton());
  // controller.load(text);
  controller.center(text);

  const clipWidth = 450,
    clipHeight = 420,
    clipX = 175,
    clipY = 185;
  const fixedImg = await loadImg(
    "https://s.cn.bing.net/th?id=OJ.ctIMyEUgdeHZwQ&w=120&h=160&c=8&rs=1&pid=academic"
  );

  const roundedXImage = new XImage({
    data: fixedImg,
    width: fixedImg.width,
    height: fixedImg.height,
    url: fixedImg.src,
    fit: BoxFit.fitHeight,
  });
  const rr = new Rectangle({
    width: screenUtil1.setWidth(750),
    height: screenUtil1.setHeight(300),
    decoration: {
      backgroundImage: roundedXImage,
    },
  }); //new ImageBox(roundedXImage);
  const scale = screenUtil1.fullWidth / fixedImg.width;
  const rectClip = new RectClipMask({
    width: clipWidth * scale,
    height: clipHeight * scale,
  });
  rectClip.setPosition(
    clipX * scale + rectClip.width * 0.5,
    clipY * scale + rectClip.height * 0.5
  );
  rr.installMultipleButtons([
    new DragButton({
      angleDisabled: true,
      buttonOption: {
        alignment: Alignment.topLeft,
        icon: new DefaultIcon(),
      },
    }),
    new DragButton({
      angleDisabled: true,
      buttonOption: {
        alignment: Alignment.topRight,
        icon: new DefaultIcon(),
      },
    }),
    new DragButton({
      angleDisabled: true,
      buttonOption: {
        alignment: Alignment.bottomRight,
        icon: new DefaultIcon(),
      },
    }),
    (() => {
      class MyButton extends DragButton {
        protected drawButton(
          position: Vector,
          size: Size,
          radius: number,
          paint: Painter
        ): void {
          paint.save();
          paint.beginPath();
          paint.arc(position.x, position.y, radius, 0, Math.PI * 2);
          paint.lineWidth = 1;
          paint.strokeStyle = "#69e7ff";
          paint.fillStyle = "#ffffff";
          paint.fill();
          paint.stroke();
          paint.closePath();
          paint.restore();
        }
      }
      const button = new MyButton({
        angleDisabled: true,
        buttonOption: {
          alignment: Alignment.bottomLeft,
          icon: new DefaultIcon(),
        },
      });
      button.displayBackground = false;
      return button;
    })(),
    new RotateButton({
      alignment: Alignment.format(-0.6, 1.2),
    }),
    new CloseButton({
      icon: new ImageIcon(
        new XImage({
          data: img,
          width: screenUtil1.setSp(30),
          height: screenUtil1.setSp(30),
          // url: img.src,
        })
      ),
      alignment: Alignment.format(0, 1.2),
    }),
  ]);
  controller.load(rr);
  // controller.load(rectClip);
  controller.center(rr);
  //屏蔽双指
  controller.cancelGesture();
  controller.updateText(text.value, {
    color: "red",
  });
  console.log("拿到矩形", rectClip.value);
  // setInterval(()=>{
  //   rr.replaceXImage(Math.random()>.5?ximage:roundedXImage);
  // },1000)
}
controller.addListener("onHide", (view) => {
  console.log("删除");
  setTimeout(() => {
    // controller.show(view);
  }, 1000);
});
async function loadImg(src): Promise<HTMLImageElement> {
  const bg = new Image();
  bg.src = src; //;
  bg.crossOrigin = "anonymous";
  await waitingLoadImg(bg);
  return Promise.resolve(bg);
}
for (let index = 0; index < 1; index++) {
  main();
}
if (controller.initialized) {
  controller.cancelEvent();
  document.addEventListener("mousedown", (e) => {
    controller.down(e);
  });
  document.addEventListener("mousemove", (e) => {
    controller.move(e);
  });
  document.addEventListener("mouseup", (e) => {
    controller.up(e);
  });
}
