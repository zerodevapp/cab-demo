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
  return (
    <Modal
      opened={open}
      onClose={() => {
        onClose();
      }}
      withCloseButton={false}
      closeOnClickOutside={false}
    >
      <RegisterPaymaster />
    </Modal>
  );
}