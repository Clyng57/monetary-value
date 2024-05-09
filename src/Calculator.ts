
import { MonetaryValue } from './MonetaryValue'
import { Rate } from './MonetaryValue'

if (typeof Object.hasOwn !== 'function') {
  Object.defineProperty(Object, 'hasOwn', {
    value: function hasOwn (object: any, key: string | symbol): boolean {
      return Object.prototype.hasOwnProperty.call(object, key)
    }
  })
}

export class Calculator {
  static add (a: number, b: number): number {
    return a + b
  }

  static subtract (a: number, b: number): number {
    return a - b
  }

  static multiply (a: number, b: number): number {
    return a * b
  }

  static compare (a: number, b: number): number {
    return a - b
  }

  static decrement (a: number): number {
    return a - 1
  }

  static increment (a: number): number {
    return a + 1
  }

  static integerDivide (a: number, b: number): number {
    return Math.trunc(a / b)
  }

  static modulo (a: number, b: number): number {
    return a % b
  }

  static power (base: number, exponent: number): number {
    return base ** exponent
  }

  static zero (): number {
    return 0
  }

  static lessThan (a: number, b: number): boolean {
    return a < b
  }

  static greaterThan (a: number, b: number): boolean {
    return a > b
  }

  static computeBase (base: number | number[]): number {
    if (Array.isArray(base)) {
      return base.reduce((a, b) => a * b)
    }

    return base
  }

  static divideDown (amount: number, factor: number): number {
    const zero = Calculator.zero()
    const isPositive = Calculator.greaterThan(amount, zero)
    const quotient = Calculator.integerDivide(amount, factor)
    const remainder = Calculator.modulo(amount, factor)
    const isInteger = remainder === zero

    if (isPositive && isInteger) {
      return quotient
    }

    return quotient - 1
  }

  static divideUp (amount: number, factor: number): number {
    const zero = Calculator.zero()
    const isPositive = Calculator.greaterThan(amount, zero)
    const quotient = Calculator.integerDivide(amount, factor)
    const remainder = Calculator.modulo(amount, factor)
    const isInteger = remainder === zero

    if (isPositive && !isInteger) {
      return quotient + 1
    }

    return quotient
  }

  static divideHalfUp (amount: number, factor: number): number {
    const zero = Calculator.zero()
    const remainder = Math.abs(Calculator.modulo(amount, factor))
    const difference = factor - remainder
    const isLessThanHalf = difference > remainder
    const isPositive = Calculator.greaterThan(amount, zero)

    if (
      remainder === (amount - remainder) ||
      (isPositive && !isLessThanHalf) ||
      (!isPositive && isLessThanHalf)
    ) {
      return Calculator.divideUp(amount, factor)
    }

    return Calculator.divideDown(amount, factor)
  }

  static maximum (...values: number[]): number {
    return Math.max(...values)
  }

  static minimum (...values: number[]): number {
    return Math.min(...values)
  }

  static countTrailingZeros (input: number, base: number): number {
    if (input === 0) {
      return 0
    }

    let count = 0
    let tmp = input

    while (tmp % base === 0) {
      tmp = Calculator.integerDivide(tmp, base)
      count = Calculator.increment(count)
    }

    return count
  }

  static distribute (value: number, ratios: number[]): number[] {
    const total = ratios.reduce((a, b) => a + b, 0)

    if (total === 0) {
      return ratios
    }

    let remainder = value

    const shares = ratios.map(ratio => {
      const share = Calculator.integerDivide((value * ratio), total) || 0
      remainder = remainder - share
      return share
    })

    const isPositive = value >= 0
    const compare = isPositive ? Calculator.greaterThan : Calculator.lessThan
    const amount = isPositive ? 1 : -1
    let i = 0

    while (compare(remainder, 0)) {
      if (ratios[i] !== 0) {
        shares[i] = shares[i] + amount
        remainder = remainder - amount
      }

      i++
    }

    return shares
  }

  static isScaledAmount (amount: Rate): amount is { amount: number, scale: number } {
    if (typeof amount === 'number') {
      return false
    }

    return Object.hasOwn(amount, 'amount')
  }

  static getAmountAndScale (value: number | Rate): [amount: number, scale: number] {
    if (typeof value === 'number') {
      return [value, 0]
    }

    const { amount, scale = 0 } = value
    return [amount, scale]
  }

  static getDivisors (...bases: number[]): number[] {
    return bases.reduce<number[]>((divisors, _, i) => {
      const divisor = bases.slice(i).reduce((acc, curr) => (acc * curr))

      return [...divisors, divisor]
    }, [])
  }

  static isEven (value: number): boolean {
    return value % 2 === 0
  }

  static isHalf (input: number, total: number): boolean {
    const remainder = Math.abs(input % total)
    return (total - remainder) === remainder
  }

  static sign (value: number): number {
    return Math.sign(value)
  }

  static equal (...values: MonetaryValue[]): boolean {
    return Calculator.haveSameAmount(...values) && Calculator.haveSameCurrency(...values)
  }

  static haveSameAmount (...values: MonetaryValue[]): boolean {
    const [first, ...rest] = MonetaryValue.normalize(...values)
    const { amount: comparator } = first

    return rest.every(({ amount }) => amount === comparator)
  }

  static haveSameCurrency (...values: MonetaryValue[]): boolean {
    const [first, ...rest] = values
    const { currency: comparator } = first
    const base = Calculator.computeBase(comparator.base)

    return rest.every(({ currency }) => {
      const otherBase = Calculator.computeBase(currency.base)

      return (
        currency.code === comparator.code &&
        otherBase === base &&
        currency.exponent === comparator.exponent
      )
    })
  }
}
