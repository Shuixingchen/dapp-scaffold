import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, SystemProgram,GetProgramAccountsConfig, TokenAccountsFilter,Transaction, TransactionMessage, TransactionSignature, VersionedTransaction } from '@solana/web3.js';
import { FC, useCallback, useRef,useState } from 'react';
import { notify } from "../utils/notifications";
import {
    getAssociatedTokenAddress,
    TokenInstruction,
    createBurnCheckedInstruction,
    createTransferCheckedInstruction,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';

export const SendBurnTransaction: FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [tokenAccount, setTokenAccount] = useState<string>("");
    const [tokanBalance, setTokenBalance] = useState<string>("");
    const mintPublickey = new PublicKey("3xL5xaJ5Zo23xRJWaEXFvzDWNNaC6mBsDwQ3VFVRKMpe");

    const onQuery = useCallback(async () => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }
        const tokenAccount = await getAssociatedTokenAddress(
            mintPublickey,
            publicKey,
            false,
            TOKEN_PROGRAM_ID
          );
        setTokenAccount(tokenAccount.toString())
        console.log("tokenaccount:",tokenAccount.toString())
        connection.getTokenAccountBalance(tokenAccount).then(balance => {
            console.log(balance.value.amount)
            setTokenBalance(balance.value.amount)
        })
        
    }, [publicKey, connection]);

    const onBurn = useCallback(async () => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }
        if (!tokenAccount) {
            notify({ type: 'error', message: `token query first` });
            return;
        }
        let signature: TransactionSignature = '';
        try {
            const instructions = [
                createBurnCheckedInstruction(
                    new PublicKey(tokenAccount),
                    mintPublickey,
                    publicKey,
                    100000000,
                    9,
                    [],
                    TOKEN_PROGRAM_ID,
                  )
            ];
            let latestBlockhash = await connection.getLatestBlockhash()
            const messageLegacy = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: latestBlockhash.blockhash,
                instructions,
            }).compileToLegacyMessage();
            const transation = new VersionedTransaction(messageLegacy)
            signature = await sendTransaction(transation, connection);
            notify({ type: 'success', message: 'Transaction submitted!', txid: signature });
            await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed');
        }catch (error) {
            notify({ type: 'error', message: `Transaction failed!`, description: error.message });
            console.log('error', `Transaction failed! ${error.message}`, error);
        }
    }, [publicKey, tokenAccount,sendTransaction, createBurnCheckedInstruction, connection]);

    return (
        <div className="flex flex-row justify-center">
            <div className="relative group items-center">
            <button type="button" onClick={onQuery}>token query</button>
            <div>
                mint:{mintPublickey.toString()}<br/>
                tokenAccount:{tokenAccount}<br/>
                tokenBalance:{tokanBalance}</div>
                <form>
                    <label>
                        burnAmount:
                        <input type="number" />
                    </label>
                    <button type="button" onClick={onBurn}>burn</button>
                </form>
            </div>
        </div>
    );
};
