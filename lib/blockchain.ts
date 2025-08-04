import { Connection, PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";
import type { TransactionResponse } from "ethers";
import { isAddress } from "ethers";
// Solana configuration
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_ALCHEMY_RPC_URL;

const solanaConnection = new Connection(SOLANA_RPC_URL!, "confirmed");

// Ethereum configuration
const ETHEREUM_RPC_URL = process.env.NEXT_PUBLIC_ETHEREUM_ALCHEMY_RPC_URL
const ethProvider = ETHEREUM_RPC_URL
  ? new ethers.JsonRpcProvider(ETHEREUM_RPC_URL)
  : null;

// USDT/USDC contract addresses on Ethereum mainnet
const TOKEN_CONTRACTS = {
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
};

export async function verifySOLPayment(
  senderAddress: string,
  walletAddress: string,
  expectedAmount: number,
  timeWindow: number = 30 * 60 * 1000 // 30 minutes
): Promise<{ verified: boolean; transactionHash?: string; debug?: any }> {
  try {
    console.log("🔍 Starting SOL payment verification...");
    console.log("Sender address:", senderAddress);
    console.log("Wallet address:", walletAddress);
    console.log("Expected amount:", expectedAmount);
    console.log("Time window:", timeWindow, "ms");

    const senderKey = new PublicKey(senderAddress);
    const publicKey = new PublicKey(walletAddress);
    console.log("✅ Public keys created successfully");

    // Get transactions for the recipient address
    const signatures = await solanaConnection.getSignaturesForAddress(
      publicKey,
      {
        limit: 50,
      }
    );

    console.log("📋 Found", signatures.length, "signatures");

    const cutoffTime = Date.now() - timeWindow;
    console.log("⏰ Cutoff time:", new Date(cutoffTime).toISOString());

    // Sort signatures by block time (newest first) to check recent transactions first
    const sortedSignatures = signatures
      .filter((sig) => sig.blockTime && sig.blockTime * 1000 > cutoffTime)
      .sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0));

    for (const signatureInfo of sortedSignatures) {
      const txTime = signatureInfo.blockTime
        ? signatureInfo.blockTime * 1000
        : 0;
      console.log(`\n🔍 Checking transaction: ${signatureInfo.signature}`);
      console.log(
        "Block time:",
        txTime ? new Date(txTime).toISOString() : "Unknown"
      );

      const transaction = await solanaConnection.getTransaction(
        signatureInfo.signature,
        {
          maxSupportedTransactionVersion: 0,
        }
      );

      if (
        transaction?.meta?.postBalances &&
        transaction?.meta?.preBalances &&
        transaction?.transaction?.message
      ) {
        console.log(
          "Pre-balances:",
          transaction.meta.preBalances.map((b) => b / 1e9)
        );
        console.log(
          "Post-balances:",
          transaction.meta.postBalances.map((b) => b / 1e9)
        );

        const accountKeys =
          transaction.transaction.message.getAccountKeys().staticAccountKeys;

        // Find sender and receiver indices
        let senderIndex = -1;
        let receiverIndex = -1;

        for (let i = 0; i < transaction.meta.preBalances.length; i++) {
          const accountKey = accountKeys[i]?.toString();
          if (accountKey === senderAddress) senderIndex = i;
          if (accountKey === walletAddress) receiverIndex = i;
        }

        console.log(
          "Sender index:",
          senderIndex,
          "Receiver index:",
          receiverIndex
        );

        if (senderIndex !== -1 && receiverIndex !== -1) {
          const senderChange =
            (transaction.meta.postBalances[senderIndex] -
              transaction.meta.preBalances[senderIndex]) /
            1e9;
          const receiverChange =
            (transaction.meta.postBalances[receiverIndex] -
              transaction.meta.preBalances[receiverIndex]) /
            1e9;

          console.log("Sender balance change:", senderChange);
          console.log("Receiver balance change:", receiverChange);

          // Verify that:
          // 1. Receiver got the expected amount (positive change)
          // 2. Sender lost approximately the same amount (negative change, accounting for fees)
          if (
            Math.abs(receiverChange - expectedAmount) < 0.001 &&
            senderChange < 0
          ) {
            console.log("✅ Payment verified with sender/receiver match!");
            return {
              verified: true,
              transactionHash: signatureInfo.signature,
              debug: {
                senderChange,
                receiverChange,
                expectedAmount,
                senderAddress,
                receiverAddress: walletAddress,
              },
            };
          }
        }
      }
    }

    console.log("❌ No matching payment found");

    return {
      verified: false,
      debug: {
        totalSignatures: sortedSignatures.length,
        cutoffTime: new Date(cutoffTime).toISOString(),
        expectedAmount,
      },
    };
  } catch (error) {
    console.error("SOL payment verification error:", error);
    return { verified: false, debug: { error: (error as Error).message } };
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
    console.log("🔍 Starting detailed SOL payment verification...");
    console.log("Sender:", senderAddress);
    console.log("Receiver:", receiverAddress);
    console.log("Expected amount:", expectedAmount);

    const receiverKey = new PublicKey(receiverAddress);
    const signatures = await solanaConnection.getSignaturesForAddress(
      receiverKey,
      {
        limit: 50,
      }
    );

    const cutoffTime = Date.now() - timeWindow;

    for (const signatureInfo of signatures) {
      const txTime = signatureInfo.blockTime
        ? signatureInfo.blockTime * 1000
        : 0;

      if (signatureInfo.blockTime && txTime > cutoffTime) {
        const transaction = await solanaConnection.getTransaction(
          signatureInfo.signature,
          {
            maxSupportedTransactionVersion: 0,
          }
        );

        if (
          transaction?.meta?.postBalances &&
          transaction?.meta?.preBalances &&
          transaction?.transaction?.message
        ) {
          const accountKeys =
            transaction.transaction.message.getAccountKeys().staticAccountKeys;

          // Find sender and receiver indices
          let senderIndex = -1;
          let receiverIndex = -1;

          for (let i = 0; i < accountKeys.length; i++) {
            const accountKey = accountKeys[i]?.toString();
            if (accountKey === senderAddress) senderIndex = i;
            if (accountKey === receiverAddress) receiverIndex = i;
          }

          if (senderIndex !== -1 && receiverIndex !== -1) {
            const senderChange =
              (transaction.meta.postBalances[senderIndex] -
                transaction.meta.preBalances[senderIndex]) /
              1e9;
            const receiverChange =
              (transaction.meta.postBalances[receiverIndex] -
                transaction.meta.preBalances[receiverIndex]) /
              1e9;

            console.log("Sender balance change:", senderChange);
            console.log("Receiver balance change:", receiverChange);

            // Check if receiver got the expected amount (with small tolerance for fees)
            if (Math.abs(receiverChange - expectedAmount) < 0.001) {
              return {
                verified: true,
                transactionHash: signatureInfo.signature,
                debug: {
                  senderChange,
                  receiverChange,
                  expectedAmount,
                },
              };
            }
          }
        }
      }
    }

    return { verified: false };
  } catch (error) {
    console.error("Detailed SOL payment verification error:", error);
    return {
      verified: false,
      debug: { error: (error as any).message || String(error) },
    };
  }
}

