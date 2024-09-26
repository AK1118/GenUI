import Rect, { Offset } from "../basic/rect";
import { Matrix4 } from "../math/matrix";
import Alignment from "./alignment";
import Color from "./color";
import * as ui from "@/lib/native/ui";
interface GradientArguments {
  colors: Array<Color>;
  stops: Array<number>;
  transform: Matrix4;
}

export abstract class Gradient {
  constructor(
    public colors: Array<Color>,
    public stops: Array<number>=[],
    public transform: Matrix4
  ) {
    if (!colors || colors?.length === 0) {
      throw new Error("colors can not be empty");
    }
  }
  abstract createShader(rect: Rect): CanvasGradient;
  protected initGradient(gradient: CanvasGradient) {
    const colors = this.colors;
    const stops = this.stops;
    const avg = 1 / Math.max(colors.length - 1, 1);
    // 计算 stops 的长度
    const stopCount = Math.max(colors.length, stops.length);
    for (let i = 0; i < stopCount; i++) {
      const color = colors?.[i];
      const stop = stops?.[i] ?? i * avg; // 使用默认值
      // 只有当 color 存在时才添加
      if (color) {
        gradient.addColorStop(stop, color.rgba);
      }
    }
  }
}

interface LinearGradientArguments extends GradientArguments {
  begin: Alignment;
  end: Alignment;
}

export class LinearGradient extends Gradient {
  private readonly begin: Alignment;
  private readonly end: Alignment;
  constructor(args: Partial<LinearGradientArguments>) {
    super(args?.colors, args?.stops, args?.transform);
    this.begin = args?.begin ?? Alignment.centerLeft;
    this.end = args?.end ?? Alignment.centerRight;
  }
  createShader(rect: Rect): CanvasGradient {
    const gradient = ui.Gradient.linear(
      this.begin.withRect(rect),
      this.end.withRect(rect)
    );
    this.initGradient(gradient);
    return gradient;
  }
}

interface GradientArguments extends Gradient {
  center: Alignment;
  radius: number;
}

export class RadialGradient extends Gradient {
  private readonly center: Alignment;
  private readonly radius: number;
  constructor(args: Partial<GradientArguments>) {
    super(args?.colors, args?.stops, args?.transform);
    this.center = args?.center ?? Alignment.center;
    this.radius = args?.radius ?? 0.5;
  }

  createShader(rect: Rect): CanvasGradient {
    const gradient = ui.Gradient.radial(
      this.center.withRect(rect),
      this.radius * rect.shortestSide
    );
    this.initGradient(gradient);
    return gradient;
  }
}


interface SweepGradientArguments extends GradientArguments{
    center: Alignment;
    startAngle: number;
    // endAngle: number;
}

export class SweepGradient extends Gradient{
    private readonly center: Alignment;
    private readonly startAngle: number;
    private readonly endAngle: number;
    constructor(args: Partial<SweepGradientArguments>) {
        super(args?.colors, args?.stops, args?.transform);
        this.center = args?.center ?? Alignment.center;
        this.startAngle = args?.startAngle ?? 0;
        // this.endAngle = args?.endAngle ?? Math.PI * 2;
    }
    createShader(rect: Rect): CanvasGradient {
        const gradient = ui.Gradient.sweep(this.center.withRect(rect), this.startAngle);
        this.initGradient(gradient);
        return gradient;
    }
}
