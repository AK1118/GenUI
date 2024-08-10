import { Duration } from "../core/duration";
import GestureArenaManager, { GestureArenaEntry, GestureArenaMember, GestureDisposition } from "./arena-manager";
import { DownPointerEvent, PointerEvent } from "./events";

type RecognizerCallback<T> = () => T;





abstract class GestureRecognizer extends GestureArenaMember {
  addPointer(event: DownPointerEvent) {}
  invokeCallback<T>(name: string, callback: RecognizerCallback<T>): T {
    let result: T = callback?.() as T;
    return result;
  }
  protected addAllowedPointer(event: DownPointerEvent) {}
}

/**
 * GestureArenaMember 以为参赛人员
 * 每一个手指都有可以是GestureArenaEntry 对象，GestureArenaEntry  意为参赛身份人
 */
abstract class OnePointerGestureRecognizer extends GestureRecognizer {
  private entities: Map<number, GestureArenaEntry> = new Map<
    number,
    GestureArenaEntry
  >();
  abstract handleEvent(event: PointerEvent): void;
  protected addAllowedPointer(event: DownPointerEvent): void {
    super.addAllowedPointer(event);
    this.entities[event.pointer] = this.addPointerToArena(event);
    this.handleEvent(event);
  }
  resolve(disposition: GestureDisposition): void {
    this.entities.forEach((entry) => {
      entry.resolve(disposition);
    });
  }

  private addPointerToArena(event: DownPointerEvent): GestureArenaEntry {
    let entry: GestureArenaEntry;
    return entry;
  }
  acceptGesture(pointer: number): void {}
  rejectGesture(pointer: number): void {}
}

abstract class PrimaryPointerTapGestureRecognizer extends OnePointerGestureRecognizer {
  protected deadline: Duration = new Duration({
    millisecond: 100,
  });
  protected timer: any;
  handleEvent(event: PointerEvent): void {
    this.handlePrimaryPointerDown(event);
  }
  handlePrimaryPointerDown(event: PointerEvent): void {}
}

class TapGestureRecognizer extends PrimaryPointerTapGestureRecognizer {
  handleEvent(event: PointerEvent): void {
    super.handleEvent(event);
  }
}
