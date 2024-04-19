import {
  EventHandle,
  PriorityGestiEventObject,
  SimpleGestiEventObject,
  SimplePriorityGestiEventObject,
} from "@/utils/event/event-object";
import Painter from "../lib/painter";
import Rect from "../lib/rect";
import RenderBox from "../lib/rendering/renderbox";
import Vector from "../lib/vector";
import SimpleOperationObserver, {
  OperationHandle,
  SimpleOperationHandle,
} from "../abstract/operation-observer";

/**
 * 在页面上渲染的对象
 */
export interface RenderObject {
  key: string;
  /**
   * 世界坐标，相对于画布的坐标
   */
  rect: Rect;
  render(paint: Painter): void;
  renderBox: RenderBox;
}

export abstract class SimpleRenderObject implements RenderObject {
  abstract renderBox: RenderBox;
  key: string = Math.random().toString(16).substring(2);
  get rect(): Rect {
    return this.renderBox.rect;
  }
  set rect(rect: Rect) {
    this.renderBox.rect = rect;
  }
  render(paint: Painter): void {
    throw new Error("Method not implemented.");
  }
}

/**
 * 具有事件属性的可渲染对象,普通级
 */
export abstract class RenderObjectWithEvent
  extends SimpleRenderObject
  implements EventHandle
{
  protected event = new SimpleGestiEventObject();
  constructor() {
    super();
    this.event.bindHandleProxy(this);
  }
  onDown(e: Vector): boolean {
    return true;
  }
  onUp(e: Vector): boolean {
    return true;
  }
  onMove(e: Vector): boolean {
    return true;
  }
  onWheel(e: WheelEvent): void {}
}

export abstract class RenderObjectWithEventPriority extends RenderObjectWithEvent {
  protected event = new SimplePriorityGestiEventObject();
  constructor() {
    super();
    this.event.bindHandleProxy(this);
  }
}

export abstract class EventRenderObjectWithOperationObserve
  extends RenderObjectWithEvent
  implements OperationHandle
{
  private observe: SimpleOperationObserver = new SimpleOperationObserver();
  /**
   * 开始监听操作
   */
  observeStart() {
    this.observe.addObserver(this);
  }
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

export default SimpleRenderObject;
