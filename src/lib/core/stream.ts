type StreamGenerator<T, R = void, N = unknown> =
  | Generator<T, R, N>
  | AsyncGenerator<T, R, N>;


export default abstract class Stream<T> {
  protected generator: StreamGenerator<T>;
  constructor(generator: StreamGenerator<T>) {
    this.generator = generator;
  }
  public abstract map<M>(callback: (v: T) => M): Stream<M>;
  public abstract forEach(callback: (v: T) => void): void | Promise<void>;
  public abstract filters(callback: (v: T) => boolean): Stream<T>;
  static fromArray<T>(array: Array<T>): Stream<T> {
    return new SimpleStream<T>(
      (function* generate() {
        for (let item of array) {
          yield item;
        }
      })()
    );
  }
  static withAsync<T>(generate: AsyncGenerator<T, T, unknown>): Stream<T> {
    return new AsyncStream<T>(generate);
  }
  [Symbol.iterator](): StreamGenerator<T> {
    return this.generator;
  }
}

class SimpleStream<T> extends Stream<T> {
 
  protected generator: Generator<T>;
  public map<M>(callback: (v: T) => M): Stream<M> {
    function* generator() {
      for (let item of this.generator) {
        yield callback(item);
      }
    }
    return new SimpleStream<M>(generator());
  }
  public forEach(callback: (v: T) => void): void | Promise<void> {
    for (let item of this.generator) {
      callback(item);
    }
  }
  public filters(callback: (v: T) => boolean): Stream<T> {
    function* generator() {
      for (let item of this.generator) {
        if (callback(item)) yield item;
      }
    }
    return new SimpleStream<T>(generator());
  }
}

export class AsyncStream<T> extends Stream<T> {
  protected generator: AsyncGenerator<T>;
  constructor(generator: AsyncGenerator<any, any, any>) {
    super(generator);
  }
  static fromArray<T>(array: Array<T>): AsyncStream<T> {
    return new AsyncStream<T>(
      (async function* generate() {
        for (let item of array) {
          yield item;
        }
      })()
    );
  }
  public map<M>(callback: (v: T) => M): AsyncStream<M> {
    async function* generator() {
      for await (let item of this.generator) {
        yield callback(item);
      }
    }
    return new AsyncStream<M>(generator());
  }
  public async forEach(callback: (v: T) => void): Promise<void> {
    for await (let item of this.generator) {
      callback(item);
    }
  }
  public filters(callback: (v: T) => boolean): Stream<T> {
    async function* generator() {
      for await (let item of this.generator) {
        if (await callback(item)) yield item;
      }
    }
    return new AsyncStream<T>(generator());
  }
  gg(): AsyncGenerator<T> {
    console.log("AsyncStream iterator",typeof this.generator);
    return this.generator;
  }
  [Symbol.asyncIterator](): AsyncGenerator<T> {
    console.log("AsyncStream iterator",typeof this.generator);
    return this.generator;
  }
}
