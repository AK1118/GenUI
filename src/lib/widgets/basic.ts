import { PipelineOwner, RendererBinding } from "../basic/binding";
import { BuildContext, Element } from "../basic/elements";
import {
  MultiChildRenderObjectWidget,
  MultiChildRenderObjectWidgetArguments,
  ParentDataWidget,
  RootRenderObjectElement,
  SingleChildRenderObjectWidget,
  SingleChildRenderObjectWidgetArguments,
  State,
  StatefulWidget,
  StatelessWidget,
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
  onPointerCancelCallback,
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
  RenderTransformArguments,
  RenderTransformBox,
  RenderView,
  RootRenderView,
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
import { Matrix4 } from "../math/matrix";
import Vector from "../math/vector";
import {
  CancelPointerEvent,
  DownPointerEvent,
  MovePointerEvent,
  PanZoomEndPointerEvent,
  PanZoomStartPointerEvent,
  PanZoomUpdatePointerEvent,
  UpPointerEvent,
} from "../gesture/events";
import {
  GestureRecognizer,
  GestureRecognizerFactory,
} from "../gesture/recognizers/gesture-recognizer";
import TapGestureRecognizer, {
  TapGestureRecognizerArguments,
} from "../gesture/recognizers/tap";
import DoubleTapGestureRecognizer, {
  DoubleTapGestureRecognizerArguments,
} from "../gesture/recognizers/double-tap";
import LongPressGestureRecognizer, {
  LongPressGestureRecognizerArguments,
} from "../gesture/recognizers/long-press";
import PanDragGestureRecognizer, { PanDragGestureRecognizerArguments } from "../gesture/recognizers/pan-drag";
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
      console.log("更新Position",this.top,this.left);
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

export class Listener extends SingleChildRenderObjectWidget {
  private _onPointerDown: onPointerDownCallback;
  private _onPointerMove: onPointerMoveCallback;
  private _onPointerUp: onPointerUpCallback;
  private _onPointerCancel: onPointerCancelCallback;
  constructor(
    option: Partial<
      RenderPointerListenerArguments & SingleChildRenderObjectWidget
    >
  ) {
    super(option?.child, option.key);
    this._onPointerDown = option.onPointerDown;
    this._onPointerMove = option.onPointerMove;
    this._onPointerUp = option.onPointerUp;
    this._onPointerCancel = option.onPointerCancel;
  }
  createRenderObject(): RenderView {
    return new RenderPointerListener({
      onPointerDown: this._onPointerDown,
      onPointerMove: this._onPointerMove,
      onPointerUp: this._onPointerUp,
      onPointerCancel: this._onPointerCancel,
    });
  }
  updateRenderObject(
    context: BuildContext,
    renderView: RenderPointerListener
  ): void {
    renderView.onPointerDown = this._onPointerDown;
    renderView.onPointerMove = this._onPointerMove;
    renderView.onPointerUp = this._onPointerUp;
    renderView.onPointerCancel = this._onPointerCancel;
  }
}

export interface TransformRotateArguments {
  angle: number;
  origin: Vector;
  alignment: Alignment;
  angleX: number;
  angleY: number;
}

export interface TransformScaleArguments {
  scale: number;
  scaleX: number;
  scaleY: number;
  alignment: Alignment;
  origin: Vector;
}

export interface TransformTranslateArguments {
  x: number;
  y: number;
}
export class Transform extends SingleChildRenderObjectWidget {
  private _transform: Matrix4;
  private origin: Vector;
  private alignment: Alignment;
  constructor(
    option: Partial<RenderTransformArguments & SingleChildRenderObjectWidget>
  ) {
    super(option?.child, option.key);
    this._transform = option.transform ?? Matrix4.zero;
    this.origin = option.origin;
    this.alignment = option.alignment;
  }
  createRenderObject(): RenderView {
    return new RenderTransformBox({
      transform: this._transform,
      origin: this.origin,
      alignment: this.alignment,
    });
  }
  updateRenderObject(
    context: BuildContext,
    renderView: RenderTransformBox
  ): void {
    renderView.transform = this._transform;
    renderView.origin = this.origin;
    renderView.alignment = this.alignment;
  }

  static rotate(
    option: Partial<
      TransformRotateArguments & SingleChildRenderObjectWidgetArguments
    >
  ): Transform {
    const { angleX, angleY, angle } = option;
    const transform: Matrix4 = Matrix4.zero.identity();
    if (angle) {
      transform.rotateZ(angle);
    }
    if (angleY) {
      transform.rotateY(angleY);
    }
    if (angleX) {
      transform.rotateX(angleX);
    }
    return new Transform({
      child: option?.child,
      transform: transform,
      alignment: option?.alignment,
      origin: option?.origin,
    });
  }
  static translate(
    option: Partial<
      TransformTranslateArguments & SingleChildRenderObjectWidgetArguments
    >
  ): Transform {
    const { x, y } = option;
    const transform = Matrix4.zero.identity();
    transform.translate(x, y);
    return new Transform({
      transform,
      child: option?.child,
    });
  }
  static scale(
    option: Partial<
      TransformScaleArguments & SingleChildRenderObjectWidgetArguments
    >
  ): Transform {
    const { scaleX = 1, scaleY = 1, scale, origin, alignment } = option;
    const transform: Matrix4 = Matrix4.zero;
    transform.scale(scaleX, scaleY);
    if (scale) {
      transform.scale(scale, scale);
    }
    transform.setValue(15, 1);
    return new Transform({
      child: option?.child,
      transform,
      alignment,
      origin,
    });
  }
}

interface GestureDetectorArguments
  extends TapGestureRecognizerArguments,
    DoubleTapGestureRecognizerArguments,
    LongPressGestureRecognizerArguments,
    PanDragGestureRecognizerArguments {}

export class GestureDetector
  extends StatelessWidget
  implements GestureDetectorArguments
{
  private gestureRecognizers: Map<any, GestureRecognizer> = new Map();
  private child: Widget;
  onTap: VoidFunction;
  onTapDown: VoidFunction;
  onTapUp: VoidFunction;
  onDoubleTap: VoidFunction;
  onTapCancel: VoidFunction;
  onLongPress: VoidFunction;
  onPanStart: (event: PanZoomStartPointerEvent) => void;
  onPanUpdate: (event: PanZoomUpdatePointerEvent) => void;
  onPanEnd: (event: PanZoomEndPointerEvent) => void;
  constructor(
    option?: Partial<
      GestureDetectorArguments & SingleChildRenderObjectWidgetArguments
    >
  ) {
    super(option?.key);
    this.child = option?.child;
    this.onTap = option?.onTap;
    this.onTapDown = option?.onTapDown;
    this.onTapUp = option?.onTapUp;
    this.onTapCancel = option?.onTapCancel;
    this.onDoubleTap = option?.onDoubleTap;
    this.onLongPress = option?.onLongPress;
    this.onPanStart = option?.onPanStart;
    this.onPanUpdate = option?.onPanUpdate;
    this.onPanEnd = option?.onPanEnd;
  }
 

  build(context: BuildContext): Widget {
    const gestures: Map<
      any,
      GestureRecognizerFactory<GestureRecognizer>
    > = new Map();
    gestures.set(
      TapGestureRecognizer,
      new GestureRecognizerFactory(
        () => new TapGestureRecognizer(),
        (instance) => {
          instance.onTap = this.onTap;
          instance.onTapDown = this.onTapDown;
          instance.onTapUp = this.onTapUp;
          instance.onTapCancel = this.onTapCancel;
        }
      )
    );
    gestures.set(
      DoubleTapGestureRecognizer,
      new GestureRecognizerFactory(
        () => new DoubleTapGestureRecognizer(),
        (instance) => {
          instance.onDoubleTap = this.onDoubleTap;
        }
      )
    );
    gestures.set(
      LongPressGestureRecognizer,
      new GestureRecognizerFactory(
        () => new LongPressGestureRecognizer(),
        (instance) => {
          instance.onLongPress = this.onLongPress;
        }
      )
    );
    gestures.set(
      PanDragGestureRecognizer,
      new GestureRecognizerFactory(
        () => new PanDragGestureRecognizer(),
        (instance) => {
          instance.onPanEnd = this.onPanEnd;
          instance.onPanStart = this.onPanStart;
          instance.onPanUpdate = this.onPanUpdate;
        }
      )
    );

    return new RawGestureDetector({
      gestures: gestures,
      child: this.child,
    });
  }
}

interface RawGestureDetectorArguments {
  gestures: Map<any, GestureRecognizerFactory<GestureRecognizer>>;
}

class RawGestureDetector extends StatefulWidget {
  public gestures: Map<any, GestureRecognizerFactory<GestureRecognizer>> =
    new Map();
  public child: Widget;
  constructor(
    option: Partial<
      RawGestureDetectorArguments & SingleChildRenderObjectWidgetArguments
    >
  ) {
    super();
    this.gestures = option?.gestures;
    this.child = option?.child;
  }
  createState(): State {
    return new _RawGestureDetectorState();
  }
}

class _RawGestureDetectorState extends State<RawGestureDetector> {
  public gestureRecognizers: Map<any, GestureRecognizer> = new Map();

  public initState(): void {
    super.initState();
    this.handleInitGestures(this.widget.gestures);
  }

  build(context: BuildContext): Widget {
    return new Listener({
      child: this.widget.child,
      onPointerDown: this.handlePointerDown.bind(this),
    });
  }
  private handlePointerDown(event: DownPointerEvent) {
    for (const gesture of this.gestureRecognizers.values()) {
      gesture.addPointer(event);
    }
  }
  private handleInitGestures(
    gestures: Map<any, GestureRecognizerFactory<GestureRecognizer>>
  ) {
    for (const [key, gesture] of gestures) {
      const gesture_ = gesture._constructor();
      gesture._initializer(gesture_);
      this.gestureRecognizers.set(key, gesture_);
    }
  }
}
