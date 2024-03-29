import GradientDecorationBase from "@/core/bases/gradient-base";
import Painter from "../../painter";
import { LineGradientDecorationOption } from "Graphics";
import Alignment from "../../painting/alignment";

class LineGradientDecoration extends GradientDecorationBase<LineGradientDecorationOption> {
  constructor(option: LineGradientDecorationOption) {
    super(option);
    this.option = option;
    this.type = "lineGradient";
    this.option.type = "lineGradient";
    this.checkAlignments();
  }
  private checkAlignments(): void {
    const {
      begin,
      end,
    }: {
      begin: any;
      end: any;
    } = this.option;
    const isAlignmentInstance = (obj: unknown): boolean => {
      return obj instanceof Alignment;
    };
    if (isAlignmentInstance(begin) && isAlignmentInstance(end)) return;
    this.option.begin = Alignment.format(begin.x, begin.y);
    this.option.end = Alignment.format(end.x, end.y);
  }
  generateGradient(paint: Painter, size: Size): CanvasGradient {
    // const begin:Alignment=Alignment.topLeft;
    // const end:Alignment=Alignment.bottomRight;
    const { begin, end } = this.option;
    const { offsetX, offsetY } = begin.compute(size);
    const { offsetX: ex, offsetY: ey } = end.compute(size);
    this.gradient = paint.createLinearGradient(offsetX, offsetY, ex, ey);
    this.mountColorStops(this.gradient);
    return this.gradient;
  }
  public static format(
    option: LineGradientDecorationOption
  ): LineGradientDecoration {
    const b = option.begin as any,
      e = option.end as any;
    const begin = Alignment.format(b.x, b.y);
    const end = Alignment.format(e.x, e.y);
    return new LineGradientDecoration({
      ...option,
      begin,
      end,
    });
  }
}
export default LineGradientDecoration;
