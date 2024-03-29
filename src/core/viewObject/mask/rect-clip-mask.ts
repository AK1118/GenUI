import ViewObject from "@/core/abstract/view-object";
import Painter from "@/core/lib/painter";
import { ViewObjectFamily } from "@/index";
import { RectClipMaskOption, RectCropValue } from "@/types/gesti";
import {
  ViewObjectExportEntity,
  ViewObjectExportRectCrop,
  ViewObjectExportRectClipMask,
} from "Serialization";
class RectClipMask extends ViewObject {
  private readonly optionDefault: RectClipMaskOption = {
    width: 300,
    height: 300,
    maskColor: "black",
  };
  constructor(option: RectClipMaskOption) {
    super();
    this.option = Object.assign(this.optionDefault, option);
    this.setSize({
      width: option.width,
      height: option.height,
    });
    this.disableRotate();
  }
  private option: RectClipMaskOption;
  get value(): RectCropValue {
    return {
      sx: this.position.x - this.halfWidth,
      sy: this.position.y - this.halfHeight,
      width: this.width,
      height: this.height,
    };
  }
  public setMaskColor(maskColor: string): void {
    this.option.maskColor = maskColor;
  }

  drawImage(paint: Painter): void {
    paint.save();
    this.drawMask(paint);
    paint.restore();
  }
  private drawMask(paint: Painter): void {
    const x = this.position.x,
      y = this.position.y;
    const hw = this.halfWidth,
      hh = this.halfHeight;
    const { width, height } = this.getKit().getCanvasRect().size;
    paint.fillStyle = this.option.maskColor;
    paint.fillRect(-x, -y, width * 2, y - hh);
    paint.fillRect(hw, -hh, width * 2, height * 2);
    paint.fillRect(-hw, hh, this.width, height * 2);
    paint.fillRect(-x, -hh, x - hw, height * 2);
  }

  family: ViewObjectFamily;
  async export(painter?: Painter): Promise<ViewObjectExportRectClipMask> {
    return Promise.resolve({
      base: await this.getBaseInfo(),
      type: "rectClipMask",
      option: this.option,
    });
  }
  exportWeChat(
    painter?: Painter,
    canvas?: any
  ): Promise<ViewObjectExportRectCrop> {
    return this.export(painter);
  }
  public static async reserve(
    entity: ViewObjectExportRectClipMask
  ): Promise<RectClipMask> {
    const option = entity.option;
    const rectClipMask: RectClipMask = new RectClipMask(option);
    return Promise.resolve(rectClipMask);
  }
}

export default RectClipMask;
