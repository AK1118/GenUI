import Vector from "@/core/lib/vector";
import gestiEventManager, {
  EventNotifyNode,
  SingleEventNotifyNode,
} from "./event-manager";
type EventParams = Vector;

export type RankType = "priority" | "secondary";
/**
 * 聚焦失焦
 */
export interface WatcherHandle {
  onFocus(e: EventParams): void;
  onBlur(e: EventParams): void;
  blur(e: EventParams): void;
  focus(e: EventParams): void;
}

type EventCallbackFunction = (e: EventParams) => boolean;

export interface EventHandle extends WatcherHandle {
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
export abstract class GestiEventObject
  extends SingleEventNotifyNode
  implements GestiEvent
{
  readonly key: string = new Date().toUTCString(); //Math.random().toString(16).substring(2);
  handleProxy: EventHandle;
  handleWatcher: WatcherHandle;
  onFocus(e: Vector): void {
    this.handleProxy.onFocus.bind(this.handleProxy)(e);
  }
  onBlur(e: Vector): void {
    this.handleProxy.onBlur.bind(this.handleProxy)(e);
  }
  bindHandleProxy(obj: EventHandle) {
    this.handleProxy = obj;
  }
  blur(e: EventParams): void {
    this.onBlur(e);
  }
  private handleBlurOtherNode(
    e: EventParams,
    _node: EventNotifyNode,
    direction: "up" | "down"
  ) {
    if (!_node) return;
    let otherNode;
    if (direction === "up") {
      otherNode = _node.previous;
      console.log("pre", otherNode);
    } else if (direction === "down") {
      otherNode = _node.next;
      console.log("down", otherNode);
    }

    if (otherNode) {
      const node = otherNode as GestiEventObject;
      if (node.key === this.key) return;
      node.blur(e);
      // 递归调用，根据方向继续向上或向下遍历节点
      this.handleBlurOtherNode(e, otherNode, direction);
    }
  }
  /**
   * 聚焦时取消其他聚焦
   * @param e
   */
  focus(e: EventParams): void {
    //[o,o,blur<<-current,o,...]
    //current 是当前节点，需要向上blur兄弟事件，下游兄弟事件会根据事件流往下执行并判断
    this.handleBlurOtherNode(e, this, "up");
    this.handleBlurOtherNode(e, this, "down");
    this.onFocus(e);
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
    super();
  }
  bindHandleProxy(obj: EventHandle): void {
    super.bindHandleProxy(obj);
    this.registration("priority", this);
  }
}

export abstract class SecondaryGestiEventObject extends GestiEventObject {
  constructor() {
    super();
  }
  bindHandleProxy(obj: EventHandle): void {
    super.bindHandleProxy(obj);
    this.registration("secondary", this);
  }
}

/**
 * 可被事件监听对象
 */
export class SimpleGestiEventObject extends SecondaryGestiEventObject {}

export class SimplePriorityGestiEventObject extends PriorityGestiEventObject {}
