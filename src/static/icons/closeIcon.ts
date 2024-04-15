import IconBase from "@/core/lib/icon";
import { IconNames } from "@/types/gesti";

class CloseIcon extends IconBase {
  name: IconNames="closeIcon";
  get isFill(): boolean {
    return false;
  }
  get data(): number[][][] {
    return [
      [
        [5, 5],
        [35, 35],
      ],
      [
        [35, 5],
        [5, 35],
      ],
    ];
  }
}
export default CloseIcon;
