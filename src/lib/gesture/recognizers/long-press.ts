import { Duration } from "@/lib/core/duration";
import { DownPointerEvent, PointerEvent, UpPointerEvent } from "../events";
import { OnePointerGestureRecognizer, PrimaryPointerTapGestureRecognizer } from "./gesture-recognizer";
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
  protected deadline: Duration=new Duration({milliseconds: 300,});
  handlePrimaryPointerDown(event: PointerEvent): void {
    
  }
  protected didExceedDeadline(): void {
      console.log("didExceedDeadline")
  }
  isAllowedPointer(): boolean {
    return !!(this.onLongPress);
  }
  onLongPress: VoidFunction;
}

export default LongPressGestureRecognizer;
