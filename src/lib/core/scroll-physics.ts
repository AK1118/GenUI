/*
 * @Author: AK1118
 * @Date: 2024-08-30 16:34:30
 * @Last Modified by: AK1118
 * @Last Modified time: 2024-08-30 18:14:53
 */

import { ScrollPosition } from "../render-object/viewport";
import { BouncingSimulation, FrictionSimulation, Simulation } from "./animation";

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
    return delta;
  }
  createBallisticSimulation(
    position: ScrollPosition,
    velocity: number
  ): Simulation {
    return new FrictionSimulation(0.135, position.pixels, velocity);
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


export class BouncingScrollPhysics extends ScrollPhysics {
  applyBoundaryConditions(
    position: ScrollPosition,
    currentScrollOffset: number
  ): number {
    return 0;
  }
  applyPhysicsToUserOffset(position: ScrollPosition, delta: number): number {
    if (!position.outOfRange) {
      return delta;
    }
    // 计算当前超出范围的值
    let excess = 0;
    if (position.pixels < position.minScrollExtent) {
      excess = position.minScrollExtent - position.pixels;
    } else if (position.pixels > position.maxScrollExtent) {
      excess = position.pixels - position.maxScrollExtent;
    }

    // 返回调整后的 delta
    return delta * Math.pow(0.15, excess / position.viewportDimension) * 0.52;
  }
  createBallisticSimulation(
    position: ScrollPosition,
    velocity: number
  ): Simulation {
    if(Math.abs(velocity)>20){
      return new BouncingSimulation(
        position.pixels,
        position.maxScrollExtent,
        position.minScrollExtent,
        velocity
      );
    }
    return null;
  }
}
