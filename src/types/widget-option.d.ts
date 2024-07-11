import { Widget } from "@/lib/basic/framework";

export = WidgetOption;
export as namespace WidgetOption;

declare namespace WidgetOption {
  type Axis = any;
  type MainAxisAlignment = any;
  type CrossAxisAlignment = any;
  type StackFit = any;
  type Alignment = any;
  type Radius = number | Iterable<number>;

  class PaintingContext {
    paintChild(child: RenderView, offset?: Vector): void;
  }
  type RenderView = any;
  type RenderBox = any;
  interface RenderViewOption {
    child: RenderBox;
  }

  interface SingleChildRenderViewOption<ChildType = RenderView> {
    child: ChildType;
  }

  interface MultiChildRenderViewOption {
    children: RenderBox[];
  }

  interface PositionedOption {
    top: number;
    left: number;
    bottom: number;
    right: number;
    width: number;
    height: number;
  }

  interface BoundsRect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface BoundsRRect extends BoundsRect {
    radii: number | Iterable<number>;
  }

  interface ClipRectOption extends RenderViewOption {}

  interface ClipRRectOption extends ClipRectOption {
    borderRadius: Radius;
  }

  interface FlexOption {
    direction: Axis;
    mainAxisAlignment: MainAxisAlignment;
    crossAxisAlignment: CrossAxisAlignment;
  }

  interface LayoutSizes {
    mainSize: number;
    crossSize: number;
    allocatedSize: number;
  }

  interface ExpandedOption {
    flex: number;
  }
  interface StackOption {
    fit: StackFit;
    alignment: Alignment;
  }
  interface RectTLRB<T = number> {
    left: T;
    right: T;
    top: T;
    bottom: T;
  }
  interface SingleChildRenderObjectWidgetOption{
    child:Widget
  }
  interface PaddingOption {
    padding: Partial<RectTLRB>;
  }
}
