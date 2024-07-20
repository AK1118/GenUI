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
  WrapAlignment,
  WrapCrossAlignment,
} from "@/lib/render-object/basic";
import {
  Align,
  ColoredBox,
  Flex,
  Padding,
  SizeBox,
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

  public initState(): void {
    this.handleAnimate();
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
      child: new Wrap({
        direction: Axis.vertical,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: Math.sin(this.time) * 20,
        runSpacing: Math.sin(this.time) * 20,
        alignment: WrapAlignment.center,
        runAlignment: WrapAlignment.center,
        children: new Array(200)
          .fill(0)
          .map((_, index) => this.buildV("orange", 1)),
      }),
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
