import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine'
import { useWallet,useConnection } from '@solana/wallet-adapter-react'

const useUmi = () => {
  // Import useWallet hook
  const wallet = useWallet()
  const connection = useConnection();
  // Create Umi instance
  const umi = createUmi(connection.connection.rpcEndpoint)
    .use(mplTokenMetadata())
    .use(mplCandyMachine())
    // Register Wallet Adapter to Umi
    .use(walletAdapterIdentity(wallet))

  return umi
}

export default useUmi