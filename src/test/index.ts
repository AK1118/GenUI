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
} from "@/lib/render-object/basic";
import { Align, ColoredBox, Flex, Padding, SizeBox } from "@/lib/widgets/basic";
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
enum WrapAlignment {
  /// Place the objects as close to the start of the axis as possible.
  ///
  /// If this value is used in a horizontal direction, a [TextDirection] must be
  /// available to determine if the start is the left or the right.
  ///
  /// If this value is used in a vertical direction, a [VerticalDirection] must be
  /// available to determine if the start is the top or the bottom.
  start = "start",

  /// Place the objects as close to the end of the axis as possible.
  ///
  /// If this value is used in a horizontal direction, a [TextDirection] must be
  /// available to determine if the end is the left or the right.
  ///
  /// If this value is used in a vertical direction, a [VerticalDirection] must be
  /// available to determine if the end is the top or the bottom.
  end = "end",

  /// Place the objects as close to the middle of the axis as possible.
  center = "center",

  /// Place the free space evenly between the objects.
  spaceBetween = "spaceBetween",

  /// Place the free space evenly between the objects as well as half of that
  /// space before and after the first and last objects.
  spaceAround = "spaceAround",

  /// Place the free space evenly between the objects as well as before and
  /// after the first and last objects.
  spaceEvenly = "spaceEvenly",
}
enum WrapCrossAlignment {
  /// Place the children as close to the start of the run in the cross axis as
  /// possible.
  ///
  /// If this value is used in a horizontal direction, a [TextDirection] must be
  /// available to determine if the start is the left or the right.
  ///
  /// If this value is used in a vertical direction, a [VerticalDirection] must be
  /// available to determine if the start is the top or the bottom.
  start,

  /// Place the children as close to the end of the run in the cross axis as
  /// possible.
  ///
  /// If this value is used in a horizontal direction, a [TextDirection] must be
  /// available to determine if the end is the left or the right.
  ///
  /// If this value is used in a vertical direction, a [VerticalDirection] must be
  /// available to determine if the end is the top or the bottom.
  end,

  /// Place the children as close to the middle of the run in the cross axis as
  /// possible.
  center,

  // TODO(ianh): baseline.
}
class WrapParentData extends ContainerRenderViewParentData {
  runIndex: number = 0;
}

class RunMetrics {
  constructor(
    mainAxisExtent: number,
    crossAxisExtent: number,
    childCount: number
  ) {
    this.mainAxisExtent = mainAxisExtent;
    this.crossAxisExtent = crossAxisExtent;
    this.childCount = childCount;
  }
  mainAxisExtent: number = 0;
  crossAxisExtent: number = 0;
  childCount: number = 0;
}

