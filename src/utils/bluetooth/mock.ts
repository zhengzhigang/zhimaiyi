type OnMockDataCallback = (points: number[]) => void

class MockOximeter {
  private isRunning = false
  private timer: ReturnType<typeof setInterval> | null = null
  private onDataCallback: OnMockDataCallback | null = null
  private sampleRate = 50
  private baseValue = 32768
  private amplitude = 2000
  private heartRate = 75
  private spo2 = 98
  private noiseLevel = 45
  private baselineDrift = 0
  private sampleCount = 0
  private batchSize = 5
  private pinkB0 = 0
  private pinkB1 = 0
  private pinkB2 = 0
  private pinkB3 = 0
  private pinkB4 = 0
  private pinkB5 = 0

  setCallback(callback: OnMockDataCallback) {
    this.onDataCallback = callback
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.sampleCount = 0
    this.baselineDrift = 0
    this.pinkB0 = 0
    this.pinkB1 = 0
    this.pinkB2 = 0
    this.pinkB3 = 0
    this.pinkB4 = 0
    this.pinkB5 = 0

    const interval = (1000 / this.sampleRate) * this.batchSize
    this.timer = setInterval(() => {
      const points = this.generateBatch()
      this.onDataCallback?.(points)
    }, interval)
  }

  stop() {
    this.isRunning = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  setHeartRate(rate: number) {
    this.heartRate = Math.max(40, Math.min(180, rate))
  }

  setSpO2(value: number) {
    this.spo2 = Math.max(70, Math.min(100, value))
  }

  private generateBatch(): number[] {
    const points: number[] = []

    for (let i = 0; i < this.batchSize; i++) {
      const t = this.sampleCount / this.sampleRate
      const point = this.generatePoint(t)
      points.push(point)
      this.sampleCount++
    }

    return points
  }

  private generatePoint(t: number): number {
    const cycleDuration = 60 / this.heartRate
    const normalizedTime = t % cycleDuration
    const phase = normalizedTime / cycleDuration

    let signal = this.baseValue

    signal += this.generatePulseWave(phase)
    signal += this.generateACComponent(phase, t)
    signal += this.generateNoise()
    signal += this.updateBaselineDrift()

    return Math.round(signal)
  }

  private generatePulseWave(phase: number): number {
    const systolicPeak = Math.exp(-Math.pow((phase - 0.18) / 0.075, 2)) * this.amplitude
    const shoulder = Math.exp(-Math.pow((phase - 0.31) / 0.13, 2)) * this.amplitude * 0.32
    const dicroticNotch = -Math.exp(-Math.pow((phase - 0.48) / 0.035, 2)) * this.amplitude * 0.18
    const diastolicWave = Math.exp(-Math.pow((phase - 0.58) / 0.09, 2)) * this.amplitude * 0.24
    const slowRunoff = Math.exp(-Math.max(0, phase - 0.22) * 4.2) * this.amplitude * 0.16

    return systolicPeak + shoulder + dicroticNotch + diastolicWave + slowRunoff
  }

  private generateACComponent(phase: number, t: number): number {
    const harmonic = Math.sin(phase * Math.PI * 4 + 0.35) * this.amplitude * 0.04
    const respiratory = Math.sin(t * Math.PI * 2 * 0.22) * this.amplitude * 0.07
    return (harmonic + respiratory) * (this.spo2 / 100)
  }

  private generateNoise(): number {
    const noise = (Math.random() - 0.5) * this.noiseLevel
    const pinkNoise = this.generatePinkNoise() * this.noiseLevel * 0.5
    return noise + pinkNoise
  }

  private generatePinkNoise(): number {
    const white = Math.random() - 0.5
    this.pinkB0 = 0.99886 * this.pinkB0 + white * 0.0555179
    this.pinkB1 = 0.99332 * this.pinkB1 + white * 0.0750759
    this.pinkB2 = 0.96900 * this.pinkB2 + white * 0.1538520
    this.pinkB3 = 0.90000 * this.pinkB3 + white * 0.3104856
    this.pinkB4 = 0.65000 * this.pinkB4 + white * 0.5329522
    this.pinkB5 = -0.7616 * this.pinkB5 - white * 0.0168980
    return this.pinkB0 + this.pinkB1 + this.pinkB2 + this.pinkB3 + this.pinkB4 + this.pinkB5 + white * 0.5362
  }

  private updateBaselineDrift(): number {
    const driftSpeed = 2
    const driftRange = 500

    if (Math.random() < 0.01) {
      this.baselineDrift += (Math.random() - 0.5) * driftSpeed * 2
    }

    this.baselineDrift = Math.max(-driftRange, Math.min(driftRange, this.baselineDrift))
    return this.baselineDrift
  }

  getHeartRate(): number {
    return this.heartRate
  }

  getSpO2(): number {
    return this.spo2
  }

  isRunningStatus(): boolean {
    return this.isRunning
  }
}

export const mockOximeter = new MockOximeter()
