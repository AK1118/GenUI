import {
  EventHandle,
  PriorityGestiEventObject,
  SimpleGestiEventObject,
  SimplePriorityGestiEventObject,
  WatcherHandle,
} from "@/utils/event/event-object";
import Painter from "../lib/painter";
import Rect from "../lib/rect";
import RenderBox from "../lib/rendering/renderbox";
import Vector from "../lib/vector";
import SimpleOperationObserver, {
  OperationHandle,
  SimpleOperationHandle,
} from "../abstract/operation-observer";
import CatchPointUtil from "@/utils/event/catchPointUtil";

/**
 * 
 * 
 * 
 * build 只执行一次，用于传输上下文数据例如 主题，父数据等
 * render 渲染数据
 * 
 * 
 */

/**
 * 在页面上渲染的对象
 */
export interface RenderObject {
  parent: RenderObject;
  key: string;
  renderBox: RenderBox;
  focused: boolean;
  render(paint: Painter): void;
  get mounted(): boolean;
}

export abstract class SimpleRenderObject implements RenderObject {
  parent: RenderObject;
  get mounted(): boolean {
    return this.renderBox != null;
  }
  protected performMount(parent?: RenderObject): void {
    this.parent = parent;
  }
  focused: boolean = false;
  abstract renderBox: RenderBox;
  key: string = Math.random().toString(16).substring(2);
  get rect(): Rect {
    return this.renderBox.rect;
  }
  set rect(rect: Rect) {
    this.renderBox.rect = rect;
  }
  render(paint: Painter): void {
    
  }
}

/**
 * 具有事件属性的可渲染对象,普通级
 */
export abstract class RenderObjectWithEvent
  extends SimpleRenderObject
  implements EventHandle, WatcherHandle
{
  protected event = new SimpleGestiEventObject();
  constructor() {
    super();
  }
  performMount(parent?: RenderObject): void {
    super.performMount(parent);
    this.event.bindHandleProxy(this);
  }
  blur(e: Vector): void {
    this.focused = false;
    this.onBlur(e);
  }
  focus(e: Vector): void {
    this.focused = true;
    this.event.focus(e);
    this.onFocus(e);
  }
  onFocus(e: Vector): void {}
  onBlur(e: Vector): void {}
  onDown(e: Vector): boolean {
    const selected = CatchPointUtil.inArea(this.rect, e);
    if (selected) {
      this.focus(e);
      return false;
    } else if (this.focused) {
      this.blur(e);
    }
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
