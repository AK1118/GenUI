class XImage {
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
  fixedWidth: number=0;
  fixedHeight: number=0;
  /**
 *   interface createImageOptions {
        data?: HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | Blob | ImageData | ImageBitmap | OffscreenCanvas, options?: createImageOptions,
        width?: number,
        height?: number,
        scale?: number,
        maxScale?: number,
        minScale?: number,
    }
 * 
 */
  constructor(params: createImageOptions) {
    const { data, width, height, scale, originData, fixedWidth, fixedHeight } =
      params;
    if (!data || !width || !height) throw Error("数据或宽或高不能为空");
    this.originData = originData;
    this.data = data;
    this.width = width;
    this.height = height;
    this.scale = scale || 1;
    /**
     * 需要保留图片原始大小
     */
    if (fixedWidth && fixedHeight) {
      this.fixedWidth = fixedWidth;
      this.fixedHeight = fixedHeight;
    }else{
      this.fixedWidth = width;
      this.fixedHeight = height;
    }
    this.width *= this.scale;
    this.height *= this.scale;
    this.width = ~~this.width;
    this.height = ~~this.height;
  }
  toJson(): rectparams {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
export default XImage;
