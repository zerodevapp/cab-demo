import { Modal } from "@mantine/core";
import { Call, RepayTokenInfo, SponsorTokenInfo } from "@/types";
import CABUserOp from "./CAB/CABUserOp";
import { UserOperation } from "permissionless";
import { EntryPoint, GetEntryPointVersion } from "permissionless/types";

export interface CABModalProps {
  open: boolean,
  onClose: () => void;
  chainId: number;
  sponsorTokensInfo?: SponsorTokenInfo[];
  repayTokensInfo?: RepayTokenInfo[];
  userOperation?: UserOperation<GetEntryPointVersion<EntryPoint>>;
}

export default function CABModal({ 
  open,
  onClose,
  sponsorTokensInfo,
  repayTokensInfo,
  userOperation,
  chainId,
}: CABModalProps) {
  return (
    <Modal
      opened={open}
      onClose={onClose}
      size="lg"
      styles={{
        title: {
          textAlign: "center",
        },
      }}
    >
     <CABUserOp 
      chainId={chainId}
      sponsorTokensInfo={sponsorTokensInfo}
      repayTokensInfo={repayTokensInfo}
      userOperation={userOperation} 
    />
    </Modal>
  )
}