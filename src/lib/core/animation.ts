import {
  Binding,
  SchedulerBinding,
  SchedulerFrameManager,
} from "../basic/binding";
import { clamp } from "../math/math";
import { ChangeNotifier } from "./change-notifier";
import { Duration } from "./duration";

type TickerCallback = (deltaTime: number) => void;

export abstract class Curve {
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
    const elapsed = (time - this.startTime) * 0.001; // 计算运行时间（秒）
    if (this.inActive) {
      this.onTick(elapsed); // 调用回调函数
    }
    if (this.shouldCallbackSchedule) {
      setTimeout(this.scheduleTick.bind(this));
    }
  }

  private get shouldCallbackSchedule(): boolean {
    return this.inActive; // 是否继续调度
  }

  private scheduleTick(): void {
    this.animateId = SchedulerBinding.instance.scheduleFrameCallback(
      this.tick.bind(this)
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
  /**
   * 动画开始之前
   */
  get isDismissed(): boolean {
    return this._statusListener.status === AnimationStatus.dismissed;
  }
  /**
   * 动画正向线性中
   */
  get isForward(): boolean {
    return this._statusListener.status === AnimationStatus.forward;
  }
  /**
   * 动画反向线性中
   */
  get isReverse(): boolean {
    return this._statusListener.status === AnimationStatus.reverse;
  }
  /**
   * 动画结束之后
   */
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
    this.status = AnimationStatus.dismissed;
  }
  cancel(){
    this.stop();
    this.simulation=null;
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

export class FrictionSimulation extends Simulation {
  private drag: number;
  private dragLog: number;
  private position: number;
  private velocity: number;
  private constantDeceleration: number;
  private finalTime: number = Infinity; // 需要为牛顿迭代方法在构造函数中调用设置为 Infinity
  private toleranceVelocity: number;

  constructor(
    drag: number,
    position: number,
    velocity: number,
    toleranceVelocity: number = 0,
    constantDeceleration: number = 0
  ) {
    if (drag <= 0) {
      throw new Error("Drag must be greater than 0");
    }
    super();
    this.drag = drag;
    this.dragLog = Math.log(drag);
    this.position = position;
    this.velocity = velocity;
    this.constantDeceleration = constantDeceleration * Math.sign(velocity);
    this.toleranceVelocity = toleranceVelocity;

    // 计算终止时间
    this.finalTime = this.newtonsMethod({
      initialGuess: 0,
      target: 0,
      f: (time) => this.dx(time),
      df: (time) =>
        this.velocity * Math.pow(this.drag, time) * this.dragLog -
        this.constantDeceleration,
      iterations: 10,
    });
  }

  /**
   * 指数衰减阻尼物理模型：
   * x(t) =p0 + v0 * d^t / ln(d) - v0 / ln(d) - (c / 2)*t^2
   * * 牛顿迭代方法求解
   * x'(t) = v0 * d^t / ln(d) - c*t
   * 其中t单位是秒,p0是初始位置,v0是初始速度,d是阻尼因子,c是一个常量的减速度（负加速度）
   *
   */
  x(time: number): number {
    if (time > this.finalTime) {
      return this.finalX;
    }
    let x =
      this.position +
      (this.velocity * Math.pow(this.drag, time)) / this.dragLog -
      this.velocity / this.dragLog -
      (this.constantDeceleration / 2) * Math.pow(time, 2);
    return x;
  }

  dx(time: number): number {
    if (time > this.finalTime) {
      return 0;
    }
    return (
      this.velocity * Math.pow(this.drag, time) -
      this.constantDeceleration * time
    );
  }

  /**
   * 可能会到达的最终位置
   */
  get finalX(): number {
    if (this.constantDeceleration === 0) {
      return this.position - this.velocity / this.dragLog;
    }
    return this.x(this.finalTime);
  }

  /**
   * 在某一位置上的时间
   */
  public timeAtX(targetX: number): number {
    if (targetX === this.position) {
      return 0.0;
    }
    if (
      this.velocity === 0.0 ||
      (this.velocity > 0
        ? targetX < this.position || targetX > this.finalX
        : targetX > this.position || targetX < this.finalX)
    ) {
      return Infinity;
    }
    return this.newtonsMethod({
      initialGuess: 0,
      target: targetX,
      f: (time) => this.x(time),
      df: (time) => this.dx(time),
      iterations: 10,
    });
  }

  isDone(time: number): boolean {
    return (
      Math.abs(this.dx(time)) < this.toleranceVelocity || this.dx(time) === 0
    );
  }

  private newtonsMethod({
    initialGuess,
    target,
    f,
    df,
    iterations,
  }: {
    initialGuess: number;
    target: number;
    f: (x: number) => number;
    df: (x: number) => number;
    iterations: number;
  }): number {
    let guess = initialGuess;
    for (let i = 0; i < iterations; i++) {
      guess = guess - (f(guess) - target) / df(guess);
    }
    return guess;
  }
}

class SpringSimulation extends Simulation {
  private damping: number = 2; // 阻尼系数
  private stiffness: number = 2; // 刚度系数
  private initialPosition: number;
  private endPosition: number;
  private initialVelocity: number;

  constructor(position: number, endPosition: number, velocity: number) {
    super();
    this.initialPosition = position;
    this.endPosition = endPosition;
    this.initialVelocity = velocity;
  }

  x(time: number): number {
    const distance = this.initialPosition - this.endPosition;
    // 计算弹簧的位置，公式：x(t) = end + (start - end) * e^(-damping * t) * cos(stiffness * t)
    //此处只关注x位置衰减
    return (
      this.endPosition + distance * Math.exp(-this.damping * time * 2)
      //* Math.cos(this.stiffness * time*2)
    );
  }

  dx(time: number): number {
    const distance = this.endPosition - this.initialPosition;
    // 计算弹簧的速度，公式：v(t) = -distance * e^(-damping * t) * (damping * cos(stiffness * t) + stiffness * sin(stiffness * t))
    return (
      -distance *
      Math.exp(-this.damping * time) *
      (this.damping * Math.cos(this.stiffness * time) +
        this.stiffness * Math.sin(this.stiffness * time))
    );
  }

  isDone(time: number): boolean {
    // 当时间足够长时，假设弹簧运动已停止
    return (
      Math.abs(this.x(time) - this.endPosition) < 0.1 &&
      Math.abs(this.dx(time)) < 0.1
    );
  }
}

export class BouncingSimulation extends Simulation {
  private position: number = 0;
  private maxScrollExtent: number = 0;
  private minScrollExtent: number = 0;
  private velocity: number = 0;
  private frictionSimulation: FrictionSimulation;
  private springTime: number = Infinity;
  private springSimulation: SpringSimulation;
  constructor(
    position: number,
    maxScrollExtent: number,
    minScrollExtent: number,
    velocity: number
  ) {
    super();
    this.position = position;
    this.maxScrollExtent = maxScrollExtent;
    this.minScrollExtent = minScrollExtent;
    this.velocity = velocity;
    this.frictionSimulation = new FrictionSimulation(0.135, position, velocity);
    if (position > maxScrollExtent) {
      this.springSimulation = new SpringSimulation(
        position,
        maxScrollExtent,
        velocity
      );
      this.springTime = -Infinity;
    } else if (position < minScrollExtent) {
      this.springSimulation = new SpringSimulation(position, 0, velocity);
      this.springTime = -Infinity;
    } else {
      this.frictionSimulation = new FrictionSimulation(
        0.135,
        position,
        velocity
      );
      const finalX = this.frictionSimulation.finalX;
      if (finalX > maxScrollExtent) {
        this.springTime = this.frictionSimulation.timeAtX(maxScrollExtent);
        this.springSimulation = new SpringSimulation(
          this.frictionSimulation.x(this.springTime),
          this.maxScrollExtent,
          this.frictionSimulation.dx(velocity)
        );
      } else if (finalX < minScrollExtent) {
        this.springTime = this.frictionSimulation.timeAtX(minScrollExtent);
        this.springSimulation = new SpringSimulation(
          this.frictionSimulation.x(this.springTime),
          this.minScrollExtent,
          this.frictionSimulation.dx(velocity)
        );
      }
    }
  }
  private offsetTime: number = 0;
  private simulation(time: number): Simulation {
    let simulation: Simulation;
    if (time > this.springTime+this.springTime*0.1) {
      this.offsetTime = isFinite(this.springTime) ? this.springTime : 0;
      simulation = this.springSimulation;
    } else {
      this.offsetTime = 0;
      simulation = this.frictionSimulation;
    }
    if (!simulation) {
      simulation = this.frictionSimulation;
    }
    return simulation;
  }

  x(time: number): number {
    return this.simulation(time).x(time - this.offsetTime);
  }

  dx(time: number): number {
    return this.simulation(time).dx(time - this.offsetTime);
  }

  isDone(time: number): boolean {
    return this.simulation(time).isDone(time - this.offsetTime);
  }
}
