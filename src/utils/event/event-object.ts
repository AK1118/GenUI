import Vector from "@/core/lib/vector";
import gestiEventManager from "./event-manager";
type EventParams = Vector;

export type RankType = "priority" | "secondary";
/**
 * 聚焦失焦
 */
export interface Watcher {
  onFocus(): void;
  onBlur(): void;
  blur(): void;
  focus(): void;
}
type EventCallbackFunction = (e: EventParams) => boolean;
export interface EventHandle {
  onDown(e: EventParams): boolean;
  onUp(e: EventParams): boolean;
  onMove(e: EventParams): boolean;
  onWheel(e: WheelEvent): void;
}

/**
 * 事件接收者
 */
export interface GestiEvent extends EventHandle {
  registration<T extends GestiEventObject>(rank: RankType, obj: T): void;
  bindHandleProxy(obj: EventHandle): void;
  handleProxy: EventHandle;
}

/**
 * 事件可通知对象
 */
export abstract class GestiEventObject implements GestiEvent, Watcher {
  readonly key: string = Math.random().toString(16).substring(2);
  handleProxy: EventHandle;
  constructor(autoRegistration: boolean = true) {
    if (autoRegistration) {
      this.registration("priority", this);
    }
  }
  bindHandleProxy(obj: EventHandle) {
    this.handleProxy = obj;
  }
  onFocus(): void {
    throw new Error("Method not implemented.");
  }
  onBlur(): void {
    throw new Error("Method not implemented.");
  }
  blur(): void {
    throw new Error("Method not implemented.");
  }
  focus(): void {
    throw new Error("Method not implemented.");
  }
  registration<T extends GestiEventObject>(rank: RankType, obj: T): void {
    gestiEventManager.register(rank, obj);
  }
  onDown(e: EventParams): boolean {
    return this.handleProxy.onDown.bind(this.handleProxy)(e);
  }
  onUp(e: EventParams): boolean {
    return this.handleProxy.onUp.bind(this.handleProxy)(e);
  }
  onMove(e: EventParams): boolean {
    return this.handleProxy.onMove.bind(this.handleProxy)(e);
  }
  onWheel(e: WheelEvent): void {
    this.handleProxy.onWheel.bind(e);
  }
}

/**
 * ### 事件优先者
 * 例如一个view A和一个button,button属于其他view上，且button空间和view A重叠
 * 意图为点击button,如果优先级等同，会出现按钮事件被view A抢夺，
 * button此时就需要具有优先事件处理权力
 */
export abstract class PriorityGestiEventObject extends GestiEventObject {
  constructor() {
    super(false);
    this.registration("priority", this);
  }
}

export abstract class SecondaryGestiEventObject extends GestiEventObject {
  constructor() {
    super(false);
    this.registration("secondary", this);
  }
}

/**
 * 可被事件监听对象
 */
export class SimpleGestiEventObject extends SecondaryGestiEventObject {}

export class SimplePriorityGestiEventObject extends PriorityGestiEventObject {}
