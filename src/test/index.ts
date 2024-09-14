import Painter from "@/lib/painting/painter";
import { Binding } from "../lib/basic/binding";
import { BuildContext, Element } from "../lib/basic/elements";
import { Offset, Size } from "@/lib/basic/rect";
import {
  Align,
  ClipRRect,
  ColoredBox,
  CustomPaint,
  DecoratedBox,
  Expanded,
  Flex,
  GestureDetector,
  Image,
  Listener,
  Padding,
  Positioned,
  SizedBox,
  Stack,
  Text,
  Transform,
  ViewPort,
  WidgetToSliverAdapter,
  // ViewPort,
  Wrap,
} from "@/lib/widgets/basic";
import {
  MultiChildRenderObjectWidget,
  State,
  StatefulWidget,
  StatelessWidget,
  Widget,
} from "@/lib/basic/framework";
import Alignment from "@/lib/painting/alignment";
import { BoxConstraints } from "@/lib/rendering/constraints";
import Vector from "@/lib/math/vector";
import runApp from "@/index";
import {
  abs,
  cos,
  fract,
  radiansPerDegree,
  random,
  sin,
} from "@/lib/math/math";
import { GlobalKey } from "@/lib/basic/key";
import { getRandomColor } from "@/lib/utils/utils";
import { Matrix4 } from "@/lib/math/matrix";
import { BoxDecoration } from "@/lib/painting/decoration";
import BorderRadius from "@/lib/painting/radius";
import { Border, BorderSide } from "@/lib/painting/borders";
import BoxShadow from "@/lib/painting/shadow";
import {
  FontWeight,
  TextAlign,
  TextDecoration,
  TextDecorationStyle,
  TextStyle,
} from "@/lib/text-painter";
import { Container, Scrollable } from "@/lib/widgets/widgets";
import { ImageSource } from "@/lib/painting/image";
import { BoxFit } from "@/lib/painting/box-fit";
import { ChangeNotifier } from "@/lib/core/change-notifier";
import { ScrollPosition } from "@/lib/render-object/viewport";
import {
  BouncingScrollPhysics,
  SimpleScrollPhysics,
} from "@/lib/core/scroll-physics";
import { AnimationController, AnimationStatus } from "@/lib/core/animation";
import { Duration } from "@/lib/core/duration";
import {
  Axis,
  AxisDirection,
  CrossAxisAlignment,
  MainAxisAlignment,
  StackFit,
} from "@/lib/core/base-types";
import { ScrollController } from "@/lib/widgets/scroll-controller";
import {CustomPainter} from "@/lib/rendering/custom";

const canvas: HTMLCanvasElement = document.querySelector("#canvas");
const img2: HTMLImageElement = document.querySelector("#bg");

const dev = window.devicePixelRatio;
const width = 300;
const height = 300;
console.log("DPR：", dev);
canvas.width = width * dev;
canvas.height = height * dev;
canvas.style.width = width + "px";
canvas.style.height = height + "px";
const g = canvas.getContext("2d", {
  // willReadFrequently: true,
});
// g.imageSmoothingEnabled = false;
Painter.setPaint(g);

class Scaffold extends StatefulWidget {
  createState(): State<Scaffold> {
    return new ScaffoldState();
  }
}

class MyListener extends ChangeNotifier {
  public counter: number = 0;
  trigger() {
    this.notifyListeners();
  }
  add() {
    this.counter += 1;
    this.notifyListeners();
  }
}

class MyCustomPainter extends CustomPainter {
  render(painter: Painter, size: Size): void {
    console.log("渲染", size);
    painter.fillStyle = "orange";
    painter.fillRect(0, 0, 10, 10);
  }
}
class MyForgoundCustomPainter extends CustomPainter {
  render(painter: Painter, size: Size): void {
    console.log("渲染", size);
    painter.fillStyle = "orange";
    // painter.clip();
    // painter.fillRect(0,0,10,10);
    painter.fillText("\ue89e\ue7cc", 10, 10);
  }
}

