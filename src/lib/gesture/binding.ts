import { BindingBase } from "../basic/framework";
import Vector from "../math/vector";
import { Queue } from "../utils/utils";
import GestureArenaManager from "./arena-manager";
import {
  DownPointerEvent,
  GenPointerData,
  HoverPointerEvent,
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
    if (event instanceof DownPointerEvent||event instanceof HoverPointerEvent||event instanceof UpPointerEvent) {
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
  /**
   * @RendererBinding 派生自该类，该方法用于命中测试，@performPointerEventHandle 调用该方法时，会优先调用 @RendererBinding 的 hitTest 方法，
   * 此处的 @hitTest 方法为事件系统的根部，即，从 @RendererBinding.hitTest 开始, @GestureBinding.hitTest 结束。
   * 
   * 命中测试从根部 @PipelineOwner.renderView 开始，子根部向叶子节点递归，叶子节点在调用此方法后如果命中会将自己包裹为 @HitTestEntry 实体后加入命中结果中
   * 参考
   * ```
   * protected hitTest(result: HitTestResult, position: Vector) {
   *     result.add(new HitTestEntry(this));
   * }
   * 
   * ```
   */
  protected hitTest(result: HitTestResult, position: Vector) {
    result.add(new HitTestEntry(this));
  }
}
