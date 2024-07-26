import { PipelineOwner, RendererBinding } from "../basic/binding";
import { BuildContext, Element } from "../basic/elements";
import {
  MultiChildRenderObjectWidget,
  MultiChildRenderObjectWidgetArguments,
  ParentDataWidget,
  RootRenderObjectElement,
  SingleChildRenderObjectWidget,
  SingleChildRenderObjectWidgetArguments,
  Widget,
} from "../basic/framework";
import {
  AlignArguments,
  AlignRenderView,
  Axis,
  ClipRectRenderView,
  ClipRRectArguments,
  ClipRRectRenderView,
  ColoredRender,
  ConstrainedBoxRender,
  CrossAxisAlignment,
  ExpandedArguments,
  FlexOption,
  FlexParentData,
  FlexRenderView,
  MainAxisAlignment,
  onPointerDownCallback,
  onPointerMoveCallback,
  onPointerUpCallback,
  PaddingOption,
  PaddingRenderView,
  ParentDataRenderView,
  PositionedArguments,
  Radius,
  RenderPointerListener,
  RenderPointerListenerArguments,
  RenderView,
  RootRenderView,
  RotateArguments,
  RotateRenderView,
  SizedBoxOption,
  StackFit,
  StackOption,
  StackParentData,
  StackRenderView,
  WrapAlignment,
  WrapCrossAlignment,
  WrapOption,
  WrapRenderView,
} from "../render-object/basic";
import Alignment from "../painting/alignment";
export interface ColoredBoxOption {
  color: string;
}
export class ColoredBox extends SingleChildRenderObjectWidget {
  private color: string;
  constructor(
    option: Partial<ColoredBoxOption & SingleChildRenderObjectWidgetArguments>
  ) {
    super(option?.child, option.key);
    this.color = option?.color;
  }
  createRenderObject(): RenderView {
    return new ColoredRender(this.color);
  }
  updateRenderObject(context: BuildContext, renderView: RenderView) {
    (renderView as ColoredRender).color = this.color;
  }
}

export class SizeBox extends SingleChildRenderObjectWidget {
  protected width: number;
  protected height: number;
  constructor(option: Partial<SizedBoxOption & SingleChildRenderObjectWidget>) {
    super(option?.child, option.key);
    const { width, height } = option;
    this.width = width;
    this.height = height;
  }
  createRenderObject(): RenderView {
    return new ConstrainedBoxRender({
      width: this.width,
      height: this.height,
    });
  }
  updateRenderObject(context: BuildContext, renderView: RenderView) {
    (renderView as ConstrainedBoxRender).setSize(this.width, this.height);
  }
}
export { SizeBox as SizedBox };

export class Padding extends SingleChildRenderObjectWidget {
  private option: Partial<PaddingOption>;
  constructor(
    option: Partial<PaddingOption & SingleChildRenderObjectWidgetArguments>
  ) {
    super(option.child, option.key);
    this.option = option;
  }
  createRenderObject(): RenderView {
    return new PaddingRenderView({
      padding: this.option.padding,
    });
  }
  updateRenderObject(context: BuildContext, renderView: RenderView): void {
    (renderView as PaddingRenderView).padding = this.option.padding;
  }
}

export class Align extends SingleChildRenderObjectWidget {
  private alignment: Alignment;
  constructor(
    option: Partial<AlignArguments & SingleChildRenderObjectWidgetArguments>
  ) {
    super(option?.child, option.key);
    this.alignment = option?.alignment ?? Alignment.center;
  }
  createRenderObject(): RenderView {
    return new AlignRenderView({
      alignment: this.alignment,
    });
  }
  updateRenderObject(context: BuildContext, renderView: RenderView): void {
    (renderView as AlignRenderView).alignment = this.alignment;
  }
}

export class RootWidget extends SingleChildRenderObjectWidget {
  private owner: PipelineOwner = RendererBinding.instance.pipelineOwner;
  createRenderObject(): RenderView {
    return new RootRenderView();
  }
  createElement(): Element {
    return new RootRenderObjectElement(this);
  }
  updateRenderObject(context: BuildContext, renderView: RenderView) {}
}
export class Expanded extends ParentDataWidget<FlexParentData> {
  private flex: number = 0;
  constructor(
    option: Partial<ExpandedArguments & SingleChildRenderObjectWidgetArguments>
  ) {
    super(option?.child, option.key);
    this.flex = option?.flex ?? 0;
  }
  applyParentData(renderView: ParentDataRenderView<FlexParentData>): void {
    const flexParentData = renderView?.parentData as FlexParentData;
    flexParentData.flex = this.flex;
    renderView.parentData = flexParentData;
    if (renderView.parent instanceof RenderView) {
      renderView.parent.markNeedsLayout();
    }
  }
}
export class Flex extends MultiChildRenderObjectWidget {
  public direction: Axis = Axis.horizontal;
  public mainAxisAlignment: MainAxisAlignment = MainAxisAlignment.start;
  public crossAxisAlignment: CrossAxisAlignment = CrossAxisAlignment.start;
  constructor(
    option: Partial<FlexOption & MultiChildRenderObjectWidgetArguments>
  ) {
    const { direction, children, mainAxisAlignment, crossAxisAlignment } =
      option;
    super(children, option.key);
    this.direction = direction ?? this.direction;
    this.mainAxisAlignment = mainAxisAlignment ?? this.mainAxisAlignment;
    this.crossAxisAlignment = crossAxisAlignment ?? this.crossAxisAlignment;
  }
  createRenderObject(): RenderView {
    return new FlexRenderView({
      direction: this.direction,
      mainAxisAlignment: this.mainAxisAlignment,
      crossAxisAlignment: this.crossAxisAlignment,
    });
  }
  updateRenderObject(context: BuildContext, renderView: FlexRenderView): void {
    renderView.direction = this.direction;
    renderView.mainAxisAlignment = this.mainAxisAlignment;
    renderView.crossAxisAlignment = this.crossAxisAlignment;
  }
}

