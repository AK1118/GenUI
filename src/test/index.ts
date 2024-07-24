import Painter from "@/lib/painting/painter";
import { Binding } from "../lib/basic/binding";
import { BuildContext, Element } from "../lib/basic/elements";
import { Size } from "@/lib/basic/rect";
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
  Padding,
  Positioned,
  SizeBox,
  Stack,
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
import { sin } from "@/lib/math/math";

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
  public initState(): void {
    //  this.handleAnimate();
    setInterval(() => {
      g.clearRect(0, 0, canvas.width, canvas.height);
      this.setState(() => {
        this.flex += 1;
      });
    }, 1000);
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
  build(context: BuildContext): Widget {
    return new SizeBox({
      width: canvas.width,
      height: canvas.height,
      child: new Align({
        child:
          this.flex % 2 == 0
            ? new ColoredBox({
                color: "#efefef",
                child: new SizeBox({
                  width: 40,
                  height: 40,
                }),
              })
            : null,
      }),
      // child: new Stack({
      //   fit: StackFit.expand,
      //   children: [
      //     this.flex % 2 == 0?new Positioned({
      //       bottom: this.flex * 10,
      //       left: 0,
      //       child: new ColoredBox({
      //         color: "#efefef",
      //         child: new SizeBox({
      //           width: 40,
      //           height: 40,
      //         }),
      //       }),
      //     }):null,
      //   ],
      // }),
      //child:
      // new Wrap({
      //   children: [
      //     new ClipRRect({
      //       borderRadius: 10,
      //       child: new ColoredBox({
      //         color: this.getRandomColor(),
      //         child: new SizeBox({
      //           width: 10*this.flex,
      //           height: 40,
      //         }),
      //       }),
      //     }),
      //     new ClipRRect({
      //       borderRadius: 10,
      //       child: new ColoredBox({
      //         color: this.getRandomColor(),
      //         child: new SizeBox({
      //           width: 40,
      //           height: 40,
      //         }),
      //       }),
      //     }),
      //   ],
      // }),

      // child: new Flex({
      //   mainAxisAlignment: MainAxisAlignment.center,
      //   crossAxisAlignment: CrossAxisAlignment.center,
      //   direction: Axis.vertical,
      //   children: [
      //     // new ClipRRect({
      //     //   borderRadius: 10,
      //     //   child: new ColoredBox({
      //     //     color: this.getRandomColor(),
      //     //     child: new SizeBox({
      //     //       width: 40,
      //     //       height: 40,
      //     //     }),
      //     //   }),
      //     // }),
      //     //  new ColoredBox({
      //     //       color: this.getRandomColor(),
      //     //       child: new SizeBox({
      //     //         width: this.flex*1.1,
      //     //         height: 40,
      //     //       }),
      //     //     }),
      //     new Expanded({
      //       flex: this.flex,
      //       child: new ColoredBox({
      //         color: "#bbbbbb",
      //         child: new SizeBox({
      //           width: 40,
      //           height: 40,
      //         }),
      //       }),
      //     }),
      //     new Expanded({
      //       flex: this.flex,
      //       child: new ColoredBox({
      //         color: "#efefef",
      //         child: new SizeBox({
      //           width: 40,
      //           height: 40,
      //         }),
      //       }),
      //     }),
      //   ],
      // }),
    });
  }
}

const view = //new V(new Size(100,100))//new ColoredBox("white",new SizeBox(200,200))//
  new Ful();

runApp(view);
// const view = new ColoredBox("white", new SizeBox(100, 100));
// const element=view.createElement();

// console.log(view)
// console.log(element);
// element.mount();
