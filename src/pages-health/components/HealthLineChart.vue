<template>
  <!-- #ifdef MP-WEIXIN -->
  <view v-if="values.length" class="health-line-chart">
    <ec-canvas
      :id="chartId"
      class="health-line-chart-canvas"
      :canvas-id="chartId"
    />
  </view>
  <!-- #endif -->

  <!-- #ifndef MP-WEIXIN -->
  <!-- @vue-ignore -->
  <view
    v-if="values.length"
    :id="chartId"
    class="health-line-chart"
    :chart-payload="chartPayload"
    :change:chart-payload="chart.update"
  />
  <!-- #endif -->
</template>

<script setup lang="ts">
interface ChartArea {
  from: number
  to: number
  color: string
}

const props = withDefaults(defineProps<{
  values: number[]
  type?: 'line' | 'bar' | 'range'
  categories?: string[]
  min?: number
  max?: number
  lineColor?: string
  axisColor?: string
  splitLineColor?: string
  labelColor?: string
  areas?: ChartArea[]
  showSymbol?: boolean
  showXAxis?: boolean
  smooth?: boolean
  barColor?: string
  barWidth?: number
}>(), {
  type: 'line',
  categories: () => [],
  min: 0,
  max: 100,
  lineColor: '#21b9c0',
  axisColor: '#d8d8d8',
  splitLineColor: '#e8edf0',
  labelColor: '#333',
  areas: () => [],
  showSymbol: false,
  showXAxis: false,
  smooth: false,
  barColor: '#fb814b',
  barWidth: 20,
})

const chartId = `health-chart-${Math.random().toString(36).slice(2, 10)}`

const option = computed(() => {
  const categories = props.values.map((_, index) => props.categories[index] || String(index + 1))
  if (props.type === 'range') {
    const backgroundSeries = props.areas.map(area => ({
      type: 'bar',
      stack: 'range-background',
      silent: true,
      barWidth: '100%',
      data: [Math.max(0, area.to - area.from)],
      itemStyle: {
        color: area.color,
      },
      emphasis: {
        disabled: true,
      },
      z: 0,
    }))

    return {
      animation: false,
      grid: {
        left: 54,
        right: 12,
        top: 8,
        bottom: 18,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: [''],
        axisLine: { show: true, lineStyle: { color: props.axisColor } },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: props.min,
        max: props.max,
        splitNumber: 5,
        axisLine: { show: true, lineStyle: { color: props.axisColor } },
        axisTick: { show: false },
        axisLabel: {
          color: props.labelColor,
          fontSize: 11,
        },
        splitLine: {
          show: true,
          lineStyle: { color: props.splitLineColor, width: 1 },
        },
      },
      series: [
        ...backgroundSeries,
        {
          type: 'line',
          data: [props.values[0]],
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 10,
          lineStyle: {
            width: 0,
            opacity: 0,
          },
          itemStyle: {
            color: '#fff',
            borderColor: props.lineColor,
            borderWidth: 3,
          },
          z: 3,
        },
      ],
    }
  }

  if (props.type === 'bar') {
    return {
      animation: false,
      grid: {
        left: 50,
        right: 16,
        top: 8,
        bottom: 30,
        containLabel: false,
      },
      xAxis: {
        type: 'value',
        min: props.min,
        max: props.max,
        interval: 20,
        axisLine: { show: true, lineStyle: { color: props.axisColor } },
        axisTick: { show: false },
        axisLabel: { color: props.labelColor, fontSize: 12 },
        splitLine: {
          show: true,
          lineStyle: { color: props.splitLineColor, width: 1 },
        },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: categories,
        axisLine: { show: true, lineStyle: { color: props.axisColor } },
        axisTick: { show: false },
        axisLabel: {
          color: props.labelColor,
          fontSize: 14,
          margin: 10,
        },
      },
      series: [{
        type: 'bar',
        data: props.values,
        barWidth: props.barWidth,
        itemStyle: {
          color: props.barColor,
          borderRadius: [0, props.barWidth / 2, props.barWidth / 2, 0],
        },
      }],
    }
  }

  const backgroundSeries = props.areas.length
    ? [
        {
          type: 'bar',
          stack: 'chart-background',
          silent: true,
          barWidth: '100%',
          barCategoryGap: '0%',
          data: categories.map(() => Number(props.areas[0]?.from) || props.min),
          itemStyle: { color: 'transparent' },
          emphasis: { disabled: true },
          z: 0,
        },
        ...props.areas.map(area => ({
          type: 'bar',
          stack: 'chart-background',
          silent: true,
          barWidth: '100%',
          barCategoryGap: '0%',
          data: categories.map(() => Math.max(0, Number(area.to) - Number(area.from))),
          itemStyle: { color: area.color },
          emphasis: { disabled: true },
          z: 0,
        })),
      ]
    : []

  return {
    animation: false,
    grid: {
      left: 42,
      right: 14,
      top: 12,
      bottom: props.showXAxis ? 34 : 18,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: categories,
      axisLine: { show: props.showXAxis, lineStyle: { color: props.axisColor } },
      axisTick: { show: false },
      axisLabel: {
        show: props.showXAxis,
        color: props.labelColor,
        fontSize: 10,
        interval: 'auto',
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: props.min,
      max: props.max,
      splitNumber: 5,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: props.labelColor,
        fontSize: 10,
      },
      splitLine: {
        show: true,
        lineStyle: { color: props.splitLineColor, width: 1 },
      },
    },
    series: [
      ...backgroundSeries,
      {
        type: 'line',
        data: props.values,
        smooth: props.smooth,
        symbol: props.showSymbol ? 'circle' : 'none',
        symbolSize: 6,
        lineStyle: { color: props.lineColor, width: 2 },
        itemStyle: { color: props.lineColor },
        z: 3,
      },
    ],
  }
})

