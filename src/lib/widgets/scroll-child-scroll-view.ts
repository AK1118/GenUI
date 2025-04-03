/*
 * @Author: AK1118
 * @Date: 2024-09-16 09:49:49
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2025-04-03 11:58:54
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
import { Scrollable } from "./scrollable";
import { ScrollViewArguments } from "./scroll-view";

interface SingleChildScrollViewArguments extends ScrollViewArguments { }
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
                new WidgetToSliverAdapter({
                    child: this.child,
                }),
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
