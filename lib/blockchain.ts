// import { Connection, PublicKey } from '@solana/web3.js'
// import { ethers } from 'ethers'

// // Solana configuration
// //const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
// const SOLANA_RPC_URL = "https://solana-devnet.g.alchemy.com/v2/-wgX0L1sP7MA475YuImcVvf6fB4ymZQx"
// const solanaConnection = new Connection(SOLANA_RPC_URL, 'confirmed')

// // Ethereum configuration
// const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
// const ethProvider = ETHEREUM_RPC_URL ? new ethers.JsonRpcProvider(ETHEREUM_RPC_URL) : null

// //console.log(solanaConnection);

// // USDT/USDC contract addresses on Ethereum mainnet
// const TOKEN_CONTRACTS = {
//   USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
//   USDC: '0xA0b86a33E6417a26AB2277D6e4a9e76c7dD33A8a'
// }

// export async function verifySOLPayment(
//   walletAddress: string,
//   expectedAmount: number,
//   timeWindow: number = 30 * 60 * 1000 // 30 minutes
// ): Promise<{ verified: boolean; transactionHash?: string }> {
//   try {
//     const publicKey = new PublicKey(walletAddress)
//     const signatures = await solanaConnection.getSignaturesForAddress(publicKey, {
//       limit: 50
//     })

//     const cutoffTime = Date.now() - timeWindow
    
//     for (const signatureInfo of signatures) {
//       if (signatureInfo.blockTime && signatureInfo.blockTime * 1000 > cutoffTime) {
//         const transaction = await solanaConnection.getTransaction(signatureInfo.signature, {
//           maxSupportedTransactionVersion: 0
//         })
        
//         if (transaction?.meta?.postBalances && transaction?.meta?.preBalances) {
//           const balanceChange = (transaction.meta.postBalances[0] - transaction.meta.preBalances[0]) / 1e9
          
//           if (Math.abs(balanceChange - expectedAmount) < 0.001) {
//             return {
//               verified: true,
//               transactionHash: signatureInfo.signature
//             }
//           }
//         }
//       }
//     }
    
//     return { verified: false }
//   } catch (error) {
//     console.error('SOL payment verification error:', error)
//     return { verified: false }
//   }
// }

// export async function verifyETHPayment(
//   walletAddress: string,
//   expectedAmount: number,
//   timeWindow: number = 30 * 60 * 1000
// ): Promise<{ verified: boolean; transactionHash?: string }> {
//   try {
//     if (!ethProvider) throw new Error('Ethereum provider not configured')
    
//     const currentBlock = await ethProvider.getBlockNumber()
//     const blocksToCheck = Math.floor(timeWindow / (13 * 1000)) // ~13 seconds per block
//     const fromBlock = currentBlock - blocksToCheck
    
//     const filter = {
//       address: null,
//       fromBlock,
//       toBlock: 'latest',
//       topics: [
//         null,
//         null,
//         ethers.zeroPadValue(walletAddress, 32)
//       ]
//     }
    
//     const logs = await ethProvider.getLogs(filter)
    
//     for (const log of logs) {
//       const transaction = await ethProvider.getTransaction(log.transactionHash)
//       if (transaction && transaction.to?.toLowerCase() === walletAddress.toLowerCase()) {
//         const amountETH = parseFloat(ethers.formatEther(transaction.value))
        
//         if (Math.abs(amountETH - expectedAmount) < 0.001) {
//           return {
//             verified: true,
//             transactionHash: transaction.hash
//           }
//         }
//       }
//     }
    
//     return { verified: false }
//   } catch (error) {
//     console.error('ETH payment verification error:', error)
//     return { verified: false }
//   }
// }

// export async function verifyTokenPayment(
//   tokenSymbol: 'USDT' | 'USDC',
//   walletAddress: string,
//   expectedAmount: number,
//   timeWindow: number = 30 * 60 * 1000
// ): Promise<{ verified: boolean; transactionHash?: string }> {
//   try {
//     if (!ethProvider) throw new Error('Ethereum provider not configured')
    
