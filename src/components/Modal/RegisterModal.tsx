import { Modal } from "@mantine/core";
import RegisterPaymaster from "./Register/RegisterPaymaster";

export interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
}

export default function RegisterModal({
  onClose,
  open,
}: RegisterModalProps) {
  const titleId = "Register CAB Paymaster";

  return (
    <Modal
      opened={open}
      onClose={() => {
        onClose();
      }}
      title={titleId}
      withCloseButton={false}
      closeOnClickOutside={false}
    >
      <RegisterPaymaster />
    </Modal>
  );
}