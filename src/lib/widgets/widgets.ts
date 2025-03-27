/*
 * @Author: AK1118
 * @Date: 2024-09-16 09:49:49
 * @Last Modified by: AK1118
 * @Last Modified time: 2024-09-16 17:54:29
 * @Description: 组合类组件
 */
import { BuildContext } from "../basic/elements";
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
import { AlignArguments, RectTLRB } from "../render-object/basic";
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

interface ContainerArguments {
  width: number;
  height: number;
  color: Color;
  child: Widget;
  decoration: BoxDecoration;
  alignment: Alignment;
  constraints: BoxConstraints;
  key: Key;
  padding: Partial<RectTLRB>;
}

export class Container extends StatelessWidget implements ContainerArguments {
  width: number;
  height: number;
  constraints: BoxConstraints;
  color: Color;
  child: Widget;
  decoration: BoxDecoration;
  alignment: Alignment;
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
    this.alignment = args?.alignment;
    this.key = args?.key;
    this.padding = args?.padding;

    this.constraints =
      this.width !== null || this.height !== null
        ? this.constraints?.tighten(this.width, this.height) ??
          BoxConstraints.tightFor(this.width, this.height)
        : this.constraints;
  }
  /**
   * 根据参数选择使用对应的组件包裹，包裹顺序由底至高。
   * 例如：@Padding 依赖 @ConstrainedBox 的约束，所以Padding必须是 @ConstrainedBox 的child。
   * 而 @DecoratedBox 的渲染需要覆盖整个 @ConstrainedBox ,所以需要在 @ConstrainedBox 之上。
   */
  build(context: BuildContext): Widget {
    let result: Widget = this.child;
    if (
      this.child === null &&
      (this.constraints === null || !this.constraints?.isTight)
    ) {
      result = new ConstrainedBox({
        additionalConstraints: BoxConstraints.expand(),
        child: result,
      });
    } else if (this.alignment) {
      result = new Align({
        alignment: this.alignment,
        child: result,
      });
    }

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

    if (this.constraints) {
      result = new ConstrainedBox({
        additionalConstraints: this.constraints,
        child: result,
      });
    }

    if (this.decoration) {
      if (this.color) {
        throw new Error("color and decoration can't be used at the same time");
      }
      result = new DecoratedBox({
        decoration: this.decoration,
        child: result,
      });
    }

    return result;
  }
}

type RowArguments = {
  mainAxisAlignment: MainAxisAlignment;
  crossAxisAlignment: CrossAxisAlignment;
};

export class Row extends Flex {
  constructor(
    args: Partial<RowArguments & MultiChildRenderObjectWidgetArguments>
  ) {
    super({
      ...args,
      direction: Axis.horizontal,
    });
  }
}

type ColumnArguments = {
  mainAxisAlignment: MainAxisAlignment;
  crossAxisAlignment: CrossAxisAlignment;
};

export class Column extends Flex {
  constructor(
    args: Partial<ColumnArguments & MultiChildRenderObjectWidgetArguments>
  ) {
    super({
      ...args,
      direction: Axis.vertical,
    });
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
        onPanStart: () => {
          this.position.scrollStart();
        },
        onPanUpdate: (event) => {
          this.applyUserOffset(event.delta);
          this.position.scrollUpdate(
            new Offset(event.position.x, event.position.y)
          );
        },
        onPanEnd: () => {
          this.position.scrollEnd();
        },
        child: this.widget.viewportBuilder(context, this.position),
      }),
    });
  }
}

interface ScrollViewArguments {
  controller: ScrollController;
  axisDirection: AxisDirection;
  physics: ScrollPhysics;
}

interface SingleChildScrollViewArguments extends ScrollViewArguments {}

export abstract class ScrollView extends StatelessWidget {
  private controller: ScrollController;
  private axisDirection: AxisDirection;
  private physics: ScrollPhysics;
  private children: Array<Widget>;
  constructor(
    args: Partial<
      SingleChildScrollViewArguments & MultiChildRenderObjectWidgetArguments
    >
  ) {
    super(args.key);
    this.controller = args?.controller ?? new ScrollController();
    this.axisDirection = args?.axisDirection ?? AxisDirection.down;
    this.physics = args?.physics ?? new SimpleScrollPhysics();
    this.children = args?.children;
  }
  abstract buildSlivers(context: BuildContext): Array<Widget>;
  protected viewportBuilder(
    context: BuildContext,
    offset: ViewPortOffset,
    axisDirection: AxisDirection,
    slivers: Array<Widget>
  ): ViewPort {
    return new ViewPort({
      offset: offset,
      axisDirection: axisDirection,
      children: slivers,
    });
  }
  build(context: BuildContext): Widget {
    const slivers = this.buildSlivers(context);
    return new Scrollable({
      controller: this.controller,
      axisDirection: this.axisDirection,
      physics: this.physics,
      viewportBuilder: (context: BuildContext, offset: ViewPortOffset) => {
        return this.viewportBuilder(
          context,
          offset,
          this.axisDirection,
          slivers
        );
      },
    });
  }
}

export class SingleChildScrollView extends StatelessWidget {
  private controller: ScrollController;
  private axisDirection: AxisDirection;
  private physics: ScrollPhysics;
  private child: Widget;
  constructor(
    args: Partial<
      SingleChildScrollViewArguments & SingleChildRenderObjectWidgetArguments
    >
  ) {
    super(args.key);
    this.controller = args?.controller ?? new ScrollController();
    this.axisDirection = args?.axisDirection ?? AxisDirection.down;
    this.physics = args?.physics ?? new SimpleScrollPhysics();
    this.child = args?.child;
  }
  private viewportBuilder(
    context: BuildContext,
    position: ScrollPosition
  ): ViewPort {
    return new ViewPort({
      offset: position,
      axisDirection: position.axisDirection,
      children: [
        this.child,
        // new WidgetToSliverAdapter({
        //   child: this.child,
        // }),
      ],
    });
  }
  build(context: BuildContext): Widget {
    return new Scrollable({
      controller: this.controller,
      axisDirection: this.axisDirection,
      physics: this.physics,
      viewportBuilder: this.viewportBuilder.bind(this),
    });
  }
}