// Helper function to get recent transactions for debugging
export async function getRecentTransactions(
  walletAddress: string,
  limit: number = 10
) {
  try {
    const publicKey = new PublicKey(walletAddress);
    const signatures = await solanaConnection.getSignaturesForAddress(
      publicKey,
      { limit }
    );

    const transactions = [];
    for (const sig of signatures) {
      const tx = await solanaConnection.getTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (tx) {
        transactions.push({
          signature: sig.signature,
          blockTime: sig.blockTime
            ? new Date(sig.blockTime * 1000).toISOString()
            : null,
          balanceChanges:
            tx.meta?.postBalances?.map((post, i) => ({
              account: tx.transaction.message
                .getAccountKeys()
                .staticAccountKeys[i]?.toString(),
              change: tx.meta?.preBalances
                ? (post - tx.meta.preBalances[i]) / 1e9
                : 0,
            })) || [],
        });
      }
    }

    return transactions;
  } catch (error) {
    console.error("Error getting recent transactions:", error);
    return [];
  }
}

export async function verifyETHPayment(
  senderAddress: string,
  walletAddress: string,
  expectedAmount: number,
  timeWindow: number = 30 * 60 * 1000
): Promise<{ verified: boolean; transactionHash?: string }> {
  try {
    if (!ethProvider) throw new Error("Ethereum provider not configured");

    console.log("🔍 Starting ETH payment verification...");
    console.log("Sender address:", senderAddress);
    console.log("Receiver address:", walletAddress);
    console.log("Expected amount:", expectedAmount);

    const currentBlock = await ethProvider.getBlockNumber();
    const blocksToCheck = Math.floor(timeWindow / (13 * 1000)); // ~13 seconds per block
    const fromBlock = currentBlock - blocksToCheck;

    // Get transactions TO the recipient address
    const filter = {
      fromBlock,
      toBlock: "latest",
      address: walletAddress,
    };

    // Get all transactions in the block range and filter manually
    // for (let blockNum = fromBlock; blockNum <= currentBlock; blockNum++) {
    //   try {
    //     const block = await ethProvider.getBlock(blockNum, true)
    //     if (!block || !block.transactions) continue

    //     for (const transaction of block.transactions) {
    //       if (typeof transaction === 'string') continue

    //       const tx = transaction as TransactionResponse

    //       // Check if transaction is from our sender to our receiver
    //       if (tx.from?.toLowerCase() === senderAddress.toLowerCase() &&
    //           tx.to?.toLowerCase() === walletAddress.toLowerCase()) {

    //         const amountETH = parseFloat(ethers.formatEther(tx.value))
    //         console.log('Found transaction:', tx.hash, 'Amount:', amountETH)

    //         if (Math.abs(amountETH - expectedAmount) < 0.001) {
    //           console.log('✅ ETH Payment verified!')
    //           return {
    //             verified: true,
    //             transactionHash: tx.hash
    //           }
    //         }
    //       }
    //     }
    //   } catch (blockError) {
    //     console.log('Error processing block', blockNum, ':', blockError)
    //     continue
    //   }
    // }

    const logs = await ethProvider.getLogs(filter);
    for (const log of logs) {
      const tx = await ethProvider.getTransaction(log.transactionHash);
      if (tx && tx.from?.toLowerCase() === senderAddress.toLowerCase()) {
        const amountETH = parseFloat(ethers.formatEther(tx.value));
        console.log("Found transaction:", tx.hash, "Amount:", amountETH);
        if (Math.abs(amountETH - expectedAmount) < 0.001) {
          console.log("✅ ETH Payment verified!");
          return { verified: true, transactionHash: tx.hash };
        }
      }
    }

    console.log("❌ No matching ETH payment found");

    return { verified: false };
  } catch (error) {
    console.error("ETH payment verification error:", error);
    return { verified: false };
  }
}

