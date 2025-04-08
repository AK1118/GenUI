// 基础异常类 (重命名为 GenUIError)
abstract class GenUIError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "GenUIError";
    }
  }
  
  // 1️⃣ 断言错误
  export class AssertionError extends GenUIError {
    constructor(message: string) {
      super(`Assertion failed: ${message}`);
      this.name = "AssertionError";
    }
  }
  
  // 2️⃣ 格式错误 
  export class FormatException extends GenUIError {
    constructor(message: string) {
      super(`Invalid format: ${message}`);
      this.name = "FormatException";
    }
  }
  
  // 3️⃣ 空值错误
  export class NullThrownError extends GenUIError {
    constructor() {
      super("A null value was thrown.");
      this.name = "NullThrownError";
    }
  }
  
  // 4️⃣ 非法参数异常
  export class ArgumentError extends GenUIError {
    constructor(message: string) {
      super(`Invalid argument: ${message}`);
      this.name = "ArgumentError";
    }
  }
  
  // 5️⃣ 自定义 "未实现" 异常
  export class UnimplementedError extends GenUIError {
    constructor(message: string = "This feature is not implemented.") {
      super(message);
      this.name = "UnimplementedError";
    }
  }
  
  // 6️⃣ 运行时异常
  export class StateError extends GenUIError {
    constructor(message: string) {
      super(`Invalid state: ${message}`);
      this.name = "StateError";
    }
  }
  