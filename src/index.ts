import { Binding } from "./lib/basic/binding";
import { BuildContext, BuildOwner, Element } from "./lib/basic/elements";
import {
  ComponentElement,
  MultiChildRenderObjectElement,
  MultiChildRenderObjectWidget,
  RenderObjectElement,
  SingleChildRenderObjectElement,
  SingleChildRenderObjectWidget,
  Widget,
} from "./lib/basic/framework";
import Rect, { Size } from "./lib/basic/rect";
import Vector from "./lib/math/vector";
import Alignment from "./lib/painting/alignment";
import Painter from "./lib/painting/painter";
import {
  Axis,
  Clip,
  CrossAxisAlignment,
  MainAxisAlignment,
  MultiChildRenderView,
  PaintingContext,
  RenderBox,
  RenderView,
  SingleChildRenderView,
  WrapAlignment,
  WrapCrossAlignment,
} from "./lib/render-object/basic";
import Constraints, { BoxConstraints } from "./lib/rendering/constraints";
import {
  Align,
  ColoredBox,
  Flex,
  Padding,
  SizeBox,
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
  Widget,
  ColoredBox,
  Padding,
  Align,
  Wrap,
  Flex,
  SizeBox,
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
  RenderView,
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
