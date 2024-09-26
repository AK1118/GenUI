import { Offset } from "../basic/rect";
import Painter from "../painting/painter";

export abstract class Gradient {
  /** 创建一个线性渐变 */
  static linear(begin: Offset, end: Offset): CanvasGradient {
    const linearGradient = new Painter().createLinearGradient(
      begin.x,
      begin.y,
      end.x,
      end.y
    );
    return linearGradient;
  }
  /** 创建一个径向渐变 */
  static radial(center: Offset, radius: number): CanvasGradient {
    const radialGradient = new Painter().createRadialGradient(
      center.x,
      center.y,
      0,
      center.x,
      center.y,
      radius
    );
    return radialGradient;
  }
  /**
   * 创建一个扫描式渐变
   */
  static sweep(center: Offset, startAngle: number): CanvasGradient {
    const sweepGradient = new Painter().createConicGradient(
      startAngle,
      center.x,
      center.y
    );
    return sweepGradient;
  }
}
