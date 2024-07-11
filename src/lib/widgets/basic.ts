import {
  FlexOption,
  MultiChildRenderObjectWidgetOption,
  PaddingOption,
  SingleChildRenderObjectWidgetOption,
} from "@/types/widget-option";
import { PipelineOwner, RendererBinding } from "../basic/binding";
import { BuildContext } from "../basic/elements";
import {
  MultiChildRenderObjectWidget,
  SingleChildRenderObjectWidget,
  Widget,
} from "../basic/framework";
import {
  AlignRenderView,
  Axis,
  ColoredRender,
  ConstrainedBoxRender,
  CrossAxisAlignment,
  FlexRenderView,
  MainAxisAlignment,
  PaddingRenderView,
  RenderView,
  RootRenderView,
} from "../render-object/basic";
import Alignment from "../painting/alignment";

export class ColoredBox extends SingleChildRenderObjectWidget {
  private color: string;
  constructor(color: string, child?: Widget) {
    super(child);
    this.color = color;
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
  constructor(width?: number, height?: number, child?: Widget) {
    super(child);
    this.width = width;
    this.height = height;
  }
  createRenderObject(): RenderView {
    return new ConstrainedBoxRender(this.width, this.height);
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
    const view = new RootRenderView();
    view.attach(this.owner);
    return view;
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
