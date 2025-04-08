import { GestureDisposition } from "../arena-manager";
import {
  DownPointerEvent,
  MovePointerEvent,
  PanZoomEndPointerEvent,
  PanZoomStartPointerEvent,
  PanZoomUpdatePointerEvent,
  PointerEvent,
  UpPointerEvent,
} from "../events";
import { OnePointerGestureRecognizer } from "./gesture-recognizer";

export interface PanDragGestureRecognizerArguments {
  onDragStart: (event: DownPointerEvent) => void;
  onDragUpdate: (event: MovePointerEvent) => void;
  onDragEnd: (event: UpPointerEvent) => void;
}

class PanDragGestureRecognizer
  extends OnePointerGestureRecognizer
  implements PanDragGestureRecognizerArguments {
  onDragStart: (event: DownPointerEvent) => void;
  onDragUpdate: (event: MovePointerEvent) => void;
  onDragEnd: (event: UpPointerEvent) => void;
 
  private startEvent: PanZoomStartPointerEvent;
  private moved: boolean = false;
  isAllowedPointer(event: DownPointerEvent): boolean {
    return !!(this.onDragStart || this.onDragUpdate || this.onDragEnd);
  }
  handleEvent(event: PointerEvent): void {
    if (event instanceof DownPointerEvent) {
      this.startEvent = event;
    }
    if (event instanceof MovePointerEvent) {
      if (this.startEvent && !this.moved) {
        this.resolve(GestureDisposition.accepted);
        this.handlePanDragStart(this.startEvent);
        this.moved = true;
      } else {
        this.handlePanDragUpdate(event);
      }
    }
    if (event instanceof UpPointerEvent && this.moved && this.startEvent) {
      super.resolve(GestureDisposition.rejected);
      this.handlePanDragEnd(event);
      this.reset();
      this.stopTrackingPointer(event.pointer);
    }
  }
  rejectGesture(pointer: number): void {
    super.rejectGesture(pointer);
    this.reset();
  }

  private reset() {
    this.startEvent = null;
    this.moved = false;
  }


  private handlePanDragEnd(event: UpPointerEvent): void {
    this.invokeCallback("onPanEnd", () => {
      this.onDragEnd?.(event);
    });
  }

  private handlePanDragStart(event: DownPointerEvent): void {
    this.invokeCallback("onPanStart", () => {
      this.onDragStart?.(event);
    });
  }

  private handlePanDragUpdate(event: MovePointerEvent): void {
    this.invokeCallback("onPanUpdate", () => {
      this.onDragUpdate?.(event);
    });
  }

}

export default PanDragGestureRecognizer;