export async function verifyTokenPayment(
  tokenSymbol: "USDT" | "USDC",
  senderAddress: string,
  walletAddress: string,
  expectedAmount: number,
  timeWindow: number = 30 * 60 * 1000
): Promise<{ verified: boolean; transactionHash?: string }> {
  try {
    if (!ethProvider) throw new Error("Ethereum provider not configured");

    if (!isAddress(senderAddress) || !isAddress(walletAddress)) {
      throw new Error("Invalid Ethereum address provided");
    }

    console.log("🔍 Starting", tokenSymbol, "payment verification...");
    console.log("Sender address:", senderAddress);
    console.log("Receiver address:", walletAddress);
    console.log("Expected amount:", expectedAmount);

    const contractAddress = TOKEN_CONTRACTS[tokenSymbol];
    const currentBlock = await ethProvider.getBlockNumber();
    const blocksToCheck = Math.floor(timeWindow / (13 * 1000));
    const fromBlock = currentBlock - blocksToCheck;

    // ERC20 Transfer event signature
    const transferTopic = ethers.id("Transfer(address,address,uint256)");

    const filter = {
      address: contractAddress,
      fromBlock,
      toBlock: "latest",
      topics: [
        transferTopic,
        ethers.zeroPadValue(senderAddress, 32), // from address (sender)
        ethers.zeroPadValue(walletAddress, 32), // to address
      ],
    };

    const logs = await ethProvider.getLogs(filter);
    console.log("Found", logs.length, "transfer logs");

    for (const log of logs) {
      const amount = ethers.formatUnits(
        log.data,
        tokenSymbol === "USDT" ? 6 : 6
      );
      const amountFloat = parseFloat(amount);
      console.log("Transfer amount:", amountFloat, "Expected:", expectedAmount);

      if (Math.abs(amountFloat - expectedAmount) < 0.01) {
        console.log("✅", tokenSymbol, "Payment verified!");
        return {
          verified: true,
          transactionHash: log.transactionHash,
        };
      }
    }

    return { verified: false };
  } catch (error) {
    console.error(`${tokenSymbol} payment verification error:`, error);
    return { verified: false };
  }
}

// export async function getCryptoPrice(symbol: string): Promise<number> {
//   try {
//     const response = await fetch(
//       `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
//     );
//     const data = await response.json();
//     return data[symbol]?.usd || 0;
//   } catch (error) {
//     console.error("Price fetch error:", error);
//     return 0;
//   }
// }

export async function getCryptoPrice(symbol: string): Promise<number> {
  if (!symbol || typeof symbol !== "string") {
    throw new Error("Invalid or missing symbol");
  }
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`
    );
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }
    const data = await response.json();
    const price = data[symbol.toLowerCase()]?.usd;
    if (price === undefined) {
      throw new Error(`No price found for symbol: ${symbol}`);
    }
    return price;
  } catch (error) {
    console.error("Price fetch error:", error);
    throw error;
  }
}

export function calculateCryptoAmount(
  usdAmount: number,
  cryptoPrice: number
): number {
  return usdAmount / cryptoPrice;
}
