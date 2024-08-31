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
import { Container } from "@/lib/widgets/widgets";
import { ImageSource } from "@/lib/painting/image";
import { BoxFit } from "@/lib/painting/box-fit";
import { ChangeNotifier } from "@/lib/core/change-notifier";
import { ScrollPosition } from "@/lib/rendering/viewport";
import { BouncingScrollPhysics } from "@/lib/core/scroll-physics";
import { AnimationController } from "@/lib/core/animation";

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

const notifier = new MyListener();
class ScaffoldState extends State<Scaffold> {
  private time: number = 1;
  private offset: ScrollPosition = new ScrollPosition({
    physics: new BouncingScrollPhysics(),
  });
  private dy: number = 0;
  private preDeltaY: number = 0;
  public initState(): void {
    super.initState();
    this.animate();
    // setInterval(()=>{
    //   this.setState(()=>{
    //     this.time+=1;
    //   });
    // },1000);
    // notifier.addListener(() => {
    //   this.setState(() => {
    //     this.time = notifier.counter;
    //   });
    // });
  }
  private animate() {
    this.setState(() => {
      //this.time += 1;
    });
    requestAnimationFrame(() => {
      this.offset.setPixels(this.offset.pixels - this.dy);
      this.dy *= 0.95;
      if (abs(this.dy) >= 0.01 && this.offset.pixels > 0) this.animate();
    });
  }
  build(context: BuildContext): Widget {
    return new Container({
      padding: {
        top: 100,
      },
      width: canvas.width * 0.5,
      height: 100,
      decoration: new BoxDecoration({
        border: Border.all({
          color: "orange",
        }),
      }),
      child: new GestureDetector({
        onPanUpdate: (event) => {
          this.offset.setPixels(this.offset.pixels - event.delta.offsetY);
          this.preDeltaY = event.delta.offsetY;
        },
        onPanEnd: (event) => {
          this.dy = this.preDeltaY;
          this.animate();
          // console.log( this.dy );
        },
        onTapDown: () => {
          this.dy = 0;
        },
        // onTap:()=>{
        //   this.offset.pixels += 10;
        //     //notifier.add();

        //   },
        child: new ViewPort({
          offset: this.offset,
          children: [
            ...Array.from(Array(9)).map((_, ndx) => {
              return new WidgetToSliverAdapter({
                child: new Container({
                  width: canvas.width * 0.5,
                  height: 30,
                  color: ndx % 2 === 0 ? "white" : "#edf2fa",
                  child: new Align({
                    alignment: Alignment.center,
                    child: new Text("item" + ndx),
                  }),
                }),
              });
            }),
          ],
        }),
      }),
    });
  }
  // build(context: BuildContext): Widget {
  //   return new SizedBox({
  //     width: 300, // canvas.width,
  //     height: canvas.height,
  //     child: new ColoredBox({
  //       color: "white",
  //       child: new Flex({
  //         direction: Axis.vertical,
  //         crossAxisAlignment: CrossAxisAlignment.center,
  //         children: [
  //           new Text("123"+this.time, {
  //             style: new TextStyle({
  //               fontSize: 10,
  //               fontWeight: FontWeight.bold,
  //             }),
  //           }),
  //           new Text("123", {
  //             style: new TextStyle({
  //               fontSize: 10,
  //               fontWeight: FontWeight.bold,
  //             }),
  //           }),
  //           new Container({
  //             width: 100,
  //             height: 100,
  //             child: new DecoratedBox({
  //               decoration: new BoxDecoration({
  //                 backgroundColor:'orange'
  //               }),
  //               child: new Image({
  //                 imageSource: new ImageSource({
  //                   image: img2,
  //                   width: img2.width,
  //                   height: img2.height,
  //                 }),
  //                 fit: BoxFit.fitHeight,
  //                 align: Alignment.center,
  //               }),
  //             }),
  //           }),
  //           // new Text(
  //           //   `Python 的 for 语句与 C 或 Pascal 中的不同。Python 的 for 语句不迭代算术递增数值（如 Pascal），或是给予用户定义迭代步骤和结束条件的能力（如 C），而是在列表或字符串等任意序列的元素上迭代，按它们在序列中出现的顺序。 例如（这不是有意要暗指什么）：`,
  //           //   {
  //           //     style: new TextStyle({
  //           //       fontSize: 10,
  //           //       // color:'orange',
  //           //       textAlign: TextAlign.justify,
  //           //     }),
  //           //   }
  //           // ),
  //           new GestureDetector({
  //             onTap: () => {
  //               this.setState(() => {
  //                 this.time += 0.1;
  //               });
  //             },
  //             child: new Padding({
  //               child: new Container({
  //                 decoration: new BoxDecoration({
  //                   backgroundColor: "#ccc",
  //                   border: Border.all({
  //                     color: "#58b6f0",
  //                   }),
  //                   borderRadius: BorderRadius.all(20),
  //                 }),
  //                 child: new Text(
  //                   `Python 的 for 语句与 C 或 Pascal 中的不同。Python 的 for 语句不迭代算术递增数值（如 Pascal），或是给予用户定义迭代步骤和结束条件的能力（如 C），而是在列表或字符串等任意序列的元素上迭代，按它们在序列中出现的顺序。 例如（这不是有意要暗指什么）：`,
  //                   {
  //                     style: new TextStyle({
  //                       fontSize: 10,
  //                       // color:'orange',
  //                       textAlign: TextAlign.justify,
  //                       decorationStyle: TextDecorationStyle.solid,
  //                       decorationColor: "orange",
  //                       decoration: TextDecoration.underline,
  //                     }),
  //                   }
  //                 ),
  //               }),
  //               padding: {
  //                 top: 20,
  //                 left: 20,
  //                 right: 20,
  //                 bottom: 20,
  //               },
  //             }),
  //           }),
  //           // new Text(
  //           //   `The Non-Uniform Border package provides a custom border class for Flutter that allows different widths for each side of a border with a single color. This can be useful for creating custom UI elements that require non-uniform border styling.`,
  //           //   {
  //           //     style: new TextStyle({
  //           //       fontSize: 10,
  //           //       // color:'orange',
  //           //       textAlign: TextAlign.justify,
  //           //     }),
  //           //   }
  //           // ),
  //           new Button(),
  //         ],
  //       }),
  //     }),
  //   });
  // }
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
  private time: number = 0;
  private animationController = new AnimationController();
  public initState(): void {
    super.initState();
    this.animationController.addListener(() => {
      this.setState(() => {
        this.time = canvas.height * this.animationController.value;
      });
      // console.log(this.time);
    });
    this.animationController.addStatusListener(() => {
      console.log("改变状态", this.animationController.status);
    });
    setTimeout(() => {
      this.animationController.reverse();
    }, 100 * this.widget.index);
    //  this.animate();
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
    return new GestureDetector({
      onTap: () => {
        // this.animate();
        this.animationController.forward();
      },
      child: new Container({
        decoration: new BoxDecoration({
          backgroundColor: "#2196f3",
          borderRadius: BorderRadius.all(10),
        }),
        width: 30,
        height: Math.max(90, this.time),
        // child: new Padding({
        //   padding: {
        //     top: 10,
        //     bottom: 10,
        //     left: abs(sin((Math.PI / 180) * this.time) * 100),
        //     right: abs(sin((Math.PI / 180) * this.time) * 100),
        //   },
        //   // child: new Text("Button" + this.time.toFixed(1), {
        //   //   style: new TextStyle({
        //   //     color: "white",
        //   //   }),
        //   // }),
        // }),
      }),
    });
  }
}

const app = new Container({
  width: canvas.width,
  height: canvas.height,
  child: new Flex({
    children: Array.from(new Array(30).fill(0)).map((_, ndx) => {
      return new Button(ndx);
    }),
  }),
}); // new Scaffold();
runApp(app);

// notifier.addListener(()=>{
//   console.log("change1");
// });

// notifier.addListener(()=>{
//   console.log("change2");
//   notifier.trigger();
// });

// notifier.addListener(()=>{
//   console.log("change3");
// });
