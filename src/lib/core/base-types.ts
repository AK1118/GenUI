import Color from "../painting/color";

export enum Axis {
  horizontal = "horizontal",
  vertical = "vertical",
}

export enum Clip {
  none = "none",
  //使用硬边裁剪
  hardEdge = "hardEdge",
  //使用抗锯齿裁剪
  antiAlias = "antiAlias",
}
export enum MainAxisAlignment {
  start = "start",
  end = "end",
  center = "center",
  spaceBetween = "spaceBetween",
  spaceAround = "spaceAround",
  spaceEvenly = "spaceEvenly",
}

export enum CrossAxisAlignment {
  start = "start",
  end = "end",
  center = "center",
  stretch = "stretch",
  baseline = "baseline",
}

export enum StackFit {
  /**
   * 这表示 Stack 组件会放宽传递给它的约束。换句话说，非定位子组件可以根据自己的需要在 Stack 区域内自由调整大小。举个例子，如果 Stack 的约束要求它的大小是 350x600，那么非定位子组件可以在宽度和高度上都在 0 到 350 和 0 到 600 的范围内调整
   */
  loose = "loose",
  /**
   * 这表示 Stack 组件会将传递给它的约束放大到允许的最大尺寸。举个例子，如果 Stack 的约束是宽度在 10 到 100 的范围内，高度在 0 到 600 的范围内，那么非定位子组件都会被调整为 100 像素宽和 600 像素高。
   */
  expand = "expand",
  /**
   * 这表示 Stack 组件会将从父组件传递给它的约束不加修改地传递给非定位子组件。举个例子，如果一个 Stack 作为 Row 的 Expanded 子组件，那么水平约束会是紧密的，而垂直约束会是松散的。
   */
  passthrough = "passthrough",
}

export enum TextDirection {
  /// The text flows from right to left (e.g. Arabic, Hebrew).
  rtl = "rtl",
  /// The text flows from left to right (e.g., English, French).
  ltr = "ltr",
}
export enum WrapAlignment {
  start = "start",
  end = "end",
  center = "center",
  spaceBetween = "spaceBetween",
  spaceAround = "spaceAround",
  spaceEvenly = "spaceEvenly",
}
export enum WrapCrossAlignment {
  start = "start",
  end = "end",
  center = "center",
}


export enum AxisDirection {
    up = "up",
    down = "down",
    left = "left",
    right = "right",
  }
  
  export enum GrowthDirection {
    forward = "forward",
    reverse = "reverse",
  }
  
  export enum ScrollDirection {
    idle = "idle",
    forward = "forward",
    reverse = "reverse",
  }

export interface Shadow {
  shadowColor?: Color;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export type Radius = number | Iterable<number>;