export class LatencyProfiler {
  private measurements: Map<string, number[]> = new Map();

  startTiming(operationId: string): () => number {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordMeasurement(operationId, duration);
      return duration;
    };
  }

  private recordMeasurement(operationId: string, duration: number): void {
    if (!this.measurements.has(operationId)) {
      this.measurements.set(operationId, []);
    }
    
    const measurements = this.measurements.get(operationId)!;
    measurements.push(duration);
    
    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  getAverageLatency(operationId: string): number {
    const measurements = this.measurements.get(operationId);
    if (!measurements || measurements.length === 0) {
      return 0;
    }
    
    return measurements.reduce((sum, duration) => sum + duration, 0) / measurements.length;
  }

  getStats(operationId: string): { average: number; min: number; max: number; count: number } {
    const measurements = this.measurements.get(operationId);
    if (!measurements || measurements.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0 };
    }
    
    const sorted = [...measurements].sort((a, b) => a - b);
    return {
      average: measurements.reduce((sum, duration) => sum + duration, 0) / measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: measurements.length
    };
  }

  getAllStats(): Record<string, { average: number; min: number; max: number; count: number }> {
    const stats: Record<string, { average: number; min: number; max: number; count: number }> = {};
    
    for (const operationId of this.measurements.keys()) {
      stats[operationId] = this.getStats(operationId);
    }
    
    return stats;
  }
}
