export const invoiceManagerAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_vaultManager',
        type: 'address',
        internalType: 'contract IVaultManager',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cabPaymasters',
    inputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'paymaster',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'paymasterVerifier',
        type: 'address',
        internalType: 'contract IPaymasterVerifier',
      },
      {
        name: 'expiry',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createInvoice',
    inputs: [
      {
        name: 'nonce',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'paymaster',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'invoiceId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getCABPaymaster',
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct IInvoiceManager.CABPaymaster',
        components: [
          {
            name: 'paymaster',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'paymasterVerifier',
            type: 'address',
            internalType: 'contract IPaymasterVerifier',
          },
          {
            name: 'expiry',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getInvoice',
    inputs: [
      {
        name: 'invoiceId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct IInvoiceManager.Invoice',
        components: [
          {
            name: 'account',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'nonce',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'paymaster',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'sponsorChainId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getInvoiceId',
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'paymaster',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'nonce',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'repayTokenInfos',
        type: 'tuple[]',
        internalType: 'struct IInvoiceManager.RepayTokenInfo[]',
        components: [
          {
            name: 'vault',
            type: 'address',
            internalType: 'contract IVault',
          },
          {
            name: 'amount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'chainId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'initialize',
    inputs: [
      {
        name: 'initialOwner',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'invoices',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'nonce',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'paymaster',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'sponsorChainId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isInvoiceRepaid',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'registerPaymaster',
    inputs: [
      {
        name: 'paymaster',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'paymasterVerifier',
        type: 'address',
        internalType: 'contract IPaymasterVerifier',
      },
      {
        name: 'expiry',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'repay',
    inputs: [
      {
        name: 'invoiceId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'invoice',
        type: 'tuple',
        internalType: 'struct IInvoiceManager.InvoiceWithRepayTokens',
        components: [
          {
            name: 'account',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'nonce',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'paymaster',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'sponsorChainId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'repayTokenInfos',
            type: 'tuple[]',
            internalType: 'struct IInvoiceManager.RepayTokenInfo[]',
            components: [
              {
                name: 'vault',
                type: 'address',
                internalType: 'contract IVault',
              },
              {
                name: 'amount',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'chainId',
                type: 'uint256',
                internalType: 'uint256',
              },
            ],
          },
        ],
      },
      {
        name: 'proof',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revokePaymaster',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [
      {
        name: 'newOwner',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'vaultManager',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract IVaultManager',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'withdrawToAccount',
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'repayTokenVaults',
        type: 'address[]',
        internalType: 'contract IVault[]',
      },
      {
        name: 'repayAmounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Initialized',
    inputs: [
      {
        name: 'version',
        type: 'uint64',
        indexed: false,
        internalType: 'uint64',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'InvoiceCreated',
    inputs: [
      {
        name: 'invoiceId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'account',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'paymaster',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'InvoiceRepaid',
    inputs: [
      {
        name: 'invoiceId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'account',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'paymaster',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      {
        name: 'previousOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PaymasterRegistered',
    inputs: [
      {
        name: 'account',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'paymaster',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'paymasterVerifier',
        type: 'address',
        indexed: true,
        internalType: 'contract IPaymasterVerifier',
      },
      {
        name: 'expiry',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PaymasterRevoked',
    inputs: [
      {
        name: 'account',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'paymaster',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'paymasterVerifier',
        type: 'address',
        indexed: true,
        internalType: 'contract IPaymasterVerifier',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'InvalidInitialization',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotInitializing',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: [],
  },
] as const;
