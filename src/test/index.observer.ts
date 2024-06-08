enum ObserverType {
  PDF = "pdf",
  VIDEO = "video",
}

interface RecordEntity<T = any> {
  key: string;
  recordTime: number;
  data: T;
}
type ListenCallback = (args?: any) => void;
interface ListenerType {
  start;
  dispose;
  cancel;
  hiddenWindow;
  displayWindow;
  update;
}
interface ResultEntity {
  key: string;
  record: number;
}
/**
 *
 * # 监听PDF的阅读和视频的播放
 *
 * ## 监听PDF
 * * 规则：必须在窗口内，必须在n时间内滑动(或者其他能证明用户在观看的动作)
 * * 从初始化到销毁一直只保持一个记录，离开pdf阅读页面后，记录将被停止。
 *
 * ## 监听视频
 * * 规则：必须在窗口内，视频必须保持为播放状态
 * * 离开窗口立即暂停视频播放，且停止记录。
 *
 * # 计时逻辑
 * 1. 记录的时间是累加的ms
 * 2. 只记录在规则内的时间，例如：在窗口内的pdf聚焦窗口，且在interval时间内触发一次[Observer.update]。以上就会合法的计时。
 * 3. 在离开窗口后会即刻计时，且interval计时器会立即失效。
 * 4. 离开窗口后再次进入窗口不会触发再次计时，需要调用[Observer.update]开始一轮新的计时。
 * - 正常运转触发第2,离开窗口触发第3，再次进入窗口触发4
 *
 * 不论监听什么类型，在监听开始时必须调用 [Observer.start]以开始计时。在开始计时后,每过一个interval timeout 将会标记一次时间用于记录最后阅读时长，
 * 任何一个违反规则的事件将会停止计时器的工作，并持久化记录停止工作的时间戳。
 *
 * [start]代表着一轮的开始，它不会在一轮中被多次调用，只能通过[update]来进行当轮中的刷新操作。[start]方法可选接收一个[ResultEntity]参数设置初始化计时数据和身份表示key
 * [end]表示该该轮暂停|结束
 * [dispose]调用后该轮真实被销毁，摸出当轮所有缓存数据
 *
 */
abstract class Observer {
  private key: string;
  private _started: boolean = false;
  abstract get observerType(): ObserverType;
  abstract get interval(): number;
  protected currentRecord: Partial<RecordEntity> = null;
  protected markList: Array<Partial<RecordEntity>> = [];
  private timer: any;
  private startTime: number;
  private recordTime: number = 0;
  private display: () => void;
  private hidden: () => void;
  private listeners: Partial<
    Record<keyof ListenerType, Array<ListenCallback>>
  > = {};
  public get started(): boolean {
    return this._started;
  }
  protected get currentTime(): number {
    return +new Date();
  }
  public getRecordResult(): ResultEntity {
    return {
      key: this.key,
      record: this.recordTime,
    };
  }
  public getRecordTime(): number {
    return this.recordTime;
  }
  private handleListenWindow() {
    this.cancelListenWindow();
    this.display = () => {
      this.onDisplayWindow();
    };
    this.hidden = () => {
      this.onHiddenWindow();
    };
    const display = this.display;
    const hidden = this.hidden;
    window.addEventListener("focus", display);
    window.addEventListener("blur", hidden);
  }
  private cancelListenWindow() {
    const display = this.display;
    const hidden = this.hidden;
    window.removeEventListener("focus", display);
    window.removeEventListener("blur", hidden);
  }
  /**
   * @mustCallSuper
   */
  protected onHiddenWindow() {
    this.cancelObserve();
    this.callListen("hiddenWindow");
  }
  /**
   * @mustCallSuper
   */
  protected onDisplayWindow() {
    this.callListen("displayWindow");
    // this.resumeObserve();
  }
  private markTime(type: ObserverType) {
    let markEntity = this.performMark();
    markEntity = {
      recordTime: this.recordTime,
      ...markEntity,
    };
    this.markList.push(markEntity);
    localStorage.setItem(type, JSON.stringify(this.markList));
    console.log("MARK", markEntity);
    this.currentRecord = markEntity;
  }
  private performRecordTimeOut() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this.startTime === 0) {
      this.startTime = this.currentTime;
    }
    this.timer = setTimeout(() => {
      this.computeRecordTime();
      this.markTime(this.observerType);
      this.didCancelObserve();
      this.timer = null;
    }, this.interval);
  }
  private computeRecordTime(): void {
    /**
     * 计时器到时间后计算一次
     * 离开屏幕计算一次，多次离开屏幕刷新？
     */
    if (this.startTime == 0) return;
    this.recordTime += this.currentTime - this.startTime;
    this.startTime = 0;
    console.log("已记录时长:", this.recordTime, "ms");
  }
  protected cancelObserve(): void {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.markTime(this.observerType);
    this.computeRecordTime();
    this.didCancelObserve();
    this.callListen("cancel");
  }
  protected resumeObserve() {
    this.performRecordTimeOut();
  }
  protected updateObserve() {
    this.performRecordTimeOut();
  }
  /**
   * 开始执行监听
   */
  abstract performObserve(): void;
  /**
   * 在mark时间时返回需要mark的信息实体
   */
  protected performMark(): Partial<RecordEntity> {
    return {};
  }
  /**
   * 取消监听时
   */
  abstract didCancelObserve(): void;
  /**
   * @mustCallSuper
   */
  public start(defaultEntity?: ResultEntity) {
    this.performDispose();
    this.handleGenerateRandomKeyForObs();
    this.handleListenWindow();
    this.performRecordTimeOut();
    this.performObserve();
    this.startTime = this.currentTime;
    this._started = true;
    if (defaultEntity) {
      this.key = defaultEntity?.key;
      this.recordTime = defaultEntity?.record;
    }
    this.callListen("start");
  }
  private handleGenerateRandomKeyForObs() {
    this.key = Math.random().toString(16).substring(3);
  }
  public update() {
    if (!this.started) {
      return console.warn(
        "该update是无效的，因为监听器未开始记录。用observer.start() 解决该问题"
      );
    }
    this.updateObserve();
    this.callListen("update");
  }
  protected performDispose() {
    this.cancelObserve();
    this.cancelListenWindow();
    this.startTime = 0;
    this.currentRecord = {};
    this.markList = [];
    this._started = false;
    this.key = null;
  }
  public dispose() {
    this.performDispose();
    this.callListen("dispose");
    this.listeners = {};
  }
  private callListen(type: keyof ListenerType, args?: any) {
    const callbacks = this.listeners[type];
    callbacks?.forEach((_) => {
      _.call?.(args);
    });
  }
  public addListeners(type: keyof ListenerType, callback: ListenCallback) {
    let callbacks = this.listeners[type];
    if (!callbacks) {
      callbacks = new Array();
    }
    callbacks.push(callback);
    this.listeners[type] = callbacks;
  }
  public end() {
    if (this.started) {
      this.cancelObserve();
    }
  }
  public notifyHasDisplay() {
    this.onDisplayWindow();
  }
  public notifyHasHidden() {
    this.onHiddenWindow();
  }
}

