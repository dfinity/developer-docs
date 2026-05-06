---
learn_hub_id: 44598021228564
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/44598021228564-Chain-key-Bitcoin"
learn_hub_title: "Chain-key Bitcoin"
learn_hub_section: "Chain Fusion"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Chain-key Bitcoin

Chain-key Bitcoin (ckBTC) is a token on the Internet Computer that is backed 1:1 by bitcoin (BTC) such that 1 ckBTC can always be redeemed for 1 BTC and vice versa.

Unlike other tokens pegged to bitcoin, the ckBTC token does not rely on a third-party bridge for the conversion between BTC and ckBTC, making it a substantially more secure alternative to “wrapped” tokens.

While chain-key bitcoin and regular bitcoin have the same value, the advantage of chain-key bitcoin is fast and cheap transfers: A transfer is finalized within a few seconds (a speed-up of roughly three orders of magnitude compared to transfers on the Bitcoin blockchain when waiting for 6 confirmations) and only costs 0.0000001 ckBTC (approximately two orders of magnitude lower than the Bitcoin miner fees).

## Architecture

The ckBTC functionality is built upon the [Bitcoin integration](https://learn.internetcomputer.org/hc/en-us/articles/34211154520084 "Bitcoin integration") of the Internet Computer, which makes it possible for canisters to receive, hold, and send bitcoin.

There are two canisters, the ckBTC minter and ckBTC ledger, that together provide the ckBTC functionality. The ckBTC minter mints new ckBTC tokens whenever it receives bitcoin. Likewise, it burns ckBTC tokens whenever an owner of ckBTC tokens requests a withdrawal of bitcoin. The ckBTC minter waits for 6 confirmations before minting ckBTC and it burns ckBTC before it transfers BTC back to the users. The ckBTC ledger is [ICRC-2](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-2/README.md) and [ICRC-1](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-1/README.md) compliant, updating the balance accounts when ckBTC tokens are transferred and executing the mint and burn operations coming from the ckBTC minter.

An overview of the basic architecture is depicted in the following figure.

![](https://learn.internetcomputer.org/hc/article_attachments/44598021222548)

The figure shows the main flow at a high level of abstraction: Users interact with the ckBTC minter and the ckBTC ledger to convert ckBTC/BTC and transfer ckBTC, respectively. The ckBTC minter interacts with the [Bitcoin canister](https://github.com/dfinity/bitcoin-canister) to retrieve information about the Bitcoin network state and send Bitcoin transactions.

The ckBTC minter further interacts with the [Bitcoin checker canister](https://learn.internetcomputer.org/hc/en-us/articles/45033984570516) to run checks against Bitcoin addresses and transactions. These checks are meant to ensure that the ckBTC minter only uses "clean" bitcoins to back the issued ckBTC tokens and to prevent transferring bitcoins to Bitcoin addresses that are considered to be associated with illicit activity. As such, these checks provide an additional layer of security to ckBTC users.

## Canisters

Both the [ckBTC ledger](https://dashboard.internetcomputer.org/canister/mxzaz-hqaaa-aaaar-qaada-cai) and the [ckBTC minter](https://dashboard.internetcomputer.org/canister/mqygn-kiaaa-aaaar-qaadq-cai), running on the [pzp6e](https://dashboard.internetcomputer.org/subnet/pzp6e-ekpqk-3c5x7-2h6so-njoeq-mt45d-h3h6c-q3mxf-vpeq5-fk5o7-yae) subnet, are canisters that are controlled by the NNS (specifically, the [NNS root canister](https://dashboard.internetcomputer.org/canister/r7inp-6aaaa-aaaaa-aaabq-cai)).

### ckBTC Ledger

The ckBTC ledger, which complies with the [ICRC-2](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-2/README.md) and [ICRC-1](https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-1) standards, is responsible for keeping account balances and for transferring ckBTC between accounts. It provides the following functionality:

  * It enables the ckBTC minter to mint and burn ckBTC.
  * It enables the transfer of ckBTC among users.



As mentioned above, the transaction fee is 0.0000001 ckBTC, the equivalent of 10 satoshi. The transaction fee is sent to the account with the ckBTC minter as the owner and the subaccount `0xfee`. The **minting account** is the ckBTC minter’s default account; that is, the ckBTC minter’s principal ID and the all-zero subaccount. The initial supply of the ckBTC ledger is 0. ckBTC tokens are minted only when the ckBTC minter receives bitcoin, ensuring that the ckBTC supply managed by the ckBTC ledger is upper bounded by the amount of bitcoin held by the ckBTC minter.

### ckBTC Minter

The ckBTC minter is the canister responsible for managing deposited BTC and minting/burning ckBTC based on the amount of deposited BTC. It provides the following functionality:

  * For a certain principal ID and an optional subaccount, it returns a specific Bitcoin address under the ckBTC minter’s control. The ckBTC minter uses P2WPKH (“pay to witness public key hash”) addresses as defined in [BIP-141](https://en.bitcoin.it/wiki/BIP_0141). These addresses are rendered in the Bech32 format as defined in [BIP-173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki). While the ckBTC minter exclusively uses P2WPKH addresses internally, it supports all currently used address formats (P2PKH, P2SH, P2WPKH, P2TR) for retrievals.
  * Users can inform the ckBTC minter about bitcoins that were sent to an address controlled by the ckBTC minter. If the balance has increased, the ckBTC minter mints ckBTC for the user associated with the Bitcoin address.
  * Users can request to get bitcoins back. The ckBTC minter burns the same amount of ckBTC and transfers the corresponding BTC amount minus fees to the address provided by the user.



The ckBTC minter canister has a few important configuration parameters including:

  * `retrieve_btc_min_amount`: This is the minimum ckBTC amount that can be burned and, correspondingly, the minimum BTC amount that can be withdrawn. The parameter is set to **0.0005 BTC** , or **50,000 satoshi**.
  * `max_time_in_queue_nanos`: Any BTC retrieval request should be kept in a queue for at most this time. Caching requests rather than handling them right away has the advantage that multiple requests can be served in a single transaction, saving Bitcoin miner fees. The parameter is currently set to **5 minutes**.
  * `min_confirmations`: The number of confirmations required for the ckBTC minter to accept a Bitcoin transaction. In particular, the ckBTC minter does not mint ckBTC before a transaction transferring BTC to a Bitcoin address managed by the ckBTC minter reaches this number of transactions. The parameter is currently set to **6**.
  * `btc_checker_principal`: The principal ID of the Bitcoin checker canister, discussed below.
  * `check_fee`: The fee that must be paid when depositing bitcoins to cover the cost in cycles for interacting with the Bitcoin checker canister. It is currently set to **100 satoshi**.
  * `utxo_consolidation_threshold`: The minimum number of unspent transaction outputs (UTXOs) to trigger a consolidation. UTXO consolidation is discussed below.
  * `max_num_inputs_in_transaction`: The maximum number of inputs that the ckBTC minter uses in a transaction, set to **1000**.



The remaining parameters are self-explanatory and can be found in the [ckBTC minter Candid file](https://github.com/dfinity/ic/blob/master/rs/bitcoin/ckbtc/minter/ckbtc_minter.did).

The following sections explain how the ckBTC minter manages its internal state.

#### Addresses

All Bitcoin addresses that are controlled by the ckBTC minter and have a positive balance are part of the ckBTC minter's state. If the balance of such an address reduces to zero, the address is removed from the state. It can be added back if the balance becomes positive again.

#### Unspent Transaction Outputs

Once a new unspent transaction output (UTXO) under the control of the ckBTC minter is discovered (using the `update_balance` function), it is stored internally in a set called `available_utxos` (defined [here](https://github.com/dfinity/ic/blob/2348b094d3d27616ee3f049d3048baa1da8d625a/rs/bitcoin/ckbtc/minter/src/state.rs#L305C14-L305C14) in the source code).

All discovered UTXOs remain in this set until a Bitcoin transaction is created to spend one or more of them when retrieving bitcoins. When a transaction is created spending some UTXOs, these UTXOs are removed from the set `available_utxos` and inserted in the `used_utxos` field of the `SubmittedBtcTransaction` struct (defined [here](https://github.com/dfinity/ic/blob/70d19f16c17f8f42987a46d473ba27705927cdb7/rs/bitcoin/ckbtc/minter/src/state.rs#L87) in the source code), which is the internal representation of a Bitcoin transaction.

A UTXO is removed from the ckBTC state when the `SubmittedBtcTransaction` struct that contains the UTXO is removed from the state.

#### Transactions

Every transaction that the ckBTC minter creates has an output that sends the ckBTC minter fee plus the transaction change back to its main BTC address (the P2WPKH address derived from its public key with an empty derivation path).

A transaction can be removed from the cache if the transaction output that belongs to the ckBTC minter appears in the returned list of UTXOs of the ckBTC minter’s main BTC address with at least `min_confirmations=6` confirmations.

The ckBTC minter may resubmit transactions, making use of Bitcoin’s request by fee (RBF) mechanism as defined in [BIP-125](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki). In the case of ckBTC, a resubmission adds a transaction to the cache that spends exactly the same UTXOs as the transaction it replaces. The only difference is that the BTC amount sent to the user(s) is reduced in order to increase the fee.

BIP-125 states that at most 100 transactions may be evicted from the mempool, i.e., the fee cannot be increased more than 100 times. Moreover, the fee must be increased at least by the minimum relay fee (see minrelaytxfee [here](https://en.bitcoin.it/wiki/Miner_fees#Relaying)) of 1 satoshi/vbyte.

For example, if we assume a minimum increase of 200 satoshi (the minimum fee for a basic `segwit` transaction with one input and one output is 192 satoshi and the number per output is always lower than 200 if there are at least as many outputs as inputs), the minimum transfer amount should be at least 20,000 satoshi which equals 0.0002 BTC. When adding a base fee at a large fee rate of 100 satoshi/vbyte and assuming a virtual transaction size of 200 vbyte per output, we get a minimum transfer amount of 0.0004 BTC. Adding a security margin, we get the minimum retrieval amount of 0.0005 BTC that is used for the configuration parameter `retrieve_btc_min_amount`. The RBF flag is set on every transaction to ensure that they can be updated if necessary.

Transactions with `min_confirmations=6` confirmations or more are considered  _finalized_. The ckBTC minter stores information about finalized transactions forever.

## Converting BTC to ckBTC

In this section, the process to convert BTC to ckBTC is explained, making use of the ckBTC minter and ckBTC ledger endpoints.

The first step is for the user to determine the Bitcoin address where the user is supposed to transfer bitcoin for the minting process by calling the `get_btc_address` endpoint. Next, the user transfers the desired BTC amount to this Bitcoin address.

Once the transaction has `min_confirmations=6` confirmations, the user notifies the ckBTC minter to update the balance of the user's account on the ckBTC ledger by calling the `update_balance` function. The ckBTC minter uses the `bitcoin_get_utxos` endpoint of the Bitcoin canister to retrieve the current list of UTXOs for the Bitcoin address associated with the user. If there are new UTXOs, the ckBTC minter instructs the Bitcoin checker canister to perform a check of the newly discovered UTXOs and then, if the checks are successful, issues a minting transaction to the ckBTC ledger per UTXO, minting the value of the UTXO minus the Bitcoin checker fee into the user’s account.

Formally, Let `R` denote the set of returned UTXOs. The following pseudo-code illustrates how the UTXOs are processed:
    
    
    for utxo in new_utxos(R):    // R = set of returned UTXOs
        if utxo.value >= check_fee:
            if utxo in checked_utxos:
                state = checked_utxos.get(utxo)
            else:
                state = bitcoin_checker.check_transaction(utxo.transaction_id).await?
                if state == passed:
                    checked_utxos.set(utxo, passed)
            if state == passed:
                ckbtc_ledger.mint(utxo.value-check_fee, recipient_account).await?
                available_utxos.add(utxo)    // Add to available UTXOs
                checked_utxos.remove(utxo)   // Remove from checked UTXOs after minting
            else:
                add_to_quarantine_list(utxo)
        else:
            add_to_ignore_list(utxo)
    return response with UTXO statuses
    

The function `new_utxos` extracts the newly discovered UTXOs from `R`. Details about this function are provided further below.

A UTXO is considered if its value is at least `check_fee`. UTXOs with a value lower than this fee are added to an ignore list. The additional state `checked_utxos` is maintained to remember that a UTXO was checked if the state is clean. Once the corresponding amount of ckBTC has been minted, this state can be removed again. If the UTXO does not pass the check, it is moved to a quarantine list instead.

The function `new_utxos` filters out all UTXOs in the ignore list, the quarantine list, and the set `available_utxos`, as well as the UTXOs in any `used_utxos` list of `SubmittedBtcTransaction` structs. By contrast, the UTXOs in `checked_utxos` are not filtered.

Note that the implementation uses the map `utxos_state_addresses` instead of the set `available_utxos`. For each address, the map contains all UTXOs, including UTXOs already used in outgoing transactions. It is therefore not necessary to parse all `SubmittedBtcTransaction` structs when using the map because UTXOs that have been used in transactions are already considered.

UTXOs in the ignore list and quarantine list remain there indefinitely. Mechanisms to enable the owner to transfer the funds in these UTXOs back out may be added in the future.

## Converting ckBTC to BTC

The process to convert ckBTC to BTC consists of the following steps:

  1. Transfer request: The user makes the desired ckBTC amount available to the ckBTC minter and requests a conversion. The destination Bitcoin address undergoes a check by the Bitcoin checker canister. If the check is successful, the request is accepted and put into a queue.
  2. Submission: The ckBTC minter periodically attempts to submit transactions for validated transfer requests.
  3. Finalization: The ckBTC minter periodically checks which transactions went through and finalizes these transactions.
  4. Resubmission: The ckBTC minter can resubmit a transaction that has been pending for at least one day with a higher fee.



The individual parts are discussed in greater detail in the following sections.

There are two flows to convert ckBTC to BTC. The newer, recommended flow is based on the ICRC-2 standard and requires the user to allow the ckBTC minter to withdraw the desired amount from a user-controlled account by calling `icrc2_approve` on the ckBTC ledger. Subsequently, the user can call the `retrieve_btc_with_approval` endpoint to inform the ckBTC minter about the withdrawal intent. In addition to specifying the withdrawal amount, the Bitcoin address where the withdrawn funds are to be sent must be specified as well.

The ckBTC minter instructs the Bitcoin checker canister to perform a check against the targeted Bitcoin address using the `check_address` endpoint. If the check is successful, the ckBTC minter deducts the fee from the amount to be retrieved and puts the corresponding retrieval request into a queue and checks the status of the queue on a timer.

If the oldest request has been in the queue for at least 10 minutes or at least 20 retrieval requests have been accumulated, the ckBTC minter creates a single Bitcoin transaction to serve up to 100 retrieval requests as follows:

  1. It selects available UTXOs with a total sum of at least the sum in the retrieval requests.
  2. It constructs a Bitcoin transaction with the selected UTXOs as inputs and an output for each retrieval request plus an additional output for the ckBTC minter’s fee and the change.
  3. It uses the Bitcoin canister’s fee API to determine an appropriate fee for the transaction, using the median fee rate.
  4. It distributes the fee evenly among all outputs other than the output for the ckBTC minter’s fee plus change.
  5. For each input of the transaction, the ckBTC minter invokes the threshold ECDSA functionality (calling the `sign_with_ecdsa` function) to obtain the required signatures and puts them into the transaction.
  6. Lastly, it sends the Bitcoin transaction by invoking the `bitcoin_send_transaction` function of the Bitcoin integration API.



The BTC retrieval process is depicted in the following figure.

![](https://learn.internetcomputer.org/hc/article_attachments/44598026440340)

Note that the amounts in the transfer to the withdrawal account and the retrieval request need not be the same. The `retrieve_btc_status_v2` endpoint can be used to query the current status of a retrieval request.

The other, older mechanism, which is not based on ICRC-2, is summarized here briefly for the sake of completeness. Since the ckBTC minter can only burn ckBTC in an account that it controls, the first step is to transfer the amount to be retrieved to the owner-specific  _withdrawal account_ under the ckBTC minter’s control. After the user has transferred the desired ckBTC amount to the withdrawal account, the user can call the `retrieve_btc` endpoint, specifying the withdrawal amount and the destination Bitcoin address. The ckBTC minter will then attempt to burn the specified ckBTC amount in the withdrawal account and, if the Bitcoin checker canister indicates that the destination address is clean, record the retrieval request, which is handled on a timer as before.

The advantage of the ICRC-2-based flow is that the ckBTC amount stays with the user until a request is made to retrieve BTC, i.e., the risk that the funds get stuck in the withdrawal account is removed.

Looking at the retrieval flow in more detail, the first step is to approve the ckBTC minter to withdraw the desired ckBTC amount from (one of) the user's accounts. To this end, the user calls icrc2_approve on the ckBTC ledger. The required parameters are `spender` and `amount` but there are also several optional parameters such as `from_subaccount`.

Subsequently, the user can call `retrieve_btc_with_approval` on the ckBTC minter with parameters `address`, specifying the Bitcoin address that should receive the retrieved bitcoins, and `amount` (plus, optionally, `from_subaccount`), which causes the ckBTC minter to attempt to transfer the specified amount from the user's account to the minting account. As defined in ICRC-1, transferring tokens to the minting account constitutes a burn operation. Note that specifying an amount to be retrieved smaller than the minimum retrieval amount (`retrieve_btc_min_amount`) results in an immediate rejection of the request.

If the burn operation fails, the retrieval process is aborted and an error is returned to the user. If the ckBTC tokens are burned successfully, the ckBTC minter instructs the Bitcoin checker canister to perform a check against the Bitcoin address where funds are supposed to be sent. If this check fails, a task is created internally to reimburse the burned amount to the user and an error is returned. Otherwise, the steps depend on the result: if the result is `Passed`, a task to transfer the amount minus the Bitcoin checker fee to the destination address is created and the user receives the signal that the request was accepted in the form of the block index of the burn operation on the ckBTC ledger. If the result is `Failed`, a task to reimburse the amount  _minus the Bitcoin checker fee_ is created and a corresponding error message is returned to the user.

The following pseudo-code illustrates how the `retrieve_btc_with_approval` endpoint works, given the parameters `amount` and `btc_address`.
    
    
    assert(max(retrieve_btc_min_amount, check_fee) <= amount)
    index = ckbtc_ledger.icrc2_transfer_from(user_account, minting_account, amount).await?
    result = bitcoin_checker.check_address(btc_address).await
    if result = error:
        create_reimbursement(amount, index, user_account)
        return Error("Failed to perform check")
    else:
        Ok(state) = result
        if state == clean:    
            create_request(amount-check_fee, index, btc_address)
            return index
        else:
            create_reimbursement(amount-check_fee, index, btc_address)
            return Error("Tainted destination address")
    

For each recorded retrieval request, the ckBTC minter stores the following data:

  * `index`: The block index of the burn operation used to burn the ckBTC. Since the block index is unique, it is used as the request ID.
  * `amount`: The total amount of tokens to retrieve. This amount must be at least the minimum retrieval amount as defined above.
  * `btc_address`: The address where the bitcoins will be sent.
  * `received_at`: The timestamp when the request was received (not shown in the pseudo-code).



Pseudo-code for the older `retrieve_btc` endpoint whose retrieval flow is based on the concept of withdrawal accounts is shown here, also requiring the parameters `amount` and `btc_address`.
    
    
    assert(amount >= max(retrieve_btc_min_amount, kyt_fee))
        assert(ckbtc_ledger.balance_of(withdrawal_account).await? >= amount)
        state = bitcoin_checker.check_address(btc_address).await?
    
    if state == clean:
        index = ckbtc_ledger.icrc1_transfer(withdrawal_account, minting_account, amount).await?
        create_request(amount-check_fee, index, btc_address)
        return index
     else:
        index = ckbtc_ledger.burn(check_fee, withdrawal_account).await?
        return Error("Tainted destination address", index)
    

Note that while the `retrieve_btc` endpoint achieves the same result as `retrieve_btc_with_approval`, it works quite differently internally. For example, the check performed by the Bitcoin checker canister happens _before_ the ckBTC tokens are burned. Further note that if the check succeeds but the burn transaction fails (regardless of the result of the check), no fee is charged and the request is rejected, which implies that a subsequent request with the same parameters will result in another call to the Bitcoin checker canister.

#### Submission

The ckBTC minter uses the [timer functionality](https://internetcomputer.org/docs/current/developer-docs/backend/periodic-tasks) to initiate Bitcoin transfers. The following steps are carried out periodically:

  1. Check if there is at least one request that is 10 minutes old or there are at least 20 requests in the pending-requests queue. If not, stop.
  2. Update the balance of the ckBTC minter’s main BTC address (the P2WPKH address derived from its public key with an empty derivation path) using the Bitcoin integration’s `bitcoin_get_utxos` function. Newly discovered UTXOs are added to the set `available_utxos`.
  3. Determine the total amount of bitcoins available, which is the sum of all bitcoins in `available_utxos`.
  4. Call the transfer function with the next batch of requests that can be served given the total amount of available bitcoins. A transaction is created, setting the transaction ID for each request in the batch, and sent to the Bitcoin network.
  5. Every request in this batch is then moved to the unconfirmed-transfers queue.



  
As evident from the steps outlined above, the transfer function can handle multiple requests at the same time. Handling multiple requests in a single transaction has several advantages over sending individual transactions:

  1. Requests can possibly be served more quickly, especially if the ckBTC minter must wait for change to return to its main BTC address.
  2. As the fee for the non-input bytes is shared, the fee per request is slightly lower.
  3. Serving multiple requests at the same time can make denial-of-service attacks where an attacker attempts to drain the pool of usable UTXOs with many small requests harder.



Given this set of requests, the next step is to select UTXOs for the transaction.

Since UTXOs are always spent entirely, the difference between the sum of bitcoins in the spent UTXOs and the requested amount minus the Bitcoin miner fee must be transferred to a new UTXO as well. As mentioned before, the ckBTC minter uses its main BTC address to accumulate change.

The transfer function performs the following steps:

  1. Determine the target `t` of bitcoins that must be transferred out to handle all requests in the given batch.
  2. Select UTXOs for the transaction from the set `available_utxos`.
  3. Build the Bitcoin transaction and compute the Bitcoin miner fee based on current Bitcoin fees using the median fee rate of the return value of `bitcoin_get_current_fee_percentiles` and the (virtual) size of the transaction. The ckBTC minter fee is `146*in + 4*out + 26 satoshi`, where `in` and `out` denote the number of transaction inputs and outputs, respectively. Note that the fee is split evenly among the handled retrieval requests, deducting the same fraction of the total fee from each output that is not returning change and the ckBTC minter fee to the ckBTC minter.
  4. Sign every input using the threshold ECDSA interface.
  5. Submit the transaction using the `bitcoin_send_transaction` endpoint.
  6. Create a transaction record in the form of a `SubmittedBtcTransaction` struct. The UTXOs selected for this transaction are moved from the set `available_utxos` to the `used_utxos` field in the `SubmittedBtcTransaction` struct.



The following UTXO selection algorithm, in pseudo-code, is used:
    
    
    // t = target, A = available_utxos, k = # outputs
    // Pre-condition: sum(A) >= t
    fn select_utxos(t, A, k)
    
        fn greedy(t, A):
            if t ≤ 0 or |A| = 0: return {}
            m := max(A)    // The UTXO with the largest value
            if m.value < t:
                return {m} ∪ greedy(t-m.value, A \ {m})
            else:
                return min({a ∊ A | a.value ≥ t})
    
        S := greedy(t, A)  
        A := A \ S
        if |A| > UTXOS_COUNT_THRESHOLD:
            a := min(A)
            while a ≠ Ø and |S| < k:
                S := S ∪ {a}
            	A := A \ {a}
        return S
    

The algorithm has the following properties. If there are at most `UTXOS_COUNT_THRESHOLD` (currently set to 1,000) UTXOs, the algorithm greedily chooses the smallest number of UTXOs possible for the given target. If a single UTXO suffices, it uses the UTXO that results in the smallest change.

If there are more than `UTXOS_COUNT_THRESHOLD` UTXOs, the UTXOs with the smallest values are added to the greedy solution until the number of inputs `k` matches the number of outputs that the transaction produces. Note that a transaction with `k` outputs handles `k-1` retrieval requests as there is always one output that returns the change and fee to the ckBTC minter.

Once the transaction is sent, the requests are moved to the unconfirmed-transfers queue.

#### Finalization

The ckBTC minter uses the timer mechanism to determine the status of sent transactions as well. Specifically, the ckBTC minter periodically wakes up and checks the state of the requests in the unconfirmed-transfers queue. The ckBTC minter checks the UTXOs of its main account to determine which transactions have sufficiently many confirmations. Concretely, If an output returning the ckBTC fee and change is discovered, the corresponding transaction is considered final and is discarded.

#### Resubmission

It is possible that it takes a long time for a transaction to be included in a block. If fees increase significantly for some time, a transaction may even be stuck for a long time or dropped entirely. While the ckBTC minter uses a reasonable fee, it may still be necessary to issue a transaction again because burned ckBTC are never returned and UTXOs are never freed and are thus stuck when the transaction spending these UTXOs is stuck.

The ckBTC minter resubmits a transaction that has not been confirmed within 24 hours.

If a transaction is replaced, the new transaction uses the same UTXOs as the original transaction but the fee is increased. In other words, the transaction is identical except that the outputs for each user is reduced due to the increased fee. The new fee is the sum of the old transaction fee plus the size of the transaction (in `vbytes`) times the minimum relay fee of 1 satoshi/vbyte plus the ckBTC minter fee again because the ckBTC minter must acquire new signatures and send the new transaction to the Bitcoin canister.

## Fees

The ckBTC canisters run on an application subnet and must be self-sustainable. Rather than charging cycles for the endpoints, the ckBTC minter accumulates a surplus of BTC over time. Moreover, every ckBTC transaction increases the ckBTC balance of the ckBTC minter's fee account (i.e., its principal ID plus the `0xfee` subacccount) by **10 satoshi**. In the future, the ckBTC minter will mint ckBTC to get the total ckBTC supply and the BTC amount under the ckBTC minter's control to match. The ckBTC minter can then trade these extra ckBTC tokens for cycles to fuel both the ckBTC minter and ckBTC ledger.

There is a growing surplus of BTC because it collects a fee when bitcoins are withdrawn. The formula for the ckBTC minter fee when calling `retrieve_btc` is determined as follows:

  * Under the conservative assumption that 1 BTC = 20,000 XDR, 1 billion cycles corresponds to 5 satoshi (because 1 trillion cycles corresponds to 1 XDR).
  * The [cost](https://docs.internetcomputer.org/references/t-sigs-how-it-works/#api-fees) to obtain a single EDCSA signature is approximately 26.16 billion cycles on a 34-node subnet, whereas sending a Bitcoin transaction costs 5 billion cycles plus 20 million cycles per byte.



Given these numbers, the cost to sign and send a transaction with `in` inputs and `out` outputs is
    
    
    26.16b*in + 5b + tx_size*20m cycles
    < 26.16b*in + 5b + (149*in + 35*out + 10)*20m cycles
    < 29.14b*in +0.7b*out + 5.2b cycles
    < 146*in + 4*out + 26 satoshi.
    

The formula `146*in + 4*out + 26` is used to determine the ckBTC minter’s fee in satoshi. Since every transaction has at least two inputs and two outputs, the fee is at least 352 satoshi.

This conservative pricing strategy is used to subsidize the other endpoints, which are free of charge. Moreover, while the `retrieve_btc_with_approval` endpoint is relatively expensive, the fee is typically still lower than the Bitcoin miner fee.

As mentioned above, there is also a fee (namely, the Bitcoin checker fee of **100 satoshi**) when converting BTC to ckBTC (but not when converting ckBTC to BTC).

## UTXO Consolidation

As more and more bitcoins are deposited, the number of UTXOs that are managed by the ckBTC minter grows. Users tend to deposit bitcoins in small quantities, resulting in many UTXOs that lock small amounts. A consequence of the ckBTC minter managing numerous small UTXOs is that it may not be possible to withdraw a large amount in a single transaction because such a transaction would require spending an exceedingly large number of outputs, which would cause the transaction to be larger than the maximum size of a standard Bitcoin transaction of [100 KB](https://github.com/bitcoin/bitcoin/blob/3c098a8aa0780009c11b66b1a5d488a928629ebf/src/policy/policy.h#L24). In other words, large withdrawals may take longer as they might have to be split up into multiple smaller withdrawals, leading to a poor user experience.

In order to mitigate the risk of failed withdrawal requests, the ckBTC miner creates  _UTXO consolidation transactions:_ As long as the ckBTC minter has more than 10,000 UTXOs, it periodically creates transactions that spend the 1000 smallest outputs that it possesses, creating 2 new outputs each locking half of the sum of the bitcoins in the inputs minus the network fee. Initially, a consolidation transaction is created once per day, and the frequency is later reduced to once per week. 1000 inputs are used as it is large enough a number to reduce the total number of managed UTXOs quickly but small enough to generate standard Bitcoin transactions. It is a technical detail why 2 outputs are created as opposed to a single one: More of the existing code can be reused for consolidation transactions as every other transaction created by the ckBTC minter has at least 2 outputs, one for the user requesting a withdrawal and one for the change that goes back to the ckBTC minter.

In contrast to transactions triggered by withdrawal requests, the ckBTC minter triggers UTXO consolidation transactions and therefore must pay for them itself. The ckBTC minter uses the funds accumulated in its fee collector account, i.e., its `0xfee` subaccount. Since the ckBTC minter is using its own funds, it is still always guaranteed that 1 ckBTC is backed by (at least) 1 BTC.

## ckBTC Minter API

The ckBTC minter provides the following endpoints:

  * `get_btc_address`: Returns a specific Bitcoin address that the caller can use to obtain ckBTC by sending BTC to this address.
  * `get_known_utxos` (query): Returns the UTXOs associated with the given account (principal ID-subaccount pair) that the ckBTC minter knows.
  * `update_balance`: Instructs the ckBTC minter to check the balance of a Bitcoin address and mint ckBTC into the account of the owner.
  * `estimate_withdrawal_fee`: Returns a current estimate for the fee to be paid when retrieving a certain BTC amount.
  * `get_deposit_fee` (query): Returns the fee charged when minting ckBTC. This fee currently corresponds to `check_fee`.
  * `get_withdrawal_account`: Returns a specific ckBTC account where the owner must transfer ckBTC before being able to retrieve BTC.
  * `retrieve_btc_with_approval`: Instructs the ckBTC minter to burn a certain ckBTC amount and send the corresponding BTC amount, minus fees, to a provided Bitcoin address.
  * `retrieve_btc`: Serves the same purpose as `retrieve_btc_with_approval` but requires the user to first deposit ckBTC in a specific subaccount of the ckBTC minter.
  * `retrieve_btc_status_v2` (query): Returns the status of a previous `retrieve_btc` or `retrieve_btc_with_approval` call.
  * `retrieve_btc_status_v2_by_account` (query): Provides the status of all recent `retrieve_btc` or `retrieve_btc_with_approval` calls associated with the provided account.
  * `retrieve_btc_status` (query): Serves the same purpose as `retrieve_btc_status_v2` but returns less status information. This endpoint is considered  _deprecated_.
  * `get_minter_info` (query): Returns information about the ckBTC minter itself.
  * `get_canister_status`: Returns canister status information.
  * `get_events` (query): Returns a set of events for debugging purposes.



## Additional information

  * [Bitcoin integration](https://learn.internetcomputer.org/hc/en-us/articles/34211154520084)
  * [ckBTC developer documentation](https://docs.internetcomputer.org/defi/chain-key-tokens/ckbtc/overview)



#### 

