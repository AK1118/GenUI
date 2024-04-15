import Button, { BaseButton } from "../../abstract/baseButton";
import ViewObject from "../../abstract/view-object";
import CatchPointUtil from "../../../utils/event/catchPointUtil";
import Drag from "../../../utils/event/drag";
import { FuncButtonTrigger, ViewObjectFamily } from "../../enums";
import GestiEventManager, { GestiEvent } from "../../../utils/event/event";
import Gesture from "../../../utils/event/gesture";
import GestiController from "../../interfaces/gesticontroller";
import Painter from "../painter";
import Rect from "../rect";
import Vector from "../vector";
import ImageBox from "../../viewObject/image";
import TextBox from "../../viewObject/text/text";
import WriteFactory from "../../viewObject/write/write-factory";
import { ViewObject as ViewObjectD, XImageOption } from "@/types/gesti";
import XImage from "../ximage";
import {
  ViewObjectExportEntity,
  ViewObjectExportWrapper,
  ViewObjectImportEntity,
} from "@/types/serialization";
import {
  ExportAllInterceptor,
  GraffitiCloser,
  ImportAllInterceptor,
  InitializationOption,
  TextOptions,
} from "@/types/gesti";
import WriteViewObj from "../../viewObject/write";
import ScreenUtils from "@/utils/screenUtils/ScreenUtils";
import { ScreenUtilOption } from "Gesti";
import Platform from "../../viewObject/tools/platform";
import Deserializer from "@/utils/deserializer/Deserializer";
import {
  CenterAxis,
  GestiControllerListenerTypes,
  GraffitiType,
} from "@/types/controller";
import { BoxDecorationOption } from "@/types/graphics";
import DecorationBase from "../../bases/decoration-base";
import ImageToolkitBase, { EventHandlerState } from "./image-toolkit-base";
import { LayerOperationType } from "./utils";
import { ListenerHook } from "../listener";

class ImageToolkit extends ImageToolkitBase {
  constructor(option: InitializationOption) {
    super();
    const {
      x: offsetX,
      y: offsetY,
      canvasWidth,
      canvasHeight,
    } = option?.rect || {};
    this.offset = new Vector(offsetX || 0, offsetY || 0);
    this.canvasRect = new Rect({
      x: this.offset.x,
      y: this.offset.y,
      width: canvasWidth,
      height: canvasHeight,
    });
    this.paint = new Painter(option.renderContext);
    this.writeFactory = new WriteFactory(this.paint);
    this.bindEvent();
  }
  private bindEvent(): void {
    this.eventHandler = new GestiEventManager().getEvent(this);
    if (this.eventHandler == null) return;
    this.eventHandler
      .down(this.onDown)
      .move(this.onMove)
      .up(this.onUp)
      .wheel(this.onWheel);
    this.debug(["Event Bind,", this.eventHandler]);
  }
  public onDown(v: GestiEventParams): void {
    this.eventHandlerState = EventHandlerState.down;
    const event: Vector | Vector[] = this.correctEventPosition(v);
    this.debug(["Event Down,", event]);

    //手势解析处理
    this.gesture.onDown(this.selectedViewObject, event);

    if (this.selectedViewObject ?? false) {
      if (Array.isArray(event) || this.checkFuncButton(event)) {
        return;
      }
    }
    /**
     * 处理拖拽的代码块，被选中图册是检测选中的最高优先级
     * 当有被选中图层时，拖拽的必然是他，不论层级
     *
     */
    let selectedTarget: ViewObject = CatchPointUtil.catchViewObject(
      this.ViewObjectList,
      event
    );
    /**
     * 已选中图层移动优先级>涂鸦动作优先级>选中图层动作优先级
     * 没有选中的图层时执行涂鸦动作，判断涂鸦动作是否开启
     * */
    if (selectedTarget && !selectedTarget.isBackground) {
      if (selectedTarget.selected) {
        if (!selectedTarget.isLock)
          this.drag.catchViewObject(selectedTarget.rect, event);
        this.selectedViewObject = this.handleSelectedTarget(event);
        return;
      }

      //涂鸦等待且现在手机点击在已选中对象内
      if (this.writeFactory.watching && !selectedTarget.selected) {
        this.writeFactory.onDraw();
      }

      this.selectedViewObject = this.handleSelectedTarget(event);
      this.ViewObjectList.forEach((item) =>
        item.key === selectedTarget.key ? "" : this.handleCancelView(item)
      );
    } else {
      //点击图像外取消选中上一个对象
      this.handleCancelView(this.selectedViewObject);
      if (this.writeFactory.watching && !selectedTarget?.selected)
        return this.writeFactory.onDraw();
    }
    this.render();
  }
  protected handleCancelView(view: ViewObject): void {
    this.blurViewObject(view);
  }
  /**
   * 取消聚焦
   * @param view
   */
  protected blurViewObject(view?: ViewObject) {
    const _view = view || this.selectedViewObject;
    if (_view) {
      if (_view.key == this.selectedViewObject?.key) {
        this.selectedViewObject = null;
      }
      _view?.cancel();
      this.callHook("onCancel", _view);
    }
    this.render();
  }
  public onMove(v: GestiEventParams): void {
    if (this.eventHandlerState === EventHandlerState.down) {
      const event: Vector | Vector[] = this.correctEventPosition(v);
      this.debug(["Event Move,", event]);
      //绘制处理,当down在已被选中的图册上时不能绘制
      if (this.writeFactory.current) {
        this.render();
        this.writeFactory.current?.setScreenUtils(this.screenUtils);
        return this.writeFactory.current?.onMove(
          event,
          this.screenUtils?.devScale
        );
      }

      //手势解析处理
      this.gesture.onMove(this.selectedViewObject, event);
      //手势
      if (Array.isArray(event)) {
        this.gesture.update(event);
        return this.render();
      }
      //拖拽
      this.drag.update(event);
      //有被选中对象才刷新
      if (this.selectedViewObject != null) this.render();
    } else {
      const event: Vector | Vector[] = this.correctEventPosition(v);
      //Hover检测
      const selectedViewObject: ViewObject = CatchPointUtil.catchViewObject(
        this.ViewObjectList,
        event
      );
      if (
        selectedViewObject &&
        this.hoverViewObject?.key != selectedViewObject.key
      ) {
        this.callHook("onHover", selectedViewObject);
        this.hoverViewObject = selectedViewObject;
      } else if (!selectedViewObject && this.hoverViewObject) {
        this.callHook("onLeave", this.hoverViewObject);
        this.hoverViewObject = null;
      }
    }
  }
  public onUp(v: GestiEventParams): void {
    const event: Vector | Vector[] = this.correctEventPosition(v);
    this.debug(["Event Up,", event]);
    //判断是否选中对象
    this.eventHandlerState = EventHandlerState.up;
    //手势解析处理
    this.gesture.onUp(this.selectedViewObject, event);
    this.drag.cancel();
    //绘制完了新建一个viewObj图册对象
    const writeObj = this.writeFactory.done();
    writeObj.then((value: WriteViewObj) => {
      if (value) {
        this.selectedViewObject?.cancel();
        this.callHook("onCreateGraffiti", value);
        this.addViewObject(value);
      }
    });
    if (this.selectedViewObject) {
      if (this._inObjectArea) this.selectedViewObject.onUpWithInner(this.paint);
      else this.selectedViewObject.onUpWithOuter(this.paint);
    }
    this.render();
    this._inObjectArea = false;
  }

