import RenderObject, {
  EventRenderObjectWithOperationObserve,
} from "../interfaces/render-object";
import { Debounce, Throttle } from "../../utils/utils";
import RenderBox from "../lib/rendering/renderbox";
import { SimpleGestiEventObject } from "@/utils/event/event-object";

//操作监听类型
/**
 * 值得注意的是，可能会有一些组合的指令
 * 比如  size+angle=拖拽
 * 需要另外声明出一个类型出来 drag
 */
interface OperationType {
  size: Size;
  angle: number;
  scale: number;
  position: Vector;
  addPosition: Vector;
  drag: { angle: number; size: Size };
  sizeScaleWidth: number;
  sizeScaleHeight: number;
}

/**
 * 被观察者应该实现的抽象类
 */
abstract class ObserverObj {
  observer: Observer = null;
  addObserver(observer: Observer): void {
    this.observer = observer;
  }
  removeObserver(): void {
    this.observer = null;
  }
}

class Observer {
  private parent: OperationObserver;
  constructor(parent: OperationObserver) {
    this.parent = parent;
  }
  report(value: any, type: keyof OperationType): void {
    this.parent.report(value, type);
  }
  beforeReport(value: any, type: keyof OperationType): void {
    this.parent.beforeReport(value, type);
  }
}

export interface OperationHandle {
  //改变角度
  didChangeAngle(angle: number);
  beforeChangeAngle(angle: number): void;
  //改变大小
  _didChangeSize(size: Size): void;
  didChangeSize(size: Size): void;
  beforeChangeSize(size: Size): void;
  //改变定位
  didChangePosition(position: Vector): void;
  _didChangePosition(position: Vector): void;
  beforeChangePosition(position: Vector): void;
  //改变缩放
  didChangeDeltaScale(deltaScale: number): void;
  _didChangeDeltaScale(deltaScale: number): void;
  //拖拽
  didDrag(value: { size: Size; angle: number }): void;
  //通过增加改变位置
  beforeAddPosition(delta: Vector): void;
  _didAddPosition(delta: Vector): void;
  //改变任意数据时
  _didChangedAll(): void;

  didChangeScaleHeight(): void;

  _didChangeScaleWidth(): void;

  _didChangeScaleHeight(): void;
}
/**
 * 被监视者
 */
export abstract class SimpleOperationHandle implements OperationHandle {
  //改变角度
  didChangeAngle(angle: number) {}
  beforeChangeAngle(angle: number): void {}
  //改变大小
  _didChangeSize(size: Size): void {}
  didChangeSize(size: Size): void {}
  beforeChangeSize(size: Size): void {}
  //改变定位
  didChangePosition(position: Vector): void {}
  _didChangePosition(position: Vector): void {}
  beforeChangePosition(position: Vector): void {}
  //改变缩放
  didChangeDeltaScale(deltaScale: number): void {}
  //拖拽
  didDrag(value: { size: Size; angle: number }): void {}
  //通过增加改变位置
  didAddPosition(delta: Vector): void {}
  beforeAddPosition(delta: Vector): void {}
  _didAddPosition(delta: Vector): void {}
  //改变任意数据时
  _didChangedAll(): void {}

  didChangeScaleWidth(): void {}

  didChangeScaleHeight(): void {}

  _didChangeScaleWidth(): void {}

  _didChangeScaleHeight(): void {}
  _didChangeDeltaScale(deltaScale: number): void {}
}

/**
 * 监视者
 */
abstract class OperationObserver extends SimpleOperationHandle {
  private observeRenderObject: SimpleOperationHandle;
  /**
   * 添加被观察者
   * @param obj
   */
  public addObserver(
    observeRenderObject: EventRenderObjectWithOperationObserve
  ): void {
    this.observeRenderObject = observeRenderObject;
    const renderBox = observeRenderObject.renderBox;
    renderBox.rect.addObserver(new Observer(this));
  }
  /**
   * @description 改变前
   * @param value
   * @param type
   */
  beforeReport(value: any, type: keyof OperationType): void {
    const handle = this.observeRenderObject;
    switch (type) {
      case "position":
        handle.beforeChangePosition(value);
        break;
      case "angle":
        handle.beforeChangeAngle(value);
        break;
      case "size":
        handle.beforeChangeSize(value);
        break;
      case "addPosition":
        handle.beforeAddPosition(value);
        break;
      default: {
      }
    }
  }
  /**
   * 汇报观察情况，调用对应函数
   * @param value
   * @param type
   */
  report(value: any, type: keyof OperationType): void {
    const handle = this.observeRenderObject;
    switch (type) {
      case "size":
        {
          handle._didChangeSize(value);
          handle.didChangeSize(value);
        }

        break;
      case "angle":
        handle.didChangeAngle(value);
        break;

      case "scale":
        {
          handle._didChangeDeltaScale(value);
          handle.didChangeDeltaScale(value);
        }
        break;

      case "position":
        {
          handle._didChangePosition(value);
          handle.didChangePosition(value);
        }
        break;
      case "drag":
        this.didDrag(value);
        {
          handle._didChangePosition(value);
          handle.didChangePosition(value);
        }
        break;
      case "addPosition":
        {
          handle._didAddPosition(value);
          handle.didAddPosition(value);
        }
        break;
      default: {
      }
    }
    handle._didChangedAll();
  }
  //移除观察者
  public removeObserver() {
    // .rect.removeObserver();
  }
}

class SimpleOperationObserver extends OperationObserver {}

export default SimpleOperationObserver;

export { ObserverObj, OperationType };
