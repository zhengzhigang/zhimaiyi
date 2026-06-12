import header1 from '../assets/health-report/check-report/report-header-1.jpg'
import header2 from '../assets/health-report/check-report/report-header-2.jpg'
import header3 from '../assets/health-report/check-report/report-header-3.jpg'
import header4 from '../assets/health-report/check-report/report-header-4.jpg'
import header5 from '../assets/health-report/check-report/report-header-5.jpg'
import header6 from '../assets/health-report/check-report/report-header-6.jpg'
import header7 from '../assets/health-report/check-report/report-header-7.jpg'

export const reportHeaders = [header1, header2, header3, header4, header5, header6, header7]

const indexFields = [
  ['heartRate', '心率', '/Min'],
  ['cardiacOutput', '心输出量', 'L/Min'],
  ['strokeVolume', '心搏出量', 'ML/Beat'],
  ['strokeVolumeIndex', '心搏指数', 'ML/Beat*M*M'],
  ['cardiacIndex', '心脏指数', 'L/Min*M*M'],
  ['peripheralResistance', '外周阻力', ''],
  ['bloodViscosity', '血液黏稠度', 'CP'],
  ['bloodVesselElasticity', '血管弹性', ''],
  ['arterialStiffnessIndex', '血管硬化指数', ''],
  ['selfDisciplineBalance', '自律平衡', ''],
  ['fatigueIndex', '疲劳程度', ''],
  ['heartRateVariability', '心率变异度', ''],
]

export interface CheckReportData {
  profile: Record<string, any>
  pulseName: string
  diagnosisTime: string
  suggestions: string[]
  features: Array<{ title: string, content: string }>
  indexes: any[]
  advice: Record<string, string>
  pulseValues: number[]
  reportNo: string
}

export function emptyReportData(): CheckReportData {
  return {
    profile: {
      account: '--',
      name: '未登录',
      gender: '--',
      age: '--',
      height: '--',
      weight: '--',
    },
    pulseName: '暂无脉象',
    diagnosisTime: '',
    suggestions: [],
    features: [],
    indexes: fillIndexes([]),
    advice: {},
    pulseValues: [],
    reportNo: '--',
  }
}

function formatDate(value: unknown) {
  return String(value || '').replace('T', ' ').replace(/\.\d{3}\+\d{2}:\d{2}$/, '')
}

function getStatusColor(item: Record<string, any>) {
  if (item.normal)
    return '#78b62f'
  if (item.color === 3)
    return '#e51c35'
  return '#f0a000'
}

function fillIndexes(list: any[]) {
  return indexFields.map(([label, title, symbol]) => {
    const matched = list.find(item => item.label === label || item.title === title)
    return matched || {
      id: label,
      label,
      title,
      value: '--',
      symbol,
      color: '#b7b7b7',
      normal: false,
      describe: '',
    }
  })
}

export function buildCheckReport(userInfo: Record<string, any>, summary: Record<string, any>, detail: Record<string, any>): CheckReportData {
  const rawIndexes = (Array.isArray(detail.bodyIndexList) ? detail.bodyIndexList : []).map(item => ({
    id: item.id || item.indexLabel,
    label: item.indexLabel || '',
    title: item.title || item.indexName || '指标',
    value: item.value === null || item.value === undefined ? '--' : String(item.value),
    symbol: item.symbol || '',
    describe: item.describe || '',
    color: getStatusColor(item),
    normal: Boolean(item.normal),
  }))
  const phone = String(userInfo.phone || summary.phone || '').trim()
  const userId = userInfo.id || summary.userId || summary.id || '--'

  return {
    profile: {
      account: phone || userId,
      name: userInfo.nickName || userInfo.userName || userInfo.name || summary.name || '未登录',
      gender: Number(userInfo.sex) === 2 ? '女' : '男',
      age: summary.age || '--',
      height: userInfo.height || summary.height || '--',
      weight: userInfo.weight || summary.weight || '--',
    },
    pulseName: detail.pulseManifestationName || summary.pulseDiagnosisName || '暂无脉象',
    diagnosisTime: formatDate(detail.diagnosisTimeStr),
    suggestions: String(detail.suggestion || '').split(/\n+/).map(item => item.trim()).filter(Boolean),
    features: [
      { title: '脉位脉深', content: detail.problemComment },
      { title: '脉象特点', content: detail.constitutionDiagnosis },
      { title: '易感症状', content: detail.susceptibleSymptoms },
      { title: '易患疾病', content: detail.susceptibleDisease },
    ].filter(item => item.content),
    indexes: fillIndexes(rawIndexes),
    advice: {
      stapleDiet: detail.constitutionReportEntity?.stapleDiet || '',
      life: detail.constitutionReportEntity?.life || '',
      seasonsDiet: detail.constitutionReportEntity?.seasonsDiet || '',
      emotionalAdjustment: detail.constitutionReportEntity?.emotionalAdjustment || '',
      homeHealthCare: detail.constitutionReportEntity?.homeHealthCare || '',
      drugCare: detail.constitutionReportEntity?.drugCare || '',
    },
    pulseValues: Array.isArray(detail.pluseData) ? detail.pluseData : [],
    reportNo: detail.id ? `TCM-${detail.id}` : '--',
  }
}