const chartPayload = computed(() => JSON.stringify({
  id: chartId,
  option: option.value,
}))

// #ifdef MP-WEIXIN
const componentInstance = getCurrentInstance()

function updateMiniProgramChart(retryCount = 0) {
  nextTick(() => {
    const scope = componentInstance?.proxy?.$scope as any
    const chartComponent = scope?.selectComponent?.(`#${chartId}`)
    if (chartComponent?.setOption) {
      chartComponent.setOption(option.value)
      return
    }
    if (retryCount < 10)
      setTimeout(() => updateMiniProgramChart(retryCount + 1), 50)
  })
}

onMounted(() => updateMiniProgramChart())
watch(option, () => updateMiniProgramChart(), { deep: true })
// #endif
</script>

<script module="chart" lang="renderjs">
/* eslint-disable import/first */
import { BarChart, LineChart, ScatterChart } from 'echarts/charts'
import { GridComponent, MarkAreaComponent } from 'echarts/components'
import * as webEcharts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

webEcharts.use([LineChart, BarChart, ScatterChart, GridComponent, MarkAreaComponent, CanvasRenderer])

export default {
  mounted() {
    this.render(this.chartPayload)
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect()
    this.instance?.dispose()
  },
  methods: {
    update(value) {
      this.render(value)
    },
    render(value, retryCount = 0) {
      if (!value)
        return
      const payload = JSON.parse(value)
      const element = document.getElementById(payload.id)
      if (!element) {
        if (retryCount < 10)
          requestAnimationFrame(() => this.render(value, retryCount + 1))
        return
      }
      if (!this.instance) {
        this.instance = webEcharts.init(element)
        if (typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(() => this.instance?.resize())
          this.resizeObserver.observe(element)
        }
      }
      this.instance.setOption(payload.option, true)
      this.instance.resize()
    },
  },
}
</script>

<style scoped>
.health-line-chart {
  display: block;
  width: 100%;
  height: 100%;
}

.health-line-chart-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
