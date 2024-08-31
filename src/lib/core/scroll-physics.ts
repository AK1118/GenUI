/*
 * @Author: AK1118
 * @Date: 2024-08-30 16:34:30
 * @Last Modified by: AK1118
 * @Last Modified time: 2024-08-30 18:14:53
 */

import { ScrollPosition } from "../rendering/viewport";

class Simulation {}

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

export class BouncingScrollPhysics extends ScrollPhysics {
  applyPhysicsToUserOffset(position: ScrollPosition, delta: number): number {
    return 0;
  }
  createBallisticSimulation(
    position: ScrollPosition,
    velocity: number
  ): Simulation {
    return null;
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
