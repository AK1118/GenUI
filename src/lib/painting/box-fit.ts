import { Size } from "../basic/rect";

export enum BoxFit {
  /// 通过扭曲源图像的宽高比来填充目标框。
  fill = "fill",

  /// 在目标框内尽可能放大，同时仍然完全包含源图像。
  contain = "contain",

  /// 在覆盖整个目标框的同时尽可能缩小。
  ///
  /// 要实际裁剪内容，请在 [FittedBox] 中将 `clipBehavior: Clip.hardEdge` 与此搭配使用。
  cover = "cover",

  /// 确保显示源图像的完整宽度，即使这意味着源图像会在垂直方向上溢出目标框。
  fitWidth = "fitWidth",

  /// 确保显示源图像的完整高度，即使这意味着源图像会在水平方向上溢出目标框。
  fitHeight = "fitHeight",

  /// 将源图像对齐到目标框内（默认居中），并丢弃位于框外的部分。
  ///
  /// 源图像不会被缩放。
  none = "none",

  /// 将源图像对齐到目标框内（默认居中），并在必要时将源图像缩小，以确保它适合目标框。
  ///
  /// 如果需要缩小图像，这与 `contain` 相同，否则与 `none` 相同。
  scaleDown = "scaleDown",
}

/**
 * @inputSize 目标大小
 * @outputSize 源大小
 */
export const applyBoxFit = (
  fit: BoxFit,
  inputSize: Size,
  outputSize: Size
): Size => {
  let fittedSize = inputSize;
  switch (fit) {
    case BoxFit.fill:
      break;
    case BoxFit.contain:
    case BoxFit.cover:
      if (outputSize.width / outputSize.height > inputSize.width / inputSize.height) {
        //fitHeight
        fittedSize =new Size(inputSize.height * outputSize.width / outputSize.height, inputSize.height);
      } else {
         //fitWidth
         fittedSize =new Size(inputSize.width, inputSize.width * outputSize.height / outputSize.width);
      }
      break;
    case BoxFit.fitWidth:
      fittedSize = new Size(
        inputSize.width,
        (outputSize.height * inputSize.width) / outputSize.width
      );
      break;
    case BoxFit.fitHeight:
      fittedSize = new Size(
        (inputSize.height * outputSize.width) / outputSize.height,
        inputSize.height
      );
      break;
    case BoxFit.none:
        fittedSize=outputSize;
    case BoxFit.scaleDown:
  }
  return fittedSize;
};
