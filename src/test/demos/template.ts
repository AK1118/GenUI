import Painter from "@/lib/painting/painter";
import { Offset, Size } from "@/lib/basic/rect";
import {
  Align,
  ClipPath,
  ClipRRect,
  ColoredBox,
  ConstrainedBox,
  CustomPaint,
  DecoratedBox,
  Expanded,
  Flex,
  GestureDetector,
  Image as ImageWidget,

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

import Alignment from "@/lib/painting/alignment";
import { BoxConstraints } from "@/lib/rendering/constraints";
import Vector from "@/lib/math/vector";
import runApp, { BuildContext } from "@/index";
import {
  abs,
  cos,
  fract,
  radiansPerDegree,
  random,
  sin,
} from "@/lib/math/math";
import { GlobalKey } from "@/lib/basic/key";
import { getRandomColor, getRandomStrKey } from "@/lib/utils/utils";
import { Matrix4 } from "@/lib/math/matrix";
import { BoxDecoration } from "@/lib/painting/decoration";
import { BorderRadius } from "@/lib/painting/radius";
import { Border, BorderSide } from "@/lib/painting/borders";
import BoxShadow from "@/lib/painting/shadow";
import {
  Column,
  Container,
  Row,
  Scrollable,
  ScrollView,
  SingleChildScrollView,
} from "@/lib/widgets/widgets";
import { BoxFit } from "@/lib/painting/box-fit";
import { ChangeNotifier, Listenable } from "@/lib/core/change-notifier";
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
  TextAlign,
  WrapAlignment,
  WrapCrossAlignment,
} from "@/lib/core/base-types";
import { ScrollBar, ScrollController } from "@/lib/widgets/scroll";
import { CustomClipper, CustomPainter } from "@/lib/rendering/custom";
import { Path2D } from "@/lib/rendering/path-2D";
import { GenPlatformConfig } from "@/lib/core/platform";
import { Colors, Color } from "@/lib/painting/color";
import {
  LinearGradient,
  RadialGradient,
  SweepGradient,
} from "@/lib/painting/gradient";
import {
  SliverChildBuilderDelegate,
  SliverChildDelegate,
  SliverList,
  SliverMultiBoxAdaptorElement,
  SliverMultiBoxAdaptorParentData,
  SliverMultiBoxAdaptorRenderView,
} from "@/lib/widgets/sliver";
import { NativeEventsBindingHandler } from "@/lib/native/events";
import EditText, { Editable, EditableText } from "@/lib/widgets/text";
import { NativeTextInputHandler, TextInput } from "@/lib/native/text-input";
//@ts-ignore
import eruda from "eruda";
import Stream, { AsyncStream } from "@/lib/core/stream";
import ScreenUtils from "../screen-utils";
import MyPost from "../poster";
import { NativeInputStream, TextNativeInputAdapter } from "./text-input-stream";
import { TextStyle } from "@/lib/painting/text-painter"
import {
  MultiChildRenderObjectWidget,
  RenderObjectElement,
  SingleChildRenderObjectElement,
  SingleChildRenderObjectWidget,
  State,
  StatefulWidget,
  StatelessWidget,
  Widget,
} from "@/lib/basic/framework";
import ScrollSliverListExample from "./scroll-sliver";
import { DefaultNativeStrategies } from "@/lib/native/native-strategies";
import { PaintingContext, SingleChildRenderView } from "@/lib/render-object/basic";
import { RenderView } from "@/lib/render-object/render-object";
import { GenNative } from "@/types/native";
import { AssetImageProvider, ImageProvider, NetWorkImageProvider } from "@/lib/painting/image-provider";
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

GenPlatformConfig.InitInstance({
  screenWidth: width,
  screenHeight: height,
  devicePixelRatio: dev,
  debug: true,
  canvas: canvas,
  renderContext: g,
  strategies: new DefaultNativeStrategies()
});

