import { Size } from "../basic/rect";
import { ChangeNotifier, Listenable } from "../core/change-notifier";
import Vector from "../math/vector";
import Painter from "../painting/painter";
import { Queue } from "../utils/utils";
import { Path2D } from "./path-2D";

export abstract class CustomPainter extends ChangeNotifier {
  abstract render(painter: Painter, size: Size): void;
}

export abstract class CustomClipper implements Listenable {
  private reClip: Listenable;
  constructor(reClip?: Listenable) {
    this.reClip = reClip;
  }
  addListener(listener: VoidFunction): void {
    this.reClip?.addListener(listener);
  }
  removeListener(listener: VoidFunction): void {
    this.reClip?.removeListener(listener);
  }
  abstract getClip(offset:Vector,size: Size): Path2D;
}
