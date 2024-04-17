import IconBase from "@/core/lib/icon";
import { IconNames } from "@/types/gesti";

class ScaleIcon extends IconBase{
    name: IconNames="scaleIcon";
    get data(): number[][][] {
        return [
            [[5,5],[25,5],[5,25]],[[35,35],[10,35],[35,10]]
        ];
    }
}
export default ScaleIcon;