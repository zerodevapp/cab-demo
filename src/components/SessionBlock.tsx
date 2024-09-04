"use client";
import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import {
  walletActionsErc7715,
  type GrantPermissionsReturnType,
} from "viem/experimental";
import { useWriteContracts } from "wagmi/experimental";
import {
  ENTRYPOINT_ADDRESS_V07,
  createBundlerClient,
  createSmartAccountClient,
} from "permissionless";
import {
  type Hex,
  createPublicClient,
  decodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  getAbiItem,
  http,
  keccak256,
  parseAbi,
  parseEther,
  toFunctionSelector,
  toHex,
  zeroAddress,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  type Delegation,
  createSessionAccount,
  getDelegationTupleType,
} from "@zerodev/session-account";
import { createZeroDevPaymasterClient } from "@zerodev/sdk";
import { optimismSepolia, sepolia } from "wagmi/chains";
import { Button, Card, Flex, Text } from "@mantine/core";
import {
  erc20SpenderAddress,
  getBundler,
  getPaymaster,
  testErc20Address,
} from "@/utils/constants";
import { erc20SpenderAbi } from "@/abis/erc20SpenderAbi";

const BUNDLER_URL = getBundler(optimismSepolia.id);
const PAYMASTER_URL = getPaymaster(optimismSepolia.id);

function SessionInfo({
  sessionId,
  privateKey,
  sessionType,
}: {
  sessionId: `0x${string}`;
  privateKey: Hex | undefined;
  sessionType: "WALLET" | "ACCOUNT" | undefined;
}) {
  const { address } = useAccount();
  const {data} = useWalletClient()
  const { data: hash, writeContracts, isPending, error } = useWriteContracts();
  const [dappManagedTxHash, setDappManagedTxHash] = useState<Hex>();
  const [dappManagedTxIsPending, setDappManagedTxIsPending] = useState(false);

  console.log({ error });
  useEffect(()=>{
    if (hash) {
      fetchTxReceipt(hash as Hex)
    }
  }, [hash])
  const fetchTxReceipt = async (hash: Hex) => {
    const bundlerClient = createBundlerClient({
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      transport: http(BUNDLER_URL)
    })
    const receipt = await bundlerClient.waitForUserOperationReceipt({hash,timeout: 100_000})
    console.log({receipt})
  }

  const sendDappManagedTx = async () => {
    if (!privateKey) return;
    setDappManagedTxIsPending(true);
    const sessionKeySigner = privateKeyToAccount(privateKey);

    const [delegations, delegatorInitCode] = decodeAbiParameters(
      [getDelegationTupleType(true), { type: "bytes" }],
      sessionId
    );
    const publicClient = createPublicClient({
      transport: http(BUNDLER_URL),
      chain: optimismSepolia,
    });
    const sessionAccount = await createSessionAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      sessionKeySigner,
      delegations: delegations as Delegation[],
      delegatorInitCode,
    });

    const paymasterClient = createZeroDevPaymasterClient({
      chain: optimismSepolia,
      transport: http(PAYMASTER_URL),
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    });

    const kernelClient = createSmartAccountClient({
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      chain: sepolia,
      // @ts-ignore
      account: sessionAccount,
      bundlerTransport: http(BUNDLER_URL, { timeout: 100000 }),
      middleware: {
        sponsorUserOperation: paymasterClient.sponsorUserOperation,
      },
    });
    const userOpHash = await kernelClient.sendUserOperation({
      // @ts-ignore
      account: kernelClient.account,
      userOperation: {
        callData: await kernelClient.account!.encodeCallData({
          to: testErc20Address,
          data: encodeFunctionData({
            abi: parseAbi(["function mint(address,uint256)"]),
            functionName: "mint",
            args: [address ?? zeroAddress, BigInt(1)],
          }),
          value: BigInt(0),
        }),
      },
    });
    console.log({ userOpHash });
    setDappManagedTxHash(userOpHash);
    setDappManagedTxIsPending(true);
  };
  return (
    <>
      <div className="flex flex-col items-center space-y-4 mt-4 px-4">
        {sessionId && (
          <p className="text-sm font-semibold text-white-700 truncate w-full text-center md:text-base lg:text-lg">
            {`Permission ID: ${keccak256(sessionId).slice(0, 10)}...${keccak256(
              sessionId
            ).slice(-3)}`}
          </p>
        )}
        {sessionType === "WALLET" && (
          <Button
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 transition ease-in-out duration-150"
            disabled={isPending}
            onClick={() => {
              writeContracts({
                contracts: [
                  {
                    address: testErc20Address,
                    abi: erc20Abi,
                    functionName: "approve",
                    args: [erc20SpenderAddress, parseEther("0.000029")],
                  },
                  {
                    address: erc20SpenderAddress,
                    abi: erc20SpenderAbi,
                    functionName: "spendAllowance",
                    args: [testErc20Address, parseEther("0.000029")],
                  },
                ],
                capabilities: {
                  paymasterService: {
                    url: PAYMASTER_URL,
                  },
                  permissions: {
                    sessionId: sessionId,
                  },
                },
              });
            }}
          >
            {isPending ? "Tranferring..." : "Transfer With Session"}
          </Button>
        )}
        {/* {sessionType === "ACCOUNT" && (
            <Button
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 transition ease-in-out duration-150"
              disabled={dappManagedTxIsPending}
              onClick={sendDappManagedTx}
            >
              {"Mint With Dapp managed session"}
            </Button>
          )} */}
      </div>
      {(hash || dappManagedTxHash) && (
        <div className="mt-4 text-center text-sm font-medium text-green-600">
          MintWithSession UserOp Hash: {hash ?? dappManagedTxHash}
        </div>
      )}
    </>
  );
}

