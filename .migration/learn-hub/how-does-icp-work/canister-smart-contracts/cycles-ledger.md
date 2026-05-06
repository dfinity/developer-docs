---
learn_hub_id: 45034096457748
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/45034096457748-Cycles-Ledger"
learn_hub_title: "Cycles Ledger"
learn_hub_section: "Canister Smart Contracts"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Cycles Ledger

The [cycles ledger](https://github.com/dfinity/cycles-ledger) is a canister that simplifies the management of cycles.

Instead of creating one or more cycles wallets, which the developer controls and manages, the cycles ledger is a global ledger under the control of the NNS. That is, the burden of managing cycles wallets is lifted.

The cycles ledger complies with the [IRCR-1](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-1/README.md), [ICRC-2](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-2/README.md), and [ICRC-3](https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-3) standards. As a result, the cycles ledger can also be integrated into applications and services that work with ICRC tokens.

The cycles ledger (canister ID: `um5iw-rqaaa-aaaaq-qaaba-cai`) runs on the [uzr34 system subnet](https://dashboard.internetcomputer.org/subnet/uzr34-akd3s-xrdag-3ql62-ocgoh-ld2ao-tamcv-54e7j-krwgb-2gm4z-oqe). The corresponding index canister (canister ID: `ul4oc-4iaaa-aaaaq-qaabq-cai`) runs on the same subnet.

## Architecture

The following figure depicts the involved components and their interactions at a high level.

![](https://learn.internetcomputer.org/hc/article_attachments/45034096454164)

The cycles ledger interacts with the cycles minting canister of the NNS and user canisters to provide the cycles ledger-specific functionality, such as transferring cycles as well as creating canisters with cycles. Concretely, it provides the following functionality:

  1. `deposit` credits the sent cycles to the given principal ID.
  2. `withdraw` sends the given number of cycles to the given canister.
  3. `withdraw_from` sends the given number of cycles to the given canister taking the funds from a given account.
  4. `create_canister` creates a new canister using cycles.
  5. `create_canister_from` creates a new canister using cycles taken from a given account.



The cycles balance of an account on the cycles ledger can be increased in the following ways:

  1. Calling `deposit` with cycles attached.
  2. Calling `notify_mint_cycles` on the cycles minting canister (CMC) after having deposited ICP in a user-specific subaccount of the CMC's account on the ICP ledger.
  3. Calling `icrc1_transfer` or `icrc2_transfer_from` on the cycles ledger to transfer cycles.



Due to the tight interaction with the NNS, in particular the CMC, the cycles ledger is controlled by the [NNS root canister](https://dashboard.internetcomputer.org/canister/r7inp-6aaaa-aaaaa-aaabq-cai).

It is important to point out that the cycles ledger does not provide the functionality to call arbitrary other canisters with cycles. The reason is that open call contexts may cause the cycles ledger to become stuck.

If this functionality is needed, a developer can still spin up a cycles wallet - and load it with cycles using the cycles ledger.

## Technical Details

As mentioned above, the cycles ledger complies with the ICRC-1, ICRC-2, and ICRC-3 standards, providing all the necessary endpoints. All endpoints are listed in the [Candid file](https://github.com/dfinity/cycles-ledger/blob/main/cycles-ledger/cycles-ledger.did).

Every endpoint that causes a state change (in particular, the creation of a block) on the cycles ledger incurs a fee of **100 million cycles**.

This fee is also levied for the cycles ledger-specific endpoints discussed next.

### Depositing Cycles to the Cycles Ledger

The function `deposit` provides the means to accept cycles from other canisters.
    
    
    type DepositArgs = record {
        to : Account;
        memo : opt vec nat8;
    };
    
    type DepositResult = record { balance : nat; block_index : BlockIndex };
    
    deposit : (DepositArgs) -> (DepositResult);
    

The parameters are the account, i.e., a principal ID-subaccount pair, that should be credited for this transfer, and an optional memo. The memo can later on be retrieved when querying the transaction at the returned block index.

The cycles are attached to the call itself. The cycles ledger checks that at least 100 million cycles are attached and then increases the balance of the account by the number of attached cycles minus the fee. If fewer than 100 million cycles are attached, an error is returned.

### Withdrawing Cycles from the Cycles Ledger

The user invokes the function `withdraw` to instruct the cycles ledger to send the given number of cycles to the specified canister. Alternatively, the function `withdraw_from` can be called to make use of an ICRC-2 approval to get the cycles from an account with a different principal ID.
    
    
    type WithdrawArgs = record {
      amount : nat;
      from_subaccount : opt vec nat8;
      to : principal;
      created_at_time : opt nat64;
    };
    type WithdrawError = variant {
      GenericError : record { message : text; error_code : nat };
      TemporarilyUnavailable;
      FailedToWithdraw : record {
        fee_block : opt nat;
        rejection_code : RejectionCode;
        rejection_reason : text;
      };
      Duplicate : record { duplicate_of : nat };
      BadFee : record { expected_fee : nat };
      InvalidReceiver : record { receiver : principal };
      CreatedInFuture : record { ledger_time : nat64 };
      TooOld;
      InsufficientFunds : record { balance : nat };
    };
    type WithdrawFromArgs = record {
      spender_subaccount : opt vec nat8;
      from : Account;
      to : principal;
      amount : nat;
      created_at_time : opt nat64;
    };
    type WithdrawFromError = variant {
      GenericError : record { message : text; error_code : nat };
      TemporarilyUnavailable;
      FailedToWithdrawFrom : record {
        withdraw_from_block : opt nat;
        refund_block : opt nat;
        approval_refund_block : opt nat;
        rejection_code : RejectionCode;
        rejection_reason : text;
      };
      Duplicate : record { duplicate_of : BlockIndex };
      InvalidReceiver : record { receiver : principal };
      CreatedInFuture : record { ledger_time : nat64 };
      TooOld;
      InsufficientFunds : record { balance : nat };
      InsufficientAllowance : record { allowance : nat };
    };
    
    withdraw : (WithdrawArgs) -> (variant { Ok : BlockIndex; Err : WithdrawError });
    withdraw_from : (WithdrawFromArgs) -> (variant { Ok : BlockIndex; Err : WithdrawFromError });
    

The function `withdraw` has four parameters: the number of cycles to be sent, an optional subaccount, the principal ID of the targeted canister, and an optional timestamp to indicate the time when the request was created.

Note that the sum of the transferred amount and the fee of 100 million cycles is deducted from the user’s account derived from the user’s principal ID and the provided subaccount (if any). The memo in the recorded burn transaction is an encoding of the principal ID of the targeted canister, which makes it possible for the user to verify that the cycles were sent to the right canister when querying the corresponding transaction.

The effective fee of burn blocks of 100 million cycles is different from other ledgers, particularly the ICP ledger and standard ICRC ledgers, where the effective fee of burn blocks is 0. This is because withdrawing cycles is fundamentally different from just burning tokens.

The function `withdraw_from` is almost identical but it makes it possible to specify a `from` account, i.e., the cycles are meant to be withdrawn from an account with a different principal ID. If the spender's principal ID plus optional subaccount has not been approved to retrieve at least the specified amount, an `InsufficientAllowance` error is returned.

### Creating Canisters Using the Cycles Ledger

A canister can be created by calling the `create_canister` function, which has four parameters:

  * An optional subaccount from which the funds are taken. If no subaccount is provided, the default account (with the all-zero subaccount) is used.
  * An optional timestamp to mark the time when the request has been created.
  * The number of cycles to be used.
  * The canister creation arguments for the cycles minting canister.



There is also the function `create_canister_from`, which in addition requires a `from` account.
    
    
    type CreateCanisterArgs = record {
      from_subaccount : opt vec nat8;
      created_at_time : opt nat64;
      amount : nat;
      creation_args : opt CmcCreateCanisterArgs;
    };
    
    type CreateCanisterFromArgs = record {
      from : Account;
      spender_subaccount : opt vec nat8;
      created_at_time : opt nat64;
      amount : nat;
      creation_args : opt CmcCreateCanisterArgs;
    };
    
    type CmcCreateCanisterArgs = record {
      settings : opt CanisterSettings;
      subnet_selection : opt SubnetSelection;
    };
    
    type CanisterSettings = record {
      controllers : opt vec principal;
      compute_allocation : opt nat;
      memory_allocation : opt nat;
      freezing_threshold : opt nat;
      reserved_cycles_limit : opt nat;
    };
    
    type SubnetSelection = variant {
      Subnet : record {
        subnet : principal;
      };
      Filter : SubnetFilter;
    };
    
    type SubnetFilter = record {
      subnet_type : opt text;
    };
    
    type CreateCanisterSuccess = record {
      block_id : BlockIndex;
      canister_id : principal;
    };
    
    type CreateCanisterError = variant {
      InsufficientFunds : record { balance : nat };
      TooOld;
      CreatedInFuture : record { ledger_time : nat64 };
      TemporarilyUnavailable;
      Duplicate : record {
        duplicate_of : nat;
        canister_id : opt principal;
      };
      FailedToCreate : record {
        fee_block : opt BlockIndex;
        refund_block : opt BlockIndex;
        error : text;
      };
      GenericError : record { message : text; error_code : nat };
    };
    
    type CreateCanisterFromError = variant {
      InsufficientFunds : record { balance : nat };
      InsufficientAllowance : record { allowance : nat };
      TooOld;
      CreatedInFuture : record { ledger_time : nat64 };
      TemporarilyUnavailable;
      Duplicate : record {
        duplicate_of : nat;
        canister_id : opt principal;
      };
      FailedToCreateFrom : record {
        create_from_block : opt BlockIndex;
        refund_block : opt BlockIndex;
        approval_refund_block : opt BlockIndex;
        rejection_code : RejectionCode;
        rejection_reason : text;
      };
      GenericError : record { message : text; error_code : nat };
    };
    
    create_canister : (CreateCanisterArgs) -> (variant { Ok : CreateCanisterSuccess; Err : CreateCanisterError });
      create_canister_from : (CreateCanisterFromArgs) -> (variant { Ok : CreateCanisterSuccess; Err : CreateCanisterFromError });
    

It is possible to specify canister settings, which are applied to the newly created canister. If not specified, the caller is the controller of the canister and the other settings are set to default values.

It is further possible to target a specific subnet by specifying the principal ID of a subnet in the `subnet_selection` field. Alternatively, a subnet type such as "fiduciary" may be specified. If the subnet selection is left empty, the new canister is installed on a random subnet.

Since only the cycles minting canister has the power to create canisters on arbitrary subnets, the cycles ledger simply invokes the function `create_canister` on the cycles minting canister, attaching the user-specified number of cycles to the call. If a canister is created successfully, the cycles ledger returns both the block index of the transaction that burned the cycles on the cycles ledger and the principal ID of the newly created canister.

## Additional Information

  * [Developer documentation](https://docs.internetcomputer.org/defi/token-ledgers/cycles-ledger)
  * [Chain-key tokens](https://learn.internetcomputer.org/hc/en-us/articles/34211397080980)
  * [Tokens & cycles](https://docs.internetcomputer.org/building-apps/getting-started/tokens-and-cycles)



