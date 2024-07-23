import { Modal } from "@mantine/core";
import { Call } from "@/types";
import CABUserOp from "./CAB/CABUserOp";

export interface CABModalProps {
  open: boolean,
  onClose: () => void;
  calls: Call[];
  chainId: number;
}

export default function CABModal({ open, onClose, calls, chainId }: CABModalProps) {
  const titleId = "Send Useroperation with CAB";

  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={titleId}
      size="lg"
      styles={{
        title: {
          textAlign: "center",
        },
      }}
    >
     <CABUserOp calls={calls} chainId={chainId} />
    </Modal>
  )
}