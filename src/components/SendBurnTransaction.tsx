import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, SystemProgram,GetProgramAccountsConfig, TokenAccountsFilter,Transaction, TransactionMessage, TransactionSignature, VersionedTransaction } from '@solana/web3.js';
import { FC, useCallback, useRef,useState } from 'react';
import { notify } from "../utils/notifications";
import {
    getAssociatedTokenAddress,
    TokenInstruction,
    createBurnCheckedInstruction,
    createTransferCheckedInstruction,
    createTransferInstruction,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { useForm,useWatch } from 'react-hook-form';

export const SendBurnTransaction: FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [tokenAccount, setTokenAccount] = useState<string>("");
    const [tokanBalance, setTokenBalance] = useState<string>("");
    const mintPublickey = new PublicKey("3xL5xaJ5Zo23xRJWaEXFvzDWNNaC6mBsDwQ3VFVRKMpe");

    const selectOptionRef = useRef(null);
    const amountRef = useRef(null);
    const destinationRef = useRef(null);

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

    const onAction = useCallback(async () => {
        const action = selectOptionRef.current.value;
        const amount = amountRef.current.value;
        const destination = destinationRef.current.value;
        console.log('Action:', action);
        console.log('Amount:', amount);
        console.log('Destination:', destination);
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }
        
        if (!tokenAccount) {
            notify({ type: 'error', message: `token query first` });
            return;
        }
        if (action == "burn") {
            await onBurn(publicKey, tokenAccount, sendTransaction, createBurnCheckedInstruction,amount, connection);
        }else if(action == "transfer") {
            await onTransfer(publicKey, tokenAccount, sendTransaction, createTransferInstruction,amount, destination, connection);
        }

    }, [publicKey, tokenAccount, sendTransaction, createBurnCheckedInstruction,createTransferInstruction,connection]);

    const onBurn = async (publicKey, tokenAccount,sendTransaction, createBurnCheckedInstruction,amount, connection) => {
        let signature: TransactionSignature = '';
        try {
            const instructions = [
                createBurnCheckedInstruction(
                    new PublicKey(tokenAccount),
                    mintPublickey,
                    publicKey,
                    amount,
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
    }
    const onTransfer = async (publicKey, tokenAccount,sendTransaction, createTransferInstruction,amount, destination, connection) => {
        let signature: TransactionSignature = '';
        try {
            const desTokenAccount = await getAssociatedTokenAddress(
                mintPublickey,
                new PublicKey(destination),
                false,
                TOKEN_PROGRAM_ID
              );
            const instructions = [
                createTransferInstruction(
                    new PublicKey(tokenAccount),
                    desTokenAccount,
                    publicKey,
                    amount,
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
    }

    return (
        <div className="flex flex-row justify-center">
            <div className="relative group items-center">
            <button type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={onQuery}>token query</button>
            <div>
                mint:{mintPublickey.toString()}<br/>
                tokenAccount:{tokenAccount}<br/>
                tokenBalance:{tokanBalance}</div>
                <form  >
                    <div>
                        <label htmlFor="selectOption">Action: </label>
                        <select id="selectOption" name="selectOption" ref={selectOptionRef} style={{ color: 'black' }}>
                        <option value="burn">burn</option>
                        <option value="transfer">transfer</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="amount">Amount: </label>
                        <input type="number" id="amount" name="amount" ref={amountRef} style={{ color: 'black' }} />
                    </div>
                    <div>
                        <label htmlFor="destination">Destination: </label>
                        <input type="txt" id="destination" name="destination"  ref={destinationRef} style={{ color: 'black' }} />
                    </div>
                    <button type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={onAction}>Submit</button>
                </form>
            </div>
        </div>
    );
};
