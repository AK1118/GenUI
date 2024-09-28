import Painter from "../painting/painter";


interface BaseConfig {
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  debug?: boolean;
  canvas?: HTMLCanvasElement;
  renderContext?:CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D 
}

export class GenPlatformConfig {
  private static _instance: GenPlatformConfig;
  private baseConfig: BaseConfig;
  constructor(args: BaseConfig) {
    this.baseConfig = args;
  }
  public static InitInstance(args: BaseConfig): GenPlatformConfig {
    if (!GenPlatformConfig._instance) {
      GenPlatformConfig._instance = new GenPlatformConfig(args);
    }
    return GenPlatformConfig._instance;
  }
  static get instance(): GenPlatformConfig {
    return GenPlatformConfig._instance;
  }
  get config() {
    return this.baseConfig;
  }
  get rawScreenWidth() {
    return this.baseConfig.screenWidth;
  }
  get rawScreenHeight() {
    return this.baseConfig.screenHeight;
  }
  get screenWidth() {
    return this.devicePixelRatio * this.rawScreenWidth;
  }
  get screenHeight() {
    return this.devicePixelRatio * this.rawScreenHeight;
  }
  get devicePixelRatio() {
    return this.baseConfig.devicePixelRatio;
  }
  get isDebug() {
    return this.baseConfig?.debug;
  }

  get painter():Painter{
    return new Painter(this.baseConfig?.renderContext);
  }

  get canvas():HTMLCanvasElement{
    return this.baseConfig?.canvas;
  }
}

