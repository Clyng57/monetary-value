
import { Currency } from './Currency'
import { Calculator } from './Calculator'
import { CurrencyCode } from './codes'

export type Rate = number | { amount: number, scale?: number }

export interface Rates {
  [key: string]: Rate
}

export interface MonetaryValueLike {
  amount: number
  scale?: number
  currency?: Currency | CurrencyCode
}

export interface MonetaryValueJSON {
  type: 'MonetaryValue'
  value: string
}

export class MonetaryValue {
  static from (input: MonetaryValueLike | string): MonetaryValue {
    if (typeof input === 'string') {
      const [amount, currencyString] = input.split(' ')
      const [whole, decimal] = amount.split('.')
      const currency = Currency.from(currencyString as CurrencyCode)

      if (decimal !== undefined) {
        const scale = decimal.length
        const newAmount = Number(whole + decimal)
        return new MonetaryValue(newAmount, scale, currency)
      }

      return new MonetaryValue(Number(amount), 0, currency)
    } else {
      const scale = input.scale ?? 0
      let currency = input.currency instanceof Currency || typeof input.currency === 'string'
        ? input.currency
        : 'USD'

      if (typeof currency === 'string') {
        currency = Currency.from(currency)
      }

      return new MonetaryValue(input.amount, scale, currency)
    }
  }

  static normalize (...values: MonetaryValue[]): MonetaryValue[] {
    const highestScale = values.reduce((highest, current) => {
      const { scale } = current
      return Math.max(highest, scale)
    }, 0)

    return values.map(
      (value) => value.scale !== highestScale ? value.withScale(highestScale) : value
    )
  }

  static max (...values: MonetaryValue[]): MonetaryValue {
    const [first, ...rest] = MonetaryValue.normalize(...values)

    return rest.reduce((max, current) => {
      if (!Calculator.haveSameCurrency(max, current)) {
        throw new Error('Cannot compare money with different currencies.')
      }

      return current.amount > max.amount ? current : max
    }, first)
  }

  static min (...values: MonetaryValue[]): MonetaryValue {
    const [first, ...rest] = MonetaryValue.normalize(...values)

    return rest.reduce((max, current) => {
      if (!Calculator.haveSameCurrency(max, current)) {
        throw new Error('Cannot compare money with different currencies.')
      }

      return current.amount < max.amount ? current : max
    }, first)
  }

  #amount: number
  #scale: number
  #currency: Currency

  constructor (amount: number, scale: number, currency: Currency) {
    this.#amount = amount
    this.#currency = currency
    this.#scale = scale
  }

  get amount (): number {
    return this.#amount
  }

  get scale (): number {
    return this.#scale
  }

  get currency (): Currency {
    return this.#currency
  }

  get hasSubUnits (): boolean {
    const base = Calculator.computeBase(this.currency.base)
    return (this.amount % (base ** this.scale)) !== 0
  }

  get isNegative (): boolean {
    return this.amount < 0
  }

  get isPositive (): boolean {
    return this.amount > 0
  }

  get isZero (): boolean {
    return this.amount === 0
  }

  add (other: MonetaryValue): MonetaryValue {
    if (!Calculator.haveSameCurrency(this, other)) {
      throw new Error('Cannot add money with different currencies.')
    }

    const [newAugend, newAddend] = MonetaryValue.normalize(this, other)
    const { amount: augendAmount, currency, scale } = newAugend

    return new MonetaryValue(
      augendAmount + newAddend.amount,
      scale,
      currency
    )
  }

  allocate (ratios: number[]): MonetaryValue[] {
    const ten = new Array(10).fill(null).reduce((previousValue: number) => (previousValue + 1), 0)
    const hasRatios = ratios.length > 0
    const scaledRatios = ratios.map((ratio) => Calculator.getAmountAndScale(ratio))
    const highestRatioScale = Math.max(...scaledRatios.map(([, scale]) => scale))

    const normalizedRatios = scaledRatios.map(([amount, scale]) => {
      const factor = scale === highestRatioScale ? 0 : highestRatioScale - scale

      return {
        amount: amount * (ten ** factor),
        scale
      }
    })

    const hasOnlyPositiveRatios = normalizedRatios.every(({ amount }) => amount >= 0)
    const hasOneNonZeroRatio = normalizedRatios.some(({ amount }) => amount > 0)
    const condition = hasRatios && hasOnlyPositiveRatios && hasOneNonZeroRatio

    if (!condition) {
      throw new Error('Invalid ratios')
    }

    const newScale = this.scale + highestRatioScale
    const tmp = this.withScale(newScale)

    const shares = Calculator.distribute(
      tmp.amount,
      normalizedRatios.map(({ amount }) => amount)
    )

    return shares.map(
      (share) => new MonetaryValue(share, tmp.scale, tmp.currency)
    )
  }