class WrapRenderView extends MultiChildRenderView {
  direction: Axis = Axis.horizontal;
  spacing: number = 0;
  runSpacing: number = 0;
  alignment: WrapAlignment = WrapAlignment.start;
  runAlignment: WrapAlignment = WrapAlignment.start;
  crossAxisAlignment: WrapCrossAlignment = WrapCrossAlignment.start;
  private getMainAxisExtent(size: Size): number {
    if (this.direction === Axis.horizontal) {
      return size.width;
    } else if (this.direction === Axis.vertical) {
      return size.height;
    }
  }
  private getOffset(mainAxisOffset: number, crossAxisOffset: number): Vector {
    switch (this.direction) {
      case Axis.horizontal:
        return new Vector(mainAxisOffset, crossAxisOffset);
      case Axis.vertical:
        return new Vector(crossAxisOffset, mainAxisOffset);
    }
  }
  private getCrossAxisExtent(size: Size): number {
    if (this.direction === Axis.horizontal) {
      return size.height;
    } else if (this.direction === Axis.vertical) {
      return size.width;
    }
  }
  private getChildCrossAxisOffset(
    runCrossAxisExtent: number,
    childCrossAxisExtent: number
  ): number {
    const freeSpace: number = runCrossAxisExtent - childCrossAxisExtent;
    switch (this.crossAxisAlignment) {
      case WrapCrossAlignment.start:
        return 0.0;
      case WrapCrossAlignment.end:
        return freeSpace;
      case WrapCrossAlignment.center:
        return freeSpace / 2.0;
    }
  }
  performLayout(): void {
    const constraints = this.constraints;
    let childConstraints: BoxConstraints = BoxConstraints.zero;
    let mainAxisLimit: number = 0;
    switch (this.direction) {
      case Axis.horizontal:
        childConstraints = new BoxConstraints({
          maxWidth: constraints.maxWidth,
        });
        mainAxisLimit = constraints.maxWidth;
        break;
      case Axis.vertical:
        childConstraints = new BoxConstraints({
          maxHeight: constraints.maxHeight,
        });
        mainAxisLimit = constraints.maxHeight;
        break;
    }

    let child: RenderView = this.firstChild;
    let mainAxisExtent: number = 0;
    let crossAxisExtent: number = 0;
    //运行时宽度，用于判断是否超出宽度，超出则换行
    let runMainAxisExtent: number = 0;
    let runCrossAxisExtent: number = 0;
    let currentChildNdx: number = 0;
    const runMetrics: Array<RunMetrics> = [];
    while (child) {
      child.layout(childConstraints, true);
      const childSize = child.size;
      const childMainAxisExtent = this.getMainAxisExtent(childSize);
      const childCrossAxisExtent = this.getCrossAxisExtent(childSize);
      if (
        currentChildNdx > 0 &&
        runMainAxisExtent + childMainAxisExtent + this.spacing > mainAxisLimit
      ) {
        mainAxisExtent = Math.max(mainAxisExtent, runMainAxisExtent);
        crossAxisExtent = Math.max(runCrossAxisExtent, crossAxisExtent);
        crossAxisExtent += this.runSpacing;
        runMainAxisExtent = 0;
        runCrossAxisExtent = 0;
        runMetrics.push(
          new RunMetrics(mainAxisExtent, crossAxisExtent, currentChildNdx)
        );
        currentChildNdx = 0;
      }
      runMainAxisExtent += childMainAxisExtent;
      runCrossAxisExtent = Math.max(runCrossAxisExtent, childCrossAxisExtent);
      if (currentChildNdx > 0) {
        runMainAxisExtent += this.spacing;
      }
      currentChildNdx += 1;
      const parentData = child.parentData as WrapParentData;
      parentData.runIndex = runMetrics.length;
      child = parentData.nextSibling;
    }
    //最后一行,如果currentChildNdx不为0，说明最新的一行
    if (currentChildNdx > 0) {
      mainAxisExtent = runMainAxisExtent;
      crossAxisExtent = runCrossAxisExtent + this.runSpacing;
      runMetrics.push(
        new RunMetrics(mainAxisExtent, crossAxisExtent, currentChildNdx)
      );
    }

    let containerMainAxisExtent: number = 0;
    let containerCrossAxisExtent: number = 0;

    if (this.direction === Axis.horizontal) {
      this.size = constraints.constrain(
        new Size(mainAxisExtent, crossAxisExtent)
      );
      containerMainAxisExtent = this.size.width;
      containerCrossAxisExtent = this.size.height;
    } else if (this.direction === Axis.vertical) {
      this.size = constraints.constrain(
        new Size(crossAxisExtent, mainAxisExtent)
      );
      containerMainAxisExtent = this.size.height;
      containerCrossAxisExtent = this.size.width;
    }
    const runLen = runMetrics.length;
    const crossAxisFreeSpace = Math.max(
      0,
      containerCrossAxisExtent - crossAxisExtent
    );

    let runLeading: number = 0;
    let runBetween: number = 0;
    switch (this.runAlignment) {
      case WrapAlignment.start:
        break;
      case WrapAlignment.end:
        runLeading = crossAxisFreeSpace;
        break;
      case WrapAlignment.center:
        runLeading = crossAxisFreeSpace * 0.5;
        break;
      case WrapAlignment.spaceBetween:
        runBetween = crossAxisFreeSpace / (runLen - 1);
        break;
      case WrapAlignment.spaceAround:
        runBetween = crossAxisFreeSpace / runLen;
        runLeading = runBetween * 0.5;
        break;
      case WrapAlignment.spaceEvenly:
        runBetween = crossAxisFreeSpace / (runLen + 1);
        runLeading = runBetween;
        break;
    }
    runBetween += this.runSpacing;
    let crossAxisOffset: number = runLeading;
    for (let i = 0; i < runLen; i++) {
      const run: RunMetrics = runMetrics[i];
      const runMainAxisExtent = run.mainAxisExtent;
      const runCrossAxisExtent = run.crossAxisExtent;
      const runChildCount = run.childCount;

      const mainAxisFreeSpace = Math.max(
        0,
        containerMainAxisExtent - runMainAxisExtent
      );

      let runMainLeading: number = 0;
      let runMainBetween: number = 0;
      switch (this.alignment) {
        case WrapAlignment.start:
          break;
        case WrapAlignment.end:
          runMainLeading = mainAxisFreeSpace;
          break;
        case WrapAlignment.center:
          runMainLeading = mainAxisFreeSpace * 0.5;
          break;
        case WrapAlignment.spaceBetween:
          runMainBetween = mainAxisFreeSpace / (runChildCount - 1);
          break;
        case WrapAlignment.spaceAround:
          runMainBetween = mainAxisFreeSpace / runChildCount;
          runMainLeading = runMainBetween * 0.5;
          break;
        case WrapAlignment.spaceEvenly:
          runMainBetween = mainAxisFreeSpace / (runChildCount + 1);
          runMainLeading = runMainBetween;
          break;
      }
      runMainBetween += this.spacing;

      let child = this.firstChild;
      let childMainPosition: number = runMainLeading;

      while (child) {
        const parentData = child.parentData as WrapParentData;
        if (parentData.runIndex !== i) {
          break;
        }
        const childSize = child.size;
        const childMainAxisExtent = this.getMainAxisExtent(childSize);
        const childCrossAxisExtent = this.getCrossAxisExtent(childSize);
        const crossOffset=this.getChildCrossAxisOffset(crossAxisExtent,childCrossAxisExtent);
        const offset = this.getOffset(
          childMainPosition,
          crossAxisOffset + crossOffset
        );
        childMainPosition += childMainAxisExtent;
        childMainPosition += runMainBetween;
        parentData.offset = offset;
        child = parentData.nextSibling;
      }
      crossAxisOffset += runCrossAxisExtent + runBetween;
    }
  }
  private applyPerformChild(): Size {
    return Size.zero;
  }
  protected setupParentData(child: RenderView): void {
    child.parentData = new WrapParentData();
  }
}

