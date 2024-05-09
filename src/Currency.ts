
import SlotMap from '@neumatter/slot-map'
import { CurrencyCode, codes as codeMap } from './codes'

export class Currency {
  static from (code: CurrencyCode): Currency {
    const slotMap = SlotMap.get(this)
    let currency: Currency | undefined = slotMap.get(code)

    if (currency === undefined) {
      currency = new Currency(code)
      slotMap.set(code, currency)
    }

    return currency
  }

  public readonly name: string
  public readonly base: number
  public readonly exponent: number
  #formatter: Intl.NumberFormat

  constructor (public readonly code: CurrencyCode) {
    const codeData = codeMap.get(code)

    if (codeData === undefined) {
      throw new Error(`Unknown currency code: ${code}`)
    }

    const [name, base, exponent] = codeData.split(';')
    this.code = code
    this.base = parseInt(base.trim())
    this.exponent = parseInt(exponent.trim())
    this.name = name.trim()

    this.#formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code
    })
  }

  format (amount: number): string {
    return this.#formatter.format(amount)
  }

  toString (): string {
    return this.code
  }
}