//     const contractAddress = TOKEN_CONTRACTS[tokenSymbol]
//     const currentBlock = await ethProvider.getBlockNumber()
//     const blocksToCheck = Math.floor(timeWindow / (13 * 1000))
//     const fromBlock = currentBlock - blocksToCheck
    
//     // ERC20 Transfer event signature
//     const transferTopic = ethers.id('Transfer(address,address,uint256)')
    
//     const filter = {
//       address: contractAddress,
//       fromBlock,
//       toBlock: 'latest',
//       topics: [
//         transferTopic,
//         null, // from address
//         ethers.zeroPadValue(walletAddress, 32) // to address
//       ]
//     }
    
//     const logs = await ethProvider.getLogs(filter)
    
//     for (const log of logs) {
//       const amount = ethers.formatUnits(log.data, tokenSymbol === 'USDT' ? 6 : 6)
//       const amountFloat = parseFloat(amount)
      
//       if (Math.abs(amountFloat - expectedAmount) < 0.01) {
//         return {
//           verified: true,
//           transactionHash: log.transactionHash
//         }
//       }
//     }
    
//     return { verified: false }
//   } catch (error) {
//     console.error(`${tokenSymbol} payment verification error:`, error)
//     return { verified: false }
//   }
// }

// export async function getCryptoPrice(symbol: string): Promise<number> {
//   try {
//     const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`)
//     const data = await response.json()
//     return data[symbol]?.usd || 0
//   } catch (error) {
//     console.error('Price fetch error:', error)
//     return 0
//   }
// }

// export function calculateCryptoAmount(usdAmount: number, cryptoPrice: number): number {
//   return usdAmount / cryptoPrice
// }














import { Connection, PublicKey } from '@solana/web3.js'
import { ethers } from 'ethers'

// Solana configuration
const SOLANA_RPC_URL = "https://solana-devnet.g.alchemy.com/v2/-wgX0L1sP7MA475YuImcVvf6fB4ymZQx"
const solanaConnection = new Connection(SOLANA_RPC_URL, 'confirmed')

// Ethereum configuration
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
const ethProvider = ETHEREUM_RPC_URL ? new ethers.JsonRpcProvider(ETHEREUM_RPC_URL) : null

// USDT/USDC contract addresses on Ethereum mainnet
const TOKEN_CONTRACTS = {
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC: '0xA0b86a33E6417a26AB2277D6e4a9e76c7dD33A8a'
}

export async function verifySOLPayment(
  walletAddress: string,
  expectedAmount: number,
  timeWindow: number = 30 * 60 * 1000 // 30 minutes
): Promise<{ verified: boolean; transactionHash?: string; debug?: any }> {
  try {
    console.log('🔍 Starting SOL payment verification...')
    console.log('Wallet address:', walletAddress)
    console.log('Expected amount:', expectedAmount)
    console.log('Time window:', timeWindow, 'ms')
    
    const publicKey = new PublicKey(walletAddress)
    console.log('✅ Public key created successfully')
    
    const signatures = await solanaConnection.getSignaturesForAddress(publicKey, {
      limit: 50
    })
    
    console.log('📋 Found', signatures.length, 'signatures')
    
    const cutoffTime = Date.now() - timeWindow
    console.log('⏰ Cutoff time:', new Date(cutoffTime).toISOString())
    
    let validTransactions = []
    
    for (const signatureInfo of signatures) {
      const txTime = signatureInfo.blockTime ? signatureInfo.blockTime * 1000 : 0
      console.log(`\n🔍 Checking transaction: ${signatureInfo.signature}`)
      console.log('Block time:', txTime ? new Date(txTime).toISOString() : 'Unknown')
      console.log('Within time window:', txTime > cutoffTime)
      
      if (signatureInfo.blockTime && txTime > cutoffTime) {
        const transaction = await solanaConnection.getTransaction(signatureInfo.signature, {
          maxSupportedTransactionVersion: 0
        })
        
        if (transaction?.meta?.postBalances && transaction?.meta?.preBalances) {
          console.log('Pre-balances:', transaction.meta.preBalances.map(b => b / 1e9))
          console.log('Post-balances:', transaction.meta.postBalances.map(b => b / 1e9))
          
          // Check all accounts in the transaction, not just index 0
          for (let i = 0; i < transaction.meta.preBalances.length; i++) {
            const balanceChange = (transaction.meta.postBalances[i] - transaction.meta.preBalances[i]) / 1e9
            console.log(`Account ${i} balance change:`, balanceChange)
            
            // Check if this account matches our wallet
            const accountKey = transaction.transaction.message.accountKeys[i]?.toString()
            console.log(`Account ${i} key:`, accountKey)
            console.log(`Matches wallet:`, accountKey === walletAddress)
            
            if (accountKey === walletAddress && Math.abs(balanceChange - expectedAmount) < 0.001) {
              console.log('✅ Payment verified!')
              return {
                verified: true,
                transactionHash: signatureInfo.signature,
                debug: {
                  balanceChange,
                  expectedAmount,
                  difference: Math.abs(balanceChange - expectedAmount)
                }
              }
            }
          }
          
          validTransactions.push({
            signature: signatureInfo.signature,
            balanceChanges: transaction.meta.postBalances.map((post, i) => ({
              account: transaction.transaction.message.accountKeys[i]?.toString(),
              change: (post - transaction.meta!.preBalances[i]) / 1e9
            })),
            blockTime: txTime
          })
        }
      }
    }
    
    console.log('❌ No matching payment found')
    console.log('Valid transactions found:', validTransactions.length)
    
    return { 
      verified: false, 
      debug: {
        totalSignatures: signatures.length,
        validTransactions,
        cutoffTime: new Date(cutoffTime).toISOString(),
        expectedAmount
      }
    }
  } catch (error) {
    console.error('SOL payment verification error:', error)
    return { verified: false, debug: { error: error.message } }
  }
}