  compare (other: MonetaryValue): 1 | 0 | -1 {
    if (!Calculator.haveSameCurrency(this, other)) {
      throw new Error('Cannot compare money with different currencies.')
    }

    const [newThis, newOther] = MonetaryValue.normalize(this, other)
    const { amount: thisAmount } = newThis
    const { amount: otherAmount } = newOther

    if (thisAmount > otherAmount) {
      return 1
    } else if (thisAmount < otherAmount) {
      return -1
    } else {
      return 0
    }
  }

  equals (other: MonetaryValue): boolean {
    return (
      Calculator.haveSameAmount(this, other) &&
      Calculator.haveSameCurrency(this, other)
    )
  }

  greaterThan (other: MonetaryValue): boolean {
    return this.compare(other) === 1
  }

  greaterThanOrEquals (other: MonetaryValue): boolean {
    return this.compare(other) >= 0
  }

  lessThan (other: MonetaryValue): boolean {
    return this.compare(other) === -1
  }

  lessThanOrEquals (other: MonetaryValue): boolean {
    return this.compare(other) <= 0
  }

  multiply (multiplier: MonetaryValue | number, precision?: number): MonetaryValue {
    const { amount, scale, currency } = this
    const [multiplierAmount, multiplierScale] = Calculator.getAmountAndScale(multiplier)
    const newScale = scale + multiplierScale

    return new MonetaryValue(
      amount * multiplierAmount,
      newScale,
      currency
    ).withScale(precision !== undefined ? precision : newScale)
  }

  subtract (other: MonetaryValue): MonetaryValue {
    if (!Calculator.haveSameCurrency(this, other)) {
      throw new Error('Cannot subtract money with different currencies.')
    }

    const [newAugend, newAddend] = MonetaryValue.normalize(this, other)
    const { amount: augendAmount, currency, scale } = newAugend

    return new MonetaryValue(
      augendAmount - newAddend.amount,
      scale,
      currency
    )
  }

  toUnits (): number[] {
    const bases = Array.isArray(this.currency.base) ? this.currency.base : [this.currency.base]
    const divisors = Calculator.getDivisors(...bases.map((base) => (base ** this.scale)))

    const amounts = divisors.reduce<number[]>(
      (amounts, divisor, index) => {
        const amountLeft = amounts[index]

        const quotient = Calculator.integerDivide(amountLeft, divisor)
        const remainder = Calculator.modulo(amountLeft, divisor)

        return [...amounts.filter((_, i) => i !== index), quotient, remainder]
      },
      [this.amount]
    )

    return amounts
  }

  toString (): string {
    const { scale, currency } = this
    const base = Calculator.computeBase(currency.base)
    const ten = new Array(10).fill(null).reduce(Calculator.increment, 0)
    const isMultiBase = Array.isArray(currency.base)
    const isBaseTen = (base % ten) === 0
    const isDecimal = !isMultiBase && isBaseTen

    if (!isDecimal) {
      throw new Error('Cannot convert non-decimal money to decimal.')
    }

    const units = this.toUnits()
    const whole = String(units[0])
    const fraction = String(Math.abs(units[1]))
    const scaleNumber = Number(scale)
    const decimal = `${whole}.${fraction.padStart(scaleNumber, '0')} ${currency.code}`

    return (
      units[0] === 0 && units[1] < 0 ? `-${decimal}` : decimal
    )
  }

  toJSON (): MonetaryValueJSON {
    return {
      type: 'MonetaryValue',
      value: this.toString()
    }
  }

  toLocaleString (): string {
    return this.currency.format(Number(this.toString().split(' ')[0]))
  }

  withScale (
    newScale: number
  ): MonetaryValue {
    const { amount, scale, currency } = this
    const isLarger = newScale > scale
    const base = Calculator.computeBase(currency.base)

    if (isLarger) {
      const a = newScale
      const b = scale
      const factor = base ** (a - b)
      const newAmount = amount * factor
      return new MonetaryValue(newAmount, newScale, currency)
    } else {
      const a = scale
      const b = newScale
      const factor = base ** (a - b)
      const newAmount = Calculator.divideHalfUp(amount, factor)
      return new MonetaryValue(newAmount, newScale, currency)
    }
  }

  withCurrency (newCurrency: Currency | CurrencyCode, rates: Rates): MonetaryValue {
    newCurrency = typeof newCurrency === 'string' ? Currency.from(newCurrency) : newCurrency
    const rate = rates[newCurrency.toString()]
    const { amount, scale } = this
    const [rateAmount, rateScale] = Calculator.getAmountAndScale(rate)
    const newScale = scale + rateScale

    return new MonetaryValue(amount * rateAmount, newScale, newCurrency).withScale(
      Math.max(newScale, newCurrency.exponent)
    )
  }

  trim (): MonetaryValue {
    const { amount, scale, currency } = this
    const base = Calculator.computeBase(currency.base)
    const trailingZerosLength = Calculator.countTrailingZeros(amount, base)
    const difference = scale - trailingZerosLength
    const newScale = Math.max(difference, currency.exponent)

    if (newScale === scale) {
      return new MonetaryValue(amount, scale, currency)
    }

    return this.withScale(newScale)
  }
}
