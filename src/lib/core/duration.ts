interface DurationArguments {
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
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
    if (duration.millisecond) {
      this._duration += duration.millisecond;
    }
    if (duration.microsecond) {
      this._duration += duration.microsecond / 1000;
    }
  }
  get value(): number {
    return this._duration;
  }
}
