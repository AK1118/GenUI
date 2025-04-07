import { NativeStrategies } from "../native/native-strategies";
import Painter from "../painting/painter";


interface BaseConfig {
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  debug?: boolean;
  canvas?: HTMLCanvasElement;
  renderContext?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  strategies: NativeStrategies,
  showBanner?: boolean,
}

export class GenPlatformConfig {
  private static _instance: GenPlatformConfig;
  private baseConfig: BaseConfig;
  constructor(args: BaseConfig) {
    this.baseConfig = args;
    if (this.screenWidth <= 0 || this.screenHeight <= 0 || this.devicePixelRatio <= 0) {
      throw new Error("screenWidth, screenHeight and devicePixelRatio must be greater than 0");
    }
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

  get showBanner() {
    return this.baseConfig?.showBanner;
  }


  get strategies(): NativeStrategies {
    return this.baseConfig?.strategies;
  }

  get painter(): Painter {
    const painterStrategy = this.strategies?.getPainterStrategy();
    const painter = painterStrategy.getPainter(this.baseConfig?.renderContext);
    return painter;
  }

  get canvas(): HTMLCanvasElement {
    return this.baseConfig?.canvas;
  }
}

