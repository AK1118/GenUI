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
import { FontWeight, TextAlign, TextStyle } from "@/lib/text-painter";
import { Container } from "@/lib/widgets/widgets";

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
  private time: number = 0;
  public initState(): void {
    super.initState();
    // this.animate();
    // setInterval(()=>{
    //   this.setState(()=>{
    //     this.time+=1;
    //   });
    // },1000);
  }
  private animate() {
    this.setState(() => {
      this.time += 1;
    });
    requestAnimationFrame(() => {
      this.animate();
    });
  }
  build(context: BuildContext): Widget {
    return new SizedBox({
      width: canvas.width,
      height: canvas.height,
      child: new ColoredBox({
        color: "white",
        child: new Flex({
          direction: Axis.vertical,
          children: [
            new Text("123", {
              style: new TextStyle({
                fontSize: 10,
                fontWeight: FontWeight.bold,
              }),
            }),
            new Text("123", {
              style: new TextStyle({
                fontSize: 10,
                fontWeight: FontWeight.bold,
              }),
            }),
            new Text(
              `Python 的 for 语句与 C 或 Pascal 中的不同。Python 的 for 语句不迭代算术递增数值如 Pascal如（这不是有意要暗指什么）：`
              ,{
              style: new TextStyle({
                fontSize: 14,
                color:'orange',
                // textAlign:TextAlign.justify,
                // fontWeight: FontWeight.bold,
              }),
            })
            // new Container({
            //   width: 10,
            //   height: 10,
            //   color: "white",
            //   padding:{
            //     top:10,
            //     left:10,
            //     right:10,
            //     bottom:10,
            //   },
            //   child: new Container({
            //     width: 100,
            //     height: 100,
            //     decoration:new BoxDecoration(
            //       {
            //         backgroundColor:"orange",
            //         borderRadius:BorderRadius.all(10),
            //         border:Border.all({
            //           color:"white",
            //           width:1,
            //         }),

            //       }
            //     )
            //   }),
            // }),
          ],
        }),
      }),
    });
  }
  //   return new SizedBox({
  //     width: canvas.width,
  //     height: canvas.height,
  //     child: new Flex({
  //       direction: Axis.vertical,
  //       mainAxisAlignment: MainAxisAlignment.start,
  //       children: [
  //         new DecoratedBox({
  //           decoration: new BoxDecoration({
  //             backgroundColor: "#2196f3",
  //             shadows: [
  //               new BoxShadow({
  //                 shadowBlur: 3,
  //                 shadowColor: "#ccc",
  //                 shadowOffsetX: 0,
  //                 shadowOffsetY: 3,
  //               }),
  //             ],
  //           }),
  //           child: new Padding({
  //             padding: {
  //               top: 15,
  //               left: 15,
  //               right: 15,
  //               bottom: 15,
  //             },
  //             child: new Flex({
  //               mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //               crossAxisAlignment: CrossAxisAlignment.center,
  //               children: [
  //                 new Text({
  //                   text: "Flutter 圆角描边示例",
  //                   style: new TextStyle({
  //                     color: "white",
  //                     fontWeight: FontWeight.bold,
  //                   }),
  //                 }),
  //                 new SizedBox({}),
  //               ],
  //             }),
  //           }),
  //         }),
  //         new Expanded({
  //           flex: 2,
  //           child: new ColoredBox({
  //             color: "white",
  //             child:new SizedBox({
  //               // width:100,
  //               child:new Flex({
  //                 direction:Axis.vertical,
  //                 crossAxisAlignment:CrossAxisAlignment.stretch,
  //                 children:[
  //                   new ColoredBox({
  //                     color:"orange",
  //                     child:new SizedBox({
  //                       width:10,
  //                       height:10,
  //                     })
  //                   }),
  //                   new ColoredBox({
  //                     color:"blue",
  //                     child:new SizedBox({
  //                       width:20,
  //                       height:20,
  //                     })
  //                   }),
  //                 ]
  //               })
  //             })
  //           })
  //         }),
  //       ],
  //     }),
  //   });
  // }
}

const app = new Scaffold();
runApp(app);