class PDFObserver extends Observer {
  get observerType(): ObserverType {
    return ObserverType.PDF;
  }
  get interval(): number {
    return 2000;
  }
  performObserve(): void {
    console.log("开始监听PDF");
  }
  didCancelObserve(): void {
    const result = this.getRecordResult();
    console.log(result.key, "取消监听PDF", result.record);
  }
  protected onDisplayWindow(): void {
    super.onDisplayWindow();
    this.update();
    console.log("恢复监听PDF");
  }
  protected onHiddenWindow(): void {
    super.onHiddenWindow();
    console.log("暂停监听PDF");
  }
}
export const pdfObserver = new PDFObserver();
// document.querySelector<HTMLButtonElement>("#continue").onclick = () => {
//   console.log("离开pdf页面");
//   pdfObserver.dispose();
// };
// document.querySelector<HTMLButtonElement>("#startpdf").onclick = () => {
//   console.log("pdf加载完毕");
//   pdfObserver.start();
// };
// document.addEventListener("scroll", () => {
//   console.log("pdf页面滚动");
//   pdfObserver.update();
// });

class VideoObserver extends Observer {
  private _videoEle: HTMLVideoElement;
  get videoEle(): HTMLVideoElement {
    return this._videoEle;
  }
  get observerType(): ObserverType {
    return ObserverType.VIDEO;
  }
  get interval(): number {
    const videoDuration = this.videoEle.duration * 1000;
    console.log("视频总时长:", videoDuration, "ms");
    return videoDuration;
  }
  performObserve(): void {}
  protected onHiddenWindow(): void {
    this.cancelObserve();
    console.log("暂停监听VIDEO")
  }
  protected onDisplayWindow(): void {
    super.onDisplayWindow();
  }
  didCancelObserve(): void {
    this.videoEle?.pause();
    const result = this.getRecordResult();
    console.log(result.key, "取消监听VIDEO", result.record);
  }
  public setVideoEle(videoEle: HTMLVideoElement): void {
    if (!videoEle || !(videoEle instanceof HTMLVideoElement))
      throw new TypeError("必须传入一个视频控件DOM对象");
    this._videoEle = videoEle;
    this.listenVideoAction();
  }
  private listenVideoAction() {
    this.videoEle?.addEventListener("play", () => {
      this.update();
    });
    this.videoEle?.addEventListener("pause", () => {
      this.cancelObserve();
    });
  }
  
  public start(): void {
    if (!this.videoEle) {
      throw new Error("视频监听失败，视频控件不应该为空。");
    }
    super.start();
  }
  public dispose(): void {
    this._videoEle = null;
    super.dispose();
  }
}
export const videoObserver = new VideoObserver();
// const videoObserver = new VideoObserver();
// const video = document.querySelector<HTMLVideoElement>("#video");
// videoObserver.setVideoEle(video);
// videoObserver.start();

export default Observer;
export { PDFObserver, VideoObserver };
