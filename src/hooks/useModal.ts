import { ModalContext } from "@/components/Provider/ModalProvider";
import { useContext } from "react";

export function useModal() {
  const {
    connectModalOpen,
    registerModalOpen,
    openConnectModal,
    openRegisterModal,
    closeConnectModal,
    closeRegisterModal,
  } = useContext(ModalContext);

  return {
    connectModalOpen,
    registerModalOpen,
    openConnectModal,
    openRegisterModal,
    closeConnectModal,
    closeRegisterModal,
  };
}
