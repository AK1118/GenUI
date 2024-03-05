# 1.3.90 更新日志

### 废弃

- 无

### 新增

- disableRotate 和 enableRotate 方法，控制 view 是否可被旋转.值 angleDisabled
- 控制器新增 show 和 hide 方法，用于控制图层的显示与隐藏
- RectCrop 对象，裁剪框，可通过该实例获取被框选区域矩形数据(非 ImageData)
- 控制器新增 setLayer 用于设置图层,forceRender 新增强制重新排序
- 文字新增艺术字属性:
``` Typescript
  //描边
  stroke?: boolean;
  //填充
  fill?: boolean;
  //描边颜色
  strokeColor?: string;
  //填充渐变
  fillGradient?: LineGradientDecorationOption;
  //描边渐变
  strokeGradient?: LineGradientDecorationOption;
  //描边线条宽度
  strokeLineWidth?: number;
```

### 修复

- 控制器 remove 方法失效问题
- 导出时由于不必要的开销导致微信小程序 ios 端报错

### 优化

- 导出时不必要的开销
