
# Monetary Value Library
[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

## Introduction
This TypeScript library provides a robust implementation for handling monetary values. It includes features such as arithmetic operations, currency conversion, comparison, allocation, and scaling of monetary amounts in different currencies. The core of the library revolves around the `MonetaryValue` class which encapsulates all functionality needed to manipulate monetary amounts with precision.

## Installation
To install the Monetary Value Library, you will need Node.js and npm (Node Package Manager) installed on your machine. Once you have those set up, you can install the library via npm:

```bash
pnpm add @neumatter/monetary-value --save
```

## Usage

### Creating Monetary Values

To create a new monetary value, you can use the `MonetaryValue` class constructor.

```javascript
import { MonetaryValue } from '@neumatter/monetary-value'

const amount = MonetaryValue.from('100.00 USD')
const amount2 = new MonetaryValue(10000, 2, 'USD')
console.log(amount.toString()) // Outputs '100.00 USD'
console.log(amount2.toString()) // Outputs '100.00 USD'
```

### Arithmetic Operations

```javascript
import { MonetaryValue } from '@neumatter/monetary-value'

const amount1 = MonetaryValue.from('100.00 USD')
const amount2 = MonetaryValue.from('50.00 USD')

const sum = amount1.add(amount2)
const difference = amount1.subtract(amount2)
const product = amount1.multiply(2)

console.log(sum.toString()) // Outputs '150.00 USD'
console.log(difference.toString()) // Outputs '50.00 USD'
console.log(product.toString()) // Outputs '200.00 USD'
```

### Comparison and Allocation

```javascript
import { MonetaryValue } from '@neumatter/monetary-value'

const amount1 = MonetaryValue.from('100.00 USD')
const amount2 = MonetaryValue.from('50.00 USD')

console.log(amount1.isGreaterThan(amount2)) // Outputs true
console.log(amount1.isLessThan(amount2)) // Outputs false
console.log(amount1.isEqualTo(amount2)) // Outputs false

const [allocated1, allocated2] = amount1.allocate([50, 50])
console.log(allocated1.toString()) // Outputs '50.00 USD'
console.log(allocated2.toString()) // Outputs '50.00 USD'
```
