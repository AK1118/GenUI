import {
  Binding,
  SchedulerBinding,
  SchedulerFrameManager,
} from "../basic/binding";
import { clamp } from "../math/math";
import { ChangeNotifier } from "./change-notifier";
import { Duration } from "./duration";

type TickerCallback = (deltaTime: number) => void;

abstract class Curve {
  abstract transformInternal(t: number): number;
}

/**
 * 三次贝塞尔曲线
 */
class Cubic extends Curve {
  private readonly cubicErrorBound: number = 0.001;
  private a: number;
  private b: number;
  private c: number;
  private d: number;
  constructor(a: number, b: number, c: number, d: number) {
    super();
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }
  private _evaluateCubic(a: number, b: number, m: number): number {
    return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m;
  }
  public transformInternal(t: number) {
    let start = 0.0;
    let end = 1.0;
    let i = 0;
    //通过1000次的循环逼近t值
    while (i++ < 1000) {
      let midpoint = (start + end) * 0.5;
      let estimate = this._evaluateCubic(this.a, this.c, midpoint);
      if (Math.abs(t - estimate) < this.cubicErrorBound)
        return this._evaluateCubic(this.b, this.d, midpoint);
      if (estimate < t) start = midpoint;
      else end = midpoint;
    }
  }
}

class Learn extends Curve {
  transformInternal(t: number): number {
    return t;
  }
}

export class Curves {
  static readonly ease = new Cubic(0.25, 0.1, 0.25, 1.0);
  static readonly easeIn = new Cubic(0.42, 0.0, 1.0, 1.0);
  static readonly fastLinearToSlowEaseIn = new Cubic(0.18, 1.0, 0.04, 1.0);
  static readonly easeInToLinear = new Cubic(0.67, 0.03, 0.65, 0.09);
  static readonly easeInSine = new Cubic(0.47, 0.0, 0.745, 0.715);
  static readonly easeInQuad = new Cubic(0.55, 0.085, 0.68, 0.53);
  static readonly easeOut = new Cubic(0.0, 0.0, 0.58, 1.0);
  static readonly easeInBack = new Cubic(0.6, -0.28, 0.735, 0.045);
  static readonly linear = new Learn();
  static bezier(p0: number, p1: number, p2: number, t: number): number {
    const k = 1 - t;
    return k * k * p0 + 2 * k * t * p1 + t * t * p2;
  }
}

class Ticker {
  private onTick: NonNullable<TickerCallback>;
  private startTime: number = 0; // 初始开始时间
  public inActive: boolean = false;
  private animateId: number = 0;

  constructor(onTick: TickerCallback) {
    this.onTick = onTick;
  }

  public start(): void {
    this.inActive = true;
    this.startTime = 0;
    this.scheduleTick(); // 开始调度
  }

  public stop(canceled: boolean = true): void {
    this.inActive = false; // 停止动画
    this.startTime = 0; // 重置开始时间
  }

  private tick(time: number): void {
    if (this.startTime === 0) {
      this.startTime = time; // 记录首次tick的时间戳
    }
    const elapsed = (time - this.startTime) / 1000; // 计算运行时间（秒）
    if(this.inActive){
      this.onTick(elapsed); // 调用回调函数
    }
    if (this.shouldCallbackSchedule) {
      setTimeout(() => {
        this.scheduleTick(); // 如果需要继续，调度下一帧
      });
    }
  }

  private get shouldCallbackSchedule(): boolean {
    return this.inActive; // 是否继续调度
  }

  private scheduleTick(): void {
    this.animateId = SchedulerBinding.instance.scheduleFrameCallback(
      (time: number) => {
        this.tick(time);
      }
    );
  }
}

export enum AnimationStatus {
  //动画开始之前
  dismissed = "dismissed",
  //动画正向线性中
  forward = "forward",
  //动画反向线性中
  reverse = "reverse",
  //动画结束之后
  completed = "completed",
}

enum AnimationDirection {
  forward = "forward",
  reverse = "reverse",
}

class AnimationStatusListener extends ChangeNotifier {
  private _status: AnimationStatus = AnimationStatus.dismissed;
  constructor() {
    super();
  }
  get status(): AnimationStatus {
    return this._status;
  }
  set status(status: AnimationStatus) {
    if (this._status != status) {
      this._status = status;
      this.notifyListeners();
    }
  }
}

abstract class Animation<T> extends ChangeNotifier {
  protected currentValue: T;
  private _statusListener: AnimationStatusListener =
    new AnimationStatusListener();
  constructor() {
    super();
  }
  get value(): T {
    return this.currentValue;
  }
  set status(status: AnimationStatus) {
    this._statusListener.status = status;
  }
  get status(): AnimationStatus {
    return this._statusListener.status;
  }
  get isDismissed(): boolean {
    return this._statusListener.status === AnimationStatus.dismissed;
  }
  get isForward(): boolean {
    return this._statusListener.status === AnimationStatus.forward;
  }
  get isReverse(): boolean {
    return this._statusListener.status === AnimationStatus.reverse;
  }
  get isCompleted(): boolean {
    return this._statusListener.status === AnimationStatus.completed;
  }
  public addStatusListener(listener: VoidFunction): void {
    this._statusListener.addListener(listener);
  }
  public removeStatusListener(listener: VoidFunction): void {
    this._statusListener.removeListener(listener);
  }
}

