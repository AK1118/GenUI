import { FuncButtonTrigger } from "../../enums";
import Alignment from "@/core/lib/painting/alignment";
import BaseButton, { ButtonOption } from "../../abstract/baseButton";
import Painter from "../../lib/painter";
import Rect from "../../lib/rect";
import Vector from "../../lib/vector";
import Widgets from "../../../static/widgets";
import ViewObject from "../../abstract/view-object";
import { Icon } from "@/core/lib/icon";
import RotateIcon from "@/static/icons/rotateIcon";

class RotateButton extends BaseButton {
  readonly name: ButtonNames = "RotateButton";
  public trigger: FuncButtonTrigger = FuncButtonTrigger.drag;
  protected icon: Icon = new RotateIcon();
  public oldAngle: number = 0;
  public radius: number = 10;
  protected buttonAlignment: Alignment = Alignment.bottomCenter;
  constructor(buttonOption?: ButtonOption) {
    super(buttonOption);
    this.rect.onDrag = (newRect: Rect) => {
      /*拖拽缩放*/
      this.rect = newRect;
      this.effect(newRect);
    };
  }
  updatePosition(vector: Vector): void {
    this.updateRelativePosition();
    this.setAbsolutePosition(vector);
  }
  setMaster(master: ViewObject): void {
    this.master = master;
  }
  effect(currentButtonRect: Rect): void {
    // 计算按钮的偏移量
    const [offsetX, offsetY] = currentButtonRect.position
      .sub(this.master.position)
      .toArray();

    // 计算按钮的角度变化
    let angle = Math.atan2(offsetY, offsetX) - this.oldAngle;

    // 将角度转换为 0 到 2π 的范围
    angle = angle < 0 ? angle + 2 * Math.PI : angle;

    // 将角度限制在45度的倍数附近
    {
      const _45 = Math.PI / 4; // 45度对应的弧度值
      const limit = 0.1; // 误差范围
      const scale = Math.round(angle / _45); // 计算角度是否接近45度的倍数
      // 如果角度接近45度的倍数，则旋转到这个45度的倍数角度
      angle = Math.abs(angle - scale * _45) < limit ? scale * _45 : angle;
    }

    // 设置按钮的角度
    this.master.rect.setAngle(angle);
  }
  public get getOldAngle(): number {
    return this.oldAngle;
  }
  public render(paint: Painter): void {
    this.draw(paint);
  }
}

export default RotateButton;