  public onWheel(e: WheelEvent): void {
    const { deltaY } = e;
    if (this.selectedViewObject != null) {
      if (deltaY < 0) this.selectedViewObject.enlarge();
      else this.selectedViewObject.narrow();
    }
    this.render();
  }

  private correctEventPosition(vector: GestiEventParams): Vector | Vector[] {
    let _vector: Vector[] = new Array<Vector>();
    if (Array.isArray(vector)) {
      vector.map((item: Vector) => {
        /**
         * ### 适配屏幕，触摸点也需要适配
         */
        if (this.screenUtils) {
          item.x *=
            this.screenUtils.devicePixelRatio *
            this.screenUtils.deviceCanvasRatio.widthRatio;
          item.y *=
            this.screenUtils.devicePixelRatio *
            this.screenUtils.deviceCanvasRatio.heightRatio;
        }
        _vector.push(item.sub(this.offset));
      });
      return _vector;
    } else if (this.screenUtils) {
      /**
       * ### 适配屏幕，触摸点也需要适配
       */
      const v = vector as unknown as Vector;
      v.x *=
        this.screenUtils.devicePixelRatio *
        this.screenUtils.deviceCanvasRatio.widthRatio;
      v.y *=
        this.screenUtils.devicePixelRatio *
        this.screenUtils.deviceCanvasRatio.heightRatio;
      return v.sub(this.offset);
    }
    return vector.sub(this.offset);
  }

  private checkFuncButton(eventPosition: Vector): boolean {
    const _button: BaseButton | boolean =
      this.selectedViewObject.checkFuncButton(eventPosition);
    const result: any = _button;
    //确保是按钮 且 对象以及被选中
    if (result instanceof Button && this.selectedViewObject.selected) {
      this._inObjectArea = true;
      const button: BaseButton = result;
      if (button.trigger == FuncButtonTrigger.drag) {
        button.onSelected();
        this.drag.catchViewObject(button.rect, eventPosition);
      } else if (button.trigger == FuncButtonTrigger.click) {
        button.effect();
      }
      return true;
    } else {
      this.drag.cancel();
      this.gesture.cancel();
    }
    return false;
  }
  /**
   * 传入一个Vector坐标判断是否选中了图册
   * @param event
   */
  private handleSelectedTarget(event: Vector | Vector[]): ViewObject {
    const selectedViewObjectTarget: ViewObject = CatchPointUtil.catchViewObject(
      this.ViewObjectList,
      event
    );
    if (selectedViewObjectTarget ?? false) {
      this.debug(["选中了", selectedViewObjectTarget]);
      this.callHook("onSelect", selectedViewObjectTarget);
      this._inObjectArea = true;
      //之前是否有被选中图层 如果有就取消之前的选中
      if (
        this.selectedViewObject &&
        selectedViewObjectTarget.key != this.selectedViewObject.key
      ) {
        this.handleCancelView(this.selectedViewObject);
      }
      //选中后变为选中状态
      selectedViewObjectTarget.onSelected();
      //不允许在锁定时被拖拽选中进行操作
      if (!selectedViewObjectTarget.isLock)
        this.drag.catchViewObject(selectedViewObjectTarget.rect, event);
      return selectedViewObjectTarget;
    }
    return null;
  }

  /**
   * @description 获取当前所存图层长度
   * @returns number
   */
  protected getViewObjectCount(): number {
    return this.ViewObjectList.length;
  }

  protected addViewObject(obj: ViewObject): void {
    if (obj.getLayer() === null) obj.setLayer(this.getViewObjectCount() - 1);
    this.callHook("onLoad", obj);
    this.tool.sortByLayer(this.ViewObjectList);
    this.render();
  }
}

export default ImageToolkit;