export class Wrap extends MultiChildRenderObjectWidget {
  direction: Axis = Axis.horizontal;
  spacing: number = 0;
  runSpacing: number = 0;
  alignment: WrapAlignment = WrapAlignment.start;
  runAlignment: WrapAlignment = WrapAlignment.start;
  crossAxisAlignment: WrapCrossAlignment = WrapCrossAlignment.start;
  constructor(
    option: Partial<WrapOption & MultiChildRenderObjectWidgetArguments>
  ) {
    super(option?.children, option.key);
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

export class ClipRect extends SizeBox {
  createRenderObject(): RenderView {
    return new ClipRectRenderView({
      width: this.width,
      height: this.height,
    });
  }
}
export class ClipRRect extends ClipRect {
  private borderRadius: Radius = 0;
  constructor(
    option: Partial<
      ClipRRectArguments & SizedBoxOption & SingleChildRenderObjectWidget
    >
  ) {
    super(option);
    this.borderRadius = option?.borderRadius ?? 0;
  }
  createRenderObject(): RenderView {
    return new ClipRRectRenderView({
      borderRadius: this.borderRadius,
      width: this.width,
      height: this.height,
    });
  }
  updateRenderObject(
    context: BuildContext,
    renderView: ClipRRectRenderView
  ): void {
    renderView.borderRadius = this.borderRadius;
  }
}

export class Positioned extends ParentDataWidget<StackParentData> {
  private top: number;
  private left: number;
  private right: number;
  private bottom: number;
  private width: number;
  private height: number;
  constructor(
    option: Partial<
      PositionedArguments & SingleChildRenderObjectWidgetArguments
    >
  ) {
    const { child, top, bottom, left, right, width, height } = option;
    super(child, option.key);
    this.top = top;
    this.bottom = bottom;
    this.left = left;
    this.right = right;
    this.width = width;
    this.height = height;
  }
  applyParentData(child: ParentDataRenderView<StackParentData>): void {
    const parentData = child.parentData;
    parentData.bottom = this.bottom;
    parentData.top = this.top;
    parentData.left = this.left;
    parentData.right = this.right;
    parentData.width = this.width;
    parentData.height = this.height;
    if (child?.parent instanceof RenderView) {
      child.parent.markNeedsLayout();
    }
  }
}

export class Stack extends MultiChildRenderObjectWidget {
  private _fit: StackFit = StackFit.loose;
  private _alignment: Alignment = Alignment.topLeft;
  constructor(
    option: Partial<StackOption & MultiChildRenderObjectWidgetArguments>
  ) {
    super(option?.children, option.key);
    this._fit = option?.fit ?? StackFit.loose;
    this._alignment = option?.alignment ?? Alignment.topLeft;
  }
  createRenderObject(): RenderView {
    return new StackRenderView({
      fit: this._fit,
      alignment: this._alignment,
    });
  }
  updateRenderObject(context: BuildContext, renderView: StackRenderView): void {
    renderView.fit = this._fit;
    renderView.alignment = this._alignment;
  }
}

export class Rotate extends SingleChildRenderObjectWidget {
  private _angle: number;
  constructor(
    option: Partial<RotateArguments & SingleChildRenderObjectWidgetArguments>
  ) {
    super(option?.child, option.key);
    this._angle = option.angle ?? 0;
  }

  createRenderObject(): RenderView {
    return new RotateRenderView({
      angle: this._angle,
    });
  }
  updateRenderObject(
    context: BuildContext,
    renderView: RotateRenderView
  ): void {
    renderView.angle = this._angle;
  }
}

export class Listener extends SingleChildRenderObjectWidget {
  private _onPointerDown: onPointerDownCallback;
  private _onPointerMove: onPointerMoveCallback;
  private _onPointerUp: onPointerUpCallback;
  constructor(
    option: Partial<
      RenderPointerListenerArguments & SingleChildRenderObjectWidget
    >
  ) {
    super(option?.child, option.key);
    this._onPointerDown = option.onPointerDown;
    this._onPointerMove = option.onPointerMove;
    this._onPointerUp = option.onPointerUp;
  }
  createRenderObject(): RenderView {
    return new RenderPointerListener({
      onPointerDown: this._onPointerDown,
      onPointerMove: this._onPointerMove,
      onPointerUp: this._onPointerUp,
    });
  }
  updateRenderObject(
    context: BuildContext,
    renderView: RenderPointerListener
  ): void {
    renderView.onPointerDown = this._onPointerDown;
    renderView.onPointerMove = this._onPointerMove;
    renderView.onPointerUp = this._onPointerUp;
  }
}
