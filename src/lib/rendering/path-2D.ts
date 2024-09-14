type PathTypes = "rect" | "arc";

export abstract class Path {
  constructor(type: PathTypes) {
    this._type = type;
  }
  private _type: PathTypes;
  get type(): PathTypes {
    return this._type;
  }
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
}

export class ArcPath extends Path {
    public x: number;
    public y: number;
    public radius: number;
    public startAngle: number;
    public endAngle: number;
    public anticlockwise?: boolean;
    constructor(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
      super("arc");
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.startAngle = startAngle;
      this.endAngle = endAngle;
      this.anticlockwise = anticlockwise;
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
  public arc(x:number, y:number, radius:number, startAngle:number, endAngle:number, anticlockwise?:boolean){
    this._paths.set(this._currentPathCount, new ArcPath(x, y, radius, startAngle, endAngle, anticlockwise));
  }
  get paths(): Array<Path> {
    return Array.from(this._paths.values());
  }
}
