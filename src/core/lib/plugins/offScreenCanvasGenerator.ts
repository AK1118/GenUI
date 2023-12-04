import { OffScreenCanvasBuilderOption } from "@/types/index";
import Painter from "../painter";

class OffScreenCanvasBuilder {
  private offScreenCanvasBuilder: (width: number, height: number) => any;
  private offScreenContextBuilder: (offScreenCanvas: any) => any;
  private imageBuilder: (offScreenCanvas: any) => HTMLImageElement | any;
  constructor(option: OffScreenCanvasBuilderOption) {
    this.offScreenCanvasBuilder =
      option?.offScreenCanvasBuilder ||
      ((width: number, height: number) => null);
    this.offScreenContextBuilder =
      option?.offScreenContextBuilder || (() => null);
    this.imageBuilder =
      option?.imageBuilder || ((offScreenCanvas: any) => null);
  }
  public buildOffScreenCanvas(width: number, height: number): any {
    return this.offScreenCanvasBuilder?.(width, height);
  }
  public buildImage(offScreenCanvas: any) {
    return this.imageBuilder(offScreenCanvas);
  }
  public buildOffScreenContext(offScreenCanvas): Painter {
    const paint = this.offScreenContextBuilder?.(offScreenCanvas);
    if (!paint) return null;
    return new Painter(paint as any);
  }
}

export default OffScreenCanvasBuilder;
