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
  SizedBox,
  Stack,
  Text,
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
import { FontWeight, TextStyle } from "@/lib/text-painter";

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

class ScaffoldState extends State<Scaffold> {
  private time:number=0;
  public initState(): void {
      super.initState();
      // this.animate();
      setInterval(()=>{
        this.setState(()=>{
          this.time+=1;
        });
      },1000);
    }
  private animate(){
    this.setState(()=>{
      this.time+=1;
    });
    requestAnimationFrame(()=>{
      this.animate();
    })
  }
  build(context: BuildContext): Widget {
    return new SizedBox({
      width: canvas.width,
      height: canvas.height,
      child: new Flex({
        direction: Axis.vertical,
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          new DecoratedBox({
            decoration: new BoxDecoration({
              backgroundColor: "#2196f3",
              shadows: [
                new BoxShadow({
                  shadowBlur: 3,
                  shadowColor: "#ccc",
                  shadowOffsetX: 0,
                  shadowOffsetY: 3,
                }),
              ],
            }),
            child: new Padding({
              padding: {
                top: 15,
                left: 15,
                right: 15,
                bottom: 15,
              },
              child: new Flex({
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  new Text({
                    text: "Flutter 圆角描边示例",
                    style: new TextStyle({
                      color: "white",
                      fontWeight: FontWeight.bold,
                    }),
                  }),
                  new SizedBox({}),
                ],
              }),
            }),
          }),
          new Expanded({
            flex: 1,
            child: new Padding({
              padding: {
                top: 15,
                left: 15,
                right: 15,
                bottom: 15,
              },
              child: Transform.rotate({
                angle:Math.PI/180*this.time,
                alignment: Alignment.center,
                child: new DecoratedBox({
                  decoration: new BoxDecoration({
                    backgroundColor: "white",
                    border: Border.all({
                      color: "#ccc",
                      width: 1,
                    }),
                    borderRadius: BorderRadius.all(10),
                    shadows: [
                      new BoxShadow({
                        shadowBlur: 3,
                        shadowColor: "#ccc",
                        shadowOffsetX: 0,
                        shadowOffsetY: 3,
                      }),
                    ],
                  }),
                  child: new Flex({
                    direction: Axis.vertical,
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      new Text({
                        text: "   使用仅限位置形参，可以让用户无法使用形参名。形参名没有实际意义时，强制调用函数的实参顺序时，或同时接收位置形参和关键字时，这种方式很有用。",
                        style: new TextStyle({
                          fontSize: 14,
                          color: "#b6b6b6",
                        }),
                      }),
                      new Text({
                        text: "   使用仅限位置形参，可以让用户无法使用形参名。形参名没有实际意义时，强制调用函数的实参顺序时，或同时接收位置形参和关键字时，这种方式很有用。",
                        style: new TextStyle({
                          fontSize: 14,
                          color: "#b6b6b6",
                        }),
                      }),
                    ],
                  }),
                }),
              }),
            }),
          }),
        ],
      }),
    });
  }
}

const app = new Scaffold();
runApp(app);
