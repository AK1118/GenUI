import Painter from "@/lib/painting/painter";
import { Binding } from "../lib/basic/binding";
import { BuildContext, Element } from "../lib/basic/elements";
import { Offset, Size } from "@/lib/basic/rect";
import {
  Axis,
  ContainerRenderViewParentData,
  CrossAxisAlignment,
  MainAxisAlignment,
  MultiChildRenderView,
  PlaceholderRenderView,
  RenderView,
  StackFit,
  WrapAlignment,
  WrapCrossAlignment,
} from "@/lib/render-object/basic";
import {
  Align,
  ClipRRect,
  ColoredBox,
  DecoratedBox,
  Expanded,
  Flex,
  GestureDetector,
  Listener,
  Padding,
  Positioned,
  SizeBox,
  Stack,
  Transform,
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
// g.scale(dev, dev);
class Ful extends StatefulWidget {
  createState(): State {
    return new StateTest();
  }
}

class StateTest extends State {
  private size: Size = new Size(10, 10);
  private delta: number = 3;
  private force: number = 0.01;
  private time: number = 0;
  private waveSpeed: number = 0.01;
  private waveFrequency: number = 0.01;
  private flex: number = 0;
  private vec: Vector = Vector.zero;
  public initState(): void {
    //  this.handleAnimate();
    // setInterval(() => {
    //   g.clearRect(0, 0, canvas.width, canvas.height);
    //   this.setState(() => {
    //     this.flex += 1;
    //   });
    // }, 1000);
  }

  handleAnimate() {
    this.time += this.waveSpeed;
    requestAnimationFrame(() => {
      g.clearRect(0, 0, canvas.width, canvas.height);
      this.force += 0.01;
      this.setState(() => {
        if (this.force > 1) {
          this.force = 0.9;
        }
      });
      this.handleAnimate();
    });
  }

  private buildV(color: string, opacity: number): SizeBox {
    return new SizeBox({
      width: 30,
      height: 30,
      child: new Flex({
        direction: Axis.vertical,
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          new ColoredBox({
            color: `rgba(239, 239, 239, ${opacity})`,
            child: new SizeBox({ width: 10, height: 10 }),
          }),
          new Flex({
            direction: Axis.horizontal,
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              new ColoredBox({
                color: `rgba(239, 239, 239, ${opacity})`,
                child: new SizeBox({ width: 10, height: 10 }),
              }),
              new ColoredBox({
                color,
                child: new SizeBox({ width: 10, height: 10 }),
              }),
              new ColoredBox({
                color: `rgba(239, 239, 239, ${opacity})`,
                child: new SizeBox({ width: 10, height: 10 }),
              }),
            ],
          }),
          new ColoredBox({
            color: `rgba(239, 239, 239, ${opacity})`,
            child: new SizeBox({ width: 10, height: 10 }),
          }),
        ],
      }),
    });
  }

  buildRow(rowIndex: number): Widget {
    const rows = Math.ceil(canvas.height / 40);
    // console.log("行",rows);
    const children = [];
    for (let j = 0; j < rows; j++) {
      const opacity =
        (Math.sin((this.time + rowIndex * this.waveFrequency) * 2 * Math.PI) +
          1) /
        2;
      children.push(this.buildV(`rgba(135, 238, 44, ${opacity})`, opacity));
    }
    return new Flex({
      children,
    });
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
  private globalKey = new GlobalKey();

  build(context: BuildContext): Widget {
    return new SizeBox({
      width: canvas.width,
      height: canvas.height,
      child: new Stack({
        children: [
          ...Array.from(new Array(1)).map((_) => {
            return new Slider();
          }),
        ],
      }),
    });
  }
}

class Slider extends StatefulWidget {
  constructor() {
    super();
  }
  createState(): State {
    return new SliderState();
  }
}

class SliderState extends State<Slider> {
  private position: Vector = new Vector(0, 0);
  private time: number = 3;
  private color: string = "#efefef";
  public initState(): void {
    // setInterval(() => {
    //   this.animation();
    // }, 100);
    // this.animation();
  }
  private animation() {
    this.setState(() => {
      this.time += 0.01;
      g.clearRect(0, 0, canvas.width, canvas.height);
    });
    requestAnimationFrame(() => {
      this.animation();
    });
  }
  //只要时RenderObjectWidget的子类，就会自动刷新
  //不是就不会刷新
  build(context: BuildContext): Widget {
    return new Positioned({
      top: this.position.y,
      left: this.position.x,
      child: new GestureDetector({
        onTapDown: () => {
          this.setState(() => {
            this.time=1
           });
        },
        onTap: () => {
          console.log("Tap");
        },
        onTapUp: () => {
         this.setState(() => {
          this.time=3;
         });
        },
        onTapCancel: () => {
          console.log("Cancel");
        },
        onDoubleTap: () => {
          this.setState(() => {
            this.color = getRandomColor();
          });
        },
        onLongPress: () => {
          console.log("LongPress");
        },
        onPanUpdate: (event) => {
          this.setState(() => {
            this.position.add(
              new Vector(event.delta.offsetX, event.delta.offsetY)
            );
          });
        },
        child:new DecoratedBox({
          decoration: new BoxDecoration({
            backgroundColor: "white",
            borderRadius:BorderRadius.all(10),
            shadows:[
              new BoxShadow({
                shadowColor:"#ccc",
                shadowBlur:this.time,
                shadowOffsetX:this.time,
                shadowOffsetY:this.time,
              }),
            ],
            // border: Border.all({
            //   color: "orange",
            //   width: 1,
            // }),
            // border: Border.only({
            //   top: new BorderSide({
            //     color: "orange",
            //     // dashed:[3,3],
            //     width: 10,
            //   }),
            //   right: new BorderSide({
            //     color: "blue",
            //     // dashed:[3,3],
            //     width: 10,
            //   }),
            //   bottom: new BorderSide({
            //     color: "orange",
            //     // dashed:[3,3],
            //     width: 10,
            //   }),
            //   left: new BorderSide({
            //     color: "blue",
            //     // dashed:[3,3],
            //     width: 10,
            //   }),
            // }),
          }),
          child: new SizeBox({
            width:100,
            height: 30,
            child: new Align({
              child: new ColoredBox({
                color: this.color,
                child: new SizeBox({
                  width: 10 + sin(this.time) * 10,
                  height: 100,
                }),
              }),
            }),
          }),
        }),
      }),
    });
  }
}

class A extends StatelessWidget {
  child: Widget;
  constructor(child: Widget) {
    super();
    this.child = child;
  }
  build(context: BuildContext): Widget {
    return this.child; //new TestW();
  }
}

class TestW extends StatefulWidget {
  child: Widget;
  constructor(child: Widget) {
    super();
    this.child = child;
  }
  createState(): State {
    return new TestState();
  }
}

class TestState extends State<TestW> {
  build(context: BuildContext): Widget {
    return new ColoredBox({
      color: "#efefef",
      child: new Padding({
        padding: {
          top: 10,
          left: 10,
          right: 10,
          bottom: 10,
        },
        child: new Listener({
          child: this.widget.child,
        }),
      }),
    });
  }
}

const view = //new V(new Size(100,100))//new ColoredBox("white",new SizeBox(200,200))//
  new Ful();

runApp(view);

// new Painter().setShadow({
//   shadowBlur:3,
//   shadowColor:"black",
//   shadowOffsetX:10,
//   shadowOffsetY:10,
// });