export abstract class Simulation {
  abstract x(time: number): number;
  abstract dx(time: number): number;
  abstract isDone(time: number): boolean;
}

interface AnimationControllerArguments {
  begin: number;
  end: number;
  duration: Duration;
  reverseDuration: Duration;
  curve: Curve;
}

export class AnimationController extends Animation<number> {
  private ticker: Ticker;
  private begin: number;
  private end: number;
  private simulation: Simulation;
  private duration: Duration;
  private direction: AnimationDirection = AnimationDirection.forward;
  private reverseDuration: Duration;
  private curve: Curve;
  private lastTimeStamp: number = 0;
  constructor(args: Partial<AnimationControllerArguments>) {
    super();
    this.begin = args?.begin ?? 0;
    this.end = args?.end ?? 1;
    this.duration =
      args?.duration ??
      new Duration({
        milliseconds: 300,
      });
    this.reverseDuration = args?.reverseDuration;
    this.curve = args?.curve ?? Curves.linear;
    this.ticker = new Ticker(this.tick.bind(this));
    this.currentValue = 0;
  }
  get velocity(): number {
    return this.simulation?.dx(this.lastTimeStamp);
  }
  get isAnimating(): boolean {
    return this.ticker.inActive;
  }
  private start() {
    if (this.isAnimating) return;
    this.status = AnimationStatus.forward;
    this.ticker.start();
  }
  public animateWidthSimulation(simulation: Simulation): void {
    this.startSimulation(simulation);
  }
  private startSimulation(simulation: Simulation) {
    if (!simulation) return;
    this.simulation = simulation;
    this.lastTimeStamp = 0;
    this.stop();
    this.start();
  }
  private tick(timeStamp: number): void {
    this.lastTimeStamp = timeStamp;
    const value = this.simulation.x(timeStamp);
    if (this.simulation.isDone(timeStamp)) {
      this.stop();
      this.status =
        this.direction === AnimationDirection.forward
          ? AnimationStatus.completed
          : AnimationStatus.dismissed;
    }
    this.currentValue = value;
    this.notifyListeners();
    // console.log(timeStamp)
    // if (!this.isCompleted && !this.isDismissed) {
    //   let t: number = clamp(
    //     timeStamp / this.duration.value,
    //     0,
    //     1
    //   );
    //   if (this.direction == AnimationDirection.reverse) {
    //     t = 1 - t;
    //   }
    //   let value = Curves.easeIn.transformInternal(t);
    //   if (isNaN(value)) {
    //     return this.stop();
    //   }
    //   if (t >= 1 || t <= 0) {
    //     this.status = AnimationStatus.completed;
    //     this.stop();
    //   }
    //   this.currentValue = value;
    //   this.notifyListeners();
    // }
  }
  private animateToInternal(
    target: number,
    duration?: Duration,
    curve: Curve = Curves.linear
  ) {
    if (this.isAnimating) return;
    let value =
      this.direction === AnimationDirection.forward ? this.begin : this.end;
    this.startSimulation(
      new InterpolationSimulation(
        value,
        target,
        duration ?? this.duration,
        curve
      )
    );
  }
  forward(from?: number): void {
    this.direction = AnimationDirection.forward;
    this.status = AnimationStatus.forward;
    if (from) {
      this.currentValue = from;
    }
    this.animateToInternal(this.end, this.duration, this.curve);
  }
  reverse(from?: number): void {
    this.direction = AnimationDirection.reverse;
    this.status = AnimationStatus.reverse;
    if (from) {
      this.currentValue = from;
    }
    this.animateToInternal(
      this.begin,
      this.reverseDuration ?? this.duration,
      this.curve
    );
  }
  public stop(canceled: boolean = true) {
    this.ticker.stop(canceled);
  }
}

class InterpolationSimulation extends Simulation {
  private begin: number;
  private end: number;
  private duration: Duration;
  private curve: Curve;
  constructor(begin: number, end: number, duration: Duration, curve: Curve) {
    super();
    this.begin = begin;
    this.end = end;
    this.duration = duration;
    this.curve = curve;
  }
  x(time: number): number {
    let t = clamp(time / this.duration.valueWithSeconds, 0, 1);

    if (t === 0) {
      return this.begin;
    } else if (t === 1) {
      return this.end;
    } else {
      //插值平滑计算，begin并不是永远从0开始
      //插值计算公式 `begin+(end-begin)*t`
      return (
        this.begin + (this.end - this.begin) * this.curve.transformInternal(t)
      );
    }
  }
  dx(time: number): number {
    return (this.x(time + 0.0001) - this.x(time - 0.0001)) / 0.0002;
  }
  isDone(time: number): boolean {
    return time >= this.duration.valueWithSeconds;
  }
}
