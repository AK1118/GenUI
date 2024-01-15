# 1.3.67 更新日志

### 废弃

- 废弃预设，废弃 useReader
- 废弃 LocationButton 枚举，建议使用 Alignment

### 新增

- 新增屏幕适配,可根据设置设计稿大小适配屏幕
- 新增 Graphics 系列，可新增图形为可操作对象 Rectangle & Circle，支持设置颜色渐变
- 新增插件插槽 OffScreenBuilder,用于自定义离屏画布生成
- 新增 Alignment 类，替换 LocationButton

### 优化

- 优化 TextBox 缓存,优化涂鸦概率性缺角 bug
- 优化声明文件
- 导出格式变化

  旧格式:

  ```Typescript
         {
           options:Array<ViewObject>
         }
  ```

  新格式:

  ```Typescript
   {
       entities:Array<ViewObject>,
       info:{
           platform?:"string",
           screen?:ScreenUtilsOption
       }
   }
  ```
