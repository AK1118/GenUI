import Serializable from "../interfaces/Serialization";
import Cutter from "../../utils/cutters/cutter-H5";
import { ImageChunk } from "Gesti";
import ImageChunkConverter from "../abstract/image-chunk-converter";
import ImageChunkConverterH5 from "@/utils/converters/image-chunk-converter-H5";
import { ExportXImage } from "Serialization";
import BoxFit from "./painting/box-fit";
export interface XImageOption {
  /**
   * 图片数据源，确保你的数据源能正确的显示到canvas上后再添加进来
   */
  data?:
    | HTMLImageElement
    | SVGImageElement
    | HTMLVideoElement
    | HTMLCanvasElement
    | Blob
    | ImageData
    | ImageBitmap
    | OffscreenCanvas;
  originData?: any;
  /**
   * 宽度
   */
  width?: number;
  /**
   * 高度
   */
  height?: number;
  /**
   * 缩放倍数
   */
  scale?: number;
  /**
   * 最大放大倍数
   */
  maxScale?: number;
  /**
   * 最小缩小倍数
   */
  minScale?: number;
  /**
   * 图片原始宽度
   */
  fixedWidth?: number;
  /**
   * 图片原始高度
   */
  fixedHeight?: number;
  /**
   * 图片网络地址
   */
  url?: string;

  fit?: BoxFit;
}
class XImage implements Serializable<{}> {
  originData: any;
  data: any;
  width: number = 0;
  height: number = 0;
  x: number = 0;
  y: number = 0;
  scale: number = 1;
  /**
   * 原始数据大小
   */
  fixedWidth: number = 0;
  fixedHeight: number = 0;
  url: string;
  /**
   * fit不会被序列化，fit作用于load入画布时初始大小，序列化传入其他画布不依赖于fit
   */
  fit: BoxFit = BoxFit.none;
  constructor(params: XImageOption) {
    const {
      data,
      width,
      height,
      scale,
      originData,
      fixedWidth,
      fixedHeight,
      url,
      fit,
    } = params;
    if (!data || !width || !height)
      throw Error(
        "Invalid value of XImage option,data, width, and height must all be non-null"
      );
    this.originData = originData;
    this.data = data;
    this.width = width;
    this.height = height;
    this.scale = scale || 1;
    this.url = url;
    this.fit = fit;
    /**
     * 需要保留图片原始大小
     */
    if (fixedWidth && fixedHeight) {
      this.fixedWidth = fixedWidth;
      this.fixedHeight = fixedHeight;
    } else {
      this.fixedWidth = width;
      this.fixedHeight = height;
    }
    this.width *= this.scale;
    this.height *= this.scale;
    this.width = ~~this.width;
    this.height = ~~this.height;
  }
  public async export(): Promise<ExportXImage> {
    const url: string = this.url;
    let data: ImageChunk[];
    if (!url) {
      const cutter: Cutter = new Cutter();
      const chunks: ImageChunk[] = await cutter.getChunks(this);
      const coverter: ImageChunkConverter = new ImageChunkConverterH5();
      data = coverter.coverAllImageChunkToBase64(chunks);
    }
    return Promise.resolve({
      url: this.url,
      data: data,
      width: this.fixedWidth,
      height: this.fixedHeight,
      fit:this.fit,
    });
  }
  toJSON(): any {
    let data: ImageChunk[];
    return {
      url: this.url,
      data: data,
      fit:this.fit,
      width: this.fixedWidth,
      height: this.fixedHeight,
      fixedWidth:this.fixedWidth,
      fixedHeight:this.fixedHeight,
    };
  }
  toJson(): RectParams {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
export default XImage;