const eventCaller = new NativeEventsBindingHandler();
if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  // Touch events for mobile devices
  window.addEventListener("touchstart", (e) => {
    eventCaller.applyEvent("touchstart", e);
  });
  window.addEventListener("touchmove", (e) => {
    eventCaller.applyEvent("touchmove", e);
  });
  window.addEventListener("touchend", (e) => {
    eventCaller.applyEvent("touchend", e);
  });
  window.addEventListener("touchcancel", (e) => {
    eventCaller.applyEvent("touchcancel", e);
  });
} else {
  window.addEventListener("mousedown", (e) => {
    eventCaller.applyEvent("mousedown", e);
  });
  window.addEventListener("mousemove", (e) => {
    eventCaller.applyEvent("mousemove", e);
  });
  window.addEventListener("mouseup", (e) => {
    eventCaller.applyEvent("mouseup", e);
  });
  window.addEventListener("mousedown", (e) => {
    eventCaller.applyEvent("mousedown", e);
  });
  window.addEventListener("wheel", (e) => {
    eventCaller.applyEvent("wheel", e);
  });
}

const nativeTextInputHandler = new NativeTextInputHandler();
const inputBar = document.querySelector("#inputbar") as HTMLInputElement;
inputBar.value = `123`;
nativeTextInputHandler.blurHandler(() => {
  inputBar.blur();
});
nativeTextInputHandler.focusHandler(() => {
  setTimeout(() => {
    inputBar.focus();
  }, 100)
});

const syncStream = Stream.withAsync<string>(NativeInputStream());
const handler: TextNativeInputAdapter = new TextNativeInputAdapter(syncStream, inputBar.value);

handler.addListener(() => {
  // console.log("handler",handler.payload)
  const payload = handler.payload;
  nativeTextInputHandler.updateEditingValue(
    payload.value,
    payload.selectionStart,
    payload.selectionEnd
  );
});
nativeTextInputHandler.selectionHandler((newSelection) => {
  handler.updateSelection(newSelection.baseOffset, newSelection.extentOffset);
});

export const screenUtil = new ScreenUtils({
  canvasWidth: canvas.width,
  canvasHeight: canvas.height,
  devicePixelRatio: dev,
});


class Test extends StatefulWidget {
  createState(): State {
    return new TestState();
  }
}

class TestState extends State<Test> {
  build(context: BuildContext): Widget {
    return new Container({
      constraints: new BoxConstraints({
        maxWidth: 100,
      }),
      width: canvas.width,
      height: canvas.height,
      color: Colors.white,
      padding: {
        left: 10,
        top: 30,
      },
      // alignment:Alignment.center,
      child: Transform.rotate({
        angle: Math.PI * 0,

        child: Transform.translate({
          x: 10,
          y: 10,
          child: new ColoredBox(
            {
              color: Colors.gray.withOpacity(0.2),
              child: new EditText()
            }
          )
        })
      })

    })
  }
}



const imageProvider = new NetWorkImageProvider({
  // url: "https://images.unsplash.com/photo-1726487536376-846cd82fbd78?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  url: 'http://localhost:1118/img/bg.jpg'
});
// imageProvider.load().then(e=>{
//   g.drawImage(e , 0, 0, 300, 300)
// })


