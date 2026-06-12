import WxCanvas from './wx-canvas'
import * as echarts from './echarts'

let ctx

Component({
	properties: {
		canvasId: {
			type: String,
			value: 'ec-canvas'
		},
		ec: {
			type: Object,
			value: null
		},
		option: {
			type: Object,
			value: null,
			observer(option) {
				if (this.chart && option) {
					this.chart.setOption(option, true)
				}
			}
		}
	},

	ready() {
		const canvasId = this.id || this.data.canvasId
		if (canvasId !== this.data.canvasId)
			this.setData({ canvasId }, () => this.startInit())
		else
			this.startInit()
	},

	methods: {
		startInit() {
			if (this._initialized)
				return

			this._initialized = true
			if (!this.data.ec || !this.data.ec.lazyLoad)
				this.init()
		},

		init(callback, retryCount = 0) {
			const version = wx.getSystemInfoSync().SDKVersion
				.split('.')
				.map(number => Number.parseInt(number, 10))
			const isValid = version[0] > 1
				|| (version[0] === 1 && version[1] > 9)
				|| (version[0] === 1 && version[1] === 9 && version[2] >= 91)

			if (!isValid) {
				console.error('WeChat base library 1.9.91 or newer is required')
				return
			}

			ctx = wx.createCanvasContext(this.data.canvasId, this)
			const canvas = new WxCanvas(ctx, this.data.canvasId)
			echarts.setCanvasCreator(() => canvas)

			wx.createSelectorQuery()
				.in(this)
				.select('.ec-canvas')
				.boundingClientRect((rect) => {
					if (!rect || !rect.width || !rect.height) {
						if (retryCount < 10)
							setTimeout(() => this.init(callback, retryCount + 1), 50)
						return
					}

					if (typeof callback === 'function') {
						this.chart = callback(canvas, rect.width, rect.height)
					}
					else if (this.data.ec && typeof this.data.ec.onInit === 'function') {
						this.chart = this.data.ec.onInit(canvas, rect.width, rect.height)
					}
					else {
						this.chart = echarts.init(canvas, undefined, {
							width: rect.width,
							height: rect.height
						})
						canvas.setChart(this.chart)
						const option = this._pendingOption || this.data.option
						if (option)
							this.chart.setOption(option, true)
					}

					this.triggerEvent('init', {
						canvas,
						width: rect.width,
						height: rect.height
					})
				})
				.exec()
		},

		setOption(option) {
			if (!option)
				return
			this._pendingOption = option
			if (this.chart)
				this.chart.setOption(option, true)
			else
				this.startInit()
		},

		canvasToTempFilePath(options) {
			const fileOptions = {
				...options,
				canvasId: options.canvasId || this.data.canvasId
			}
			ctx.draw(true, () => {
				wx.canvasToTempFilePath(fileOptions, this)
			})
		},

		touchStart(event) {
			if (!this.chart || !event.touches.length)
				return
			const touch = event.touches[0]
			const handler = this.chart.getZr().handler
			handler.dispatch('mousedown', { zrX: touch.x, zrY: touch.y })
			handler.dispatch('mousemove', { zrX: touch.x, zrY: touch.y })
			handler.processGesture(wrapTouch(event), 'start')
		},

		touchMove(event) {
			if (!this.chart || !event.touches.length)
				return
			const touch = event.touches[0]
			const handler = this.chart.getZr().handler
			handler.dispatch('mousemove', { zrX: touch.x, zrY: touch.y })
			handler.processGesture(wrapTouch(event), 'change')
		},

		touchEnd(event) {
			if (!this.chart)
				return
			const touch = event.changedTouches ? event.changedTouches[0] : {}
			const handler = this.chart.getZr().handler
			handler.dispatch('mouseup', { zrX: touch.x, zrY: touch.y })
			handler.dispatch('click', { zrX: touch.x, zrY: touch.y })
			handler.processGesture(wrapTouch(event), 'end')
		}
	}
})

function wrapTouch(event) {
	for (let index = 0; index < event.touches.length; index++) {
		const touch = event.touches[index]
		touch.offsetX = touch.x
		touch.offsetY = touch.y
	}
	return event
}