const controller = new ScrollController();
const controller2 = new ScrollController();
class ScaffoldState extends State<Scaffold> {
  private time: number = 1;
  private dy: number = 0;
  private preDeltaY: number = 0;
  public initState(): void {
    super.initState();
    console.log("创建A");
    // controller.addListener(() => {
    //   console.log("position", controller.offset);
    // });
    setTimeout(() => {
      // this.animateTo();
    });
  }
  private animateTo() {
    controller
      .animateTo(
        Math.random() * controller.position.maxScrollExtent,
        new Duration({
          milliseconds: 3000,
        })
      )
      .then(() => {
        setTimeout(() => {
          this.animateTo();
        }, 3000);
      });
  }
  build(context: BuildContext): Widget {
    return new Container({
      width: canvas.width,
      height: canvas.height,
      decoration: new BoxDecoration({
        border: Border.all({
          color: "orange",
        }),
      }),
      child: new Padding({
        padding: {
          top: 30,
          left: 30,
          right: 30,
          bottom: 30,
        },
        child: new CustomPaint({
          painter: new MyCustomPainter(),
          foregroundPainter: new MyForgoundCustomPainter(),
          child: new Container({
            decoration: new BoxDecoration({
              shadows: [
                new BoxShadow({
                  shadowColor: "#ccc",
                  shadowBlur: 3,
                  shadowOffsetX: 3,
                  shadowOffsetY: 3,
                }),
              ],
            }),
            child: new Scrollable({
              controller: controller,
              axisDirection: AxisDirection.down,
              physics: new BouncingScrollPhysics(),
              viewportBuilder(context, position) {
                return new ViewPort({
                  offset: position,
                  axisDirection: position.axisDirection,
                  children: [
                    ...Array.from(Array(100)).map((_, ndx) => {
                      return new WidgetToSliverAdapter({
                        child: new Container({
                          width: canvas.width,
                          height: 150,
                          color: ndx % 2 === 0 ? "white" : "#edf2fa",
                          // child: new Image({
                          //   imageSource: new ImageSource({
                          //     image: img2,
                          //   }),
                          //   fit:BoxFit.fitWidth
                          // }),
                          child: new Align({
                            alignment: Alignment.center,
                            child: new Button(ndx),
                          }),
                        }),
                      });
                    }),
                  ],
                });
              },
            }),
          }),
        }),
      }),
    });
  }
}

class Button extends StatefulWidget {
  index: number;
  constructor(index: number) {
    super();
    this.index = index;
  }
  createState(): State {
    return new _ButtonState();
  }
}

class _ButtonState extends State<Button> {
  private time: number;
  public initState(): void {
    super.initState();
    this.time = this.widget.index;
  }
  build(context: BuildContext): Widget {
    return new GestureDetector({
      onTap: () => {
        this.setState(() => {
          this.time += 1;
        });
      },
      child: new Container({
        padding: {
          top: 10,
          bottom: 10,
          left: 20,
          right: 20,
        },
        decoration: new BoxDecoration({
          backgroundColor: "#edf2fa",
          borderRadius: BorderRadius.all(10),
        }),
        child: new Flex({
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [new Text(`${this.time}`)],
        }),
      }),
    });
  }
}
/**
 * <i class="material-icons-round md-36">logout</i> &#x2014; material icon named "logout" (round).
 */
const test = "123";
const app =
  //  new Container({
  //   width: canvas.width,
  //   height: canvas.height,
  //   child: new Flex({
  //     children: Array.from(new Array(2).fill(0)).map((_, ndx) => new Button(ndx)),
  //   }),
  //});
  new Scaffold();
// runApp(app);

// img2.onload = () => {
//   // const path = new Path2D();
//   // path.rect(0, 0, 100, 100);
//   // path.arc(50, 50, 25, 0, Math.PI * 2, true);

//   // g.save();
//   // g.shadowColor = "#000";
//   // g.shadowBlur = 3;
//   // g.shadowOffsetX = 3;
//   // g.shadowOffsetY = 3;
//   // g.fillStyle = "white";
//   // g.fill(path);
//   // g.restore();

//   // g.save();
//   // g.clip(path);
//   // g.drawImage(img2, 0, 0, 100, 100);
//   // g.restore();
//   // 绘制矩形和圆形路径
//   g.save();
//   g.beginPath();
//   g.rect(0, 0, 100, 100);
//   g.arc(50, 50, 25, 0, Math.PI * 2,true);

//   // 应用阴影并填充路径
//   g.shadowColor = "#ccc";
//   g.shadowBlur = 3;
//   g.shadowOffsetX = 3;
//   g.shadowOffsetY = 3;
//   g.fillStyle = "white";
//   g.fill();
//   g.restore();

//   // 使用路径剪裁并绘制图像
//   g.save();
//   g.beginPath();
//   g.rect(0, 0, 100, 100);
//   g.arc(50, 50, 25, 0, Math.PI * 2, true);
//   g.clip();
//   g.drawImage(img2, 0, 0, 100, 100);
//   g.restore();
// };
function drawRoundedStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  cornerRadius: number
): void {
  const angle = Math.PI / spikes;

  ctx.beginPath();
  let startX = cx + Math.cos(0) * outerRadius;
  let startY = cy + Math.sin(0) * outerRadius;
  ctx.moveTo(startX, startY);

  for (let i = 0; i < spikes * 2+1; i++) {
    const isOuter = i % 2 === 0;
    const radius = isOuter ? outerRadius : innerRadius;
    const nextX = cx + Math.cos(i * angle) * radius;
    const nextY = cy + Math.sin(i * angle) * radius;

    if (i === 0) {
      ctx.moveTo(nextX, nextY);
    } else {
      ctx.arcTo(startX, startY, nextX, nextY, cornerRadius);
    }
    
    startX = nextX;
    startY = nextY;
  }

  ctx.closePath();
  ctx.fillStyle = "#ffcc00";  // Star color
  ctx.fill();
  ctx.strokeStyle = "#000000"; // Border color
  ctx.lineWidth = 3;
  ctx.stroke();
}



drawRoundedStar(g, 100, 100, 6, 100, 50, 10);