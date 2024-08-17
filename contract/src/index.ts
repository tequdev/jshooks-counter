import { assert, decodeArray, encodeString, fallback, SUCCESS, ttINVOKE } from 'jshooks-api'

const decodeString = decodeArray

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Hook = (arg: number) => {
  trace("Counter: Called.", 0)
  
  const tt = assert(otxn_type())
  
  if (tt !== ttINVOKE) 
    return rollback("Counter: Invalid transaction type.", -1)

  const key = encodeString('COUNT')
  const value = fallback(state(key))
  
  const opBuf = fallback(otxn_param(encodeString('OP')))
  
  if (opBuf === undefined) {
    return rollback("Counter: Operation not found.", -1)
  }
  
  const op = decodeString(opBuf)


  let count: number
  if (value === undefined)
    count = 0
  else
    count = value[0]

  trace("Counter: prev", count);

  if (op === 'INC') 
    count++
  else if (op === 'DEC') 
    count--
  else 
    return rollback("Counter: Invalid operation", -2)
  
  if (count < 0 || count > 0xFF)
    return rollback("Counter: Overflow", -3)

  trace("Counter: next", count);

  assert(state_set([count], key))

  accept(`Counter: Finished.: ${count}`, SUCCESS)
}

export { Hook }
