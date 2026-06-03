export interface IOrderListParams {
  useEmployeeId: boolean
  customerName?: string
  startDate?: string
  endDate?: string
}
export interface IOrderListRes {
  orderId: number
  price: number
  productCateId: number
  totalPrice: number
  addTimeStr: string
  conditionTypeName: string
  conditionTypeStr: string
  drugType: string
  customerName: string
  orderStatusStr: string
  otherDia: string
  patientName: string
}
export interface IOrderDetailParams {
  orderId: number
}


export interface IOrderDetailRes {
  orderId: number;
  orderNo: string;
  recipeRecordId: number;
  inquiryPhysiotherapyId: number;
  customerId: number;
  orgId: number;
  payWay: number;
  price: number;
  payTime: null;
  payStatus: number;
  userName: string;
  addTime: string;
  updateTime: null;
  addUser: number;
  updateUser: null;
  remark: string;
  receiverName: null;
  receiverPhone: null;
  receiverAddress: null;
  receiverPostcode: null;
  deliveryStatus: number;
  expressCompany: null;
  trackingNumber: null;
  deliveryTime: null;
  orderStatus: number;
  auditRejectReason: null;
  recipe: null;
  supplierId: number;
  applicantId: null;
  showDoseFlag: number;
  freight: number;
  sztParams: null;
  expressType: null;
  waybillFilePath: null;
  waybillRouteLabelData: null;
  wxMessageResult: string;
  sztId: null;
  sztFreight: null;
  thirdRtnError: null;
  canChangeAddress: boolean;
  paymentId: null;
  paymentResult: null;
  reverseResult: null;
  reverseResultStatus: null;
  tradePrice: number;
  drugPrice: number;
  decoctionPrice: number;
  orderSource: number;
  payPrice: number;
  payedPrice: null;
  patientName: string;
  memberId: null;
  feedbackContent: null;
  feedbackResult: null;
  feedbackResultId: null;
  feedbackTime: null;
  krtBjParams: string;
  customerName: string;
  age: number;
  sexName: null;
  sex: number;
  phone: string;
  addTimeStr: string;
  payTimeStr: null;
  payStatusStr: null;
  source: string;
  remarkToPharm: string;
  conditionList: ConditionList[];
  conditionTypeStr: null;
  conditionTypeName: null;
  mainSuit: null;
  diagnosis: null;
  diseaseIds: string;
  hospitalName: string;
  doctorName: string;
  isAdaPay: number;
  orderStatusStr: string;
  userId: number;
  photoList: any[];
  constitutionName: null;
  pulseDiagnosisInfoName: null;
  totalPrice: number;
  drugType: null;
  otherDia: string;
  symptomDuration1Names: null;
  symptomDuration2Names: null;
  symptomDuration3Names: null;
  testReportUrl: string;
  dailySelfTestId: null;
  inquiryStatus: number;
  commentVoList: any[];
  consultId: null;
  consultInfo: null;
  birthday: string;
  constitutionConditionTypeIds: null;
  dailySelfTestEntity: null;
  symptomIds: null;
  symptomDuration1Ids: null;
  symptomDuration2Ids: null;
  symptomDuration3Ids: null;
  inquiryTime: string;
  doctorRoleName: string;
  applicantName: string;
  productCateId: null;
  inqDiseaseOther: any[];
}

type ConditionList = {
  conditionId: number;
  recipeRecordId: number;
  conditionName: string;
  conditionNo: string;
  conditionType: number;
  drugType: string;
  isSendToMachine: number;
  isMakePaste: number;
  isDecoction: number;
  price: number;
  discountPrice: number;
  productionCost: null;
  actualPrice: number;
  dose: number;
  useCount: number;
  unitPrice: number;
  outOrIn: number;
  source: number;
  productCateId: number;
  suitSex: null;
  suitAgeMin: null;
  suitAgeMax: null;
  constitutionIds: null;
  diseaseIds: null;
  productEffectIds: null;
  conditionLabelIds: null;
  applyCount: null;
  taboo: null;
  delFlag: number;
  status: null;
  addTime: string;
  updateTime: null;
  addUser: number;
  updateUser: null;
  memoToPharmacy: null;
  symptomIds: null;
  conditionDrugList: ConditionDrugList[];
  outOrInValue: string;
  conditionTypeValue: string;
  conditionTime: string;
  collectFlag: null;
  conditionCommonRelId: null;
  prescriptionType: null;
  prescriptionSource: null;
  instruction: null;
  indication: null;
  prescriptionAnalysis: null;
  drugEfficacy: null;
  postscript: null;
  treatmentCase: null;
  productEffectName: null;
  decoctionPrice: number;
  tradePrice: number;
  workCate: null;
  mainDrug: null;
  type: null;
  remark: null;
}

type ConditionDrugList = {
  conditionDrugId: null;
  conditionId: null;
  drugId: number;
  itemDose: null;
  changeDose: number;
  itemPrice: null;
  conditionType: number;
  typeName: null;
  price: null;
  discountPrice: null;
  actualPrice: null;
  useMethod: null;
  fryMethod: null;
  frequency: null;
  eachCount: null;
  isDel: null;
  addTime: null;
  updateTime: null;
  addUser: null;
  updateUser: null;
  itemTradePrice: null;
  drugSpecialProcessingType: null | number;
  id: null;
  code: string;
  itemName: string;
  contentWeight: null;
  dose: number;
  util: string;
  convertRate: null;
  lockstock: null;
  libraryId: number;
  stockout: null;
  drugSpecialProcessingTypeName: null | string;
  specialProcessingType: null | string;
  specialProcessingTypeList: SpecialProcessingTypeList[] | null;
}

type SpecialProcessingTypeList = {
  id: number;
  name: string;
  typeName: null;
  children: null;
  conditionId: null;
}
