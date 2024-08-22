abstract class Listenable {
  abstract addListener(listener: VoidFunction): void;
  abstract removeListener(listener: VoidFunction): void;
}

export abstract class ChangeNotifier extends Listenable {
    private listeners: Array<VoidFunction | null> = [];
    private count: number = 0;
    private notificationCallStackDepth: number = 0;
    private needsRemoveListener: number = 0;
  
    // 添加监听器
    addListener(listener: VoidFunction): void {
      if (this.listeners.indexOf(listener) === -1) {
        this.listeners.push(listener);
        this.count++;
      }
    }
  
    // 移除监听器
    removeListener(listener: VoidFunction): void {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        // 将监听器设置为 null，延迟移除
        this.listeners[index] = null;
        this.needsRemoveListener++;
      }
  
      // 如果不在通知过程中，可以立即清理
      if (this.notificationCallStackDepth === 0) {
        this.cleanupListeners();
      }
    }
  
    // 通知所有监听器
    notifyListeners(): void {
      if (this.count === 0) return;
  
      this.notificationCallStackDepth++;
      for (let i = 0; i < this.count; i++) {
        if (this.listeners[i] != null) {
          try {
            this.listeners[i]?.();
          } catch (error) {
            console.error("Error in listener:", error);
          }
        }
      }
      this.notificationCallStackDepth--;
  
      // 如果没有嵌套调用，进行清理工作
      if (this.notificationCallStackDepth === 0 && this.needsRemoveListener > 0) {
        this.cleanupListeners();
      }
    }
  
    // 清理所有被标记为 null 的监听器
    private cleanupListeners(): void {
      if (this.needsRemoveListener > 0) {
        // 移除所有为 null 的监听器
        this.listeners = this.listeners.filter(listener => listener !== null);
        this.count = this.listeners.length;
        this.needsRemoveListener = 0;
      }
    }
  }
  
