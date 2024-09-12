import { BuildContext } from "../basic/elements";
import {
  SingleChildRenderObjectWidgetArguments,
  State,
  StatefulWidget,
  StatelessWidget,
  Widget,
} from "../basic/framework";
import { Key } from "../basic/key";
import { Offset } from "../basic/rect";
import {
  AnimationController,
  FrictionSimulation,
  Simulation,
} from "../core/animation";
import { AxisDirection } from "../core/base-types";
import { Duration } from "../core/duration";
import { SimpleScrollPhysics, ScrollPhysics } from "../core/scroll-physics";
import {
  MovePointerEvent,
  PanZoomEndPointerEvent,
  PanZoomStartPointerEvent,
  PanZoomUpdatePointerEvent,
} from "../gesture/events";
import { min } from "../math/math";
import Alignment from "../painting/alignment";
import { BoxDecoration } from "../painting/decoration";
import { AlignArguments, RectTLRB } from "../render-object/basic";
import {
  axisDirectionIsReversed,
  axisDirectionToAxis,
} from "../render-object/slivers";
import { BoxConstraints } from "../rendering/constraints";
import {
  ScrollPosition,
  ScrollPositionWithSingleContext,
} from "../render-object/viewport";
import VelocityTracker from "../utils/velocity-ticker";
import {
  Align,
  ColoredBox,
  ConstrainedBox,
  DecoratedBox,
  GestureDetector,
  Listener,
  Padding,
  SizedBox,
} from "./basic";
import { ScrollController } from "./scroll-controller";

interface ContainerArguments {
  width: number;
  height: number;
  color: string;
  child: Widget;
  decoration: BoxDecoration;
  align: Alignment;
  constraints: BoxConstraints;
  key: Key;
  padding: Partial<RectTLRB>;
}

export class Container extends StatelessWidget implements ContainerArguments {
  width: number;
  height: number;
  constraints: BoxConstraints;
  color: string;
  child: Widget;
  decoration: BoxDecoration;
  align: Alignment;
  key: Key;
  padding: Partial<RectTLRB<number>>;
  constructor(args: Partial<ContainerArguments>) {
    super();
    this.width = args?.width;
    this.height = args?.height;
    this.constraints = args?.constraints;
    this.color = args?.color;
    this.child = args?.child;
    this.decoration = args?.decoration;
    this.align = args?.align;
    this.key = args?.key;
    this.padding = args?.padding;
  }

  build(context: BuildContext): Widget {
    if (!this.constraints) {
      this.constraints = BoxConstraints.tightFor(
        this.width ?? null,
        this.height ?? null
      );
    }

    let result: Widget = new ConstrainedBox({
      additionalConstraints: this.constraints,
      child: this.child,
    });

    if (this.padding) {
      result = new Padding({
        padding: this.padding,
        child: result,
      });
    }

    if (this.color) {
      result = new ColoredBox({
        child: result,
        color: this.color,
      });
    }

    if (this.decoration) {
      result = new DecoratedBox({
        decoration: this.decoration,
        child: result,
      });
    }

    if (this.align) {
      result = new Align({
        child: result,
        alignment: this.align,
      });
    }

    return result;
  }
}

type ViewportBuilder = (
  context: BuildContext,
  position: ScrollPosition
) => Widget;

interface ScrollableArguments {
  physics: ScrollPhysics;
  viewportBuilder: ViewportBuilder;
  axisDirection: AxisDirection;
  controller: ScrollController;
}
export class Scrollable extends StatefulWidget implements ScrollableArguments {
  viewportBuilder: ViewportBuilder;
  axisDirection: AxisDirection;
  physics: ScrollPhysics;
  constructor(args: Partial<ScrollableArguments>) {
    super(args);
    this.viewportBuilder = args?.viewportBuilder;
    this.axisDirection = args?.axisDirection;
    this.physics = args?.physics ?? new SimpleScrollPhysics();
    this.controller = args?.controller;
  }
  controller: ScrollController;
  createState(): State<Scrollable> {
    return new ScrollableState();
  }
}

class ScrollableState extends State<Scrollable> {
  private position: ScrollPosition;
  private effectiveController: ScrollController;
  public initState(): void {
    super.initState();
    this.effectiveController=this.widget.controller??new ScrollController();
    console.log("创建B");
    this.updatePosition();
  }
  private updatePosition() {
    const oldPosition=this.position;
    if(oldPosition){
      this.effectiveController.detach(oldPosition);
    }
    const position = this.widget.controller.createScrollPosition(
      this.widget.physics,
      this.widget.axisDirection
    );
    this.effectiveController.attach(position);
    this.position = position;
  }
  private applyUserOffset(offset: Offset) {
    this.position.pointerScroll(offset);
  }
  public didUpdateWidget(oldWidget: Widget): void {
    super.didUpdateWidget(oldWidget);
  }
  build(context: BuildContext): Widget {
    return new Listener({
      onPointerDown: () => {
        this.position.scrollStart();
      },
      child: new GestureDetector({
        onPanStart: () => {
          this.position.scrollStart();
        },
        onPanUpdate: (event) => {
          this.applyUserOffset(event.delta);
          this.position.scrollUpdate(new Offset(event.position.x, event.position.y));
        },
        onPanEnd: () => {
          this.position.scrollEnd();
        },
        child: this.widget.viewportBuilder(context, this.position),
      }),
    });
  }
}