// Alternative method that checks both sender and receiver
export async function verifySOLPaymentDetailed(
  senderAddress: string,
  receiverAddress: string,
  expectedAmount: number,
  timeWindow: number = 30 * 60 * 1000
): Promise<{ verified: boolean; transactionHash?: string; debug?: any }> {
  try {
    console.log('🔍 Starting detailed SOL payment verification...')
    console.log('Sender:', senderAddress)
    console.log('Receiver:', receiverAddress)
    console.log('Expected amount:', expectedAmount)
    
    const receiverKey = new PublicKey(receiverAddress)
    const signatures = await solanaConnection.getSignaturesForAddress(receiverKey, {
      limit: 50
    })
    
    const cutoffTime = Date.now() - timeWindow
    
    for (const signatureInfo of signatures) {
      const txTime = signatureInfo.blockTime ? signatureInfo.blockTime * 1000 : 0
      
      if (signatureInfo.blockTime && txTime > cutoffTime) {
        const transaction = await solanaConnection.getTransaction(signatureInfo.signature, {
          maxSupportedTransactionVersion: 0
        })
        
        if (transaction?.meta?.postBalances && transaction?.meta?.preBalances) {
          const accountKeys = transaction.transaction.message.accountKeys
          
          // Find sender and receiver indices
          let senderIndex = -1
          let receiverIndex = -1
          
          for (let i = 0; i < accountKeys.length; i++) {
            const accountKey = accountKeys[i]?.toString()
            if (accountKey === senderAddress) senderIndex = i
            if (accountKey === receiverAddress) receiverIndex = i
          }
          
          if (senderIndex !== -1 && receiverIndex !== -1) {
            const senderChange = (transaction.meta.postBalances[senderIndex] - transaction.meta.preBalances[senderIndex]) / 1e9
            const receiverChange = (transaction.meta.postBalances[receiverIndex] - transaction.meta.preBalances[receiverIndex]) / 1e9
            
            console.log('Sender balance change:', senderChange)
            console.log('Receiver balance change:', receiverChange)
            
            // Check if receiver got the expected amount (with small tolerance for fees)
            if (Math.abs(receiverChange - expectedAmount) < 0.001) {
              return {
                verified: true,
                transactionHash: signatureInfo.signature,
                debug: {
                  senderChange,
                  receiverChange,
                  expectedAmount
                }
              }
            }
          }
        }
      }
    }
    
    return { verified: false }
  } catch (error) {
    console.error('Detailed SOL payment verification error:', error)
    return { verified: false, debug: { error: error.message } }
  }
}

