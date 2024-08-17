import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { LocalWallet_TESTONLY } from '@xrpl-wallet-adapter/local-testonly'
import { WalletProvider } from '@xrpl-wallet-standard/react'

const additionalWallets = [
  new LocalWallet_TESTONLY({
    additionalNetworks: {
      'xrpl:31338': {
        server: 'wss://jshooks.xahau-test.net',
        faucet: 'https://jshooks.xahau-test.net/accounts'
      }
    },
    autoFaucetNetwork: 'xrpl:31338'
  }),
]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider registerWallets={additionalWallets}>
      <App />
    </WalletProvider>
  </StrictMode>,
)
