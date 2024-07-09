import Painter from "@/lib/painting/painter";
import { Binding } from "../lib/binding";
import {
  BuildContext,
  ColoredBox,
  Element,
  Padding,
  RenderViewElement,
  ConstrainedBox,
  State,
  StatefulView,
  StatelessView,
} from "../lib/elements";
import { Size } from "@/lib/basic/rect";

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
  abstract build(context: BuildContext): Widget;
  abstract createElement(): Element;
}

abstract class StatelessWidget extends Widget {
  private child: Widget;
  constructor(child?: Widget) {
    super();
    this.child = child;
  }
  build(context: BuildContext): Widget {
    return this.child;
  }
}

class ColoredWidget extends StatelessWidget {
  createElement(): Element {
    return new ColoredBox("white");
  }
}

class SizeBox extends StatelessWidget {
  private width: number;
  private height: number;
  constructor(width: number, height: number, child?: Widget) {
    super();
    this.width = width;
    this.height = height;
  }
  createElement(): Element {
    return new ConstrainedBox(this.width, this.height);
  }
}

class TestView extends StatefulView {
  createState(): State {
    return new TestViewState();
  }
}
class TestViewState extends State {
  private color: string = "#ccc";
  private size: Size = new Size(100, 100);
  private delta: number = 3;
  initState(): void {
    this.color = "white";
    this.handleAnimate();
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

  handleAnimate() {
    if (this.size.width > 200 || this.size.width <= 0) {
      this.delta *= -1;
    }
    requestAnimationFrame(() => {
      g.clearRect(0, 0, 1000, 1000);
      this.setState(() => {
        this.size.setWidth(this.size.width + this.delta);
        this.size.setHeight(this.size.height + this.delta);
      });
      this.handleAnimate();
    });
  }
  build(context: BuildContext): RenderViewElement {
    // return  new Text(this.color);
    return new ColoredBox("white");
  }
}

const view = new ColoredWidget(
  new SizeBox(100, 100)
);

const runApp = (rootElement: Element) => {
  const binding = Binding.getInstance();
  binding.elementBinding.attachRootWidget(rootElement);
  console.log(rootElement);
};

runApp(view.createElement());
