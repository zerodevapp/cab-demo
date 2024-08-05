import { useEffect, useState } from "react";

export function useEoaAddress() {
    const [address, setAddress] = useState<`0x${string}` | undefined>(undefined);

    useEffect(() => {
        const getAddress = async () => {
            const [eoaAddress] = await window.ethereum?.request({
                method: "eth_accounts",
            });
            setAddress(eoaAddress);
        };
        getAddress();
    }, []);

    return { address };
}