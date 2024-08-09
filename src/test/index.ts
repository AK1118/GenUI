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
  Expanded,
  Flex,
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
import { abs, cos, radiansPerDegree, random, sin } from "@/lib/math/math";
import { GlobalKey } from "@/lib/basic/key";
import { getRandomColor } from "@/lib/utils/utils";
import { Matrix4 } from "@/lib/math/matrix";

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
            return new Slider("#efefef");
          }),
        ],
      }),
    });
  }
}

class Slider extends StatefulWidget {
  public color: string;
  constructor(color: string) {
    super();
    this.color = color;
  }
  createState(): State {
    return new SliderState();
  }
}

class SliderState extends State<Slider> {
  private position: Vector = new Vector(0, 0);
  private time: number = 0;
  public initState(): void {
    // setInterval(() => {
    //   this.animation();
    // }, 1000);
    this.animation();
  }
  private animation() {
    this.setState(() => {
      this.time += 0.01;
    });
    // this.transform.rotateZ(this.time*45);

    requestAnimationFrame(this.animation.bind(this));
  }
  build(context: BuildContext): Widget {
    const origin = Vector.zero;
    if (context.mounted) {
      const renderBox = context.findRenderView();
      //  if(renderBox){
      //     origin.x=renderBox.size.width/2;
      //     origin.y=renderBox.size.height;
      //  }
    }
    return new Positioned({
      top: this.position.y,
      left: this.position.x,
      child: new Listener({
        child: Transform.scale({
          scale: 0.5,
          child: Transform.rotate({
            // x: 100, //100+sin(this.time)*100,
            // y: 100, //100+cos(this.time)*100,
            alignment: Alignment.bottomRight,
            angle:(Math.PI / 180) * this.time*50,
            angleX: (Math.PI / 180) * this.time*50,
            angleY: (Math.PI / 180) * this.time*50,
            child: new ColoredBox({
              color: "white",
              child: new SizeBox({
                width: 100,
                height: 100,
                child: new Align({
                  child: new ColoredBox({
                    color: this.widget.color,
                    child: new SizeBox({ width: 10, height: 100 }),
                  }),
                }),
              }),
            }),
          }),
        }),
        onPointerMove: (event) => {
          this.setState(() => {
            this.position.add(
              new Vector(event.delta.offsetX, event.delta.offsetY)
            );
          });
        },
      }),
    });
  }
}

// bool defaultHitTestChildren(BoxHitTestResult result, { required Offset position }) {
//   // The x, y parameters have the top left of the node's box as the origin.
//   ChildType? child = lastChild;
//   while (child != null) {
//     final ParentDataType childParentData = child.parentData! as ParentDataType;
//     final bool isHit = result.addWithPaintOffset(
//       offset: childParentData.offset,
//       position: position,
//       hitTest: (BoxHitTestResult result, Offset? transformed) {
//         assert(transformed == position - childParentData.offset);
//         return child!.hitTest(result, position: transformed!);
//       },
//     );
//     if (isHit)
//       return true;
//     child = childParentData.previousSibling;
//   }
//   return false;
// }
const view = //new V(new Size(100,100))//new ColoredBox("white",new SizeBox(200,200))//
  new Ful();

runApp(view);
// const view = new ColoredBox("white", new SizeBox(100, 100));
// const element=view.createElement();

// console.log(view)
// console.log(element);
// element.mount();

class Queue<T> {
  public list: Array<T> = new Array<T>();
  public push(value: T) {
    this.list.push(value);
  }
  public addFirst(value: T) {
    this.list.push(value);
  }
  public addLast(value: T) {
    this.list.unshift(value);
  }
  public removeFirst(): T {
    return this.list.shift();
  }
  public removeLast(): T {
    return this.list.pop();
  }
  public get size(): number {
    return this.list.length;
  }
  public get isEmpty(): boolean {
    return this.size === 0;
  }
  public clear() {
    this.list = [];
  }
}
