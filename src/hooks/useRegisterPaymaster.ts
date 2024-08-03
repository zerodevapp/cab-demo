import { useMutation } from "@tanstack/react-query";
import { useWalletClient, useChainId, useSwitchChain } from "wagmi";
import { getPaymaster } from "@/utils/constants";
import type { Hex } from 'viem';

export type UseRegisterPaymasterParams = {
    chainId: number;
    onSuccess?: () => void;
}

export function useRegisterPaymaster({
    chainId,
    onSuccess,
}: UseRegisterPaymasterParams) {
    const { data: walletClient, refetch: refetchWalletClient } = useWalletClient();
    const connectedChainId = useChainId();
    const { switchChainAsync } = useSwitchChain();

    const mutation = useMutation<Hex, Error, void>({
        mutationKey: ['registerPaymaster', chainId],
        mutationFn: async () => {
            if (!walletClient) {
                throw new Error("Wallet client not available");
            }
            if (connectedChainId !== chainId) {
                await switchChainAsync?.({ chainId });
            }
            const { data: updatedWalletClient } = await refetchWalletClient();
            if (!updatedWalletClient) {
                throw new Error("Wallet client not available");
            }
            return await updatedWalletClient.transport.request({
                method: "yi_enableCAB",
                params: [getPaymaster(chainId)]
            }) as Hex;
        },
        onSuccess: (txHash) => {
            console.log("CAB enabled. TxHash:", txHash);
            onSuccess?.();
        },
        onError: (error) => {
            console.error("Failed to enable CAB:", error);
        },
    });

    return {
        hash: mutation.data,
        register: mutation.mutateAsync,
        isPending: mutation.isPending || !walletClient,
    };
}