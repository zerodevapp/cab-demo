export const vaultManagerAbi = [
    {
        type: "function",
        name: "addVault",
        inputs: [
            {
                name: "vault",
                type: "address",
                internalType: "contract IVault"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "completeWithdrawals",
        inputs: [
            {
                name: "withdrawalIds",
                type: "bytes32[]",
                internalType: "bytes32[]"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "deposit",
        inputs: [
            {
                name: "token",
                type: "address",
                internalType: "contract IERC20"
            },
            {
                name: "vault",
                type: "address",
                internalType: "contract IVault"
            },
            {
                name: "amount",
                type: "uint256",
                internalType: "uint256"
            },
            {
                name: "isYield",
                type: "bool",
                internalType: "bool"
            }
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "depositToYield",
        inputs: [
            {
                name: "vault",
                type: "address",
                internalType: "contract IYieldVault"
            }
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "getAccountTokenBalance",
        inputs: [
            {
                name: "account",
                type: "address",
                internalType: "address"
            },
            {
                name: "token",
                type: "address",
                internalType: "contract IERC20"
            }
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getUnderlyingToVaultList",
        inputs: [
            {
                name: "token",
                type: "address",
                internalType: "contract IERC20"
            }
        ],
        outputs: [
            {
                name: "",
                type: "address[]",
                internalType: "contract IVault[]"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getWithdrawal",
        inputs: [
            {
                name: "withdrawId",
                type: "bytes32",
                internalType: "bytes32"
            }
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
                        internalType: "address"
                    },
                    {
                        name: "vaults",
                        type: "address[]",
                        internalType: "contract IVault[]"
                    },
                    {
                        name: "amounts",
                        type: "uint256[]",
                        internalType: "uint256[]"
                    },
                    {
                        name: "startBlock",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "nonce",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "completed",
                        type: "bool",
                        internalType: "bool"
                    }
                ]
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getWithdrawalNonce",
        inputs: [
            {
                name: "account",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "queueWithdrawals",
        inputs: [
            {
                name: "vaults",
                type: "address[]",
                internalType: "contract IVault[]"
            },
            {
                name: "shares",
                type: "uint256[]",
                internalType: "uint256[]"
            },
            {
                name: "withdrawer",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [
            {
                name: "",
                type: "bytes32",
                internalType: "bytes32"
            }
        ],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "vaultShares",
        inputs: [
            {
                name: "account",
                type: "address",
                internalType: "address"
            },
            {
                name: "vault",
                type: "address",
                internalType: "contract IVault"
            }
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "withdrawSponsorToken",
        inputs: [
            {
                name: "account",
                type: "address",
                internalType: "address"
            },
            {
                name: "vaults",
                type: "address[]",
                internalType: "contract IVault[]"
            },
            {
                name: "amounts",
                type: "uint256[]",
                internalType: "uint256[]"
            },
            {
                name: "receiver",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    }
] as const