class Wrap extends MultiChildRenderObjectWidget {
  direction: Axis = Axis.vertical;
  spacing: number = 0;
  runSpacing: number = 0;
  constructor(children: Array<Widget>) {
    super(children);
  }
  createRenderObject(): RenderView {
    return new WrapRenderView();
  }
  updateRenderObject(context: BuildContext, renderView: RenderView): void {}
}

class V extends StatelessWidget {
  private color: string = "orange";
  constructor(color: string) {
    super();
    this.color = color;
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
    return new Padding({
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
      child: new Flex({
        direction: Axis.vertical,
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          new ColoredBox("#22c382", new SizeBox(10, 10)),
          new Flex({
            direction: Axis.horizontal,
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              new ColoredBox("#22c382", new SizeBox(10, 10)),
              new ColoredBox(this.color, new SizeBox(10, 10)),
              new ColoredBox("#22c382", new SizeBox(10, 10)),
            ],
          }),
          new ColoredBox("#22c382", new SizeBox(10, 10)),
        ],
      }),
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
  private force: number = 0.01;
  private time: number = 0;
  private waveSpeed: number = 0.01;
  private waveFrequency: number = 0.01;

  public initState(): void {
    //this.handleAnimate();
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

  private buildV(color: string, opacity: number): Flex {
    return new Flex({
      direction: Axis.vertical,
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        new ColoredBox(`rgba(239, 239, 239, ${opacity})`, new SizeBox(10, 10)),
        new Flex({
          direction: Axis.horizontal,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            new ColoredBox(
              `rgba(239, 239, 239, ${opacity})`,
              new SizeBox(10, 10)
            ),
            new ColoredBox(color, new SizeBox(10, 10)),
            new ColoredBox(
              `rgba(239, 239, 239, ${opacity})`,
              new SizeBox(10, 10)
            ),
          ],
        }),
        new ColoredBox(`rgba(239, 239, 239, ${opacity})`, new SizeBox(10, 10)),
      ],
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
    const columns = Math.ceil(canvas.width / 30);
    // console.log("列",columns);
    const children: Widget[] = [];
    for (let i = 0; i < columns; i++) {
      children.push(this.buildRow(i));
    }

    return new SizeBox(
      canvas.width,
      canvas.height,
      new Wrap([
        // new ColoredBox(this.getRandomColor(), new SizeBox(200, 20)),
        new ColoredBox(this.getRandomColor(), new SizeBox(100, 20)),
        new ColoredBox(this.getRandomColor(), new SizeBox(20, 20)),
        new ColoredBox(this.getRandomColor(), new SizeBox(30, 30)),
        new ColoredBox(this.getRandomColor(), new SizeBox(40, 40)),
      ])
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
