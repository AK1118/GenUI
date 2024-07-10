import Painter from "@/lib/painting/painter";
import { Binding } from "../lib/binding";
import {
  BuildContext,
  Element,
  Padding,
  RenderViewElement,
  ConstrainedBox,
  State,
  StatefulView,
  StatelessView,
} from "../lib/elements";
import { Size } from "@/lib/basic/rect";
import { PlaceholderRenderView, RenderView } from "@/lib/basic";
import { ColoredBox, SizeBox } from "@/lib/framework";

const canvas: HTMLCanvasElement = document.querySelector("#canvas");
const img2: HTMLImageElement = document.querySelector("#bg");

const dev = window.devicePixelRatio;
console.log("DPR：", dev);
canvas.width = 300 * dev;
canvas.height = 300 * dev;
canvas.style.width = 300 + "px";
canvas.style.height = 300 + "px";
const g = canvas.getContext("2d", {
  // willReadFrequently: true,
});
// g.imageSmoothingEnabled = false;
Painter.setPaint(g);

export abstract class Widget {
  abstract createElement(): Element;
}

// abstract class ComponentElement extends Element {
//   constructor(widget?: Widget) {
//     super(widget);
//   }
//   abstract build(context: BuildContext): Widget;
//   createRenderView(context: BuildContext): RenderView {
//     return new PlaceholderRenderView();
//   }
// }

// abstract class RenderObjectElement extends Element {
//   createRenderView(context: BuildContext): RenderView {
//     return new PlaceholderRenderView();
//   }
// }

//  class SingleChildRenderObjectElement extends RenderObjectElement {}

// class StatelessElement extends ComponentElement {}

// abstract class StatelessWidget extends Widget {
//   private child: Widget;
//   constructor(child?: Widget) {
//     super();
//     this.child = child;
//   }
//   createElement(): Element {
//     return new StatelessElement(this);
//   }
//   build(context: BuildContext): Widget {
//     return this.child;
//   }
// }

// abstract class SingleChildRenderObjectWidget extends Widget {
//   createElement(): Element {
//     return new SingleChildRenderObjectElement(this);
//   }
// }
// class ColoredWidget extends SingleChildRenderObjectWidget {
//   build(context: BuildContext): Widget {}
// }

// class SizeBox extends StatelessWidget {
//   private width: number;
//   private height: number;
//   constructor(width: number, height: number, child?: Widget) {
//     super();
//     this.width = width;
//     this.height = height;
//   }
//   createElement(): Element {
//     return new ConstrainedBox(this.width, this.height);
//   }
// }

// class TestView extends StatefulView {
//   createState(): State {
//     return new TestViewState();
//   }
// }
// class TestViewState extends State {
//   private color: string = "#ccc";
//   private size: Size = new Size(100, 100);
//   private delta: number = 3;
//   initState(): void {
//     this.color = "white";
//     this.handleAnimate();
//   }

//   getRandomColor(): string {
//     // 生成一个随机的颜色值
//     const letters = "0123456789ABCDEF";
//     let color = "#";
//     for (let i = 0; i < 6; i++) {
//       color += letters[Math.floor(Math.random() * 16)];
//     }
//     return color;
//   }

//   handleAnimate() {
//     if (this.size.width > 200 || this.size.width <= 0) {
//       this.delta *= -1;
//     }
//     requestAnimationFrame(() => {
//       g.clearRect(0, 0, 1000, 1000);
//       this.setState(() => {
//         this.size.setWidth(this.size.width + this.delta);
//         this.size.setHeight(this.size.height + this.delta);
//       });
//       this.handleAnimate();
//     });
//   }
//   build(context: BuildContext): RenderViewElement {
//     // return  new Text(this.color);
//     return new ColoredBox("white");
//   }
// }

// const view = new ColoredWidget(new SizeBox(100, 100));

// console.log(view.createElement().widget);
// , new SizeBox(100, 100)
const view = new ColoredBox("white",new SizeBox(20, 10));

const runApp = (rootWidget: Widget) => {
  const binding = Binding.getInstance();
  binding.elementBinding.attachRootWidget(rootWidget);
};

runApp(view);
// const view = new ColoredBox("white", new SizeBox(100, 100));
// const element=view.createElement();

// console.log(view)
// console.log(element);
// element.mount();
