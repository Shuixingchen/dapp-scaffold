import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, SystemProgram,GetProgramAccountsConfig, TokenAccountsFilter,Transaction, TransactionMessage, TransactionSignature, VersionedTransaction } from '@solana/web3.js';
import { FC, useCallback, useRef,useState,useEffect } from 'react';
import { notify } from "../utils/notifications";
import  useUmi from '../hooks/useUmi'
import bs58 from 'bs58';


import {
    getAssociatedTokenAddress,
    MintLayout,
} from '@solana/spl-token';
import { generateSigner, percentAmount,publicKey as umiPublicKey } from '@metaplex-foundation/umi'
import {
  createV1,
  TokenStandard,
  createFungible,
  createNft,
  fetchDigitalAsset,
  fetchAllDigitalAssetByCreator
} from '@metaplex-foundation/mpl-token-metadata'


export const SendMetaDataTransaction: FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [mint, setMint] = useState<string>("");
    const [tokanBalance, setTokenBalance] = useState<string>("");
    const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    const umi = useUmi()
    
    const onMintToken = useCallback(async () => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            return;
        }
        const mint = generateSigner(umi)
        const tx = await createFungible(umi, {
            mint,
            name: 'My Fungible',
            uri: 'https://s.btc.com/explorer-app/pool-icons/favicon-secpool.png',
            sellerFeeBasisPoints: percentAmount(5.5),
        }).sendAndConfirm(umi)
        setMint(mint.publicKey)
        const signature = bs58.encode(Buffer.from(tx.signature))
        console.log("signature:",signature)
        notify({ type: 'token success', message: 'Transaction submitted!', txid: signature});
    }, [publicKey, connection]);

    const onMintNFT = useCallback(async () => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            return;
        }
        const mint = generateSigner(umi)
        const tx = await createNft(umi, {
            mint,
            name: 'My NFT',
            uri: 'https://example.com/my-nft.json',
            sellerFeeBasisPoints: percentAmount(5.5),
          }).sendAndConfirm(umi)
        const signature = bs58.encode(Buffer.from(tx.signature))
        console.log("nft signature:",signature)
        notify({ type: 'success', message: 'Transaction submitted!', txid: signature});

    }, [publicKey, connection]);

    // 通过条件查询token信息（包含mint,metadata）
    const onQuery = useCallback(async () => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }
        const mint = "ENbFWd9ZT4KZ3kHTyHPr4iHKHcF3wM6naw9QPcB5RVEt"
        const asset = await fetchDigitalAsset(umi, umiPublicKey(mint))
        console.log("asset:",asset)
        const assetsA = await fetchAllDigitalAssetByCreator(umi, umiPublicKey(publicKey))
        console.log("assetsA:",assetsA)
        
    }, [publicKey, connection]);

    const onUpdate = useCallback(async () => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }
        
    }, [publicKey, connection]);



    // 判断是否有ata账号
    const checkTokenMint = async (connection, walletPubkey:PublicKey, tokenAccount:PublicKey, mintPublickey:PublicKey) => {
        const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
            programId: TOKEN_PROGRAM_ID,
            associatedTokenProgramId:mintPublickey
        });
        // 遍历用户的所有代币账户，寻找目标 mint 对应的账户
        let hasTargetMint = false;
        for (const accountInfo of tokenAccounts.value) {
            if (tokenAccount.equals(accountInfo.pubkey)) {
                hasTargetMint = true;
                break;
            }
        }
        return hasTargetMint;
    }
    const getTokenAccount = async (mintPublickey:PublicKey) => {
                // 获取mint账户信息
        const mintAccountInfo = await connection.getAccountInfo(mintPublickey);
        if (!mintAccountInfo || !mintAccountInfo.data) {
            throw new Error('Mint account not found or does not contain any data.');
        }
        // 解析mint账户数据
        const mintData = MintLayout.decode(mintAccountInfo.data);
        return mintData
    }
    return (
        <div className="flex flex-row justify-center">
            <div className="relative group items-center">
                <button type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={onMintToken}>MintToken</button>
                <button type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={onMintNFT}>MintNFT</button>
                <form  >
                    <div>
                        <label htmlFor="mint">Mint: </label>
                        <input type="txt" id="mint" name="mint"  value={mint} style={{ color: 'black' }} />
                    </div>
                    <button type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={onQuery}>onQuery</button>
                </form>
            </div>
        </div>
    );
};
