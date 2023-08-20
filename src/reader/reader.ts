import ViewObject from "../abstract/view-object";
import GesteControllerImpl from "../controller";
import Painter from "../painter";
import Rect from "../rect";
import Cutter from "../utils/cutter";
import ImageChunkConverter from "../utils/image-chunk-converter";
import { dataURLtoBlob } from "../utils/index";
import ImageBox from "../viewObject/image";
import TextBox from "../viewObject/text";
import WriteViewObj from "../viewObject/write";
import XImage from "../ximage";

class GestiReader {
  constructor() {}
  public async getObjectByJson(str: string) {
    const json = JSON.parse(str);
    const { options } = json;
    const rect: Rect = this.getRectByRectJson(options.rect);
    const relativeRect: Rect = this.getRectByRectJson(options.relativeRect);
    
    let viewObject: ViewObject;
    switch (json.viewObjType) {
      case "write":
        {
          viewObject = new WriteViewObj(
            options.points,
            options.config?.color ?? "red",
            options.config
          );
        }
        break;
      case "image":
        {
          const cutter=new Cutter();
          const coverter:ImageChunkConverter=new ImageChunkConverter();
          const source:ImageData=cutter.merge(options.fixedWidth,options.fixedHeight,options.options.data);
          const ximage: XImage = await new GesteControllerImpl(
            null
          ).createImage(source);
          viewObject = new ImageBox(ximage);
        }
        break;
      case "text":
        {
          viewObject = new TextBox(options.text, options.options);
        }
        break;
    }
    if (!viewObject.rect) viewObject.rect = rect;
    if (!viewObject.relativeRect) viewObject.relativeRect = relativeRect;
  
    viewObject.setMirror(options.mirror);
    viewObject.rect.setSize(rect.size.width, rect.size.height);
    viewObject.rect.setAngle(options.rect.angle);
    viewObject.relativeRect.position = relativeRect.position;
    viewObject.relativeRect.setSize(
      relativeRect.size.width,
      relativeRect.size.height
    );
    viewObject.relativeRect.setAngle(options.relativeRect.getAngle);
    viewObject.init();
    //init包括生成按钮
    options.locked && viewObject.lock();
    viewObject.custom();
    viewObject.rect.setPosition(rect.position);
    return viewObject;
  }
  private getRectByRectJson(rectJson: any): Rect {
    const jsonObj: any = rectJson;
    const rect = new Rect({
      width: jsonObj.width,
      height: jsonObj.height,
      x: jsonObj.x,
      y: jsonObj.y,
    });
    return rect;
  }
}

export default GestiReader;
