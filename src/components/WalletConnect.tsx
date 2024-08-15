import { useState, useEffect } from 'react'
import { useWalletConnect } from '@/sdk'
import { useAccount, useSwitchChain } from 'wagmi'
import { useWalletClient } from 'wagmi';
import { useSendCalls } from "wagmi/experimental";
import { zeroAddress } from 'viem'

function WalletConnect() {
  const [uri, setUri] = useState('')
  const { data: kernelClient } = useWalletClient()
  const [isDeployed, setIsDeployed] = useState(false)
  // const { switchChainAsync } = useSwitchChain();
  const { chainId } = useAccount()
  // const { sendCalls, data: id } = useSendCalls();
    // useEffect(() => {
    //   const isContractWallet = async () => {
    //     if (!kernelClient) return false;
    //     // @ts-expect-error: ignore for now
    //     const bytecode = await kernelClient.account.client.getBytecode({
    //       address: kernelClient.account.address
    //     });
    //     setIsDeployed(!!bytecode);
    //   }
    //   isContractWallet()
    // }, [kernelClient])

  const {
    connect,
    sessionProposal,
    approveSessionProposal,
    rejectSessionProposal,
    isLoading,
    error,
    disconnect,
    sessions,
    sessionRequest,
    approveSessionRequest,
    rejectSessionRequest
  } = useWalletConnect({
    projectId: 'bb1805e49e8bd78a9c75aefed3649d68',
    metadata: {
      name: 'ZeroDev Wallet',
      url: 'https://zerodev.app',
      description: 'Smart contract wallet for Ethereum',
      icons: ['https://pbs.twimg.com/profile_images/1582474288719880195/DavMgC0t_400x400.jpg'],
    }
  })

  // const switchChain = async () => {
  //   await switchChainAsync({ chainId: 11155111 });
  //   console.log('Chain switched to Sepolia');
  // }

  // const deployWallet = async () => {
    // sendCalls({
    //   calls: [
    //     {
    //       to: zeroAddress,
    //       value: BigInt(0),
    //     },
    //   ],
    //   capabilities: {
    //     paymasterService: {
    //       url: 'https://rpc.zerodev.app/api/v2/paymaster/312893bc-2d94-49c7-857c-85b09a63033b',
    //     },
    //   },
    // });
  // }

  //   if (!kernelClient) {
  //     return <p className="text-center text-lg">Loading...</p>
  //   }
  //   console.log(kernelClient)

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Yi WalletConnect Demo</h1>
      <p className="text-center mb-2"><strong>Chain: </strong> {chainId}</p>
      {/* <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        onClick={switchChain}
      >
        Switch to Sepolia
      </button> */}
      {/* {kernelClient && (
        <div>
          <p className="text-center mb-2"><strong>Address: </strong> {kernelClient.account.address}</p> */}
          {/* <p className="text-center mb-2"><strong>Is account deployed: </strong> {isDeployed ? 'Yes' : 'No'}</p>
          {!isDeployed && (
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
              onClick={deployWallet}
            >
              Deploy Wallet
            </button>
          )} */}
          {/* <p className="text-center mb-2"><strong>Chain: </strong> {kernelClient.chain.id}</p> */}
        {/* </div> */}
      {/* )} */}
      {/* <div>
        <h2 className="text-xl font-semibold mb-2">Change Chain</h2>
        <button
          className={`bg-blue-500 text-white font-bold py-2 px-4 rounded mb-4 ${true && 'opacity-50 cursor-not-allowed'}`}
          disabled
        >
          Polygon
        </button>
      </div> */}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 p-2 border border-gray-300 text-black"
          placeholder="URI"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => connect(uri)}
        >
          Connect
        </button>
      </div>
      {sessionProposal && (
        <div className="mb-4">
          <p className="mb-2">{sessionProposal.verifyContext.verified.origin}</p>
          <div className="flex gap-2 justify-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => approveSessionProposal(sessionProposal)}
            >
              Approve
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => rejectSessionProposal()}
            >
              Reject
            </button>
          </div>
        </div>
      )}
      {isLoading && <p className="text-center mb-2">Loading...{isLoading}</p>}
      {error && <p className="text-red-500 text-center mb-2 break-words">Error: {error.message}</p>}
      <h2 className="text-xl font-semibold mb-2">Sessions</h2>
      {sessions.length > 0 ? (
        sessions.map((session) => (
          <div className="flex flex-row gap-4 mb-2" key={session.topic}>
            <p>{session.peer.metadata.name}</p>
            <button
              className="ml-auto bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => disconnect(session)}
            >
              Disconnect
            </button>
          </div>
        ))
      ) : (
        <p className="text-center mb-2">No sessions</p>
      )}
      {sessionRequest && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Session Request</h3>
          <div className="mb-4">
            <p className="text-lg"><strong>Method:</strong> {sessionRequest.params.request.method}</p>
            <p className="break-words"><strong>Params:</strong> {JSON.stringify(sessionRequest.params.request.params)}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => approveSessionRequest()}
            >
              Approve
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => rejectSessionRequest()}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletConnect
