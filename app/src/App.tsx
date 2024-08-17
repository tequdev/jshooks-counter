import { useEffect, useState } from 'react';
import './App.css'

import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignAndSubmitTransaction,
  useWallet,
  useWallets,
} from '@xrpl-wallet-standard/react'
import { Client } from 'xrpl';
import { sha256 } from '@xrplf/isomorphic/sha256'

const strToHex = (str: string) => {
  let hex = '';
  for (let i = 0; i < str.length; i++)
    hex += '' + str.charCodeAt(i).toString(16);
  return hex;
}

const hexToStr = (hex: string) => { 
  let str = '';
  for (let i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

const contractAccount = 'ra6gET1cLepoxX8FDV4DDWU4HVBEKF1E5X'
const key = strToHex('COUNT').padStart(64, '0').toUpperCase()
const namespace_id = Array.from(sha256('counter')).map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()

function App() {
  const wallets = useWallets()
  const { wallet: selectedWallet } = useWallet()
  const account = useAccount()
  const { connect } = useConnect()
  const disconnect = useDisconnect()
  const signAndSubmitTransaction = useSignAndSubmitTransaction()
  const [waitingForValidated, setWaitingForValidated] = useState(false)

  const [counter, setCounter] = useState<number>()

  const fetchCounter = async (client: Client) => {
    try {
      const response = await client.request({
        command: 'ledger_entry',
        hook_state: { account: contractAccount, key, namespace_id, },
      })
      // @ts-expect-error describe
      const counter = parseInt(response.result.node.HookStateData, 16)
      setCounter(counter)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if(e.message === 'entryNotFound')
        setCounter(0)
      console.log(e.message)
    }
  }

  useEffect(() => {
    const client = new Client('wss://jshooks.xahau-test.net')
    client.apiVersion = 1

    const f = async () => {
      await client.connect()
      fetchCounter(client)
      client.on('transaction', async ({ transaction, meta }) => {
        // @ts-expect-error describe
        if (transaction.TransactionType !== 'Invoke' || transaction.Destination !== contractAccount || !meta)
          return
        await fetchCounter(client)
      })
      client.request({
        command: 'subscribe',
        streams: ['transactions'],
      })
    }
    f()
    return () => {
      client.disconnect()
    }
  }, [account])

  const signAndSubmit = async (op: 'INC' | 'DEC') => {
    if (selectedWallet && account) {
      setWaitingForValidated(true)
      const signedTransaction = await signAndSubmitTransaction(
        {
          TransactionType: 'Invoke',
          Account: account.address,
          // @ts-expect-error describe
          Destination: contractAccount,
          HookParameters: [
            {
              HookParameter: {
                HookParameterName: strToHex("OP"), HookParameterValue: strToHex(op)
              }
            },
          ]
        },
        'xrpl:31338',
      )
      console.log(signedTransaction)
      setWaitingForValidated(false)
      const meta = signedTransaction.tx_json.meta
      if (typeof meta !== 'string' && meta?.TransactionResult !== 'tesSUCCESS') {
        if(meta.HookExecutions && meta.HookExecutions.length>0)
          alert('Transaction failed: ' + hexToStr(meta.HookExecutions[0].HookExecution.HookReturnString))
        else
          alert('Transaction failed')
      }
    }
  }

  const increment = async () => await signAndSubmit('INC')
  const decrement = async () => await signAndSubmit('DEC')

  return (
    <>
      <h1>Wallet</h1>
      <div className="card">
        {wallets.map((wallet) => (
          <div key={wallet.name}>
            <button
              type="button"
              onClick={() => connect(wallet)}
              className={`walletButton ${wallet.name === selectedWallet?.name ? 'walletButton-selected' : ''}`}
            >
              <img src={wallet.icon} alt="" height={24} />
              <span>{wallet.name}</span>
            </button>
          </div>
        ))}
      </div>
      <div>
        <h2>
          Current Counter: {counter ?? 'Loading...'}
        </h2>
      </div>
      <div className="card">
        {selectedWallet && account && (
          <>
            {account.address}
          <div>
            <button type="button" onClick={increment} disabled={waitingForValidated}>
              Increment
            </button>
            <button type="button" onClick={decrement} disabled={waitingForValidated}>
              Decrement
            </button>
            <button type="button" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
          </>
        )}
      </div>
    </>
  )
}

export default App
