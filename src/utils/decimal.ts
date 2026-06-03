import Decimal from 'decimal.js'

export function addFn(a: number, b: number) {
  return new Decimal(a).add(new Decimal(b)).toNumber().toFixed(2)
}
export function subFn(a: number, b: number) {
  return new Decimal(a).sub(new Decimal(b)).toNumber().toFixed(2)
}
export function mulFn(a: number, b: number) {
  return new Decimal(a).mul(new Decimal(b)).toNumber().toFixed(2)
}
export function divFn(a: number, b: number) {
  return new Decimal(a).div(new Decimal(b)).toNumber().toFixed(2)
}
