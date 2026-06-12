<template>
  <view class="report-page">
    <button class="pdf-button" :disabled="exporting" @click="handleExportPdf">
      {{ exporting ? '正在生成...' : '保存 PDF' }}
    </button>
    <view v-if="loading" class="loading">
      报告加载中...
    </view>
    <view v-else id="report-content" class="report-content">
      <check-report
        v-for="pageNo in 7"
        :key="pageNo"
        :page-no="pageNo"
        :data="reportData"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { getHealthSummary, getPulseDiagnosisInfoDetail } from '../health-management/api'
import CheckReport from './components/CheckReport.vue'
import { buildCheckReport, emptyReportData } from './shared'

definePage({
  style: {
    navigationBarTitleText: '检测报告',
  },
})

const userStore = useUserStore()
const loading = ref(true)
const exporting = ref(false)
const reportData = ref(emptyReportData())
const pulseDiagnosisId = ref<number | string>('')

onLoad(loadReport)

async function loadReport() {
  try {
    const summary = (await getHealthSummary(userStore.userInfo.id)).data || {}
    const detail = summary.pulseDiagnosisId
      ? (await getPulseDiagnosisInfoDetail(summary.pulseDiagnosisId)).data || {}
      : {}
    reportData.value = buildCheckReport(userStore.userInfo, summary, detail)
    pulseDiagnosisId.value = summary.pulseDiagnosisId || detail.id || ''
  }
  catch (error) {
    console.warn('获取检查报告数据失败', error)
  }
  finally {
    loading.value = false
  }
}

async function handleExportPdf() {
  if (exporting.value)
    return

  // #ifdef MP-WEIXIN
  if (!pulseDiagnosisId.value || !userStore.userInfo.id) {
    uni.showModal({
      title: '暂时无法保存',
      content: '当前报告参数不完整，请稍后重试。',
      showCancel: false,
    })
    return
  }

  const baseUrl = import.meta.env.VITE_APP_IMAGE_BASEURL.replace(/\/+$/, '')
  const downloadUrl = `${baseUrl}/#/pulseD?pd=${encodeURIComponent(pulseDiagnosisId.value)}&ud=${encodeURIComponent(userStore.userInfo.id)}`
  const modalResult = await uni.showModal({
    title: '浏览器下载',
    content: `请复制地址后，打开浏览器进行粘贴下载：\n${downloadUrl}`,
    confirmText: '复制地址',
    cancelText: '取消',
  })
  if (modalResult.confirm) {
    await uni.setClipboardData({
      data: downloadUrl,
    })
  }
  return
  // #endif

  // #ifdef H5
  const reportElement = document.querySelector<HTMLElement>('#report-content')
  if (!reportElement) {
    uni.showToast({ title: '报告内容尚未加载', icon: 'none' })
    return
  }

  exporting.value = true
  uni.showLoading({ title: '正在生成 PDF', mask: true })
  try {
    await waitForReportAssets(reportElement)
    const { default: html2pdf } = await import('html2pdf.js/dist/html2pdf.bundle.min.js')
    await html2pdf()
      .set({
        filename: `检测报告-${reportData.value.profile.name || '用户'}.pdf`,
        margin: 0,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
      })
      .from(reportElement)
      .save()
  }
  catch (error) {
    console.warn('保存 PDF 报告失败', error)
    uni.showToast({ title: 'PDF 保存失败，请重试', icon: 'none' })
  }
  finally {
    exporting.value = false
    uni.hideLoading()
  }
  // #endif
}

// #ifdef H5
async function waitForReportAssets(element: HTMLElement) {
  await nextTick()
  await document.fonts?.ready

  const pendingImages = Array.from(element.querySelectorAll('img'))
    .filter(image => !image.complete)
    .map(image => new Promise<void>((resolve) => {
      image.addEventListener('load', () => resolve(), { once: true })
      image.addEventListener('error', () => resolve(), { once: true })
    }))
  await Promise.all(pendingImages)
}
// #endif
</script>

<style scoped>
.report-page {
  min-height: 100vh;
  padding-bottom: 120rpx;
  background: #fff;
}
.loading {
  padding-top: 240rpx;
  color: #888;
  text-align: center;
}
.report-content {
  background: #fff;
}
.pdf-button {
  position: fixed;
  left: 50%;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 190rpx;
  height: 76rpx;
  padding: 0;
  border-radius: 38rpx;
  color: #fff;
  background: #14b4bc;
  box-shadow: 0 8rpx 24rpx rgba(20, 180, 188, 0.28);
  font-size: 25rpx;
  line-height: 1;
  text-align: center;
  transform: translateX(-50%);
}
.pdf-button[disabled] {
  opacity: 0.72;
}
.pdf-button::after {
  border: 0;
}

@media print {
  .report-page {
    padding-bottom: 0;
  }

  .pdf-button {
    display: none;
  }
}
</style>
