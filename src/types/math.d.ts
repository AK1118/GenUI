declare class Vector {
    x: number;
    y: number;
  
    constructor(x: number, y: number);
  
    add(v: Vector): void;
    sub(v: Vector): Vector;
    mult(v: Vector): Vector;
    div(v: Vector): Vector;
    mag(): number;
    dist(v: Vector): number;
    normalize(): Vector;
    clampX(min: number, max: number): void;
    clampY(min: number, max: number): void;
    clamp(c: [number, number]): void;
    copy(): Vector;
    set(v: Vector): void;
    setXY(x: number, y: number): void;
    toJson(): { x: number; y: number };
    half(): Vector;
    troweling(): Vector;
    equals(v: Vector): boolean;
    toArray(): number[];
    toZero(): void;
    double(): Vector;
  
    static dist(v1: Vector, v2: Vector): number;
    static mag(v: Vector): number;
    static sub(v1: Vector, v2: Vector): Vector;
    static add(v1: Vector, v2: Vector): Vector;
    static mult(v: Vector, factor: number): Vector;
    static troweling(v: Vector): Vector;
    static readonly zero: Vector;
  }

  