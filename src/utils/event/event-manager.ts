type EventParams = Vector | Vector[];
type EventCallbackFunction = (e: EventParams) => void;

/**
 * 事件接收者
 */
interface GestiEvent {
  onDown: EventCallbackFunction;
  onUp: EventCallbackFunction;
  onMove: EventCallbackFunction;
  onWheel(e: WheelEvent): void;
}

/**
 * 事件通知者
 */
interface GestiEventNotification {
  wheel(key: string, e: WheelEvent): void;
  down(key: string, e: EventParams): void;
  up(key: string, e: EventParams): void;
  move(key: string, e: EventParams): void;
}

/**
 * 可被事件监听对象
 */
abstract class SimpleGestiEventObject implements GestiEvent {
  onDown: EventCallbackFunction;
  onUp: EventCallbackFunction;
  onMove: EventCallbackFunction;
  onWheel(e: WheelEvent): void {
    throw new Error("Method not implemented.");
  }
}

/**
 * 管理全局的鼠标事件监听
 */
abstract class GestiEventManager implements GestiEventNotification {
  /**
   * 委托存放全局event对象栈
   */
  private readonly eventsStacks: Record<string, Array<SimpleGestiEventObject>> =
    {};
  /**
   * 将事件注册进委托栈
   * @param key
   * @param object
   */
  public register(key: string, object: SimpleGestiEventObject): void {
    const stack = this.eventsStacks[key];
    if (!stack) {
      this.eventsStacks[key] = new Array<SimpleGestiEventObject>();
      this.eventsStacks[key].push(object);
    }
  }
  protected notify(
    key: string,
    type: keyof GestiEvent,
    event: EventParams,
    wheelEvent?: WheelEvent
  ) {
    const stack = this.eventsStacks[key];
    if (!stack) return;
    stack.forEach((_, ndx) => {
      if (type === "onDown") {
        _.onDown(event);
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
    });
  }
  wheel(key: string, e: WheelEvent): void {
    this.notify(key, "onWheel", null, e);
  }
  down(key: string, e: EventParams): void {
    this.notify(key, "onDown", e);
  }
  up(key: string, e: EventParams): void {
    this.notify(key, "onUp", e);
  }
  move(key: string, e: EventParams): void {
    this.notify(key, "onMove", e);
  }
}

class SimpleGestiEventManager extends GestiEventManager {
  private static instance: GestiEventManager;
  constructor() {
    super();
    if (!SimpleGestiEventManager.instance) {
      SimpleGestiEventManager.instance = new SimpleGestiEventManager();
    }
    return SimpleGestiEventManager.instance;
  }
}

const gestiEventManager: SimpleGestiEventManager =
  new SimpleGestiEventManager();

export default gestiEventManager;
