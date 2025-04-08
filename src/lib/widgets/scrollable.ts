/*
 * @Author: AK1118
 * @Date: 2024-09-16 09:49:49
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2025-04-03 11:57:33
 * @Description: 组合类组件
 */
import { BuildContext, Element } from "../basic/elements";
import {
  MultiChildRenderObjectWidgetArguments,
  SingleChildRenderObjectWidget,
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
import {
  Axis,
  AxisDirection,
  Clip,
  CrossAxisAlignment,
  MainAxisAlignment,
} from "../core/base-types";
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
import { AlignArguments, FlexOption, RectTLRB } from "../render-object/basic";
import {
  axisDirectionIsReversed,
  axisDirectionToAxis,
  RenderSliver,
} from "../render-object/slivers";
import { BoxConstraints } from "../rendering/constraints";
import {
  ScrollPosition,
  ScrollPositionWithSingleContext,
  ViewPortOffset,
} from "../render-object/viewport";
import VelocityTracker from "../utils/velocity-ticker";
import {
  Align,
  ClipRRect,
  ColoredBox,
  ConstrainedBox,
  DecoratedBox,
  Flex,
  GestureDetector,
  Listener,
  Padding,
  SizedBox,
  Text,
  ViewPort,
  WidgetToSliverAdapter,
} from "./basic";
import { ScrollController } from "./scroll";
import { Color } from "../painting/color";


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
  export class Scrollable extends StatefulWidget {
    viewportBuilder: ViewportBuilder;
    axisDirection: AxisDirection;
    physics: ScrollPhysics;
    constructor(args: Partial<ScrollableArguments>) {
      super();
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
      this.effectiveController = this.widget.controller ?? new ScrollController();
      this.updatePosition();
    }
    private updatePosition() {
      const oldPosition = this.position;
      if (oldPosition) {
        this.effectiveController.detach(oldPosition);
      }
      const position = this.widget.controller.createScrollPosition(
        this.widget.physics,
        this.widget.axisDirection,
        oldPosition?.pixels
      );
      this.effectiveController.attach(position);
      this.position = position;
    }
    private applyUserOffset(offset: Offset) {
      this.position.pointerScroll(offset);
    }
    public didUpdateWidget(oldWidget: Widget): void {
      super.didUpdateWidget(oldWidget);
      // this.updatePosition();
    }
    build(context: BuildContext): Widget {
      return new Listener({
        onPointerDown: () => {
          this.position.scrollStart();
        },
        child: new GestureDetector({
          onDragStart: () => {
            this.position.scrollStart();
          },
          onDragUpdate: (event) => {
            this.applyUserOffset(event.delta);
            this.position.scrollUpdate(
              new Offset(event.position.x, event.position.y)
            );
          },
          onDragEnd: () => {
            this.position.scrollEnd();
          },
          child: this.widget.viewportBuilder(context, this.position),
        }),
      });
    }
  }