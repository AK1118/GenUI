import { Duration } from "@/lib/core/duration";
import {
  CancelPointerEvent,
  DownPointerEvent,
  G_postAcceptSlopTolerance,
  MovePointerEvent,
  PointerEvent,
  UpPointerEvent,
} from "../events";
import {
  GestureRecognizer,
  OnePointerGestureRecognizer,
} from "./gesture-recognizer";
import { GestureDisposition } from "../arena-manager";
import { GestureBinding } from "../binding";
const doubleTapMinTime: Duration = new Duration({ milliseconds:200 });

export interface DoubleTapGestureRecognizerArguments {
  onDoubleTap: VoidFunction;
}

class DoubleTapGestureRecognizer
  extends OnePointerGestureRecognizer
  implements DoubleTapGestureRecognizerArguments
{
  onDoubleTap: VoidFunction;
  private doubleTapTimer: any;
  private firstTap: DownPointerEvent;
  private firstTaped: boolean = false;
  private doubleTapTimeOut: boolean = false;
  protected addAllowedPointer(event: DownPointerEvent): void {
    super.addAllowedPointer(event);
    if (!this.doubleTapTimer) {
      this.firstTap = event;
      this.doubleTapTimer = setTimeout(() => {
        this.reject();
        GestureBinding.instance.gestureArena.release(event.pointer);
        this.doubleTapTimeOut = true;
        this.reset();
      }, doubleTapMinTime.value);
    }
    else if(this.firstTaped&&!this.doubleTapTimeOut){
        this.resolve(GestureDisposition.accepted);
        GestureBinding.instance.gestureArena.release(event.pointer);
        this.reset();
    }
  }
  isAllowedPointer(): boolean {
    return !!this.onDoubleTap;
  }
  stopTimer() {
    clearTimeout(this.doubleTapTimer);
  }

  handleEvent(event: PointerEvent): void {
    if (event instanceof UpPointerEvent) {
      if (this.firstTap && !this.firstTaped) {
        GestureBinding.instance.gestureArena.hold(event.pointer);
        this.firstTaped = true;
      } else if (this.firstTaped && !this.doubleTapTimeOut) {
        const distance = this.firstTap.position.dist(event.position);
        if (distance < G_postAcceptSlopTolerance) {
          this.resolve(GestureDisposition.accepted);
          GestureBinding.instance.gestureArena.release(event.pointer);
          this.reset();
        }
      } 
    }
    if (
      event instanceof CancelPointerEvent ||
      event instanceof MovePointerEvent
    ) {
      this.reject();
      GestureBinding.instance.gestureArena.release(event.pointer);
      this.reset();
    }
  }
  private reject(){
    this.resolve(GestureDisposition.rejected);
    
  }
  private reset() {
    this.firstTap = null;
    this.doubleTapTimer = null;
    this.doubleTapTimeOut = false;
    this.firstTaped = false;
  }
  acceptGesture(pointer: number): void {
    this.stopTimer();
    this.invokeCallback("onDoubleTap", this.onDoubleTap);
  }
  rejectGesture(pointer: number): void {
    this.stopTimer();
  }
}

export default DoubleTapGestureRecognizer;
