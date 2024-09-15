/*
 * @Author: AK1118
 * @Date: 2024-09-15 09:26:07
 * @Last Modified by: AK1118
 * @Last Modified time: 2024-09-15 09:33:38
 */
import { Size } from "../basic/rect";
import { HitTestResult } from "../gesture/hit_test";
import Vector from "../math/vector";
import Painter from "../painting/painter";

type PathTypes = "rect" | "arc" | "lineTo" | "moveTo" | "arcTo";

/**
 * 自定义Path类、@Path2D 类，方便在不同的平台都可以使用相同的效果。
 * @Path 类是一个原子路径，例如它可以是一个Rect路径，或是一个Arc路径等
 * @Path2D 类是一个 @Path 集合，它可以包含多个 @Path 对象, @Path2D 类需要实现一个 @hitTest 方法路径是否被点击
 */
export abstract class Path {
  constructor(type: PathTypes) {
    this._type = type;
  }
  private _type: PathTypes;
  get type(): PathTypes {
    return this._type;
  }
  contains(position: Vector): boolean {
    return true;
  }
  abstract render(paint: Painter, size: Size): void;
}

export class RectPath extends Path {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  constructor(x: number, y: number, width: number, height: number) {
    super("rect");
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  render(paint: Painter, size: Size): void {
    paint.rect(this.x, this.y, this.width, this.height);
  }
}

export class ArcPath extends Path {
  public x: number;
  public y: number;
  public radius: number;
  public startAngle: number;
  public endAngle: number;
  public anticlockwise?: boolean;
  constructor(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean
  ) {
    super("arc");
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.anticlockwise = anticlockwise;
  }

  render(paint: Painter, size: Size): void {
    paint.arc(
      this.x,
      this.y,
      this.radius,
      this.startAngle,
      this.endAngle,
      this.anticlockwise
    );
  }
}

export class LineToPath extends Path {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    super("lineTo");
    this.x = x;
    this.y = y;
  }
  render(paint: Painter, size: Size): void {
    paint.lineTo(this.x, this.y);
  }
}

export class ArcToPath extends Path {
  public x1: number;
  public y1: number;
  public x2: number;
  public y2: number;
  public radius: number;
  constructor(x1: number, y1: number, x2: number, y2: number, radius: number) {
    super("arcTo");
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.radius = radius;
  }
  render(paint: Painter, size: Size): void {
    paint.arcTo(this.x1, this.y1, this.x2, this.y2, this.radius);
  }
}

export class MoveToPath extends Path {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    super("moveTo");
    this.x = x;
    this.y = y;
  }
  render(paint: Painter, size: Size): void {
    paint.lineTo(this.x, this.y);
  }
}

export class Path2D {
  private _paths: Map<number, Path> = new Map();
  private get _currentPathCount(): number {
    return this._paths.size;
  }
  public rect(x: number, y: number, width: number, height: number) {
    this._paths.set(this._currentPathCount, new RectPath(x, y, width, height));
  }
  public arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean
  ) {
    this._paths.set(
      this._currentPathCount,
      new ArcPath(x, y, radius, startAngle, endAngle, anticlockwise)
    );
  }
  public lineTo(x: number, y: number) {
    this._paths.set(this._currentPathCount, new LineToPath(x, y));
  }
  public moveTo(x: number, y: number) {
    this._paths.set(this._currentPathCount, new MoveToPath(x, y));
  }
  public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
    this._paths.set(
      this._currentPathCount,
      new ArcToPath(x1, y1, x2, y2, radius)
    );
  }
  get paths(): Array<Path> {
    return Array.from(this._paths.values());
  }
  public hitTest(result: HitTestResult, position: Vector): boolean {
    return true;
  }
  render(paint: Painter, size: Size): void {
    paint.beginPath();
    this.paths.forEach((path) => {
      path.render(paint, size);
    });
    paint.closePath();
  }
}
