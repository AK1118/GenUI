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
  constructor(onTick: TickerCallback) {
    this.onTick = onTick;
  }
  public inActive: boolean = false;
  private animateId: number = 0;
  public start(): void {
    this.inActive = true;
    this.scheduleTick();
  }
  public stop(): void {
    this.inActive = false;
  }
  private tick(time: number): void {
    this.onTick?.(time);
    if (this.shouldCallbackSchedule) {
      setTimeout(() => {
        this.scheduleTick();
      });
    }
  }
  get shouldCallbackSchedule(): boolean {
    return this.inActive;
  }
  private scheduleTick(): void {
    this.animateId = SchedulerBinding.instance.scheduleFrameCallback(
      (time: number) => {
        this.tick(time);
      }
    );
  }
}

enum AnimationStatus {
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

export class AnimationController extends Animation<number> {
  private ticker: Ticker;
  private startTime: number;
  private duration: Duration = new Duration({
    second: 0.5,
  });
  private direction: AnimationDirection = AnimationDirection.forward;
  constructor() {
    super();
    this.ticker = new Ticker((time) => {
      this.tick(time);
    });
    this.currentValue = 0;
  }
  get isAnimating(): boolean {
    return this.ticker.inActive;
  }
  private start() {
    this.status = AnimationStatus.forward;
    this.startTime = +new Date();
    this.ticker.start();
  }
  private tick(time: number): void {
    if (!this.isCompleted && !this.isDismissed) {
      let t: number = clamp(
        (time - this.startTime) / this.duration.value,
        0,
        1
      );
      if (this.direction == AnimationDirection.reverse) {
        t = 1 - t;
      }
      let value = Curves.easeIn.transformInternal(t);
      if (isNaN(value)) {
        return this.stop();
      }
      if (t >= 1 || t <= 0) {
        this.status = AnimationStatus.completed;
        this.stop();
      }
      this.currentValue = value;
      this.notifyListeners();
    }
  }
  forward(): void {
    this.direction = AnimationDirection.forward;
    this.start();
  }
  reverse(): void {
    this.direction = AnimationDirection.reverse;
    this.start();
  }
  private stop() {
    this.status = AnimationStatus.completed;
    this.ticker.stop();
  }
}
