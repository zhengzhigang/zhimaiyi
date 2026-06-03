import { GenderType } from '../login.typings'

export interface diseaseType {
  id: number
  categoryId: number
  diseaseName: string
  sort: number
  isDel: number
  addTime: string
  updateTime: string
  addUser: number
  updateUser: number
  isChecked: boolean
}
export interface diseaseCateType {
  categoryName: string
  id: number
  content: string
  checked: boolean
  diseaseList: diseaseType[]
}
export interface symptomType {
  id: number
  symptomName: string
}
export interface constitutionChildrenType {
  addTime: string
  causeMan: string
  causeWoman: string
  descMan: string
  descWoman: string
  hasReport: string
  id: number
  liabilityDiseaseMan: string
  liabilityDiseaseWoman: string
  name: string
  parentId: number
  updateTime: string
  value: string
}
export interface constitutionType {
  id: number
  name: string
  children: constitutionChildrenType[]
}
export interface dictRes {
  diseaseCateList: diseaseCateType[]
  symptomList: symptomType[]
  constitutionTypeList: constitutionType[]
}
export interface ISymptomListRes {
  addTime: string
  symptomName: string
  id: number
  idDel: number
  sort: number
}
export interface IOrgRes {
  id: number
  orgName: string
}
export interface IDepptRes {
  id: number
  deptName: string
}
