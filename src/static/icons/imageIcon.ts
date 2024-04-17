import IconBase from "@/core/lib/icon";
import Painter from "@/core/lib/painter";
import Vector from "@/core/lib/vector";
import XImage from "@/core/lib/ximage";
import { IconNames } from "@/types/gesti";
import { classTypeIs, reverseXImage } from "@/utils/utils";
class ImageIcon extends IconBase {
  name: IconNames = "imageIcon";
  private image: XImage;
  constructor(xImage: XImage) {
    super();
    if (classTypeIs(xImage, XImage)) {
      this.image = xImage;
    } else {
      this.reverse(xImage);
    }
  }
  private async reverse({image}: any) {
    console.log("传入",image);
    const xImage: XImage =await reverseXImage(image);
    if (classTypeIs(xImage, XImage)) {
      this.image = xImage;
    }
  }
  get data(): number[][][] {
    return [];
  }
  protected customRender(paint: Painter, location: Vector): void {
    if (!this.image) return;
    const image = this.image;
    const width = image.width,
      height = image.height;
    const x = location.x,
      y = location.y;
    const scale = this.size / this.fixedSize;
    const offsetX = width * -0.5,
      offsetY = height * -0.5;
    const drawX = x + offsetX,
      drawY = y + offsetY;
    const img = image.data;
    paint.deepDrawImage(img, drawX, drawY, width, height);
  }
}

export default ImageIcon;
