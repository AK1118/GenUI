/**
 * BoxFit.fill: 图像将会拉伸以充满容器，可能会导致图像变形。
    BoxFit.contain: 图像将会缩放以适应容器，并保持图像的纵横比，不会变形，但可能会留有空白。
    BoxFit.cover: 图像将会缩放以填充容器，可能会裁剪图像以保持纵横比，使得图像充满容器，但可能会部分被裁剪。
    BoxFit.fitWidth: 图像将会缩放以适应容器的宽度，保持图像的纵横比，并且图像的宽度将完全填充容器的宽度，高度可能不会完全填充容器的高度。
    BoxFit.fitHeight: 图像将会缩放以适应容器的高度，保持图像的纵横比，并且图像的高度将完全填充容器的高度，宽度可能不会完全填充容器的宽度。
    BoxFit.none: 图像将不会缩放，而是在容器内居中显示，可能会溢出容器。
 */

import { Size } from "../rect";

enum BoxFit {
  /**
   * ## 将源图像拉伸以填充目标框，可能会扭曲源图像的宽高比。
   */
  fill,
  /**
   * ## 尽可能大地将源图像完全包含在目标框内。
   */
  contain,
  /**
   * ## 尽可能小地将源图像完全覆盖目标框。
   */
  cover,
  /**
   * ##  确保显示源的全宽度，不考虑是否导致源在垂直方向上溢出目标框。
   */
  fitWidth,
  /**
   * ## 确保显示源的全高度，不考虑是否导致源在水平方向上溢出目标框。
   */
  fitHeight,
  /**
   * ## 不会做出任何动作
   */
  none,
  /**
   * ## 将源在目标框内对齐（默认为居中），并且在必要时将源缩小以确保其适合于框内。如果这会缩小图像，则与 `contain` 相同；否则与 `none` 相同。
   */
  scaleDown,
}


class FittedSizes {
  /// The size of the part of the input to show on the output.
  readonly source: Size;

  /// The size of the part of the output on which to show the input.
  readonly destination: Size;
  /// Creates an object to store a pair of sizes,
  /// as would be returned by [applyBoxFit].
  constructor(source: Size, destination: Size) {
    this.source = source;
    this.destination = destination;
  }
}
/**
 * 
 * @param fit 
 * @param inputSize 自身盒子
 * @param outputSize 目标盒子 
 * @returns 
 */
const applyBoxFit = (
  fit: BoxFit,
  inputSize: Size,
  outputSize: Size
): FittedSizes => {
  if (
    inputSize.height <= 0.0 ||
    inputSize.width <= 0.0 ||
    outputSize.height <= 0.0 ||
    outputSize.width <= 0.0
  ) {
    return new FittedSizes(Size.zero, Size.zero);
  }
  if(fit===undefined||fit==null){
    return new FittedSizes(inputSize,outputSize);
  }

  let sourceSize: Size = Size.zero,
    destinationSize: Size = Size.zero;
  switch (fit) {
    case BoxFit.fill:
      sourceSize = inputSize;
      destinationSize = outputSize;
      break;
    case BoxFit.contain:
      sourceSize = inputSize;
      if (
        outputSize.width / outputSize.height >
        sourceSize.width / sourceSize.height
      ) {
        destinationSize = new Size(
          (sourceSize.width * outputSize.height) / sourceSize.height,
          outputSize.height
        );
      } else {
        destinationSize = new Size(
          outputSize.width,
          (sourceSize.height * outputSize.width) / sourceSize.width
        );
      }
      break;
    case BoxFit.cover:
      if (
        outputSize.width / outputSize.height >
        inputSize.width / inputSize.height
      ) {
        sourceSize = new Size(
          inputSize.width,
          (inputSize.width * outputSize.height) / outputSize.width
        );
      } else {
        sourceSize = new Size(
          (inputSize.height * outputSize.width) / outputSize.height,
          inputSize.height
        );
      }
      destinationSize = outputSize;
      break;
    case BoxFit.fitWidth:
      sourceSize = inputSize;
      destinationSize = new Size(
        outputSize.width,
        (sourceSize.height * outputSize.width) / sourceSize.width
      );
      // if (
      //   outputSize.width / outputSize.height >
      //   inputSize.width / inputSize.height
      // ) {
      //   // Like "cover"
      //   sourceSize = new Size(
      //     inputSize.width,
      //     (inputSize.width * outputSize.height) / outputSize.width
      //   );
      //   destinationSize = outputSize;
      // } else {
      //   // Like "contain"
      // destinationSize = new Size(
      //   outputSize.width,
      //   (sourceSize.height * outputSize.width) / sourceSize.width
      // );
      // }
      break;
    case BoxFit.fitHeight:
      sourceSize = inputSize;
      destinationSize = new Size(
        (sourceSize.width * outputSize.height) / sourceSize.height,
        outputSize.height
      );
      // if (
      //   outputSize.width / outputSize.height >
      //   inputSize.width / inputSize.height
      // ) {
      //   // Like "contain"
      //   sourceSize = inputSize;
      // destinationSize = new Size(
      //   (sourceSize.width * outputSize.height) / sourceSize.height,
      //   outputSize.height
      // );
      // } else {
      //   // Like "cover"
      //   sourceSize = new Size(
      //     (inputSize.height * outputSize.width) / outputSize.height,
      //     inputSize.height
      //   );
      //   destinationSize = outputSize;
      // }
      break;
    case BoxFit.none:
      sourceSize = outputSize;
      destinationSize = outputSize;
      // sourceSize = new Size(
      //   Math.min(inputSize.width, outputSize.width),
      //   Math.min(inputSize.height, outputSize.height)
      // );
      // destinationSize = sourceSize;
      break;
    case BoxFit.scaleDown:
      sourceSize = inputSize;
      destinationSize = inputSize;
      const aspectRatio: number = inputSize.width / inputSize.height;
      if (destinationSize.height > outputSize.height) {
        destinationSize = new Size(
          outputSize.height * aspectRatio,
          outputSize.height
        );
      }
      if (destinationSize.width > outputSize.width) {
        destinationSize = new Size(
          outputSize.width,
          outputSize.width / aspectRatio
        );
      }
  }
  const fittedSize = new FittedSizes(sourceSize, destinationSize);
  return fittedSize;
};

export default BoxFit;
export { applyBoxFit };
