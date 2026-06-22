# 蓝牙指脉仪检测小程序 - 开发计划（基于页面设计 v3.0）

## 文档说明
本计划基于用户提供的三个页面设计图，包含强制横屏展示要求，重新规划页面结构和开发内容。

---

## 一、页面结构总览

### 页面导航流程
```
首页入口 → 模式选择页（第1页）→ 操作引导页（第2页）→ 波形检测页（第3页）→ 返回首页
```

### 页面详细说明

| 页面序号 | 页面名称 | 路径 | 核心功能 |
|----------|----------|------|----------|
| 第1页 | 模式选择页 | `/pages-health/pulse/select-mode/index.vue` | 快速检测/全面检测按钮，跳转至操作引导页 |
| 第2页 | 操作引导页 | `/pages-health/pulse/guide/index.vue` | 操作图片展示、提示信息、开始检测按钮 |
| 第3页 | 波形检测页 | `/pages-health/pulse/detect/index.vue` | 波形图、环形进度条、重新检测、返回首页 |

### 检测模式定义

| 模式 | 说明 | 采集时长 |
|------|------|----------|
| 快速检测 | 短时间波形采集 | 约15秒 |
| 全面检测 | 完整波形采集并上传 | 2分钟 |

---

## 二、强制横屏方案

### 2.1 实现方式
使用 CSS 旋转 + 自适应布局实现伪横屏效果：

```css
.page-container {
  width: 100vh;
  height: 100vw;
  transform-origin: top left;
  transform: rotate(90deg) translateX(0);
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}
```

### 2.2 注意事项
- 微信小程序不支持原生横屏（仅游戏类目支持）
- 使用 CSS 旋转实现视觉横屏
- 适配不同屏幕尺寸和分辨率

---

## 三、页面详细设计

### 3.1 第1页：模式选择页

**路径**: `src/pages-health/pulse/select-mode/index.vue`

**UI布局**:
```
┌─────────────────────────────────────────┐
│                                         │
│           ┌───────────────────┐         │
│           │   快速检测按钮     │         │
│           │   (短时间检测)     │         │
│           └───────────────────┘         │
│                                         │
│           ┌───────────────────┐         │
│           │   全面检测按钮     │         │
│           │   (2分钟完整检测)  │         │
│           └───────────────────┘         │
│                                         │
│         蓝牙连接状态指示                 │
│                                         │
└─────────────────────────────────────────┘
```

**UI元素**:
| 元素 | 说明 |
|------|------|
| 快速检测按钮 | 紫色/蓝色按钮，点击跳转操作引导页，携带参数 mode=quick |
| 全面检测按钮 | 另一种颜色按钮，点击跳转操作引导页，携带参数 mode=full |
| 蓝牙状态指示 | 显示当前蓝牙连接状态（未连接/已连接） |
| 连接设备入口 | 未连接时显示连接按钮 |

**交互逻辑**:
1. 进入页面检查蓝牙连接状态
2. 未连接时提示连接设备
3. 点击按钮前预检查蓝牙状态
4. 跳转时传递检测模式参数

**路由参数**:
```typescript
// 跳转方式
uni.navigateTo({
    url: `/pages-health/pulse/guide/index?mode=quick` // quick | full
})
```

---

### 3.2 第2页：操作引导页

**路径**: `src/pages-health/pulse/guide/index.vue`

**UI布局**（参考用户提供的设计图）:
```
┌─────────────────────────────────────────┐
│                                         │
│  ← 返回                                 │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │                                  │   │
│  │  操作步骤图片（纵向排列4张）      │   │
│  │  1.手掌平放                      │   │
│  │  2.手指放置传感器                │   │
│  │  3.调整位置                      │   │
│  │  4.准备就绪                      │   │
│  │                                  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  请按照提示将手指放置在传感器，          │
│  然后点击开始检测                      │
│                                         │
│           ┌───────────────┐             │
│           │   开始检测    │             │
│           └───────────────┘             │
│                                         │
└─────────────────────────────────────────┘
```

**UI元素**:
| 元素 | 说明 |
|------|------|
| 返回按钮 | 左上角，返回模式选择页 |
| 操作步骤图片 | 纵向排列4张图片，展示佩戴步骤 |
| 提示信息 | "请按照提示将手指放置在传感器，然后点击开始检测" |
| 开始检测按钮 | 紫色圆角按钮，点击跳转检测页面 |

**交互逻辑**:
1. 获取路由参数中的检测模式
2. 检查蓝牙连接状态
3. 未连接设备时提示"请正确连接检测设备后检测！"
4. 点击开始检测按钮，跳转至检测页面

**操作步骤图片说明**:
1. 第一张：手掌平放于桌面上
2. 第二张：手指靠近传感器（未接触）
3. 第三张：手指放置在传感器上
4. 第四张：手指稳定放置，准备检测

