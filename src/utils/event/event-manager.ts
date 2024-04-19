import Vector from "@/core/lib/vector";
import { GestiEvent, GestiEventObject, RankType } from "./event-object";
type EventParams = Vector;

/**
 * 事件通知者
 */
export interface GestiEventNotification {
  wheel(e: WheelEvent): void;
  down(e: EventParams): void;
  up(e: EventParams): void;
  move(e: EventParams): void;
}

interface EventNotifyNode {
  parentNode: EventNotifyNode;
  previous: EventNotifyNode;
  next: EventNotifyNode;
  event: GestiEventObject;
  setPrevious(node: EventNotifyNode): void;
  setNext(node: EventNotifyNode): void;
  getParent(): EventNotifyNode;
  getPrevious(): EventNotifyNode;
  getNext(): EventNotifyNode;
}

abstract class SingleEventNotifyNode implements EventNotifyNode {
  parentNode: EventNotifyNode;
  previous: EventNotifyNode;
  event: GestiEventObject;
  constructor(parentNode: EventNotifyNode, event: GestiEventObject) {
    this.parentNode = parentNode;
    this.event = event;
  }
  setPrevious(node: EventNotifyNode): void {
    this.previous = node;
  }
  setNext(node: EventNotifyNode): void {
    this.next = node;
  }
  getNext(): EventNotifyNode {
    return this.next;
  }
  next: EventNotifyNode;
  getParent(): EventNotifyNode {
    return this.parentNode;
  }
  getPrevious(): EventNotifyNode {
    return this.previous;
  }
}

abstract class MultipleEventNotifyNode extends SingleEventNotifyNode {
  children: Array<EventNotifyNode>;
  get childCount(): number {
    return this.children.length;
  }
  addChild(child: EventNotifyNode) {
    this.children.push(child);
  }
  getLastChild(): EventNotifyNode {
    return this.children[this.childCount - 1];
  }
}

class SimpleSingleEventNotifyNode extends SingleEventNotifyNode {}
class SimpleMultipleEventNotifyNode extends SingleEventNotifyNode {}

/**
 * 管理全局的鼠标事件监听
 */
abstract class GestiEventManager implements GestiEventNotification {
  /**
   * 委托存放全局event对象栈
   */
  private readonly eventsStacks: Record<
    RankType,
    Array<EventNotifyNode>
  > = {
    priority: [],
    secondary: [],
  };
  /**
   * 将事件注册进委托栈
   * @param key
   * @param object
   */
  public register(
    rank: RankType,
    object: GestiEventObject,
    parentNode?: EventNotifyNode
  ): void {
    const node = new SimpleSingleEventNotifyNode(parentNode, object);
    this.eventsStacks[rank].unshift(node);
  }

  private performNotify(
    rank: RankType,
    type: keyof GestiEvent,
    event: EventParams,
    wheelEvent?: WheelEvent
  ): boolean {
    const eventsStacks = this.eventsStacks[rank];
    if (!eventsStacks) return;
    const len = eventsStacks.length;
    const arr = eventsStacks;
    let isContinue = true;
    for (let index = 0; index < len; index++) {
      const node = arr[index];
      const _: GestiEventObject = node.event;
      if (type === "onDown") {
        isContinue = _.onDown(event);
      }
      if (type === "onMove") {
        _.onMove(event);
      }
      if (type === "onUp") {
        _.onUp(event);
      }
      if (type === "onWheel") {
        _.onWheel(wheelEvent);
      }
      if (!isContinue) break;
    }
    return isContinue;
  }
  protected notify(
    type: keyof GestiEvent,
    event: EventParams,
    wheelEvent?: WheelEvent
  ) {
    if (this.performNotify("priority", type, event, wheelEvent)) {
      this.performNotify("secondary", type, event, wheelEvent);
    }
  }
  wheel(e: WheelEvent): void {
    this.notify("onWheel", null, e);
  }
  down(e: EventParams): void {
    this.notify("onDown", e);
  }
  up(e: EventParams): void {
    this.notify("onUp", e);
  }
  move(e: EventParams): void {
    this.notify("onMove", e);
  }
}

class SimpleGestiEventManager extends GestiEventManager {
  private static instance: GestiEventManager;
  constructor() {
    super();
  }

  public static getInstance(): SimpleGestiEventManager {
    if (!SimpleGestiEventManager.instance) {
      SimpleGestiEventManager.instance = new SimpleGestiEventManager();
    }
    return SimpleGestiEventManager.instance;
  }
}

const gestiEventManager: SimpleGestiEventManager =
  SimpleGestiEventManager.getInstance();

export default gestiEventManager;
