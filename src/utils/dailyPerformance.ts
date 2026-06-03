import type { getLastDailyRes } from '@/api/consultation/index.typings'

export const question = [
  {
    name: '说话声音',
    prop: 'talkingSound',
    option: ['大而有力', '弱而无力', '懒言无语', '胡言乱语', '大笑诳语', '没有异常'],
    isAll: true,
  },
  {
    name: '咳嗽声音',
    prop: 'coughSound',
    option: ['咳声响亮', '咳声沉闷', '咳声浑浊', '咳声干涩', '咳声急促', '没有异常'],
    isAll: true,
  },
  {
    name: '闻体',
    prop: 'smellBody',
    option: ['恶臭气味', '尿臊气味', '酸腥气为', '狐臭气味', '酸性气味', '没有异常'],
    isAll: true,
  },
  {
    name: '闻声',
    prop: 'hear',
    option: ['呃逆', '嗳气', '叹息', '呕吐', '吞酸', '没有异常'],
    isAll: true,
  },
  {
    name: '呼吸',
    prop: 'breathing',
    option: ['气粗', '气短', '气喘', '哮鸣', '痰鸣', '没有异常'],
    isAll: true,
  },
  {
    name: '女性白带',
    prop: 'femaleLeucorrhea',
    option: ['腥秽', '恶臭', '腥臭', '腥味', '没有异常'],
    isAll: false,
  },
  {
    name: '二便(大小便)情况',
    prop: 'defecation',
    option: [
      '尿量过少',
      '尿量过多',
      '小便清长',
      '小便浑浊',
      '小便起泡',
      '小便下坠',
      '小便发热',
      '尿频尿急',
      '起夜多',
      '排便不爽',
      '肛门下坠',
      '肛门灼热',
      '大便溏稀',
      '大便脓血',
      '大便干结',
      '大便痢下',
      '没有异常',
    ],
    isAll: true,
  },
]
/**
 * 获取日常表现自测文本数组
 * @param obj 日常表现对象
 * @returns 文本数组
 */
export function getDailyTextArr(obj: getLastDailyRes | null): { name: string, text: string }[] {
  if (!obj)
    return []
  const arr = []
  question.forEach((item, index) => {
    if (!obj[item.prop]) {
      return
    }
    const text = obj[item.prop]
      .split(',')
      .map(index => item.option[+index])
      .filter(item => item !== '没有异常')
      .join('，')
    console.log('🚀 ~ text:', text)
    if (text) {
      arr.push({
        name: item.name,
        text,
      })
    }
  })
  return arr
}
