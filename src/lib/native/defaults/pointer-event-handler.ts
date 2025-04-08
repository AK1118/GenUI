import { Offset } from "@/lib/math/vector";
import { EventListenType, GenPointerEvent, GenUnifiedPointerEvent, NativeEventsBindingHandler } from "../events";

/**
 * # 默认浏览器事件绑定处理器
 */
export default class DefaultBrowserNativeEventsBindingHandler extends NativeEventsBindingHandler {
  protected adapter(type: EventListenType, data: TouchEvent | MouseEvent) {
    if (data instanceof MouseEvent || data instanceof WheelEvent) {
      let delta = 0;
      if (data instanceof WheelEvent) {
        delta = data.deltaY || 0;
      }
      return new GenUnifiedPointerEvent({
        pointer: new GenPointerEvent({
          pointer: new Offset(data.clientX, data.clientY),
          identifier: 1,
        }),
        pointers: [],
        deltaY: delta
      });
    }
    const touches = type === "touchend" ? data.changedTouches : data.touches;
    return new GenUnifiedPointerEvent({
      pointer: new GenPointerEvent({
        pointer: Offset.zero,
        identifier: 1,
      }),
      pointers: Array.from(touches).map((_, ndx) => new GenPointerEvent({
        pointer: new Offset(_.clientX, _.clientY),
        identifier: ndx,
      })),
    });

  }

  protected performBindingHandler(): void {
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Touch events for mobile devices
      window.addEventListener("touchstart", (e) => {
        this.applyEvent("touchstart", e);
      });
      window.addEventListener("touchmove", (e) => {
        this.applyEvent("touchmove", e);
      });
      window.addEventListener("touchend", (e) => {
        this.applyEvent("touchend", e);
      });
      window.addEventListener("touchcancel", (e) => {
        this.applyEvent("touchcancel", e);
      });
    } else {
      window.addEventListener("mousedown", (e) => {
        this.applyEvent("mousedown", e);
      });
      window.addEventListener("mousemove", (e) => {
        this.applyEvent("mousemove", e);
      });
      window.addEventListener("mouseup", (e) => {
        this.applyEvent("mouseup", e);
      });
      window.addEventListener("mousedown", (e) => {
        this.applyEvent("mousedown", e);
      });
      window.addEventListener("wheel", (e) => {
        this.applyEvent("wheel", e);
      });
    }
  }
}