class Item extends StatelessWidget {
  private imageProvider: ImageProvider = new NetWorkImageProvider({
    url: 'https://picsum.photos/100',
    //url: "https://images.unsplash.com/photo-1726487536376-846cd82fbd78?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    // url: 'http://localhost:1118/img/bg.jpg'
  });
  build(context: BuildContext): Widget {
    return new Container({
      width: 50,
      height: 50,
      decoration: new BoxDecoration({
        // borderRadius: BorderRadius.all(20),
        backgroundColor: Colors.gray
      }),
      // child: new ImageWidget({
      //   width: 100,
      //   height: 100,
      //   fit: BoxFit.fill,
      //   imageProvider: new AssetImageProvider({
      //     assetsImageBuilder() {
      //       const image = new Image();
      //       image.src = 'https://picsum.photos/100';
      //       return image;
      //     },
      //   }),
      // })
    });
  }
}
runApp(
  new Container({
    width: canvas.width,
    height: canvas.width,
    color: Colors.white,
    child: new SingleChildScrollView({
      child: new WidgetToSliverAdapter({
        child: new Wrap({
          alignment:WrapAlignment.spaceAround,
          runSpacing:10,
          spacing: 10,
          children: Array.from({
            length: 1500
          }).map(() => new Item()),
        })
      })
    })
    // child: new Wrap({
    //   children: Array.from({
    //     length: 10
    //   }).map(() => new Item()),
    // children: [
    //   new Image({
    //     fit: BoxFit.fill,
    //     // width:100,
    //     // height:100,
    //     imageSource: new ImageSource({
    //       imageProvider: imageProvider,
    //     })
    //   }),
    //   new Image({
    //     fit: BoxFit.fill,
    //     // width:100,
    //     // height:100,
    //     imageSource: new ImageSource({
    //       imageProvider: imageProvider,
    //     })
    //   }),
    //   new GestureDetector({
    //     onTap: () => {
    //       console.log("下一张")
    //     },
    //     child: new Container({
    //       color: Colors.pink,
    //       padding: {
    //         bottom: 30,
    //         top: 30
    //       },
    //       child: new Text("下一个张", {
    //         style: new TextStyle({
    //           color: Colors.white
    //         })
    //       })
    //     })
    //   })
    // ]
    // })
  })
);
// nativeTextInputHandler.updateEditingValue(inputBar.value, 0, 0);



// class Scaffold extends StatefulWidget {
//   createState(): State<Scaffold> {
//     return new ScaffoldState();
//   }
// }
// class MyListener extends ChangeNotifier {
//   public counter: number = 0;
//   trigger() {
//     this.notifyListeners();
//   }
//   add() {
//     this.counter += 1;
//     this.notifyListeners();
//   }
// }

// class MyCustomPainter extends CustomPainter {
//   render(painter: Painter, size: Size): void {
//     console.log("渲染", size);
//     painter.fillStyle = "orange";
//     painter.fillRect(0, 0, 10, 10);
//   }
// }
// class MyForgoundCustomPainter extends CustomPainter {
//   render(painter: Painter, size: Size): void {
//     console.log("渲染", size);
//     painter.fillStyle = "orange";
//     // painter.clip();
//     // painter.fillRect(0,0,10,10);
//     painter.fillText("\ue89e\ue7cc", 10, 10);
//   }
// }

// const controller = new ScrollController();
// const controller2 = new ScrollController();

// class Model extends ChangeNotifier {
//   x: number = 0;
//   y: number = 0;
//   setXY(x: number, y: number) {
//     this.x = x;
//     this.y = y;
//     this.notifyListeners();
//   }
// }

// class MyClipper extends CustomClipper {
//   model: Model;
//   constructor(model) {
//     super(model);
//     this.model = model;
//     window.addEventListener("mousemove", (e) => {
//       this.model.setXY(e.clientX, e.clientY);
//     });
//   }
//   getClip(offset: Vector, size: Size): Path2D {
//     const path2d = new Path2D();
//     this.drawRoundedStar(
//       path2d,
//       this.model.x - offset.x,
//       this.model.y - offset.y,
//       10,
//       100,
//       50,
//       10
//     );
//     // path2d.rect(0, 0, size.width, size.height);
//     // path2d.arc(this.model.x-offset.x, this.model.y-offset.y, 50, 0, Math.PI * 2, true);
//     return path2d;
//   }
//   drawRoundedStar(
//     ctx: Path2D,
//     cx: number,
//     cy: number,
//     spikes: number,
//     outerRadius: number,
//     innerRadius: number,
//     cornerRadius: number
//   ): void {
//     const angle = Math.PI / spikes;
//     spikes += 1;
//     let startX = cx + Math.cos(0) * outerRadius;
//     let startY = cy + Math.sin(0) * outerRadius;
//     ctx.moveTo(startX, startY);

//     for (let i = 0; i < spikes * 2; i++) {
//       const isOuter = i % 2 === 0;
//       const radius = isOuter ? outerRadius : innerRadius;
//       const nextX = cx + Math.cos(i * angle) * radius;
//       const nextY = cy + Math.sin(i * angle) * radius;

