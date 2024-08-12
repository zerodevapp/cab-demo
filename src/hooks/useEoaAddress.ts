import { useEffect, useState } from "react";

export function useEoaAddress() {
    const [address, setAddress] = useState<`0x${string}` | undefined>(undefined);

    useEffect(() => {
        const getAddress = async () => {
            const [eoaAddress] = await window.ethereum?.request({
                method: "eth_accounts",
            });
            // passkey doesn't have an eoa address so hardcode one if needed
            setAddress(eoaAddress ?? '0x955B8cBbBc90C1f3925753c76b15a3a358DCF123');
        };
        getAddress();
    }, []);

    return { address };
}