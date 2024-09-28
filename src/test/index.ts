import Painter from "@/lib/painting/painter";
import { Binding } from "../lib/basic/binding";
import { BuildContext, Element } from "../lib/basic/elements";
import { Offset, Size } from "@/lib/basic/rect";
import {
  Align,
  ClipPath,
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
import {BorderRadius} from "@/lib/painting/radius";
import { Border, BorderSide } from "@/lib/painting/borders";
import BoxShadow from "@/lib/painting/shadow";
import { Column, Container, Row, Scrollable, SingleChildScrollView } from "@/lib/widgets/widgets";
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
import { ScrollBar, ScrollController } from "@/lib/widgets/scroll";
import { CustomClipper, CustomPainter } from "@/lib/rendering/custom";
import { Path2D } from "@/lib/rendering/path-2D";
import {GenPlatformConfig} from "@/lib/core/platform";
import MyPost from "./test";
import ScreenUtils from "./screen-utils";
import { Colors,Color  } from "@/lib/painting/color";
import { LinearGradient, RadialGradient, SweepGradient } from "@/lib/painting/gradient";
import { SliverChildBuilderDelegate, SliverChildDelegate, SliverList, SliverMultiBoxAdaptorElement, SliverMultiBoxAdaptorParentData, SliverMultiBoxAdaptorRenderView } from "@/lib/widgets/sliver";

const canvas: HTMLCanvasElement = document.querySelector("#canvas");
const img2: HTMLImageElement = document.querySelector("#bg");

const dev = window.devicePixelRatio;
const width = window.innerWidth;
const height = window.innerHeight;
console.log("DPR：", dev);
canvas.width = width * dev;
canvas.height = height * dev;
canvas.style.width = width + "px";
canvas.style.height = height + "px";

const g = canvas.getContext("2d", {
  // willReadFrequently: true,
});

GenPlatformConfig.InitInstance({
  screenWidth: width,
  screenHeight: height,
  devicePixelRatio: dev,
  debug: false,
  canvas: canvas,
  renderContext: g,
});

export const screenUtil = new ScreenUtils({
  canvasWidth: canvas.width,
  canvasHeight: canvas.height,
  devicePixelRatio: dev,
});

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

class Model extends ChangeNotifier {
  x: number = 0;
  y: number = 0;
  setXY(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.notifyListeners();
  }
}

class MyClipper extends CustomClipper {
  model: Model;
  constructor(model) {
    super(model);
    this.model = model;
    window.addEventListener("mousemove", (e) => {
      this.model.setXY(e.clientX, e.clientY);
    });
  }
  getClip(offset: Vector, size: Size): Path2D {
    const path2d = new Path2D();
    this.drawRoundedStar(
      path2d,
      this.model.x - offset.x,
      this.model.y - offset.y,
      10,
      100,
      50,
      10
    );
    // path2d.rect(0, 0, size.width, size.height);
    // path2d.arc(this.model.x-offset.x, this.model.y-offset.y, 50, 0, Math.PI * 2, true);
    return path2d;
  }
  drawRoundedStar(
    ctx: Path2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    cornerRadius: number
  ): void {
    const angle = Math.PI / spikes;
    spikes += 1;
    let startX = cx + Math.cos(0) * outerRadius;
    let startY = cy + Math.sin(0) * outerRadius;
    ctx.moveTo(startX, startY);

    for (let i = 0; i < spikes * 2; i++) {
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
  }
}
/**
 * updatePositions时创建一个
 *
 */
class ScaffoldState extends State<Scaffold> {
  private time: number = 1;
  private dy: number = 0;
  private preDeltaY: number = 0;
  private list: Array<number> = new Array(20).fill(0);
  public initState(): void {
    super.initState();
    console.log("创建A");
    // controller.addListener(() => {
    //   console.log("position", controller.offset);
    // });
    setTimeout(() => {
      // this.animateTo();
      // controller.animateTo(150*2000,new Duration({
      //   milliseconds:6000,
      // }))
      // this.setState(() => {
      //   this.time += 1;
      //   // this.list=new Array(30).fill(0);
      //   console.log("数据", this.list);
      // });
      // this.setState(()=>{
      //   this.list.push(...new Array(100).fill(0));
      // })
    }, 3000);
    controller.addListener(() => {
      if (controller.offset >= controller.position.maxScrollExtent - 200) {
        this.setState(() => {
          this.list.push(...new Array(10).fill(0));
        });
      }
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
      padding: {
        top: 100,
        left: 0,
        right: 0,
        bottom: 100,
      },
      alignment: Alignment.center,
      decoration: new BoxDecoration({
        backgroundColor: new Color(0xffffffff),
      }),
      child: new Flex({
        direction: Axis.horizontal,
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          new Expanded({
            flex: 1,
            child: new Scrollable({
              controller: controller,
              axisDirection: AxisDirection.down,
              physics: new BouncingScrollPhysics(),
              viewportBuilder: (context, position) => {
                return new ViewPort({
                  offset: position,
                  axisDirection: position.axisDirection,
                  children: this.list.map((_, ndx) => {
                    return new WidgetToSliverAdapter({
                      child: new Container({
                        width: canvas.width,
                        // height: ,
                        color:
                          ndx % 2 === 0
                            ? new Color(0xffffffff)
                            : new Color(0xffedf2fa),
                        child: new Align({
                          alignment: Alignment.center,
                          child: new Button(ndx),
                        }),
                      }),
                    });
                  }),
                });
              },
            }),
          }),
        ],
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
    return new Container({
      padding: {
        top: 10,
        bottom: 10,
        left: 20,
        right: 20,
      },
      // decoration: new BoxDecoration({
      //   backgroundColor: "#edf2fa",
      // }),
      child: new Text(`${this.time}`),
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
  // new Scaffold();
  new MyPost();

class Test extends StatefulWidget {
  createState(): State {
    return new TestState();
  }
 }
class TestState extends State<Test> {
  private controller:AnimationController;
  public initState(): void {
    super.initState();
    this.controller=new AnimationController({
      duration:new Duration({milliseconds:500}),
    });
    this.controller.addListener(()=>{
      this.setState(()=>{
        if(this.controller.isCompleted){
          this.controller.reverse();
        }
      })
    });
  }
  build(context: BuildContext): Widget {
    return new GestureDetector({
      onTap:()=>{
        this.controller.forward();
        console.log("动画开始")
      },
      child:new Container({
        decoration:new BoxDecoration({
          backgroundColor:Colors.white.lerp(Colors.orange,this.controller.value),
         }),
        // width:100,
        height:this.controller.value*40+40,
        // color:Colors.white,
      })
    })
  }
}



runApp(
  new Container({
    width:canvas.width,
    height:canvas.height,
    child:new SingleChildScrollView({
      child:new SliverList(
        new SliverChildBuilderDelegate({
          builder:(context, index) =>{
              return new Container({
                width:100,
                height:100,
                color:Colors.orange,
              })
          },
        })
      )
      // child:new Container({
      //   width:canvas.width,
      //   child:new Column({
      //     crossAxisAlignment:CrossAxisAlignment.stretch,
      //     children:Array.from(new Array(2000)).map(_=>{
      //         return new Padding({
      //           padding:{
      //             bottom:10,
      //           },
      //           child: new Test()
      //         });
      //       })
      //   })
      // })
    })
  })
);
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