// Helper function to get recent transactions for debugging
export async function getRecentTransactions(walletAddress: string, limit: number = 10) {
  try {
    const publicKey = new PublicKey(walletAddress)
    const signatures = await solanaConnection.getSignaturesForAddress(publicKey, { limit })
    
    const transactions = []
    for (const sig of signatures) {
      const tx = await solanaConnection.getTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0
      })
      
      if (tx) {
        transactions.push({
          signature: sig.signature,
          blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
          balanceChanges: tx.meta?.postBalances?.map((post, i) => ({
            account: tx.transaction.message.accountKeys[i]?.toString(),
            change: tx.meta?.preBalances ? (post - tx.meta.preBalances[i]) / 1e9 : 0
          })) || []
        })
      }
    }
    
    return transactions
  } catch (error) {
    console.error('Error getting recent transactions:', error)
    return []
  }
}

export async function verifyETHPayment(
  walletAddress: string,
  expectedAmount: number,
  timeWindow: number = 30 * 60 * 1000
): Promise<{ verified: boolean; transactionHash?: string }> {
  try {
    if (!ethProvider) throw new Error('Ethereum provider not configured')
    
    const currentBlock = await ethProvider.getBlockNumber()
    const blocksToCheck = Math.floor(timeWindow / (13 * 1000)) // ~13 seconds per block
    const fromBlock = currentBlock - blocksToCheck
    
    const filter = {
      address: null,
      fromBlock,
      toBlock: 'latest',
      topics: [
        null,
        null,
        ethers.zeroPadValue(walletAddress, 32)
      ]
    }
    
    const logs = await ethProvider.getLogs(filter)
    
    for (const log of logs) {
      const transaction = await ethProvider.getTransaction(log.transactionHash)
      if (transaction && transaction.to?.toLowerCase() === walletAddress.toLowerCase()) {
        const amountETH = parseFloat(ethers.formatEther(transaction.value))
        
        if (Math.abs(amountETH - expectedAmount) < 0.001) {
          return {
            verified: true,
            transactionHash: transaction.hash
          }
        }
      }
    }
    
    return { verified: false }
  } catch (error) {
    console.error('ETH payment verification error:', error)
    return { verified: false }
  }
}

export async function verifyTokenPayment(
  tokenSymbol: 'USDT' | 'USDC',
  walletAddress: string,
  expectedAmount: number,
  timeWindow: number = 30 * 60 * 1000
): Promise<{ verified: boolean; transactionHash?: string }> {
  try {
    if (!ethProvider) throw new Error('Ethereum provider not configured')
    
    const contractAddress = TOKEN_CONTRACTS[tokenSymbol]
    const currentBlock = await ethProvider.getBlockNumber()
    const blocksToCheck = Math.floor(timeWindow / (13 * 1000))
    const fromBlock = currentBlock - blocksToCheck
    
    // ERC20 Transfer event signature
    const transferTopic = ethers.id('Transfer(address,address,uint256)')
    
    const filter = {
      address: contractAddress,
      fromBlock,
      toBlock: 'latest',
      topics: [
        transferTopic,
        null, // from address
        ethers.zeroPadValue(walletAddress, 32) // to address
      ]
    }
    
    const logs = await ethProvider.getLogs(filter)
    
    for (const log of logs) {
      const amount = ethers.formatUnits(log.data, tokenSymbol === 'USDT' ? 6 : 6)
      const amountFloat = parseFloat(amount)
      
      if (Math.abs(amountFloat - expectedAmount) < 0.01) {
        return {
          verified: true,
          transactionHash: log.transactionHash
        }
      }
    }
    
    return { verified: false }
  } catch (error) {
    console.error(`${tokenSymbol} payment verification error:`, error)
    return { verified: false }
  }
}

export async function getCryptoPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`)
    const data = await response.json()
    return data[symbol]?.usd || 0
  } catch (error) {
    console.error('Price fetch error:', error)
    return 0
  }
}

export function calculateCryptoAmount(usdAmount: number, cryptoPrice: number): number {
  return usdAmount / cryptoPrice
}