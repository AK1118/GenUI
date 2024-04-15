import Painter from "../../lib/painter";
import Widgets from "../../../static/widgets";
import SizeButton, { ARButtonOption } from "./sizeButton";
import DragButton from "./dragbutton";
import Rect from "@/core/lib/rect";
import { Icon } from "@/core/lib/icon";
import { DefaultIcon } from "@/composite/icons";
import { ButtonOption } from "@/core/abstract/baseButton";
import Alignment from "@/core/lib/painting/alignment";

export interface VerticalButtonOption extends ARButtonOption {
  location?: "top" | "bottom";
}

class VerticalButton extends SizeButton {
  readonly name: ButtonNames = "VerticalButton";
  constructor(option?: VerticalButtonOption) {
    const { location } = option??{};
    const _location =
      location === "top" ? Alignment.topCenter : Alignment.bottomCenter;
    super(Object.assign(option??{},{
      alignment:_location
    }));
  }
  public onUpWithInner(): void {
    this.computeSelfLocation();
  }
  protected icon: Icon = new DefaultIcon();
  effect(currentButtonRect?: Rect): void {
    const mag = this.getButtonWidthMasterMag(currentButtonRect);
    const preMasterSize: Size = this.master.size.copy();
    if (this.preMag === -1) {
      this.preMag = mag;
      return;
    }
    const deltaScale: number = mag / this.preMag;
    const rScale: number = deltaScale + (1 - deltaScale) / 2;
    this.master.setSize({
      height: this.master.height * rScale,
    });
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

export default VerticalButton;
