---
learn_hub_id: 34211397080980
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34211397080980-Chain-Key-Tokens"
learn_hub_title: "Chain-Key Tokens"
learn_hub_section: "Chain Fusion"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Chain-Key Tokens

One important way to extend the utility of a token is to bring it from one blockchain to another one. In traditional blockchain architectures, this is mostly accomplished through wrapping. More decentralized (and secure) alternatives to wrapping exist and can replace it: Meet [chain-key cryptography](https://learn.internetcomputer.org/hc/en-us/articles/34209486239252) and chain-key tokens!

A wrapped token represents an underlying asset, which is typically native on a different blockchain than the wrapped token. For example, a wrapped Bitcoin token represents real bitcoin but is a different token available on a different chain, for example, on the Ethereum blockchain. Traditional wrapping always involves intermediaries that need to be trusted.

A more secure alternative to wrapping tokens is to use advanced threshold cryptography to obtain chain-key tokens. As an example, chain-key Bitcoin (ckBTC), the first major chain-key token on ICP, is 1:1 backed with real bitcoin held 100% on chain by a smart contract. It can be considered a Bitcoin _twin_ on the Internet Computer that features low transaction fees and latency and high throughput, similar in its properties to a Bitcoin Layer 2.

## Traditional wrapped tokens

In traditional blockchain architectures, token wrapping involves an off-chain trusted intermediary and a token ledger smart contract. A user who wants to have a specific token, say a wrapped Bitcoin token, sends tokens of the underlying asset, such as bitcoin, to the intermediary. The intermediary, once it has confirmed the transfer of the underlying token on the token’s native blockchain, keeps the received tokens in custody and instructs the token ledger to create, or mint, the same amount of wrapped tokens that it has received of the underlying token. Minting increases the supply of the wrapped token. The newly minted wrapped tokens can then be used on the blockchain where the wrapped token was minted.

If a user wants to redeem wrapped tokens for the underlying asset, this again involves the intermediary: The user sends the wrapped token to an address controlled by the intermediary and makes an unwrap request. The intermediary removes the amount of received wrapped tokens from the wrapped token’s supply and returns the corresponding amount of underlying tokens to the user on the blockchain that natively hosts the underlying asset.

Regular users can just use the wrapped tokens and normally need not bother with the wrapping and unwrapping themselves. Thus, wrapped tokens are convenient for most users and as easy to use as any native token on the same blockchain.

This traditional off-chain approach of wrapping works well from a functional perspective, but has the major drawback of involving an intermediary whose integrity is crucial for the security of the wrapping and unwrapping of the token. The main problem is that the intermediary can get compromised, for example, hacked, defrauded by an insider, or go out of business, which may result in a total loss of the underlying tokens in the worst case. Strategies such as multi-signature schemes with keys held by multiple parties to try to decentralize the intermediary can provide some mitigation but do not change the fact that wrapping is done by an off-chain entity or group of entities. In short, this architecture is not fully decentralized. There is another potential risk regarding the backing of the wrapped token: Ideally, a wrapped token is always backed 1:1 by the underlying token. In practice, however, the intermediary can use the tokens held in custody to create profit, for example, by using them for risky investments. In the worst case, if things go wrong, this can lead to the loss of tokens and a depegging of the wrapped token.

Overall, this traditional way of implementing wrapped tokens is not desirable for reasons of security, risk, and its inherent centralized nature.

## Chain-key tokens

Chain-key tokens, such as ckBTC, are an advanced cryptography-based replacement for wrapped tokens offering stronger security and decentralization: With chain-key tokens, all operations are performed completely on chain by smart contracts, without involving any off-chain intermediaries. This eliminates the security risks and centralization concerns when using a traditional wrapping approach with an intermediary. Replacing wrapping with on-chain operations require a few key building blocks, in particular, a decentralized interaction between the two blockchains must be possible.

Chain-key tokens implement the [ICRC-1 and ICRC-2 token standards](https://github.com/dfinity/ICRC-1/tree/main) so that they can be easily integrated by on-chain services, for example, wallets and DEXs.

## Architecture

The architecture of any chain-key token on ICP uses the following building blocks as its foundation:

  1. Some form of decentralized integration with the blockchain that hosts the underlying token. This integration must allow canisters on ICP to query balances of addresses of the underlying token on its native chain as well as send transactions to the underlying chain.
  2. A chain-key implementation of the signature scheme used for signing transactions on the blockchain hosting the underlying asset must be available. For example, Bitcoin and Ethereum require ECDSA signatures. This functionality makes it possible to sign transactions for the chain of the underlying token fully on chain without involving an intermediary.



ICP has been integrated with the Bitcoin network using a [direct integration at the network level](https://learn.internetcomputer.org/hc/en-us/articles/34209531762324). The integration with Ethereum uses multiple JSON-RPC providers accessed via [HTTPS outcalls](hc/en-us/articles/01JJC9PGK13GHY6C1S0D2TQ58Z) and helper smart contracts deployed on Ethereum.

A chain-key token is typically implemented using a set of canisters:

  1. A **minter** canister is responsible for creating and removing supply of the chain-key token based on the inflow and outflow of the underlying token. It keeps the underlying tokens in on-chain custody, ensuring a 1:1 backing of the chain-key token with the underlying asset. It must be possible for any user to verify that the total supply of the chain-key token does not exceed the minter’s balance of the underlying asset.
  2. A **ledger** canister keeps track of all the balances and handles all transfers of the chain-key token. As mentioned above, this canister must adhere to the ICRC-1 and ICRC-2 token standards.
  3. An **index** canister is used to look up ledger data such as the status of a transaction or the transaction history.
  4. Optionally, one or more **archive** canisters to hold a backup copy of past transactions.



## Creating chain-key tokens from underlying tokens

When a user wishes to obtain chain-key tokens for some underlying tokens, they send the underlying tokens to an address or contract on the origin blockchain controlled by the minter. Once the minter learns about the deposit, it will then instruct the ledger to mint the corresponding number of chain-key tokens for the user.

The minter may learn about the deposit in different ways. The user may inform the minter about the deposit directly by calling an endpoint on the minter. This is the approach used for chain-key Bitcoin. The claim that tokens have been deposited to a certain address is verified by retrieving the current set of unspent outputs of that address. In the case of chain-key Ether (ckETH) and chain-key ERC-20 (ckERC20) tokens, deposits are made to a helper smart contract on Ethereum. The minter learns about deposits by periodically querying the event logs on the helper smart contract.

## Redeeming chain-key tokens for underlying tokens

A chain-key token can circulate on the ICP as long as needed. There is no need to frequently bring in and transfer out underlying tokens, and normally there is no need for most users to do this themselves. However, a user may want to redeem chain-key tokens they hold at some point to receive the underlying asset. To this end, the user must first approve the minter to withdraw at least the desired amount of chain-key tokens from the user’s account (using the approval mechanism defined in [ICRC-2](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-2/README.md)). Note that, depending on the chain-key token, more than one approval may be needed. For example, since ERC-20 transactions on Ethereum cost gas, a fee in ckETH must be paid to cover the gas fee in ETH. The user must therefore approve the ckETH minter to withdraw some of the user’s ckETH for the gas fee as well as the minter of the targeted ckERC20 token for the actual withdrawal.

After the chain-key tokens have been burned, that is, removed from the supply, the minter creates a transaction to transfer the same amount of underlying tokens, possibly minus a fee, from its custody to the user-specified address. The minter uses the chain-key signing functionality available on the Internet Computer to sign the transaction in a decentralized and secure manner. For example, threshold ECDSA signing is used for chain-key tokens where the underlying token can be transferred using ECDSA signatures, which is the case, for example, for Bitcoin, ETH, and tokens on Ethereum.

Lastly, the signed transaction must be transferred to the blockchain hosting the underying token. The direct integration with Bitcoin makes this step simple as the Internet Computer itself offers the functionality to transmit Bitcoin transactions. For EVM-based chains, this step can be accomplished by sending the transaction to JSON-RPC providers using HTTPS outcalls.

