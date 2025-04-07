import { BindingBase } from "../basic/framework";
import { ChangeNotifier, Listenable } from "../core/change-notifier";
import { Offset } from "../math/vector";

export type EventListenType =
  | "mousedown"
  | "mouseup"
  | "mousemove"
  | "wheel"
  | "mouseout"
  | "touchstart"
  | "touchend"
  | "touchmove"
  | "touchcancel";
type EventData = any;
type EventDataCallback = (data: EventData) => void;


export class GenPointerEvent{
  identifier: number;
  pointer: Offset;
}

export interface GenUnifiedEvent {
  pointer: GenPointerEvent;
  pointers: Array<GenPointerEvent>;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  delta?: Offset;
}

export class GenUnifiedPointerEvent implements GenUnifiedEvent {
  pointer: GenPointerEvent;
  pointers: GenPointerEvent[];
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  delta?: Offset;
  constructor(args:GenUnifiedEvent){
    this.pointer = args.pointer;
    this.pointers = args.pointers;
    this.ctrlKey = args?.ctrlKey;
    this.metaKey = args?.metaKey;
    this.shiftKey = args?.shiftKey;
    this.delta = args?.delta;
  }
}

export class NativeEventsBinding extends BindingBase {
  static instance: NativeEventsBinding;
  protected initInstance(): void {
    super.initInstance();
    NativeEventsBinding.instance = this;
  }
  /**
   * 只需要监听一个方法，使用Map即可
   */
  public listeners: Map<EventListenType, EventData> = new Map();
  addEventListener(type: EventListenType, callback: EventDataCallback): void {
    this.listeners.set(type, callback);
  }
  removeEventListener(type: EventListenType): void {
    this.listeners.delete(type);
  }
  applyEvent(type: EventListenType, data: EventData): void {
    const callback = this.listeners.get(type);
    callback?.(data);
  }
}

export class NativeEventsBindingHandler {
  private binding: NativeEventsBinding = new NativeEventsBinding();
  applyEvent(type: EventListenType, data: EventData): void {
    this.binding.applyEvent(type, this.adapter(data));
  }
  /**
   * 事件平台差异转换，转换各个平台数据到指定格式
   * 电脑端浏览器事件应满足格式 MouseEvent,详情参考 [MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent)
   * 移动端浏览器事件应满足格式 TouchEvent,详情参考 [MDN Reference](https://developer.mozilla.org/docs/Web/API/TouchEvent)
   */
  protected adapter(data: EventData): EventData {
    return data;
  }
}
