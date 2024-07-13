import Painter from "@/lib/painting/painter";
import { Binding } from "../lib/basic/binding";
import { BuildContext, Element } from "../lib/basic/elements";
import { Size } from "@/lib/basic/rect";
import {
  Axis,
  CrossAxisAlignment,
  MainAxisAlignment,
  PlaceholderRenderView,
  RenderView,
} from "@/lib/render-object/basic";
import { Align, ColoredBox, Flex, Padding, SizeBox } from "@/lib/widgets/basic";
import {
  State,
  StatefulWidget,
  StatelessWidget,
  Widget,
} from "@/lib/basic/framework";
import Alignment from "@/lib/painting/alignment";

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
class V extends StatelessWidget {
  private size: Size = Size.zero;
  constructor() {
    super();
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
    return  new Flex({
      direction:Axis.vertical,
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        new ColoredBox("#22c382", new SizeBox(10, 10)),
        new Flex({
          direction:Axis.horizontal,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            new ColoredBox("#22c382", new SizeBox(10, 10)),
            new ColoredBox("orange", new SizeBox(10, 10)),
            new ColoredBox("#22c382", new SizeBox(10, 10)),
          ],
        }),
        new ColoredBox("#22c382", new SizeBox(10, 10)),
      ],
    });
  }
}

class Ful extends StatefulWidget {
  createState(): State {
    return new StateTest();
  }
}

class StateTest extends State {
  private size: Size = new Size(10, 10);
  private delta: number = 3;
  private a: boolean = true;
  public initState(): void {
      //  this.handleAnimate();
    // setInterval(() => {
    //   g.clearRect(0, 0, 1000, 1000);
    //   this.setState(() => {
    //     this.size.setWidth(this.size.width + this.delta);
    //     this.size.setHeight(this.size.height + this.delta);
    //   });
    // },1000);
    // setTimeout(() => {
    //   g.clearRect(0, 0, 1000, 1000);
    //   this.setState(() => {
    //     this.a = false;
    //   });
    // }, 1000);
    // this.setState(()=>{});
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
  build(context: BuildContext): Widget {
    return new SizeBox(
      canvas.width,
      canvas.height,
      new Flex({
        direction: Axis.vertical,
        children:[
          new V(),new V(),new V()
        ]
      })
    );
  }
}

const view = //new V(new Size(100,100))//new ColoredBox("white",new SizeBox(200,200))//
  new Ful();

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