export default function SessionBlock() {
  const [sessions, setSessions] = useState<GrantPermissionsReturnType[]>([]);
  const { data: walletClient } = useWalletClient();
  const [isPending, setIsPending] = useState(false);
  const [isWalletPending, setIsWalletPending] = useState(false);
  const [isAccountPending, setIsAccountPending] = useState(false);
  const [sessionPrivateKey, setSessionPrivateKey] = useState<Hex>();
  const { address } = useAccount();
  const [sessionType, setSessionType] = useState<"WALLET" | "ACCOUNT">();

  const handleWalletTypeIssuePermissions = async () => {
    try {
      setIsWalletPending(true);
      const result = await walletClient
        // @ts-ignore
        ?.extend(walletActionsErc7715())
        // @ts-ignore
        .grantPermissions({
          signer: {
            type: "wallet",
          },
          permissions: [
            {
              type: { custom: "erc20-token-approve" },
              data: {
                tokenAddress: testErc20Address,
                allowance: parseEther("1"),
                contractAllowList: [
                  {
                    address: erc20SpenderAddress,
                    functions: [
                      toFunctionSelector(
                        getAbiItem({
                          abi: erc20SpenderAbi,
                          name: "spendAllowance",
                        })
                      ),
                    ],
                  },
                ],
              },
              policies: [],
            },
          ],
          expiry: Math.floor(Date.now().valueOf() / 1000) + 3600,
        });
      console.log(result);
      if (result) setSessions((prev) => [...prev, result]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsWalletPending(false);
      setSessionType("WALLET");
    }
  };

  const handleAccountTypeIssuePermissions = async () => {
    try {
      setIsAccountPending(true);
      const privateKey = generatePrivateKey();
      setSessionPrivateKey(privateKey);
      const sessionAccount = privateKeyToAccount(privateKey);
      const result = await walletClient
        // @ts-ignore
        ?.extend(walletActionsErc7715())
        // @ts-ignore
        .grantPermissions({
          permissions: [],
          signer: {
            type: "account",
            data: {
              id: sessionAccount.address,
            },
          },
          expiry: Math.floor(Date.now().valueOf() / 1000) + 3600,
        });
      console.log(result);
      if (result) setSessions((prev) => [...prev, result]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAccountPending(false);
      setSessionType("ACCOUNT");
    }
  };

  return (
    <>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Flex align="center" mb="md">
          <Text size="xl" w={300} mr="xs">
            Wallet Session
          </Text>
        </Flex>
        <Button
          className="disabled:opacity-50"
          variant="outline"
          disabled={isWalletPending || !walletClient || !address}
          onClick={() => handleWalletTypeIssuePermissions()}
        >
          {isWalletPending ? "Creating..." : "Create Session"}
        </Button>
        {/* <p className="text-xl">Account Session</p>
        <Button
          className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${
            !walletClient || !address ? "opacity-50" : ""
          }`}
          disabled={isAccountPending || !walletClient || !address}
          onClick={() => handleAccountTypeIssuePermissions()}
        >
          {isAccountPending ? "Creating..." : "Create Session"}
        </Button> */}
        <div className="mt-8">
          {sessions.map((session, index) => (
            <SessionInfo
              key={session.permissionsContext}
              sessionId={session.permissionsContext as `0x${string}`}
              privateKey={sessionPrivateKey ?? "0x"}
              sessionType={sessionType}
            />
          ))}
        </div>
      </Card>
    </>
  );
}
