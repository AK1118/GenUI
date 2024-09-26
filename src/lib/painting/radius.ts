import { Radius } from "../core/base-types";
import { Border } from "./borders";

interface BorderRadiusArguments {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

class BorderRadius implements BorderRadiusArguments {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
  constructor(option: Partial<BorderRadiusArguments>) {
    this.topLeft = option.topLeft || 0;
    this.topRight = option.topRight || 0;
    this.bottomLeft = option.bottomLeft || 0;
    this.bottomRight = option.bottomRight || 0;
  }
  static all(radius: number): BorderRadius {
    return new BorderRadius({
      topLeft: radius,
      topRight: radius,
      bottomLeft: radius,
      bottomRight: radius,
    });
  }
  static get zero(): BorderRadius {
    return new BorderRadius({
      topLeft: 0,
      topRight: 0,
      bottomLeft: 0,
      bottomRight: 0,
    });
  }
  isNone(): boolean {
    return (
      this.topLeft === 0 &&
      this.topRight === 0 &&
      this.bottomLeft === 0 &&
      this.bottomRight === 0
    );
  }
  static equals(a: BorderRadius, b: BorderRadius): boolean {
    return (
      a.topLeft === b.topLeft &&
      a.topRight === b.topRight &&
      a.bottomLeft === b.bottomLeft &&
      a.bottomRight === b.bottomRight
    );
  }
  public equals(a: BorderRadius): boolean {
    return BorderRadius.equals(this, a);
  }
  get radius(): Radius {
    return [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight];
  }
}

export default BorderRadius;
