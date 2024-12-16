import { Duration } from "@/lib/core/duration";
import { GestureDisposition } from "../arena-manager";
import {
  CancelPointerEvent,
  DownPointerEvent,
  PointerEvent,
  UpPointerEvent,
} from "../events";
import { PrimaryPointerTapGestureRecognizer } from "./gesture-recognizer";

export type EventCallback<T extends PointerEvent = PointerEvent> = (event: T) => void;

export interface TapGestureRecognizerArguments {
  onTap: EventCallback;
  onTapDown: EventCallback<DownPointerEvent>;
  onTapUp: EventCallback<UpPointerEvent>;
  onTapCancel:VoidFunction;
}

/**
 * deadline结束后会调用onTapDown函数，但在其他识别器介入竞争时，可能会出现rejectGesture，这时候deadline不会触发，
 * 当被默认acceptGesture时，会调用onTapDown,或者另外的onTap,onTapUp
 */
export default class TapGestureRecognizer
  extends PrimaryPointerTapGestureRecognizer
  implements TapGestureRecognizerArguments
{
  onTap: EventCallback;
  onTapDown: EventCallback<DownPointerEvent>;
  onTapUp: EventCallback<UpPointerEvent>;
  onTapCancel:VoidFunction;
  private sentDown: boolean = false;
  private up: UpPointerEvent;
  private down: DownPointerEvent;
  constructor() {
    super(
      new Duration({
        milliseconds: 180,
      })
    );
  }
  protected addAllowedPointer(event: DownPointerEvent): void {
    this.reset();
    super.addAllowedPointer(event);
  }
  isAllowedPointer(): boolean {
    return !!(this.onTap || this.onTapDown || this.onTapUp || this.onTapCancel);
  }
  handlePrimaryPointerDown(event: PointerEvent): void {
    if(event instanceof DownPointerEvent) {
      this.down = event;
    }
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
  protected didExceedDeadline(): void {
    this.checkDown();
  }
  handleEventDown() {
    this.sentDown = true;
    this.invokeCallback("onTapDown", () => {
      this.onTapDown?.(this.down);
    });
  }

  private checkDown() {
    if (this.sentDown||!this.down) return;
    this.invokeCallback("onTapDown", () => {
      this.onTapDown?.(this.down);
    });
    this.sentDown = true;
  }
  private checkCancel() {
    this.invokeCallback("onTapCancel", this.onTapCancel);
  }
  private checkUp() {
    if (!this.sentDown || !this.up) return;
    this.invokeCallback("onTapUp", ()=>{
      this.onTapUp?.(this.up);
    });
    this.invokeCallback("onTap", ()=>{
      this.onTap?.(this.down);
    });
    this.reset();
  }
  private reset() {
    this.sentDown = false;
    this.up = null;
    this.down = null;
  }
  acceptGesture(pointer: number): void {
    super.acceptGesture(pointer);
    this.checkDown();
    this.checkUp();
  }
  rejectGesture(pointer: number): void {
    super.rejectGesture(pointer);
    if (this.sentDown) {
      this.invokeCallback("onTapCancel", this.onTapCancel);
      this.reset();
    }
  }
}
