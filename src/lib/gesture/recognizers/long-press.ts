import { Duration } from "@/lib/core/duration";
import {
  CancelPointerEvent,
  DownPointerEvent,
  MovePointerEvent,
  PointerEvent,
  UpPointerEvent,
} from "../events";
import {
  OnePointerGestureRecognizer,
  PrimaryPointerTapGestureRecognizer,
} from "./gesture-recognizer";
import { GestureDisposition } from "../arena-manager";

export interface LongPressGestureRecognizerArguments {
  onLongPressStart: (event: UpPointerEvent) => void;
  onLongPressEnd: (event: UpPointerEvent) => void;
  onLongPressUpdate: (event: UpPointerEvent) => void;
  onLongPress: () => void;
}

class LongPressGestureRecognizer
  extends PrimaryPointerTapGestureRecognizer
  implements LongPressGestureRecognizerArguments
{
  constructor(
    args?: Partial<
      LongPressGestureRecognizerArguments & {
        pressDuration: Duration;
      }
    >
  ) {
    super();
    if (args) {
      this.deadline = args?.pressDuration ?? this.deadline;
    }
  }
  onLongPressUpdate: (event: UpPointerEvent) => void;
  onLongPress: () => void;
  onLongPressStart: (event: UpPointerEvent) => void;
  onLongPressEnd: (event: UpPointerEvent) => void;
  protected deadline: Duration = new Duration({ milliseconds: 300 });
  private isAccepted = false;
  private startEvent:DownPointerEvent;
  handlePrimaryPointerDown(event: PointerEvent): void {}
  protected didExceedDeadline(): void {
    this.resolve(GestureDisposition.accepted);
    this.isAccepted = true;
    this.handleLongPressStart(this.startEvent);
  }
  handleEvent(event: PointerEvent): void {
    if (event instanceof DownPointerEvent && this.isAccepted) {
      this.startEvent=event;
    } else if (event instanceof MovePointerEvent && this.isAccepted) {
      this.handleLongPressUpdate(event);
    } else if (event instanceof UpPointerEvent && this.isAccepted) {
      this.handleLongPressEnd(event);
      this.resolve(GestureDisposition.rejected);
      this.reset();
    }
    if (event instanceof CancelPointerEvent) {
      this.resolve(GestureDisposition.rejected);
    }
  }
  acceptGesture(pointer: number): void {
    super.acceptGesture(pointer);
    this.handleLongPress();
  }
  private handleLongPressUpdate(event: MovePointerEvent): void {
    this.invokeCallback("onLongPressUpdate", () => {
      this.onLongPressUpdate(event);
    });
  }
  private handleLongPressEnd(event: UpPointerEvent): void {
    this.invokeCallback("onLongPressEnd", () => {
      this.onLongPressEnd(event);
    });
  }

  private handleLongPressStart(event: DownPointerEvent): void {
    this.invokeCallback("onLongPressStart", () => {
      this.onLongPressStart(event);
    });
  }
  private handleLongPress(): void {
    this.invokeCallback("onLongPress", this.onLongPress);
  }
  isAllowedPointer(event: PointerEvent): boolean {
    return !!(
      this.onLongPress ||
      this.onLongPressStart ||
      this.onLongPressUpdate ||
      this.onLongPressEnd
    );
  }
  private reset() {
    this.isAccepted = false;
  }
}

export default LongPressGestureRecognizer;
