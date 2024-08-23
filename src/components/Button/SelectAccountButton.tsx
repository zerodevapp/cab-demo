import { Button, Flex, Menu } from "@mantine/core";
import { supportedAccounts } from "@/utils/constants";
import { useAccountType } from "@/components/Provider/AccountProvider";

export const CustomChevronDown = () => (
  <svg fill="none" height="7" width="14" xmlns="http://www.w3.org/2000/svg">
    <title>Down</title>
    <path
      d="M12.75 1.54001L8.51647 5.0038C7.77974 5.60658 6.72026 5.60658 5.98352 5.0038L1.75 1.54001"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.3"
      xmlns="http://www.w3.org/2000/svg"
    />
  </svg>
);

export function SelectAccountButton() { 
  const { account, setAccount } = useAccountType();
  // const [account, setAccount] = useState("kernel");

  return (
    <Menu>
      <Menu.Target>
        <Button miw={78} px="12px">
          <Flex gap="sm" align="center" mah={24} pr="2px">
            <div
              style={{
                display: "block",
              }}
            >
              {supportedAccounts.filter((a) => a === account)[0]}
            </div>
            <Flex miw={14}>
              <CustomChevronDown />
            </Flex>
          </Flex>
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Flex direction="column" gap={4}>
          {supportedAccounts.map((a: string, idx: number) => {
            const isSelected = account === a;
            return (
              <Button
                key={idx}
                onClick={() => {
                  setAccount?.(a);
                }}
                disabled={isSelected}
              >
                <Flex w="100%" justify="space-between" align="center">
                  <Flex align="center" gap="xs">
                    <Flex>{a}</Flex>
                  </Flex>
                </Flex>
              </Button>
            );
          })}
        </Flex>
      </Menu.Dropdown>
    </Menu>
  );
}
