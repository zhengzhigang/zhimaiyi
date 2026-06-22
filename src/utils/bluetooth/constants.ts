/**
 * 蓝牙协议常量
 */

// 帧头帧尾
export const FRAME_HEAD = 0x5A
export const FRAME_TAIL = 0xA5

// 指令集
export const CMD_HEART_BEAT = 0x00
export const CMD_SPO2_COLLECT = 0x01
export const CMD_RAW_LIGHT_COLLECT = 0x02
export const CMD_STOP = 0x03
export const CMD_POWER_OFF = 0x04

// UUID配置
export const SERVICE_UUID = '0000FFE0-0000-1000-8000-00805F9B34FB'
export const CHAR_WRITE_UUID = '0000FFE2-0000-1000-8000-00805F9B34FB'
export const CHAR_READ_UUID = '0000FFE1-0000-1000-8000-00805F9B34FB'

// 波形异常过滤配置
export const ADC_MIN = 0
export const ADC_MAX = 65535
export const MAX_JUMP_DELTA = 8000
export const MAX_CONTINUE_ERROR = 5

// 基线漂移抑制配置
export const BASELINE_WINDOW = 120
export const BASELINE_FILTER_ALPHA = 0.02
export const DRAW_CENTER = 0

// 采样与显示配置
export const MAX_POINT = 600
export const COLLECT_DURATION_FULL = 180000 // 3分钟
export const COLLECT_DURATION_QUICK = 120000 // 2分钟
export const HEART_BEAT_INTERVAL = 60000 // 心跳保活间隔

// 调试参数默认值
export const DEFAULT_AMPLITUDE_RATIO = 0.1
export const DEFAULT_X_STEP = 1
export const DEFAULT_Y_STEP = 80
export const DEFAULT_FILTER_ALPHA = 0.3
export const DEFAULT_VERTICAL_BASE_OFFSET = 32768
