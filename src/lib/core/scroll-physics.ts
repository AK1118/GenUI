/*
 * @Author: AK1118
 * @Date: 2024-08-30 16:34:30
 * @Last Modified by: AK1118
 * @Last Modified time: 2024-08-30 18:14:53
 */

import { ScrollPosition } from "../rendering/viewport";
import { Simulation } from "./animation";



export abstract class ScrollPhysics {
  /**
   * 返回每次滚动时的delta矫正值,如果返回0则不进行矫正
   */
  abstract applyBoundaryConditions(
    position: ScrollPosition,
    currentScrollOffset: number
  ): number;
  /**
   * [position] 当前的位置, [offset] 用户拖拽距离
   * 将用户拖拽距离 offset 转为需要移动的 pixels
   */
  abstract applyPhysicsToUserOffset(
    position: ScrollPosition,
    delta: number
  ): number;
  /**
   * 创建一个滚动的模拟器,一般在手指离开屏幕后调用
   */
  abstract createBallisticSimulation(
    position: ScrollPosition,
    velocity: number
  ): Simulation;
}

export class SimpleScrollPhysics extends ScrollPhysics {
  applyPhysicsToUserOffset(position: ScrollPosition, delta: number): number {
    return 0;
  }
  createBallisticSimulation(
    position: ScrollPosition,
    velocity: number
  ): Simulation {
    return new FrictionSimulation(0.15,position.pixels,velocity);
  }
  applyBoundaryConditions(
    position: ScrollPosition,
    currentScrollOffset: number
  ): number {
    if (currentScrollOffset < position.minScrollExtent) {
        // 当滚动超出顶部边界时，返回超出的距离
        return currentScrollOffset - position.minScrollExtent;
      } else if (currentScrollOffset > position.maxScrollExtent) {
        // 当滚动超出底部边界时，返回超出的距离
        return currentScrollOffset - position.maxScrollExtent;
      }
    return 0;
  }
}

class FrictionSimulation {
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
      df: (time) => this.velocity * Math.pow(this.drag, time) * this.dragLog - this.constantDeceleration,
      iterations: 10
    });
  }



  static dragFor(
    startPosition: number,
    endPosition: number,
    startVelocity: number,
    endVelocity: number
  ): number {
    return Math.exp((startVelocity - endVelocity) / (startPosition - endPosition));
  }

  x(time: number): number {
    if (time > this.finalTime) {
      return this.finalX;
    }
   let x=
      this.position +
      (this.velocity * Math.pow(this.drag, time)) / this.dragLog -
      this.velocity / this.dragLog -
      (this.constantDeceleration / 2) * time * time
      return x;
  }

  dx(time: number): number {
    if (time > this.finalTime) {
      return 0;
    }
    return this.velocity * Math.pow(this.drag, time) - this.constantDeceleration * time;
  }

  get finalX(): number {
    if (this.constantDeceleration === 0) {
      return this.position - this.velocity / this.dragLog;
    }
    return this.x(this.finalTime);
  }

  timeAtX(targetX: number): number {
    if (targetX === this.position) {
      return 0.0;
    }
    if (
      this.velocity === 0.0 ||
      (this.velocity > 0 ? targetX < this.position || targetX > this.finalX : targetX > this.position || targetX < this.finalX)
    ) {
      return Infinity;
    }
    return this.newtonsMethod({
      initialGuess: 0,
      target: targetX,
      f: (time) => this.x(time),
      df: (time) => this.dx(time),
      iterations: 10
    });
  }

  isDone(time: number): boolean {
    return Math.abs(this.dx(time)) < this.toleranceVelocity||this.dx(time)===0;
  }

  private newtonsMethod({
    initialGuess,
    target,
    f,
    df,
    iterations
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