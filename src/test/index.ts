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
import { MultiChildRenderObjectWidgetOption } from "@/types/widget-option";

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
  private _direction: Axis = Axis.horizontal;
  private _spacing: number = 0;
  private _runSpacing: number = 0;
  private _alignment: WrapAlignment = WrapAlignment.start;
  private _runAlignment: WrapAlignment = WrapAlignment.start;
  private _crossAxisAlignment: WrapCrossAlignment = WrapCrossAlignment.start;

  constructor(option: Partial<WrapOption>) {
    super();
    this.direction = option?.direction ?? Axis.horizontal;
    this.spacing = option?.spacing ?? 0;
    this.runSpacing = option?.runSpacing ?? 0;
    this.alignment = option?.alignment ?? WrapAlignment.start;
    this.runAlignment = option?.runAlignment ?? WrapAlignment.start;
    this.crossAxisAlignment =
      option?.crossAxisAlignment ?? WrapCrossAlignment.start;
  }

  get direction(): Axis {
    return this._direction;
  }
  set direction(value: Axis) {
    if (this._direction === value) {
      return;
    }
    this._direction = value;
    this.markNeedsLayout();
  }
  get spacing(): number {
    return this._spacing;
  }
  set spacing(value: number) {
    if (this._spacing === value) {
      return;
    }
    this._spacing = value;
    this.markNeedsLayout();
  }
  get runSpacing(): number {
    return this._runSpacing;
  }
  set runSpacing(value: number) {
    if (this._runSpacing === value) {
      return;
    }
    this._runSpacing = value;
    this.markNeedsLayout();
  }
  get alignment(): WrapAlignment {
    return this._alignment;
  }
  set alignment(value: WrapAlignment) {
    if (this._alignment === value) {
      return;
    }
    this._alignment = value;
    this.markNeedsLayout();
  }
  get runAlignment(): WrapAlignment {
    return this._runAlignment;
  }
  set runAlignment(value: WrapAlignment) {
    if (this._runAlignment === value) {
      return;
    }
    this._runAlignment = value;
    this.markNeedsLayout();
  }
  get crossAxisAlignment(): WrapCrossAlignment {
    return this._crossAxisAlignment;
  }
  set crossAxisAlignment(value: WrapCrossAlignment) {
    if (this._crossAxisAlignment === value) {
      return;
    }
    this._crossAxisAlignment = value;
    this.markNeedsLayout();
  }

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
    /**
     * 存储children的大小，用于计算axis=horizontal时，@mainAxisExtent 记录的是children的宽度之和，
     * 用于计算axis=vertical时，@mainAxisExtent 记录的是children的高度之和。
     * @crossAxisExtent 是 @mainAxisExtent 的交叉方向轴和，即axis=horizontal时，@crossAxisExtent 记录的是children的高度之和。
     */
    let mainAxisExtent: number = 0;
    let crossAxisExtent: number = 0;
    /**
     * 运行时宽度，用于判断是否超出宽度，超出则换行
     * 用于计算axis=horizontal时，@runMainAxisExtent 记录的是当前行的宽度之和，与 @mainAxisExtent 不同的是，@runMainAxisExtent 记录的是当前行宽度之和，在换行
     * 后会被归零，
     */
    let runMainAxisExtent: number = 0;
    let runCrossAxisExtent: number = 0;
    //当前处理main
    let currentChildNdx: number = 0;
    /**
     * 对于处理的一个单位（即不同方向时的不同列|行），记录其大小，用于计算每个单元的偏移量，并需要记录每个单元的个数，用于计算每行|列的宽度
     */
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
        mainAxisExtent += runMainAxisExtent;
        crossAxisExtent += runCrossAxisExtent + this.runSpacing;
        runMetrics.push(
          new RunMetrics(
            runMainAxisExtent,
            runCrossAxisExtent + this.runSpacing,
            currentChildNdx
          )
        );
        runMainAxisExtent = 0;
        runCrossAxisExtent = 0;
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
      mainAxisExtent += runMainAxisExtent;
      crossAxisExtent += runCrossAxisExtent + this.runSpacing;
      runMetrics.push(
        new RunMetrics(
          runMainAxisExtent,
          runCrossAxisExtent + this.runSpacing,
          currentChildNdx
        )
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
    child = this.firstChild;
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

      let childMainPosition: number = runMainLeading;

      while (child) {
        const parentData = child.parentData as WrapParentData;
        if (parentData.runIndex !== i) {
          break;
        }
        const childSize = child.size;
        const childMainAxisExtent = this.getMainAxisExtent(childSize);
        const childCrossAxisExtent = this.getCrossAxisExtent(childSize);
        const crossOffset = this.getChildCrossAxisOffset(
          runCrossAxisExtent,
          childCrossAxisExtent
        );
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
interface WrapOption {
  direction: Axis;
  spacing: number;
  runSpacing: number;
  alignment: WrapAlignment;
  runAlignment: WrapAlignment;
  crossAxisAlignment: WrapCrossAlignment;
}
class Wrap extends MultiChildRenderObjectWidget {
  direction: Axis = Axis.horizontal;
  spacing: number = 0;
  runSpacing: number = 0;
  alignment: WrapAlignment = WrapAlignment.start;
  runAlignment: WrapAlignment = WrapAlignment.start;
  crossAxisAlignment: WrapCrossAlignment = WrapCrossAlignment.start;
  constructor(
    option: Partial<WrapOption & MultiChildRenderObjectWidgetOption>
  ) {
    super(option?.children);
    this.direction = option?.direction ?? Axis.horizontal;
    this.spacing = option?.spacing ?? 0;
    this.runSpacing = option?.runSpacing ?? 0;
    this.alignment = option?.alignment ?? WrapAlignment.start;
    this.runAlignment = option?.runAlignment ?? WrapAlignment.start;
    this.crossAxisAlignment =
      option?.crossAxisAlignment ?? WrapCrossAlignment.start;
  }
  createRenderObject(): RenderView {
    return new WrapRenderView({
      direction: this.direction,
      spacing: this.spacing,
      runSpacing: this.runSpacing,
      alignment: this.alignment,
      runAlignment: this.runAlignment,
      crossAxisAlignment: this.crossAxisAlignment,
    });
  }
  updateRenderObject(context: BuildContext, renderView: WrapRenderView): void {
    renderView.direction = this.direction;
    renderView.spacing = this.spacing;
    renderView.runSpacing = this.runSpacing;
    renderView.alignment = this.alignment;
    renderView.runAlignment = this.runAlignment;
    renderView.crossAxisAlignment = this.crossAxisAlignment;
  }
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
    return new SizeBox(
      30,
      30,
      new Flex({
        direction: Axis.vertical,
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          new ColoredBox(
            `rgba(239, 239, 239, ${opacity})`,
            new SizeBox(10, 10)
          ),
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
          new ColoredBox(
            `rgba(239, 239, 239, ${opacity})`,
            new SizeBox(10, 10)
          ),
        ],
      })
    );
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
    return new SizeBox(
      canvas.width,
      canvas.height,
      new Wrap({
        direction: Axis.vertical,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing:Math.sin(this.time)*20,
        runSpacing:Math.sin(this.time)*20,
        alignment: WrapAlignment.center,
        runAlignment: WrapAlignment.center,
        children: new Array(200)
          .fill(0)
          .map((_, index) => this.buildV("orange", 1)),
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
