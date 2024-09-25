import { Duration } from "../core/duration";

export default class Timer {
    private duration: number; //毫秒
    private timer: any;
    private callback: VoidFunction;
    private runTimeDuration: number;
    private startTime: number = 0;
    constructor(callback: VoidFunction, duration: Duration) {
      this.duration = duration.value;
      this.callback = callback;
      this.runTimeDuration = duration.value;
    }
    /**
     * 在停止时需要记录剩余多少秒
     * 再次允许需要在上一次的剩余基础上再次运行
     */
    stop() {
      const now = +new Date();
      this.runTimeDuration -= now - this.startTime;
      // //console.log("自动上传暂停",this.runTimeDuration)
      this.cancel();
    }
    cancel() {
      clearTimeout(this.timer);
      this.timer=null;
    }
    reset() {
      this.timer=null;
      this.runTimeDuration = this.duration;
    }
    reStart() {
      this.reset();
      this.start();
    }
    start() {
      this.startTime = +new Date();
      if (!this.timer) {
        this.running();
      }
    }
    private running() {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.callback?.();
      }, this.runTimeDuration);
    }
  }