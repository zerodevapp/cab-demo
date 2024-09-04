export const vaultManagerAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_invoiceManager",
        type: "address",
        internalType: "contract IInvoiceManager",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "accountShares",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "address", internalType: "contract IVault" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "accountVaultList",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "address", internalType: "contract IVault" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "addVault",
    inputs: [
      {
        name: "vault",
        type: "address",
        internalType: "contract IVault",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "completeWithdrawals",
    inputs: [
      {
        name: "withdrawalIds",
        type: "bytes32[]",
        internalType: "bytes32[]",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract IERC20",
      },
      {
        name: "vault",
        type: "address",
        internalType: "contract IVault",
      },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "isYield", type: "bool", internalType: "bool" },
    ],
    outputs: [{ name: "newShare", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "depositToYield",
    inputs: [
      {
        name: "vault",
        type: "address",
        internalType: "contract IYieldVault",
      },
    ],
    outputs: [{ name: "newShares", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAccountTokenBalance",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      {
        name: "token",
        type: "address",
        internalType: "contract IERC20",
      },
    ],
    outputs: [{ name: "balance", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUnderlyingToVaultList",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract IERC20",
      },
    ],
    outputs: [
      { name: "", type: "address[]", internalType: "contract IVault[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWithdrawal",
    inputs: [
      { name: "withdrawalId", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IVaultManager.Withdrawal",
        components: [
          {
            name: "account",
            type: "address",
            internalType: "address",
          },
          {
            name: "vaults",
            type: "address[]",
            internalType: "contract IVault[]",
          },
          {
            name: "amounts",
            type: "uint256[]",
            internalType: "uint256[]",
          },
          {
            name: "startBlock",
            type: "uint256",
            internalType: "uint256",
          },
          { name: "nonce", type: "uint256", internalType: "uint256" },
          { name: "completed", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWithdrawalNonce",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "initialOwner",
        type: "address",
        internalType: "address",
      },
      {
        name: "_withdrawLockBlock",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "invoiceManager",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IInvoiceManager",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queueWithdrawals",
    inputs: [
      {
        name: "vaults",
        type: "address[]",
        internalType: "contract IVault[]",
      },
      { name: "shares", type: "uint256[]", internalType: "uint256[]" },
      { name: "withdrawer", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "withdrawalId", type: "bytes32", internalType: "bytes32" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "registeredVaults",
    inputs: [{ name: "", type: "address", internalType: "contract IVault" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "underlyingToVaultList",
    inputs: [
      { name: "", type: "address", internalType: "contract IERC20" },
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "address", internalType: "contract IVault" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vaultShares",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      {
        name: "vault",
        type: "address",
        internalType: "contract IVault",
      },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdrawLockBlock",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdrawSponsorToken",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      {
        name: "vaults",
        type: "address[]",
        internalType: "contract IVault[]",
      },
      { name: "amounts", type: "uint256[]", internalType: "uint256[]" },
      { name: "receiver", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawalNonces",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdrawals",
    inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      { name: "account", type: "address", internalType: "address" },
      { name: "startBlock", type: "uint256", internalType: "uint256" },
      { name: "nonce", type: "uint256", internalType: "uint256" },
      { name: "completed", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Deposit",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "contract IERC20",
      },
      {
        name: "vault",
        type: "address",
        indexed: true,
        internalType: "contract IVault",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "shares",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DepositToYield",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "vault",
        type: "address",
        indexed: true,
        internalType: "contract IYieldVault",
      },
      {
        name: "shares",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Initialized",
    inputs: [
      {
        name: "version",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WithdrawSponsorToken",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "vaults",
        type: "address[]",
        indexed: false,
        internalType: "contract IVault[]",
      },
      {
        name: "amounts",
        type: "uint256[]",
        indexed: false,
        internalType: "uint256[]",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WithdrawalCompleted",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "vaults",
        type: "address[]",
        indexed: false,
        internalType: "contract IVault[]",
      },
      {
        name: "shares",
        type: "uint256[]",
        indexed: false,
        internalType: "uint256[]",
      },
      {
        name: "withdrawalId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WithdrawalQueued",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "vaults",
        type: "address[]",
        indexed: false,
        internalType: "contract IVault[]",
      },
      {
        name: "shares",
        type: "uint256[]",
        indexed: false,
        internalType: "uint256[]",
      },
      {
        name: "withdrawalId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "AddressEmptyCode",
    inputs: [{ name: "target", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "AddressInsufficientBalance",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
  },
  { type: "error", name: "FailedInnerCall", inputs: [] },
  { type: "error", name: "InvalidInitialization", inputs: [] },
  { type: "error", name: "NotInitializing", inputs: [] },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
  },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
  },
] as const;
