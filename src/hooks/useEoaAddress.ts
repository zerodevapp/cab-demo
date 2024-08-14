import { useEffect, useState } from "react";

export function useEoaAddress() {
    const [address, setAddress] = useState<`0x${string}` | undefined>(undefined);

    useEffect(() => {
        const getAddress = async () => {
            const [eoaAddress] = await window.ethereum?.request({
                method: "eth_accounts",
            });
            setAddress(eoaAddress ?? '0xCe441DD40CDd8D398F04E4ec9F3Cd5626C0D657E');
        };
        getAddress();
    }, []);

    return { address };
}