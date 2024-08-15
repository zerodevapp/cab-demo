import {
    type UseQueryOptions,
    type UseQueryResult,
    useQuery
} from "@tanstack/react-query"
import { useWalletClient } from "wagmi"

export function useReadCab(
    options?: Omit<UseQueryOptions<bigint, Error>, "queryKey" | "queryFn">
): UseQueryResult<bigint, Error> {
    const { data: client } = useWalletClient()

    return useQuery({
        queryKey: ["cabBalance", client?.account?.address],
        queryFn: async () => {
            if (!client?.account) {
                throw new Error("Wallet client or account is not available")
            }
            try {
                const balance: bigint = await client.transport.request({
                    method: "yi_getCabBalance",
                    params: []
                })
                return balance
            } catch (error) {
                throw new Error(
                    `Failed to fetch CAB balance: ${(error as Error).message}`
                )
            }
        },
        enabled: !!client?.account,
        refetchInterval: 10000,
        staleTime: 5000,
        ...options
    })
}
