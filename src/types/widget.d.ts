export = Widget;
export as namespace Widget;

declare namespace Widget {
  type Radius = number | Iterable<number>;

  class PaintingContext {
    paintChild(child: RenderView, offset?: Vector): void;
  }
  type RenderView = any;

  interface RenderViewOption {
    child: RenderView;
  }

  interface SingleChildRenderViewOption {
    child: RenderView;
  }
  
  interface PositionedOption {
    top: number;
    left: number;
    bottom: number;
    right: number;
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

}
