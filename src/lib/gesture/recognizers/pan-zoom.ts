import Vector from "@/lib/math/vector";
import { GestureDisposition } from "../arena-manager";
import {
  PanZoomEndPointerEvent,
  PanZoomPointerEvent,
  PanZoomStartPointerEvent,
  PanZoomUpdatePointerEvent,
  PointerEvent,
} from "../events";
import { OnePointerGestureRecognizer } from "./gesture-recognizer";


export interface PanZoomGestureRecognizerArguments {
  onPanZoomStart?: (event: PanZoomStartPointerEvent) => void;
  onPanZoomUpdate?: (event: PanZoomUpdatePointerEvent) => void;
  onPanZoomEnd?: (event: PanZoomEndPointerEvent) => void;
}

export class PanZoomGestureRecognizer
  extends OnePointerGestureRecognizer
  implements PanZoomGestureRecognizerArguments
{
  onPanZoomEnd?: (event: PanZoomEndPointerEvent) => void;
  onPanZoomStart?: (event: PanZoomStartPointerEvent) => void;
  onPanZoomUpdate?: (event: PanZoomUpdatePointerEvent) => void;

  private _startDistance = 0;
  private _preAngle = 0;
  private _preScale = 1;

  handleEvent(event: PointerEvent): void {
    if (!(event instanceof PanZoomPointerEvent)) return;

    if (event instanceof PanZoomStartPointerEvent) {
      this.handlePanZoomStart(event);
      this.resolve(GestureDisposition.accepted);
    } else if (event instanceof PanZoomUpdatePointerEvent) {
      this.handlePanZoomUpdate(event as PanZoomUpdatePointerEvent);
    } else if (event instanceof PanZoomEndPointerEvent) {
      this.handlePanZoomEnd(event);
    }
  }

  private handlePanZoomStart(event: PanZoomStartPointerEvent): void {
    this._startDistance = this.computeDistance(event);
    this._preAngle = this.computeRotationAngle(event);
    this._preScale = 1; // 初始缩放为1
    this.invokeCallback("onPanZoomStart", () => {
      this.onPanZoomStart?.(event);
    });
  }

  private handlePanZoomUpdate(event: PanZoomUpdatePointerEvent): void {
    const currentDistance = this.computeDistance(event);
    const currentScale = currentDistance / this._startDistance;
    const currentAngle = this.computeRotationAngle(event);

    // 计算增量
    event.scale = currentScale;
    event.rotationAngle = currentAngle;
    event.deltaScale = currentScale - this._preScale;
    event.deltaRotationAngle = currentAngle - this._preAngle;

    // 缓存更新
    this._preScale = currentScale;
    this._preAngle = currentAngle;

    this.invokeCallback("onPanZoomUpdate", () => {
      this.onPanZoomUpdate?.(event);
    });
  }

  private handlePanZoomEnd(event: PanZoomEndPointerEvent): void {
    // 清空所有缓存状态
    this._startDistance = 0;
    this._preScale = 1;
    this._preAngle = 0;

    this.invokeCallback("onPanZoomEnd", () => {
      this.onPanZoomEnd?.(event);
    });
  }

  private computeRotationAngle(event: PanZoomPointerEvent): number {
    const p1 = event.pointers[0].pointer.toVector();
    const p2 = event.pointers[1].pointer.toVector();
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  private computeDistance(event: PanZoomPointerEvent): number {
    const p1 = event.pointers[0].pointer.toVector();
    const p2 = event.pointers[1].pointer.toVector();
    return Vector.dist(p1, p2);
  }

  isAllowedPointer(event: PointerEvent): boolean {
    return !!(this.onPanZoomEnd || this.onPanZoomStart || this.onPanZoomUpdate);
  }
}
