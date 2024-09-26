import { Shadow } from "../core/base-types";
import Painter from "./painter";

class BoxShadow {
  shadow: Shadow;
  constructor(shadow: Shadow) {
    this.shadow = shadow;
  }
  paint(paint: Painter) {
    paint.setShadow(this.shadow);
  }
}

export default BoxShadow;
