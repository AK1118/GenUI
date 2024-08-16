import { BindingBase } from "../basic/framework";
import Vector from "../math/vector";
import { Queue } from "../utils/utils";
import GestureArenaManager from "./arena-manager";
import {
  DownPointerEvent,
  GenPointerData,
  PointerEvent,
  PointerEventConverter,
  PointerEventHandler,
  PointerRouter,
  UpPointerEvent,
} from "./events";
import { HitTestEntry, HitTestResult, HitTestTarget } from "./hit_test";

export class GestureBinding extends BindingBase implements HitTestTarget {
  public static instance: GestureBinding;
  private pointerEventHandler: PointerEventHandler;
  private hitTestPointer: Map<number, HitTestResult> = new Map();
  private pointerEvents: Queue<PointerEvent> = new Queue();

  protected initInstance(): void {
    GestureBinding.instance = this;
    this.pointerEventHandler = new PointerEventHandler(
      this.handlePointerData.bind(this)
    );
  }
  public gestureArena: GestureArenaManager = new GestureArenaManager();
  public pointerRouter: PointerRouter = new PointerRouter();
  /**
   * 将输入事件转换为 @PointerEvent
   */
  public handlePointerData(data: GenPointerData): PointerEvent {
    const pointerEvent = PointerEventConverter.expand(data);
    if (pointerEvent) {
      this.pointerEvents.addFirst(pointerEvent);
    }
    this.flushPointerEvents();
    return pointerEvent;
  }

  private flushPointerEvents() {
    while (!this.pointerEvents.isEmpty) {
      const pointerEvent = this.pointerEvents.removeFirst();
      this.handlePointerEvent(pointerEvent);
    }
  }
  private handlePointerEvent(event: PointerEvent) {
    this.performPointerEventHandle(event);
  }
  private performPointerEventHandle(event: PointerEvent) {
    let hisTestResult: HitTestResult = new HitTestResult();
    this.hitTest(hisTestResult, event.position);
    if (event instanceof DownPointerEvent) {
      this.hitTestPointer.set(event.pointer, hisTestResult);
    } else if (event instanceof UpPointerEvent) {
      hisTestResult = this.hitTestPointer.get(event.pointer);
      this.hitTestPointer.delete(event.pointer);
    } else {
      hisTestResult = this.hitTestPointer.get(event.pointer);
    }
    if (!hisTestResult) return;
    for (let entry of hisTestResult.path) {
      entry.target.handleEvent(event, entry);
    }
  }
  handleEvent(event: PointerEvent, entry: HitTestEntry): void {
    this.pointerRouter.route(event);
    if(event instanceof DownPointerEvent) {
      this.gestureArena.close(event.pointer);
    }else if(event instanceof UpPointerEvent) {
      this.gestureArena.sweep(event.pointer);
    }
  }
  protected hitTest(result: HitTestResult, position: Vector) {
    result.add(new HitTestEntry(this));
  }
}
