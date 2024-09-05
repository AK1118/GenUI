import { Binding } from "./lib/basic/binding";
import { BuildContext, BuildOwner, Element } from "./lib/basic/elements";
import {
  ComponentElement,
  MultiChildRenderObjectElement,
  MultiChildRenderObjectWidget,
  RenderObjectElement,
  SingleChildRenderObjectElement,
  SingleChildRenderObjectWidget,
  State,
  StatefulWidget,
  StatelessWidget,
  Widget,
} from "./lib/basic/framework";
import Rect, { Size } from "./lib/basic/rect";
import { Axis, Clip, CrossAxisAlignment, MainAxisAlignment, WrapAlignment, WrapCrossAlignment } from "./lib/core/base-types";
import Vector from "./lib/math/vector";
import Alignment from "./lib/painting/alignment";
import Painter from "./lib/painting/painter";
import {
  MultiChildRenderView,
  PaintingContext,
  RenderBox,
  SingleChildRenderView,
} from "./lib/render-object/basic";
import Constraints, { BoxConstraints } from "./lib/rendering/constraints";
import {
  Align,
  ColoredBox,
  Flex,
  Padding,
  Wrap,
} from "./lib/widgets/basic";

const runApp = (rootWidget: Widget) => {
  const binding = Binding.getInstance();
  binding.elementBinding.attachRootWidget(rootWidget);
};

export {
  //Widget
  SingleChildRenderObjectWidget,
  MultiChildRenderObjectWidget,
  StatelessWidget,
  StatefulWidget,
  State,
  Widget,
  ColoredBox,
  Padding,
  Align,
  Wrap,
  Flex,
  //Basic
  Alignment,
  WrapAlignment,
  WrapCrossAlignment,
  Axis,
  MainAxisAlignment,
  CrossAxisAlignment,
  Clip,
  BuildContext,
  BuildOwner,
  //RenderView
  RenderBox,
  SingleChildRenderView,
  MultiChildRenderView,
  //Elements
  Element,
  RenderObjectElement,
  ComponentElement,
  SingleChildRenderObjectElement,
  MultiChildRenderObjectElement,
  //Utils
  Size,
  Rect,
  BoxConstraints,
  Constraints,
  PaintingContext,
  Painter,
  Vector,
  //runApp
};
export default runApp;
