import ViewObject from "../../abstract/view-object";
import Drag from "../../../utils/event/drag";
import { GestiEvent } from "../../../utils/event/event";
import Gesture from "../../../utils/event/gesture";
import Painter from "../painter";
import Rect from "../rect";
import Vector from "../vector";
import WriteFactory from "../../viewObject/write/write-factory";
import ScreenUtils from "@/utils/screenUtils/ScreenUtils";
import {  GestiControllerListenerTypes } from "@/types/controller";
import Listeners from "../listener";
import _Tools from "./utils";
export enum EventHandlerState {
  down,
  up,
  move,
}
abstract class ImageToolkitBase {
  //屏幕适配  默认不适配
  protected screenUtils: ScreenUtils;
  //所有图层集合
  protected _viewObjectList: Array<ViewObject> = new Array<ViewObject>();
  //手势监听器
  protected eventHandler: GestiEvent;
  //手势状态
  protected eventHandlerState: EventHandlerState = EventHandlerState.up;
  //拖拽代理器
  protected drag: Drag = new Drag();
  //手势处理识别器
  protected gesture: Gesture = new Gesture();
  //当前选中的图层
  protected selectedViewObject: ViewObject = null;
  //canvas偏移量
  protected offset: Vector;
  //画布矩形大小
  protected canvasRect: Rect;
  //画笔代理类 canvasContext 2d
  protected paint: Painter;
  //是否debug模式
  public isDebug: boolean = false;
  /**
   * 本次点击是否有选中到对象，谈起时需要置于false
   */
  protected _inObjectArea: boolean = false;
  /**
   * 工具
   */
  protected tool: _Tools = new _Tools();
  protected listen: Listeners = new Listeners();
  /**
   * 目前图层的显示状态，0表示隐藏，1表示显示
   */
  protected currentViewObjectState: Array<0 | 1> = [];
  //绘制对象工厂  //绘制对象，比如签字、矩形、圆形等
  protected writeFactory: WriteFactory;
  protected hoverViewObject: ViewObject = null;
  protected setViewObjectList(viewObjectArray: Array<ViewObject>) {
    this._viewObjectList = viewObjectArray;
  }
  protected cleanViewObjectList(): void {
    this._viewObjectList = [];
  }
  get ViewObjectList(): Array<ViewObject> {
    return this._viewObjectList;
  }
  protected debug(message: any): void {
    if (!this.isDebug) return;
    if (Array.isArray(message)) console.warn("Gesti debug: ", ...message);
    else console.warn("Gesti debug: ", message);
  }

  protected callHook(type: GestiControllerListenerTypes, arg = null) {
    this.listen.callHooks(type, arg);
  }
  /**
   * 扫除没用的对象，根据大小判断
   * 清扫细微到不可见的对象
   * @param item
   */
  private cleaning(item: ViewObject) {
    // if (item && item.rect) {
    //   const { width, height } = item.rect.size;
    //   if (width <= 3 && height <= 3) item.unMount();
    // }
  }
  public getCanvasRect(): Rect {
    return this.canvasRect;
  }
  public getViewObjects() {
    return this.ViewObjectList;
  }
  //上一次是否渲染完成
  private preRenderFinished: boolean = true;
  public render() {
    /**
     * 在使用绘制对象时，根据值来判断是否禁止重绘
     */
    this.debug("Update the Canvas");
    this.callHook("onUpdate", null);
    this.paint.clearRect(
      0,
      0,
      this.canvasRect.size.width,
      this.canvasRect.size.height
    );

    //当前显示标记数组初始化数据，且需要实时更新
    if (this.currentViewObjectState.length != this.ViewObjectList.length) {
      this.currentViewObjectState.push(1);
    }
    /**
     * 元素显示条件   mounted&&!disabled
     * 当为disabled时不会被清除，只是被隐藏，可以再次显示
     * 当mounted为false时，从kit中删除该对象。
     */
    this.paint.save();
    //适配屏幕分辨率
    if (this.screenUtils)
      this.paint.scale(this.screenUtils.devScale, this.screenUtils.devScale);
    this.ViewObjectList.forEach((item: ViewObject, ndx: number) => {
      if (!item.disabled) {
        //扫除
        this.cleaning(item);
        item.render(this.paint);
        this.paint.drawSync();
        this.currentViewObjectState[ndx] = 1;
      } else if (this.currentViewObjectState[ndx] == 1) {
        //标记过后不会再次标记
        this.currentViewObjectState[ndx] = 0;
        item.cancel();
        this.callHook("onHide", item);
        this.paint.drawSync();
      }
    });
    this.selectedViewObject?.performRenderSelected(this.paint);
    this.paint.restore();
  }
  public getScreenUtil(): ScreenUtils {
    return this.screenUtils;
  }
}

export default ImageToolkitBase;
