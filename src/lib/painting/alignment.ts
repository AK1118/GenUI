import { Offset, Size } from "../basic/rect";
import Vector from "../math/vector";
class Alignment {
  private x: number;
  private y: number;
  private offset: Offset = Offset.zero;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  toJSON(): { x: number; y: number } {
    return {
      x: this.x,
      y: this.y,
    };
  }
  public copyWithOffset(offset: Offset) {
    this.offset = offset;
    return this;
  }
  static format(x: number, y: number): Alignment {
    return new Alignment(x, y);
  }
  static readonly center: Alignment = new Alignment(0, 0);
  static readonly topLeft: Alignment = new Alignment(-1, -1);
  static readonly bottomLeft: Alignment = new Alignment(-1, 1);
  static readonly topRight: Alignment = new Alignment(1, -1);
  static readonly bottomRight: Alignment = new Alignment(1, 1);
  static readonly centerRight: Alignment = new Alignment(1, 0);
  static readonly bottomCenter: Alignment = new Alignment(0, 1);
  static readonly centerLeft: Alignment = new Alignment(-1, 0);
  static readonly topCenter: Alignment = new Alignment(0, -1);
  /**
   *
   *以矩形中心为原点，没有遵循计算机图形的左上角原点规则
   * @return Size
   */
  public compute(size: Size): Offset {
    const halfWidthDelta = 0.5 * size.width;
    const halfHeighDelta = 0.5 * size.height;
    return new Offset(
      halfWidthDelta * this.x + this.offset.offsetX,
      halfHeighDelta * this.y + this.offset.offsetY
    );
  }
  public alongSize(other: Size): Offset {
    const centerX = other.width * 0.5;
    const centerY = other.height * 0.5;
    return new Offset(centerX + centerX * this.x, centerY + centerY * this.y);
  }
  public inscribe(size: Size, parentSize: Size): Vector {
    const halfWidthDelta: number = (parentSize.width - size.width) * 0.5;
    const halfHeighDelta: number = (parentSize.height - size.height) * 0.5;

    return new Vector(
      halfWidthDelta + halfWidthDelta * this.x,
      halfHeighDelta + halfHeighDelta * this.y
    );
  }

  public computeWithVector(v: Vector): Vector {
    v.x *= this.x;
    v.y *= this.y;
    return v;
  }
}

export default Alignment;
