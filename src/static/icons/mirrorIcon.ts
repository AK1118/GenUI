import IconBase from "@/core/lib/icon";
import { IconNames } from "@/types/gesti";

class MirrorIcon extends IconBase {
  name: IconNames="mirrorIcon";
  private finalData: number[][][];
  get data(): number[][][] {
    if (!this.finalData) {
      this.finalData = [
        [
          [10, 10],
          [0, 20],
          [10, 30],
        ],
        [
          [10, 10],
          [0, 20],
          [10, 30],
        ],
        [
          [30, 10],
          [40, 20],
          [30, 30],
        ],
        [
          [17, 5],
          [23, 5],
          [23, 35],
          [17, 35],
        ],
      ];
    }

    return this.finalData;
  }
}

export default MirrorIcon;
