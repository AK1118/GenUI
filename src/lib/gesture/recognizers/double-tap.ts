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
const doubleTapMinTime: Duration = new Duration({ milliseconds: 300 });

export interface DoubleTapGestureRecognizerArguments {
  onDoubleTap: VoidFunction;
}

class DoubleTapGestureRecognizer
  extends OnePointerGestureRecognizer
  implements DoubleTapGestureRecognizerArguments
{
  onDoubleTap: VoidFunction;
  private doubleTapTimer: any;
  private _firstTap: DownPointerEvent;
  private doubleTapTimeOut: boolean = false;
  protected addAllowedPointer(event: DownPointerEvent): void {
    this.startTrack(event);
  }
  get firstTap(): DownPointerEvent {
    return this._firstTap;
  }
  set firstTap(value: DownPointerEvent) {
    this._firstTap = value;
  }
  private startTrack(event: DownPointerEvent) {
    this.stopDoubleTimer();
    super.addAllowedPointer(event);
  }

  private registerSecondaryTap(event: DownPointerEvent) {
    this.resolve(GestureDisposition.accepted);
    this.reset();
  }
  private registerFirstTap(event: DownPointerEvent) {
    GestureBinding.instance.gestureArena.hold(event.pointer);
    this.firstTap = event;
    this.startDoubleTimer();
  }
  private startDoubleTimer() {
    this.doubleTapTimer = setTimeout(() => {
      this.reset();
      this.doubleTapTimeOut=true;
      this.doubleTapTimer = null;
    }, doubleTapMinTime.value);
  }
  private stopDoubleTimer() {
    clearTimeout(this.doubleTapTimer);
  }
  isAllowedPointer(): boolean {
    return !!this.onDoubleTap;
  }
  stopTimer() {
    clearTimeout(this.doubleTapTimer);
  }

  handleEvent(event: PointerEvent): void {
    if (event instanceof UpPointerEvent) {
      if (!this.firstTap) {
        this.registerFirstTap(event);
      } else {
        this.registerSecondaryTap(event);
      }
    }
    if(event instanceof MovePointerEvent||event instanceof CancelPointerEvent){
      this.reject();
      this.reset();
    }
  }
  private reject() {
    this.resolve(GestureDisposition.rejected);
  }
  private reset() {
    this.stopDoubleTimer();
    if (this.firstTap) {
      this.reject();
      GestureBinding.instance.gestureArena.release(this.firstTap.pointer);
      this.firstTap = null;
      this.doubleTapTimer = null;
      this.doubleTapTimeOut = false;
    }
  }
  acceptGesture(pointer: number): void {
    this.stopTimer();
    this.checkDoubleTap();
    this.reset();
    super.acceptGesture(pointer);
  }
  private checkDoubleTap() {
    if (this.onDoubleTap) {
      this.invokeCallback("onDoubleTap", this.onDoubleTap);
    }
  }
  // rejectGesture(pointer: number): void {
  //   // this.stopTimer();
  //   super.rejectGesture(pointer);
  // }
}

export default DoubleTapGestureRecognizer;
