import XImage from "../ximage";


//图层控制器
interface LayerController{
    /**
     * 图层向下移动一位
     */
    layerLower():void;
    /**
     * 图层向上移动一位
     */
    layerRise():void;
    /**
     * 置于最顶层
     */
    layerTop():void;
    /**
     * 置于最底层
     */
    layerBottom():void;
    /**
     * 解锁图层
     */
    deLock():void;
    /**
     * 锁定图层
     */
    lock():void;
    /**
     * 取消所有被聚焦的对象
     */
    cancelAll():void;
    /**
     * 取消当前被聚焦对象
     */
    cancel():void,
}

//画布控制器
interface ImageToolKitController{
    /**
     * 回退操作
     */
    fallback():void;
    /**
     * 取消刚刚的回退
     */
    cancelFallback():void;
    /**
     * 刷新画布
     */
    update():void;
    /**
     * 新增图片
     * @param @XImage 
     */
    addImage(ximage: XImage|Promise<XImage>):Promise<boolean>;
    /**
     * @description 传入对应的值返回一个Promise<XImage>对象,option可传入 图片width、height、scale,maxScale,minScale,
     * @param image 
     * @param options 
     * 
    *   {
                data?: HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | Blob | ImageData | ImageBitmap | OffscreenCanvas, options?: createImageOptions,
                width?: number,
                height?: number,
                scale?: number,
                maxScale?: number,
                minScale?: number,
            }
     */
    createImage(image: HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | Blob | ImageData | ImageBitmap | OffscreenCanvas, options?: createImageOptions): Promise<XImage>
    /**
     * @description 添加文字
     * @param text 
     * @param options 
     */
    addText(text: string, options?: {
        fontFamily?: string,
        fontSize?: number,
    }):Promise<boolean>;
}
/**
 * 控制器类，提供接口供给用户使用
 */
interface GestiController extends LayerController,ImageToolKitController{
    /**
     * @description 鼠标/手指按下时调用
     * @param e 
     */
     down(e: Event): void;
      /**
     * @description 鼠标/手指抬起时调用
     * @param e 
     */
     up(e: Event): void;
      /**
     * @description 鼠标/手指移动时调用
     * @param e 
     */
     move(e: Event): void;
      /**
     * @description 鼠标滚轮时调用
     * @param e 
     */
     wheel(e: Event): void;
     /**
      * 取消原有事件控制权
      * 值得注意: 当调用该方法后，画布所有的手势监听都会消失。也就是说您不能再点击选取画布，除非您主动调用控制器的down/up/move/wheel方法恢复功能。
      * 栗子：
      * 
      *     window.addEventListener('touchstart',(e)=>{
                controller.down(e);
            })
            window.addEventListener('touchmove',(e)=>{
                controller.move(e);
            })
            window.addEventListener('touchend',(e)=>{
                controller.up(e);
            })
            
            //根据您的需求添加

            window.addEventListener('mousedown',(e)=>{
                controller.down(e);
            })
            window.addEventListener('mousemove',(e)=>{
                controller.move(e);
            })
            window.addEventListener('mouseup',(e)=>{
                controller.up(e);
            })
            window.addEventListener('wheel',(e)=>{
                controller.wheel(e);
            })
      */
     cancelEvent():void;
    
}

export default GestiController;