---

### 3.3 第3页：波形检测页

**路径**: `src/pages-health/pulse/detect/index.vue`

**UI布局**（参考用户提供的设计图）:
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │                                          │   │
│  │          Canvas 波形显示区域              │   │
│  │         (蓝绿色背景，白色波形线)           │   │
│  │                                          │   │
│  │   0  20  40  60  80  100  (X轴刻度)     │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│                    返回首页                      │
│                                                 │
│              ┌─────────────┐                   │
│              │   环形进度条  │                   │
│              │    25%       │                   │
│              └─────────────┘                   │
│                                                 │
│                    重新检测                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**UI元素**:
| 元素 | 说明 |
|------|------|
| 波形显示区域 | Canvas绘制，蓝绿色背景，白色波形线，从左向右滚动 |
| X轴刻度 | 0-100刻度标识 |
| 返回首页按钮 | 右上角，点击返回小程序首页（非检测首页） |
| 环形进度条 | 显示检测进度百分比（如25%） |
| 重新检测按钮 | 底部，点击重新开始检测流程 |

**交互逻辑**:
1. 页面加载时检查蓝牙连接状态
2. 根据检测模式发送对应指令
3. 实时接收波形数据并绘制
4. 更新环形进度条
5. 检测结束后自动停止，可重新检测或返回首页

**检测模式处理**:
- **快速检测**: 发送 `CMD_RAW_LIGHT_COLLECT`，检测约15秒后自动停止
- **全面检测**: 发送 `CMD_RAW_LIGHT_COLLECT`，检测2分钟后自动停止并上传数据

---

## 四、核心常量配置（基于PC端实现）

### 4.1 蓝牙协议常量

| 常量名 | 值 | 说明 |
|--------|-----|------|
| FRAME_HEAD | 0x5A | 帧头 |
| FRAME_TAIL | 0xA5 | 帧尾 |

### 4.2 指令集

| 指令名 | 值(Hex) | 说明 |
|--------|---------|------|
| CMD_HEART_BEAT | 0x00 | 心跳保活 |
| CMD_SPO2_COLLECT | 0x01 | 开始血氧采集 |
| CMD_RAW_LIGHT_COLLECT | 0x02 | 开始原始波形采集 |
| CMD_STOP | 0x03 | 停止采集 |
| CMD_POWER_OFF | 0x04 | 设备关机 |

### 4.3 UUID配置

| 常量名 | 值 |
|--------|-----|
| SERVICE_UUID | 0000ffe0-0000-1000-8000-00805f9b34fb |
| CHAR_WRITE_UUID | 0000ffe2-0000-1000-8000-00805f9b34fb |
| CHAR_READ_UUID | 0000ffe1-0000-1000-8000-00805f9b34fb |

### 4.4 波形异常过滤配置

| 常量名 | 值 |
|--------|-----|
| ADC_MIN | 0 |
| ADC_MAX | 65535 |
| MAX_JUMP_DELTA | 8000 |
| MAX_CONTINUE_ERROR | 5 |

### 4.5 基线漂移抑制配置

| 常量名 | 值 |
|--------|-----|
| BASELINE_WINDOW | 120 |
| BASELINE_FILTER_ALPHA | 0.02 |
| DRAW_CENTER | 0 |

### 4.6 采样与显示配置

| 常量名 | 值 | 说明 |
|--------|-----|------|
| MAX_POINT | 600 | Canvas波形最大显示点数 |
| COLLECT_DURATION_FULL | 120000ms | 全面检测时长（2分钟） |
| COLLECT_DURATION_QUICK | 15000ms | 快速检测时长（15秒） |
| HEART_BEAT_INTERVAL | 60000ms | 心跳保活间隔 |

### 4.7 调试参数

| 参数名 | 默认值 |
|--------|--------|
| amplitudeRatio | 0.1 |
| xStep | 1 |
| yStep | 80 |
| filterAlpha | 0.3 |
| verticalBaseOffset | 32768 |

---

## 五、核心算法实现

### 5.1 一阶滤波算法
```javascript
function firstOrderFilter(newVal, oldVal, alpha = 0.3) {
    return oldVal + alpha * (newVal - oldVal);
}
```

### 5.2 直流偏置去除与基线漂移抑制算法
```javascript
function removeDCAndDrift(val, baselineQueue, smoothBaseline) {
    baselineQueue.push(val);
    if (baselineQueue.length > 120) baselineQueue.shift();
    let mean = baselineQueue.reduce((acc, cur) => acc + cur, 0) / baselineQueue.length;
    smoothBaseline = smoothBaseline + 0.02 * (mean - smoothBaseline);
    return val - smoothBaseline;
}
```

### 5.3 三次样条插值算法（200Hz → 240Hz）
- 系数求解函数: calcSplineCoeff(x, y)
- 重采样函数: cubicSplineResample(originArr, targetHz = 240, originHz = 200)
- 最终映射: convertTo0_255(arr) → 范围 0~255

