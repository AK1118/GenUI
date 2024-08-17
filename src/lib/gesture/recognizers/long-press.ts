import { Duration } from "@/lib/core/duration";
import { CancelPointerEvent, DownPointerEvent, MovePointerEvent, PointerEvent, UpPointerEvent } from "../events";
import {
  OnePointerGestureRecognizer,
  PrimaryPointerTapGestureRecognizer,
} from "./gesture-recognizer";
import { GestureDisposition } from "../arena-manager";

export interface LongPressGestureRecognizerArguments {
  //   onLongPressStart: VoidFunction
  //   onLongPressEnd:VoidFunction
  onLongPress: VoidFunction;
}

class LongPressGestureRecognizer
  extends PrimaryPointerTapGestureRecognizer
  implements LongPressGestureRecognizerArguments
{
  protected deadline: Duration = new Duration({ milliseconds: 300 });
  handlePrimaryPointerDown(event: PointerEvent): void {}
  protected didExceedDeadline(): void {
    this.resolve(GestureDisposition.accepted);
  }
  handleEvent(event: PointerEvent): void {
      if(event instanceof UpPointerEvent||event instanceof CancelPointerEvent||event instanceof MovePointerEvent){
        this.resolve(GestureDisposition.rejected);
      }
  }
  acceptGesture(pointer: number): void {
      super.acceptGesture(pointer);
      this.handleLongPress();
  }
  
  private handleLongPress(): void {
    this.invokeCallback("onLongPress",this.onLongPress);
  }
  isAllowedPointer(): boolean {
    return !!this.onLongPress;
  }
  onLongPress: VoidFunction;
}

export default LongPressGestureRecognizer;
