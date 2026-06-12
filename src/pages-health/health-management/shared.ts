import arterialStiffnessIndexIcon from '../assets/health-management/body-index/arterial-stiffness-index.png'
import bloodVesselElasticityIcon from '../assets/health-management/body-index/blood-vessel-elasticity.png'
import bloodViscosityIcon from '../assets/health-management/body-index/blood-viscosity.png'
import cardiacIndexIcon from '../assets/health-management/body-index/cardiac-index.png'
import cardiacOutputIcon from '../assets/health-management/body-index/cardiac-output.png'
import fatigueIndexIcon from '../assets/health-management/body-index/fatigue-index.png'
import heartRateVariabilityIcon from '../assets/health-management/body-index/heart-rate-variability.png'
import heartRateIcon from '../assets/health-management/body-index/heart-rate.png'
import peripheralResistanceIcon from '../assets/health-management/body-index/peripheral-resistance.png'
import selfDisciplineBalanceIcon from '../assets/health-management/body-index/self-discipline-balance.png'
import strokeVolumeIndexIcon from '../assets/health-management/body-index/stroke-volume-index.png'
import strokeVolumeIcon from '../assets/health-management/body-index/stroke-volume.png'
import drugCareIcon from '../assets/health-management/conditioning-advice/drug-care.png'
import emotionalAdjustmentIcon from '../assets/health-management/conditioning-advice/emotional-adjustment.png'
import homeHealthCareIcon from '../assets/health-management/conditioning-advice/home-health-care.png'
import lifeIcon from '../assets/health-management/conditioning-advice/life.png'
import seasonsDietIcon from '../assets/health-management/conditioning-advice/seasons-diet.png'
import sportIcon from '../assets/health-management/conditioning-advice/sport.png'
import stapleDietIcon from '../assets/health-management/conditioning-advice/staple-diet.png'
import ageIcon from '../assets/health-management/profile/age.png'
import genderIcon from '../assets/health-management/profile/gender.png'

export const profileIcons = {
  age: ageIcon,
  gender: genderIcon,
}

export const bodyIndexIcons: Record<string, string> = {
  arterialStiffnessIndex: arterialStiffnessIndexIcon,
  bloodVesselElasticity: bloodVesselElasticityIcon,
  bloodViscosity: bloodViscosityIcon,
  cardiacIndex: cardiacIndexIcon,
  cardiacOutput: cardiacOutputIcon,
  fatigueIndex: fatigueIndexIcon,
  heartRate: heartRateIcon,
  heartRateVariability: heartRateVariabilityIcon,
  peripheralResistance: peripheralResistanceIcon,
  selfDisciplineBalance: selfDisciplineBalanceIcon,
  strokeVolume: strokeVolumeIcon,
  strokeVolumeIndex: strokeVolumeIndexIcon,
}

const titleIconMap: Record<string, string> = {
  心率: heartRateIcon,
  心输出量: cardiacOutputIcon,
  心搏出量: strokeVolumeIcon,
  心搏指数: strokeVolumeIndexIcon,
  心脏指数: cardiacIndexIcon,
  血液黏度: bloodViscosityIcon,
  血液黏稠度: bloodViscosityIcon,
  血管弹性: bloodVesselElasticityIcon,
  血管硬化指数: arterialStiffnessIndexIcon,
  疲劳程度: fatigueIndexIcon,
  外周阻力: peripheralResistanceIcon,
  心率变异度: heartRateVariabilityIcon,
  自律平衡: selfDisciplineBalanceIcon,
}

const normalizedBodyIndexIcons = Object.fromEntries(
  Object.entries({ ...bodyIndexIcons, ...titleIconMap })
    .map(([key, icon]) => [normalizeBodyIndexKey(key), icon]),
)

function normalizeBodyIndexKey(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

export function resolveBodyIndexIcon(item: Record<string, any> = {}) {
  const candidates = [
    item.indexLabel,
    item.label,
    item.indexCode,
    item.code,
    item.title,
    item.indexName,
    item.name,
  ]

  for (const candidate of candidates) {
    const icon = normalizedBodyIndexIcons[normalizeBodyIndexKey(candidate)]
    if (icon)
      return icon
  }
  return ''
}

export const adviceFields = [
  { key: 'stapleDiet', icon: stapleDietIcon, title: '膳食选择' },
  { key: 'life', icon: lifeIcon, title: '日常生活' },
  { key: 'sport', icon: sportIcon, title: '运动建议' },
  { key: 'seasonsDiet', icon: seasonsDietIcon, title: '四季养生' },
  { key: 'emotionalAdjustment', icon: emotionalAdjustmentIcon, title: '情志调摄' },
  { key: 'homeHealthCare', icon: homeHealthCareIcon, title: '居家保健' },
  { key: 'drugCare', icon: drugCareIcon, title: '药物调养' },
]

export function formatNumber(value: unknown) {
  if (value === null || value === undefined || value === '')
    return '--'
  const numberValue = Number(value)
  return Number.isFinite(numberValue)
    ? String(Math.round(numberValue * 100) / 100)
    : String(value)
}

export function getIndexStatus(item: Record<string, any>) {
  if (item.normal)
    return { text: '标准', className: 'normal' }
  if (item.color === 3)
    return { text: '过高', className: 'high' }
  return { text: item.local === 3 ? '偏低' : '偏高', className: 'warning' }
}

export function buildBodyIndexes(list: any[] = []) {
  return list.map((item) => {
    const title = item.title || item.indexName || ''
    const status = getIndexStatus(item)
    return {
      ...item,
      id: item.id || item.indexLabel,
      rawId: item.id || '',
      indexLabel: item.indexLabel || '',
      title,
      value: formatNumber(item.value),
      symbol: item.symbol || '',
      icon: resolveBodyIndexIcon(item),
      statusText: status.text,
      statusClass: status.className,
      expanded: false,
      chartReady: false,
      showTip: false,
    }
  })
}

export function buildAdviceList(report: Record<string, any> = {}) {
  return adviceFields
    .filter(item => report[item.key])
    .map(item => ({ ...item, content: report[item.key] }))
}

export function getAge(birthday: unknown) {
  if (!birthday)
    return ''
  const birthDate = new Date(birthday as string | number)
  if (Number.isNaN(birthDate.getTime()))
    return ''
  const now = new Date()
  let age = now.getFullYear() - birthDate.getFullYear()
  const monthDiff = now.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate()))
    age -= 1
  return age > 0 ? `${age}周岁` : ''
}

export function buildProfile(userInfo: Record<string, any> = {}) {
  return {
    name: userInfo.nickName || userInfo.userName || userInfo.name || '未登录',
    id: userInfo.cardNo || userInfo.id || '',
    gender: Number(userInfo.sex) === 2 ? '女' : '男',
    age: getAge(userInfo.birthday),
    avatar: userInfo.headImageUrl || userInfo.headPic || '',
  }
}

export function showError(title: string) {
  uni.showToast({ title, icon: 'none' })
}
