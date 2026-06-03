interface symptomType {
  symptomDuration1Ids: string
  symptomDuration1Names: string
  symptomDuration2Ids: string
  symptomDuration2Names: string
  symptomDuration3Ids: string
  symptomDuration3Names: string
  symptomIds: string
  symptomNames: string
  symptomOther: string
}
function str2arr(str: string): number[] {
  return str?.split(',')
    .filter(item => item !== '26' && item)
    .map(item => Number(item)) ?? []
}
/**
 * 主诉格式化
 * @param symptom symptomType
 * @returns { name: string; label: string; value: string[] }[]
 */
export function formatSymptom(symptom: symptomType): { id: number, name: string, label: string, value: number[] }[] {
  return [
    {
      id: 0,
      name: '近期个人症状',
      label: symptom.symptomNames,
      value: str2arr(symptom.symptomIds),
    },
    {
      id: 1,
      name: '1个月至3个月症状',
      label: symptom.symptomDuration1Names,
      value: str2arr(symptom.symptomDuration1Ids),
    },
    {
      id: 2,
      name: '3个月至1年症状',
      label: symptom.symptomDuration2Names,
      value: str2arr(symptom.symptomDuration2Ids),
    },
    {
      id: 3,
      name: '1年至5年症状',
      label: symptom.symptomDuration3Names,
      value: str2arr(symptom.symptomDuration3Ids),
    },
    {
      id: 4,
      name: '其他症状',
      label: symptom.symptomOther,
      value: [],
    },
  ]
}

export const initSymptomArr = [
  {
    id: 0,
    name: '近期个人症状',
    label: '',
    value: [],
  },
  {
    id: 1,
    name: '1个月至3个月症状',
    label: '',
    value: [],
  },
  {
    id: 2,
    name: '3个月至1年症状',
    label: '',
    value: [],
  },
  {
    id: 3,
    name: '1年至5年症状',
    label: '',
    value: [],
  },
  {
    id: 4,
    name: '其他症状',
    label: '',
    value: [],
  },
]
