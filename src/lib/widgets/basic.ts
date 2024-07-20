import { PipelineOwner, RendererBinding } from "../basic/binding";
import { BuildContext, Element } from "../basic/elements";
import {
  MultiChildRenderObjectWidget,
  MultiChildRenderObjectWidgetOption,
  RootRenderObjectElement,
  SingleChildRenderObjectWidget,
  SingleChildRenderObjectWidgetOption,
  Widget,
} from "../basic/framework";
import {
  AlignRenderView,
  Axis,
  ColoredRender,
  ConstrainedBoxRender,
  CrossAxisAlignment,
  FlexOption,
  FlexRenderView,
  MainAxisAlignment,
  PaddingOption,
  PaddingRenderView,
  RenderView,
  RootRenderView,
  SizedBoxOption,
  WrapAlignment,
  WrapCrossAlignment,
  WrapOption,
  WrapRenderView,
} from "../render-object/basic";
import Alignment from "../painting/alignment";
export interface ColoredBoxOption{
  color:string,
}
export class ColoredBox extends SingleChildRenderObjectWidget {
  private color: string;
  constructor(option:Partial<ColoredBoxOption&SingleChildRenderObjectWidgetOption>) {
    super(option?.child);
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
  private width: number;
  private height: number;
  constructor(option: Partial<SizedBoxOption & SingleChildRenderObjectWidget>) {
    super(option?.child);
    const { width, height } = option;
    this.width = width ?? 0;
    this.height = height ?? 0;
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

export class Padding extends SingleChildRenderObjectWidget {
  private option: Partial<PaddingOption>;
  constructor(
    option: Partial<PaddingOption & SingleChildRenderObjectWidgetOption>
  ) {
    super(option.child);
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
  constructor(alignment?: Alignment, child?: Widget) {
    super(child);
    this.alignment = alignment ?? Alignment.center;
  }
  createRenderObject(): RenderView {
    return new AlignRenderView(this.alignment);
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

export class Flex extends MultiChildRenderObjectWidget {
  public direction: Axis = Axis.horizontal;
  public mainAxisAlignment: MainAxisAlignment = MainAxisAlignment.start;
  public crossAxisAlignment: CrossAxisAlignment = CrossAxisAlignment.start;
  constructor(
    option: Partial<FlexOption & MultiChildRenderObjectWidgetOption>
  ) {
    const { direction, children, mainAxisAlignment, crossAxisAlignment } =
      option;
    super(children);
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
    option: Partial<WrapOption & MultiChildRenderObjectWidgetOption>
  ) {
    super(option?.children);
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
