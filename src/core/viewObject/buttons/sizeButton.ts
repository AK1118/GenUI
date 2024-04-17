/**
 * 改变大小按钮
 */

import Painter from "../../lib/painter";
import Rect from "../../lib/rect";
import Widgets from "../../../static/widgets";
import DragButton from "./dragbutton";
import Vector from "@/core/lib/vector";
import { Icon } from "@/core/lib/icon";
import ScaleIcon from "@/static/icons/scaleIcon";
import { DefaultIcon } from "@/composite/icons";
import Alignment from "@/core/lib/painting/alignment";
import { ButtonOption } from "@/core/abstract/baseButton";

export interface ARButtonOption extends ButtonOption {
  alignment:Alignment,
}

class SizeButton extends DragButton {
  readonly name: ButtonNames = "SizeButton";
  protected buttonAlignment: Alignment = Alignment.bottomRight;
  protected icon: Icon = new DefaultIcon();
  constructor(option?: ARButtonOption) {
    super({
      angleDisabled: true,
      ...option,
    });
    this.buttonAlignment = option?.alignment ?? Alignment.center;
    //this.beforeMounted(location);
  }
  /**
   * @description 在按钮挂载前设置位置
   * @param location
   */
  protected beforeMounted(alignment: Alignment): void {
    //按钮功能原因.按钮必须设置枚举位置,不允许设置position位置,这是强制的.
    // this.setLocationByAlignment(location);
  }

  protected manipulateDelta(delta: Vector): void {
    this.buttonAlignment.computeWithVector(delta);
  }
  public setLocation(alignment: Alignment): void {
    this.buttonAlignment = alignment;
    if (this.mounted) this.initialization(this.master);
  }
  effect(currentButtonRect?: Rect): void {
    const mag = this.getButtonWidthMasterMag(currentButtonRect);
    const preMasterSize: Size = this.master.size.copy();
    if (this.preMag === -1) {
      this.preMag = mag;
      return;
    }
    const deltaScale: number = mag / this.preMag;
    const rScale: number = deltaScale + (1 - deltaScale) / 2;
    this.master.setDeltaScale(rScale);
    const currentMasterSize: Size = this.master.size.copy();

    let delta = currentMasterSize
      .toVector()
      .sub(preMasterSize.toVector())
      .half();

    this.manipulateDelta(delta);

    //获取Widget对象的弧度制的角度
    const angleInRadians = this.master.rect.getAngle;

    // 假设 delta 是旧的 delta 向量
    const [x, y] = delta.toArray();

    /**
     * 使用矩阵旋转计算新的 delta.x 和 delta.y
     * R = | cos(angle)  -sin(angle) |
           | sin(angle)   cos(angle) |

        新速度向量 = R * 原速度向量
     */
    const newDeltaX =
      Math.cos(angleInRadians) * x - Math.sin(angleInRadians) * y;
    const newDeltaY =
      Math.sin(angleInRadians) * x + Math.cos(angleInRadians) * y;

    // 现在 newDelta 包含了根据给定角度 angle 重新计算的移动速度
    this.master.addPosition(newDeltaX, newDeltaY);
    this.preMag = deltaScale < 1 ? mag + delta.mag() : mag - delta.mag();
  }
}

export default SizeButton;