//       if (i === 0) {
//         ctx.moveTo(nextX, nextY);
//       } else {
//         ctx.arcTo(startX, startY, nextX, nextY, cornerRadius);
//       }

//       startX = nextX;
//       startY = nextY;
//     }
//   }
// }

// /**
//  * updatePositions时创建一个
//  *
//  */
// class ScaffoldState extends State<Scaffold> {
//   private time: number = 1;
//   private dy: number = 0;
//   private preDeltaY: number = 0;
//   private list: Array<number> = new Array(20).fill(0);
//   public initState(): void {
//     super.initState();
//     console.log("创建A");
//     // controller.addListener(() => {
//     //   console.log("position", controller.offset);
//     // });
//     setTimeout(() => {
//       // this.animateTo();
//       // controller.animateTo(150*2000,new Duration({
//       //   milliseconds:6000,
//       // }))
//       // this.setState(() => {
//       //   this.time += 1;
//       //   // this.list=new Array(30).fill(0);
//       //   console.log("数据", this.list);
//       // });
//       // this.setState(()=>{
//       //   this.list.push(...new Array(100).fill(0));
//       // })
//     }, 3000);
//     controller.addListener(() => {
//       if (controller.offset >= controller.position.maxScrollExtent - 200) {
//         this.setState(() => {
//           this.list.push(...new Array(10).fill(0));
//         });
//       }
//     });
//   }
//   private animateTo() {
//     controller
//       .animateTo(
//         Math.random() * controller.position.maxScrollExtent,
//         new Duration({
//           milliseconds: 3000,
//         })
//       )
//       .then(() => {
//         setTimeout(() => {
//           this.animateTo();
//         }, 3000);
//       });
//   }
//   build(context: BuildContext): Widget {
//     return new Container({
//       width: canvas.width,
//       height: canvas.height,
//       padding: {
//         top: 100,
//         left: 0,
//         right: 0,
//         bottom: 100,
//       },
//       alignment: Alignment.center,
//       decoration: new BoxDecoration({
//         backgroundColor: new Color(0xffffffff),
//       }),
//       child: new Flex({
//         direction: Axis.horizontal,
//         mainAxisAlignment: MainAxisAlignment.start,
//         crossAxisAlignment: CrossAxisAlignment.stretch,
//         children: [
//           new Expanded({
//             flex: 1,
//             child: new Scrollable({
//               controller: controller,
//               axisDirection: AxisDirection.down,
//               physics: new BouncingScrollPhysics(),
//               viewportBuilder: (context, position) => {
//                 return new ViewPort({
//                   offset: position,
//                   axisDirection: position.axisDirection,
//                   children: this.list.map((_, ndx) => {
//                     return new WidgetToSliverAdapter({
//                       child: new Container({
//                         width: canvas.width,
//                         // height: ,
//                         color:
//                           ndx % 2 === 0
//                             ? new Color(0xffffffff)
//                             : new Color(0xffedf2fa),
//                         child: new Align({
//                           alignment: Alignment.center,
//                           child: new Button(ndx),
//                         }),
//                       }),
//                     });
//                   }),
//                 });
//               },
//             }),
//           }),
//         ],
//       }),
//     });
//   }
// }

// class Button extends StatefulWidget {
//   index: number;
//   constructor(index: number) {
//     super();
//     this.index = index;
//   }
//   createState(): State {
//     return new _ButtonState();
//   }
// }

// class _ButtonState extends State<Button> {
//   private time: number;
//   public initState(): void {
//     super.initState();
//     this.time = this.widget.index;
//   }
//   build(context: BuildContext): Widget {
//     return new Container({
//       padding: {
//         top: 10,
//         bottom: 10,
//         left: 20,
//         right: 20,
//       },
//       // decoration: new BoxDecoration({
//       //   backgroundColor: "#edf2fa",
//       // }),
//       child: new GestureDetector({
//         onTap: () => {
//           console.log("点击", this.time);
//           this.setState(() => {
//             this.time += 1;
//           });
//         },
//         child: new Text(`${this.time}`),
//       }),
//     });
//   }
// }
// const app =new MyPost();
