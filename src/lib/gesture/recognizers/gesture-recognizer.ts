import { Duration } from "../../core/duration";
import { getRandomStrKey } from "../../utils/utils";
import GestureArenaManager, {
  GestureArenaEntry,
  GestureArenaMember,
  GestureDisposition,
} from "../arena-manager";
import { GestureBinding } from "../binding";
import {
  CancelPointerEvent,
  DownPointerEvent,
  PointerEvent,
  UpPointerEvent,
} from "../events";

type RecognizerCallback<T> = () => T;

export class GestureRecognizerFactory<T> {
  public _constructor: () => T;
  public _initializer: (instance: T) => void;
  constructor(_constructor: () => T, initializer: (instance: T) => void) {
    this._constructor = _constructor;
    this._initializer = initializer;
  }
}

export abstract class GestureRecognizer extends GestureArenaMember {
  addPointer(event: DownPointerEvent) {
    if (this.isAllowedPointer()) {
      this.addAllowedPointer(event);
    }
  }
  abstract isAllowedPointer(): boolean;
  protected addAllowedPointer(event: DownPointerEvent) {}
  protected invokeCallback<T>(
    name: string,
    callback: RecognizerCallback<T>
  ): T {
    let result: T = callback?.() as T;
    return result;
  }
}

/**
 * GestureArenaMember 为参赛人员
 * GestureArenaEntry  入场券
 */
export abstract class OnePointerGestureRecognizer extends GestureRecognizer {
  constructor() {
    super();
    this.handleEventBind = this.handleEvent.bind(this);
  }
  protected handleEventBind: (event: PointerEvent) => void;
  private entities: Map<number, GestureArenaEntry> = new Map<
    number,
    GestureArenaEntry
  >();
  abstract handleEvent(event: PointerEvent): void;
  protected addAllowedPointer(event: DownPointerEvent): void {
    super.addAllowedPointer(event);
    this.entities.set(event.pointer, this.addPointerToArena(event));
    this.startTrackingPointer(event.pointer);
  }
  /**
   * 启用指针追踪，根据 @pointer 将自身添加到 @GestureBinding.instance.pointerRouter 中
   * 当 @GestureBinding.handleEvent 接收到 @pointer 时，将调用 @this.handleEvent
   * 即被route的 @this.handleEvent
   */
  protected startTrackingPointer(pointer: number): void {
    GestureBinding.instance.pointerRouter.addRoute(
      pointer,
      this.handleEventBind
    );
  }
  protected stopTrackingPointer(pointer: number): void {
    GestureBinding.instance.pointerRouter.removeRoute(
      pointer,
      this.handleEventBind
    );
  }
  protected resolve(disposition: GestureDisposition): void {
    for (let entry of this.entities.values()) {
      entry.resolve(disposition);
    }
  }

  private addPointerToArena(event: DownPointerEvent): GestureArenaEntry {
    const entry = GestureBinding.instance.gestureArena.add(event.pointer, this);
    return entry;
  }
  acceptGesture(pointer: number): void {}
  rejectGesture(pointer: number): void {}
}

export abstract class PrimaryPointerTapGestureRecognizer extends OnePointerGestureRecognizer {
  protected deadline: Duration;
  protected timer: any;
  constructor(deadline?: Duration) {
    super();
    this.deadline = deadline;
  }
  protected addAllowedPointer(event: DownPointerEvent): void {
    if (this.deadline) {
      this.timer = setTimeout(() => {
        if(!this.timer)return;
        this.didExceedDeadlineWithEvent(event);
      }, this.deadline.value);
    }
    super.addAllowedPointer(event);
  }
  protected didExceedDeadlineWithEvent(event: PointerEvent) {
    this.didExceedDeadline();
  }
  protected didExceedDeadline() {
    this.deadline = null;
  }
  handleEvent(event: PointerEvent): void {
    this.handlePrimaryPointerDown(event);
  }
  private stopTimer() {
    clearTimeout(this.timer);
    this.timer=null;
  }
  rejectGesture(pointer: number): void {
    this.stopTimer();
  }
  acceptGesture(pointer: number): void {
    this.stopTimer();
  }
  abstract handlePrimaryPointerDown(event: PointerEvent): void;
}
