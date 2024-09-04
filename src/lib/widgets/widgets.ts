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
import { AlignArguments, Axis, RectTLRB } from "../render-object/basic";
import {
  AxisDirection,
  axisDirectionIsReversed,
  axisDirectionToAxis,
} from "../render-object/slivers";
import { BoxConstraints } from "../rendering/constraints";
import { ScrollPosition } from "../rendering/viewport";
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
  }
  createState(): State<Scrollable> {
    return new ScrollableState();
  }
}

class ScrollableState extends State<Scrollable> {
  private position: ScrollPosition;
  private delta: number = 0;
  private velocityTicker: VelocityTracker = new VelocityTracker(new Duration({
    milliseconds:200
  }));
  private animationController = new AnimationController({});
  public initState(): void {
    this.position = new ScrollPosition({
      axisDirection: this.widget.axisDirection,
      physics: this.widget.physics,
    });
  }
  private applyUserOffset(offset: Offset) {
    this.delta = this.position.applyUserOffset(offset);
    this.position.setPixels(this.position.pixels + this.delta);
  }
  private handleStartSimulation() {
    const velocityOffset = this.velocityTicker.getVelocity();
    const simulation = this.position.createBallisticSimulation(velocityOffset);
    if (simulation) {
      this.animationController.animateWidthSimulation(simulation);
      this.animationController.addListener(() => {
        this.position.setPixels(this.animationController.value);
      });
    }
  }
  build(context: BuildContext): Widget {
    return new Listener({
      onPointerDown: () => {
        this.animationController.stop();
      },
      child:new GestureDetector({
        onPanUpdate:(event)=>{
          this.applyUserOffset(event.delta);
          this.velocityTicker.addPosition(
            new Offset(event.position.x, event.position.y)
          );
        },
        onPanEnd: () => {
          this.handleStartSimulation();
        },
        child: this.widget.viewportBuilder(context, this.position)
      }),
    });
  }
}
