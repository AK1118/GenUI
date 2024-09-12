import Painter from "@/lib/painting/painter";
import { Binding } from "../lib/basic/binding";
import { BuildContext, Element } from "../lib/basic/elements";
import { Offset, Size } from "@/lib/basic/rect";
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
} from "@/lib/core/base-types";
import { ScrollController } from "@/lib/widgets/scroll-controller";

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
      child: new Flex({
        direction: Axis.horizontal,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          new Expanded({
            flex: 1,
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
                            child:new Button(ndx)
                          }),
                        }),
                      });
                    }),
                  ],
                });
              },
            }),
          }),
          // new Expanded({
          //   flex: 1,
          //   child:new Flex({
          //     direction:Axis.vertical,
          //     children: Array.from(Array(10)).map((_, ndx) => {
          //       return new Container({
          //         width: canvas.width,
          //         height: 150,
          //         color: ndx % 2 === 0 ? "white" : "#edf2fa",
          //         child: new Align({
          //           alignment: Alignment.center,
          //           child: new Button(ndx),
          //         }),
          //       })
          //     })
          //   })})
        ],
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
  private time: number;
  public initState(): void {
      super.initState();
this.time=this.widget.index;
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
          top: 10 ,
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
runApp(app);

const t = new Duration({
  second: 60 * 60 * 12,
});

console.log(
  "秒",
  t.valueWithSeconds,
  "毫秒",
  t.valueWithMilliseconds,
  "分",
  t.valueWithMinutes,
  "时",
  t.valueWithHours,
  "天",
  t.valueWithDays
);
g.font = "20px Material";
g.fillStyle = "orange";
g.fillText("\ue89e\ue7cc", 100, 100);
// function animate(y:number=Math.random()*300){
//   const animation = new AnimationController({
//     duration: new Duration({
//       milliseconds: 1000,
//     }),
//   });

//   g.fillStyle = "#ffffff";
//   animation.addListener(() => {

//     g.fillRect(0,y,animation.value*canvas.width,30)
//   });

//   animation.addStatusListener(() => {
//     if (animation.status == AnimationStatus.completed && !animation.isAnimating) {
//       animation.reverse();
//     } else if (
//       animation.status === AnimationStatus.dismissed &&
//       !animation.isAnimating
//     ) {
//       animation.forward();
//     }
//   });

//   animation.forward();
// }

// animate(0);
// animate(30);
// animate(70);
// animate(130);
// animate(160);
// animate(190);