### 5.4 异常值过滤算法
```javascript
function isWaveValueValid(val, lastVal) {
    if (val < 0 || val > 65535) return false;
    if (lastVal !== undefined && Math.abs(val - lastVal) > 8000) return false;
    return true;
}
```

---

## 六、API接口对接

### 6.1 波形数据上传接口

| 项目 | 值 |
|------|-----|
| URL | http://101.200.234.162:8199/extapi/getwaveresultnew |
| Method | POST |
| Content-Type | application/json |

### 6.2 请求数据格式
```json
{
    "uid": "",
    "paraa": [],
    "parab": [],
    "parac": [255, 128, 64, ...],
    "user": {
        "sex": 1
    }
}
```

---

## 七、功能模块开发计划

### 阶段一：蓝牙连接服务层

**文件结构**:
```
src/utils/bluetooth/
├── index.ts          # 蓝牙管理器主文件
├── types.ts          # 类型定义
├── constants.ts      # 常量配置
├── protocol.ts       # 协议解析器
└── algorithms.ts     # 滤波/基线算法
```

**功能清单**:
| 功能 | 实现方式 |
|------|----------|
| 蓝牙模块初始化 | uni.openBluetoothAdapter |
| 设备搜索 | uni.startBluetoothDevicesDiscovery |
| 设备连接 | uni.createBLEConnection |
| 服务特征值获取 | uni.getBLEDeviceServices / getBLEDeviceCharacteristics |
| 开启通知 | uni.notifyBLECharacteristicValueChange |
| 写入指令 | uni.writeBLECharacteristicValue |
| 数据接收 | uni.onBLECharacteristicValueChange |
| 心跳保活 | setInterval + sendCmd(CMD_HEART_BEAT) |

---

### 阶段二：状态管理层（Pinia Store）

**文件**: `src/store/bluetooth.ts`

**状态定义**:
```typescript
interface BluetoothState {
    // 连接状态
    isConnected: boolean;
    deviceName: string;
    deviceId: string;
    
    // 检测状态
    collectMode: 0 | 1 | 2;           // MODE_STOP | MODE_SPO2 | MODE_RAW_LIGHT
    detectType: 'quick' | 'full';     // 检测类型
    isDetecting: boolean;
    isCollectingFullWave: boolean;
    
    // 数据
    heartRate: number;
    spo2: number;
    wavePoints: number[];
    filterPoints: number[];
    fullWaveData: number[];
    
    // 采样率统计
    instantSampleRate: number;
    avgSampleRate: number;
    
    // 进度
    collectProgress: number;
    remainingTime: number;
    
    // 调试参数
    amplitudeRatio: number;
    xStep: number;
    yStep: number;
    filterAlpha: number;
    verticalBaseOffset: number;
}
```

**Actions**:
- connectDevice()
- disconnectDevice()
- sendCommand(cmd)
- startQuickDetect()
- startFullDetect()
- stopCollect()
- powerOff()
- resetDetect()

---

### 阶段三：横屏布局组件

**文件**: `src/components/layout/LandscapePage.vue`

**功能**:
- 提供强制横屏容器
- 处理旋转和适配逻辑
- 封装通用横屏页面结构

---

### 阶段四：模式选择页（第1页）

**文件**: `src/pages-health/pulse/select-mode/index.vue`

**功能**:
1. 横屏布局展示
2. 快速检测按钮（跳转操作引导页，mode=quick）
3. 全面检测按钮（跳转操作引导页，mode=full）
4. 蓝牙连接状态显示
5. 蓝牙连接入口

---

### 阶段五：操作引导页（第2页）

**文件**: `src/pages-health/pulse/guide/index.vue`

**功能**:
1. 横屏布局展示
2. 返回按钮（返回模式选择页）
3. 操作步骤图片展示（4张）
4. 提示信息文字
5. 开始检测按钮（跳转检测页面）
6. 蓝牙状态检查

---

### 阶段六：波形检测页（第3页）

**文件**: `src/pages-health/pulse/detect/index.vue`

**功能**:
1. 横屏布局展示
2. Canvas波形绘制（蓝绿色背景，白色波形线）
3. X轴刻度显示（0-100）
4. 返回首页按钮
5. 环形进度条（百分比显示）
6. 重新检测按钮
7. 根据模式执行不同时长检测
8. 全面检测结束后上传数据

---

### 阶段七：数据上传功能

**文件**: `src/api/health/bluetooth.ts`

**功能**:
1. 数据预处理（去直流偏置 + 三次样条插值 + 映射0-255）
2. API调用上传波形数据
3. 上传结果处理

---

### 阶段八：配置与权限

**文件**: `manifest.config.ts`

