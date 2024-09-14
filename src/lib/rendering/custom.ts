import { Size } from "../basic/rect";
import { ChangeNotifier } from "../core/change-notifier";
import Painter from "../painting/painter";
import { Queue } from "../utils/utils";

export abstract class CustomPainter extends ChangeNotifier {
  abstract render(painter: Painter, size: Size): void;
}




export abstract class CustomClipper{
  abstract getClip(size:Size):Path2D;
}

