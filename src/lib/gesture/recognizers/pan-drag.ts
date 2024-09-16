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
  onPanStart: (event: PanZoomStartPointerEvent) => void;
  onPanUpdate: (event: PanZoomUpdatePointerEvent) => void;
  onPanEnd: (event: PanZoomEndPointerEvent) => void;
}

class PanDragGestureRecognizer
  extends OnePointerGestureRecognizer
  implements PanDragGestureRecognizerArguments
{
  onPanStart: (event: PanZoomStartPointerEvent) => void;
  onPanUpdate: (event: PanZoomUpdatePointerEvent) => void;
  onPanEnd: (event: PanZoomEndPointerEvent) => void;
  private startEvent: PanZoomStartPointerEvent;
  private moved: boolean = false;
  isAllowedPointer(event: DownPointerEvent): boolean {
    return !!(this.onPanEnd || this.onPanStart || this.onPanUpdate);
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
        this.resolve(GestureDisposition.rejected);
        this.handlePanDragEnd(event);
        this.reset();
        this.stopTrackingPointer(event.pointer);
    }
  }

  private reset() {
    this.startEvent = null;
    this.moved = false;
  }


  private handlePanDragEnd(event: PanZoomEndPointerEvent): void {
    this.invokeCallback("onPanEnd", () => {
      this.onPanEnd?.(event);
    });
  }

  private handlePanDragStart(event: PanZoomStartPointerEvent): void {
    this.invokeCallback("onPanStart", () => {
      this.onPanStart?.(event);
    });
  }

  private handlePanDragUpdate(event: PanZoomUpdatePointerEvent): void {
    this.invokeCallback("onPanUpdate", () => {
      this.onPanUpdate?.(event);
    });
  }
}

export default PanDragGestureRecognizer;