**配置项**:
```typescript
'mp-weixin': {
    permission: {
        'scope.bluetooth': {
            desc: '蓝牙连接血氧设备'
        }
    }
}
```

---

## 八、开发文件清单

| 序号 | 文件路径 | 说明 | 阶段 |
|------|----------|------|------|
| 1 | src/utils/bluetooth/constants.ts | 蓝牙常量配置 | 1 |
| 2 | src/utils/bluetooth/types.ts | TypeScript类型定义 | 1 |
| 3 | src/utils/bluetooth/algorithms.ts | 滤波/基线算法 | 1 |
| 4 | src/utils/bluetooth/protocol.ts | 协议解析器 | 1 |
| 5 | src/utils/bluetooth/index.ts | 蓝牙管理器主文件 | 1 |
| 6 | src/store/bluetooth.ts | Pinia状态管理 | 2 |
| 7 | src/components/layout/LandscapePage.vue | 横屏布局组件 | 3 |
| 8 | src/pages-health/pulse/select-mode/index.vue | 模式选择页 | 4 |
| 9 | src/pages-health/pulse/guide/index.vue | 操作引导页 | 5 |
| 10 | src/pages-health/pulse/detect/index.vue | 波形检测页 | 6 |
| 11 | src/api/health/bluetooth.ts | 数据上传API | 7 |
| 12 | manifest.config.ts | 权限配置（改造） | 8 |
| 13 | pages.config.ts | 页面路由配置（改造） | 5 |

---

## 九、页面路由配置

**新增路由**:
```typescript
// pages.config.ts 中新增
{
    path: '/pages-health/pulse/select-mode/index',
    style: {
        navigationStyle: 'custom',
        navigationBarTitleText: '检测模式选择'
    }
},
{
    path: '/pages-health/pulse/guide/index',
    style: {
        navigationStyle: 'custom',
        navigationBarTitleText: '操作引导'
    }
},
{
    path: '/pages-health/pulse/detect/index',
    style: {
        navigationStyle: 'custom',
        navigationBarTitleText: '波形检测'
    }
}
```

---

## 十、开发顺序与依赖关系

```
第一周
├── Day 1-2: 阶段一（蓝牙连接服务层）
│   └── 基础：初始化、搜索、连接、写入、接收
├── Day 3: 阶段二（状态管理层）
│   └── 依赖：阶段一
├── Day 4: 阶段三（横屏布局组件）
│   └── 依赖：无
└── Day 5: 阶段四（模式选择页）
    └── 依赖：阶段二、三

第二周
├── Day 6: 阶段五（操作引导页）
│   └── 依赖：阶段三
├── Day 7-10: 阶段六（波形检测页）
│   └── 依赖：阶段一、二、三
└── Day 11-12: 阶段七（数据上传）
    └── 依赖：阶段六

第三周
└── Day 13: 阶段八（配置完善）
    └── 依赖：全部
```

---

## 十一、关键技术难点

### 11.1 强制横屏实现
- 使用 CSS 旋转实现伪横屏
- 适配不同屏幕尺寸
- 处理状态栏和安全区域

### 11.2 Canvas波形绘制
- 蓝绿色背景，白色波形线
- X轴刻度显示（0-100）
- 从左向右滚动绘制
- 性能优化（requestAnimationFrame）

### 11.3 环形进度条
- SVG绘制环形进度
- 百分比文字居中显示
- 动画过渡效果

### 11.4 蓝牙数据处理
- 粘包/拆包处理
- 异常值过滤
- 基线漂移抑制

---

## 十二、测试用例

### 12.1 页面导航测试
| 用例 | 预期结果 |
|------|----------|
| 点击快速检测 | 跳转到操作引导页 |
| 点击全面检测 | 跳转到操作引导页 |
| 操作引导页返回 | 返回模式选择页 |
| 点击开始检测 | 跳转到检测页面 |
| 检测页返回首页 | 返回小程序首页 |
| 点击重新检测 | 重新开始检测流程 |

### 12.2 检测功能测试
| 用例 | 预期结果 |
|------|----------|
| 快速检测 | 15秒后自动停止 |
| 全面检测 | 2分钟后自动停止并上传 |
| 波形显示 | Canvas实时绘制波形 |
| 进度条 | 百分比正确更新 |

### 12.3 蓝牙连接测试
| 用例 | 预期结果 |
|------|----------|
| 未连接设备点击开始检测 | 提示"请正确连接检测设备后检测！" |
| 蓝牙断开 | 提示重连 |

---

## 十三、风险与注意事项

1. **横屏适配**: 需要处理不同屏幕比例和分辨率
2. **蓝牙权限**: iOS需要配置permission说明
3. **小程序后台**: 进入后台蓝牙可能断开
4. **Canvas性能**: 控制数据点数量，避免卡顿
5. **API白名单**: 确认接口域名已添加白名单