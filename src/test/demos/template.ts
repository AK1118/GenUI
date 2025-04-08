
import {
  Align,
  GestureDetector,
  Image as ImageWidget,
  Listener,
  Text,
  TextRich,
  Transform,
} from "@/lib/widgets/basic";
import {
  Container,
} from "@/lib/widgets/index";
import { GenPlatformConfig } from "@/lib/core/platform";
import { Colors, } from "@/lib/painting/color";
import { EventListenType, GenPointerEvent, GenUnifiedPointerEvent, NativeEventsBindingHandler } from "@/lib/native/events";
import { NativeTextInputHandler, } from "@/lib/native/text-input";
//@ts-ignore
import eruda from "eruda";
import Stream from "@/lib/core/stream";
import { NativeInputStream, TextNativeInputAdapter } from "./text-input-stream";
import { DefaultNativeStrategies } from "@/lib/native/native-strategies";
import runApp, { BuildContext, Element, Listenable, RenderObjectElement, RenderObjectWidget, SingleChildRenderObjectElement, SingleChildRenderObjectWidgetArguments, State, StatefulWidget, TextOverflow, TextSpan, TextStyle, Widget } from "@/index";
import Vector, { Offset } from "@/lib/math/vector";
import Alignment from "@/lib/painting/alignment";
import { RenderView } from "@/lib/render-object/render-object";
import { RenderBox, SingleChildRenderView } from "@/lib/render-object/basic";
import { PointerEvent, SignalPointerEvent } from "@/lib/gesture/events";
import { HitTestEntry, HitTestResult } from "@/lib/gesture/hit_test";
import DefaultBrowserNativeEventsBindingHandler from "@/lib/native/defaults/pointer-event-handler";

const canvas = document.createElement("canvas");
const dev = 1//window.devicePixelRatio;
const width = 300;
const height = 300;
canvas.width = width * dev;
canvas.height = height * dev;
canvas.style.width = width + "px";
canvas.style.height = height + "px";
document.body.appendChild(canvas);
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
  strategies: new DefaultNativeStrategies(),
  showBanner: true
});




// const nativeTextInputHandler = new NativeTextInputHandler();
// const inputBar = document.querySelector("#inputbar") as HTMLInputElement;
// inputBar.value = `123`;
// nativeTextInputHandler.blurHandler(() => {
//   inputBar.blur();
// });
// nativeTextInputHandler.focusHandler(() => {
//   setTimeout(() => {
//     inputBar.focus();
//   }, 100)
// });

// const syncStream = Stream.withAsync<string>(NativeInputStream());
// const handler: TextNativeInputAdapter = new TextNativeInputAdapter(syncStream, inputBar.value);

// handler.addListener(() => {
//   // console.log("handler",handler.payload)
//   const payload = handler.payload;
//   nativeTextInputHandler.updateEditingValue(
//     payload.value,
//     payload.selectionStart,
//     payload.selectionEnd
//   );
// });
// nativeTextInputHandler.selectionHandler((newSelection) => {
//   handler.updateSelection(newSelection.baseOffset, newSelection.extentOffset);
// });


// export const screenUtil = new ScreenUtils({
//   canvasWidth: canvas.width,
//   canvasHeight: canvas.height,
//   devicePixelRatio: dev,
// });

class Test extends StatefulWidget {
  createState(): State<Test> {
    return new TestState();
  }
}

class TestState extends State<Test> {
  private scale: number = 1;
  private angle: number = 0;
  build(context: BuildContext): Widget {
    return new GestureDetector({
      onPanZoomStart(event) {
        // console.log("开始缩放", event)
      },
      onPanZoomUpdate: (event) => {
        // console.log(event)
        this.setState(() => {
          this.angle += event.deltaRotationAngle;
          this.scale += event.deltaScale;
        });
        // console.log("缩放中", event)
      },
      onPanZoomEnd(event) {
        this.preAngle = 0;
        // console.log("缩放结束", event)
      },
      onTapDown() {
        // console.log("点击")
      },
      onDragUpdate(event) {
        console.log(event.position)
      },
      onTapUp() {
        // console.log("抬起")
      },

      child: new Listener({
        onPointerMove: () => {
          //  this.setState(()=>{
          //   this.angle +=.1;
          //  })
        },
        onSignalPointer: (event) => {
          this.setState(() => {
            this.scale += event.deltaY > 0 ? -0.1 : 0.1
          });
        },
        child: new Container({
          width: canvas.width,
          height: canvas.height,
          color: Colors.gray.withAlpha(100),
          child: new Align({
            child: Transform.rotate({
              alignment: Alignment.center,
              angle: this.angle,
              child: Transform.scale({
                alignment: Alignment.center,
                scale: this.scale,
                child: new Container({
                  color: Colors.white,
                  width: 100,
                  height: 100,
                  child: new Text("base: The main container of the card, where the header, body, and footer are placed.",{
                    style:new TextStyle({
                      maxLines:4,
                      overflow: TextOverflow.ellipsis,
                      fontSize: 12,
                      color: Colors.black,
                    })
                  })
                })
              })
            })
          }),
        })
      })
    },);
  }

}


runApp(new Test());
