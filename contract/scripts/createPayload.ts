import { createHookPayload, hexNamespace } from '@transia/hooks-toolkit'

const main = async () => {
  const hook = createHookPayload({
    version: 1,
    createFile: 'index',
    fee: '1000',
    namespace: 'counter',
    flags: 1, // hsfOverride
    hookOnArray: ['Invoke'],
  })

  const tx = {
    TransactionType: 'SetHook',
    Hooks: [{ Hook: hook }],
  }
  console.log(JSON.stringify(tx, null, 2))
}

main()
