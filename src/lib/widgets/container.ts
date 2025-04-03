/*
 * @Author: AK1118
 * @Date: 2024-09-16 09:49:49
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2025-04-03 12:01:02
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
  