import IconBase from "@/core/lib/icon";
import { IconNames } from "@/types/gesti";

class DeleteIcon extends IconBase{
    name: IconNames="deleteIcon";
    get data(): number[][][] {
        
        return [
    // 第一个部分
    [
        [15, 5],
        [25, 5],
        [25, 10],
        [15, 10]
    ],
    // 第二个部分
    [
        [5, 10],
        [35, 10],
        [35, 15],
        [5, 15]
    ],
    // 第三个部分
    [
        [8, 15],
        [32, 15],
        [30, 38],
        [10, 38]
    ]
];
    }
    
}

export default DeleteIcon;