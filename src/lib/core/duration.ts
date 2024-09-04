interface DurationArguments {
  day: number;
  hour: number;
  minute: number;
  second: number;
  milliseconds: number;
  microsecond: number;
}
export class Duration {
  private _duration: number;
  constructor(duration: Partial<DurationArguments>) {
    this._duration = 0;
    if (duration.day) {
      this._duration += duration.day * 24 * 60 * 60 * 1000;
    }
    if (duration.hour) {
      this._duration += duration.hour * 60 * 60 * 1000;
    }
    if (duration.minute) {
      this._duration += duration.minute * 60 * 1000;
    }
    if (duration.second) {
      this._duration += duration.second * 1000;
    }
    if (duration.milliseconds) {
      this._duration += duration.milliseconds;
    }
    if (duration.microsecond) {
      this._duration += duration.microsecond / 1000;
    }
  }
  /**
   * 获取单位是`天`的值
   */
  get valueWithDays(): number {
    return this.valueWithHours / 24;
  }
  /**
   * 获取单位是`秒`的值
   */
  get valueWithSeconds(): number {
    return this._duration / 1000;
  }
  /**
   * 获取单位是`毫秒`的值，与`Duration.value`一致
   */
  get valueWithMilliseconds(): number {
    return this._duration;
  }
  /**
   * 获取单位是`时`的值
   */
  get valueWithHours(): number {
    return this.valueWithMinutes / 60;
  }
  /**
   * 获取单位是`分`的值
   */
  get valueWithMinutes(): number {
    return this.valueWithSeconds/60;
  }
  /**
   * 获取默认值，单位毫秒
   */
  get value(): number {
    return this._duration;
  }
}
