import { GestureDisposition } from "../arena-manager";
import {
  CancelPointerEvent,
  DownPointerEvent,
  PointerEvent,
  UpPointerEvent,
} from "../events";
import { PrimaryPointerTapGestureRecognizer } from "./gesture-recognizer";

export interface TapGestureRecognizerArguments {
  onTap: VoidFunction;
  onTapDown: VoidFunction;
  onTapUp: VoidFunction;
  onTapCancel: VoidFunction;
}

/**
 * deadline结束后会调用onTapDown函数，但在其他识别器介入竞争时，可能会出现rejectGesture，这时候deadline不会触发，
 * 当被默认acceptGesture时，会调用onTapDown,或者另外的onTap,onTapUp
 */
export default class TapGestureRecognizer
  extends PrimaryPointerTapGestureRecognizer
  implements TapGestureRecognizerArguments
{
  onTapCancel: VoidFunction;
  onTap: VoidFunction;
  onTapDown: VoidFunction;
  onTapUp: VoidFunction;
  private sentDown: boolean = false;
  private up: UpPointerEvent;
  protected addAllowedPointer(event: DownPointerEvent): void {
    this.reset();
    super.addAllowedPointer(event);
  }
  isAllowedPointer(): boolean {
    return !!(this.onTap||this.onTapDown||this.onTapUp||this.onTapCancel);
  }
  handlePrimaryPointerDown(event: PointerEvent): void {
    if (event instanceof UpPointerEvent) {
      this.up = event;
      this.checkUp();
    } else if (event instanceof CancelPointerEvent) {
      this.resolve(GestureDisposition.rejected);
      if (this.sentDown) {
        this.checkCancel();
        this.reset();
      }
    }
  }
  handleEventDown() {
    this.sentDown = true;
    this.invokeCallback("onTapDown", this.onTapDown);
  }
  acceptGesture(pointer: number): void {
    super.acceptGesture(pointer);
    this.checkDown();
    this.checkUp();
  }
  private checkDown() {
    if (this.sentDown) return;
    this.invokeCallback("onTapDown", this.onTapDown);
    this.sentDown = true;
  }
  private checkCancel() {
    this.invokeCallback("onTapCancel", this.onTapCancel);
  }
  private checkUp() {
    if (!this.sentDown || !this.up) return;
    this.invokeCallback("onTapUp", this.onTapUp);
    this.invokeCallback("onTap", this.onTap);
    this.reset();
  }
  private reset() {
    this.sentDown = false;
    this.up = null;
  }
  rejectGesture(pointer: number): void {
    super.rejectGesture(pointer);
    if (this.sentDown) {
      this.invokeCallback("onTapCancel", this.onTapCancel);
      this.reset();
    }
  }
}
