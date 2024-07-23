import { ModalContext } from "@/components/Provider/ModalProvider";
import { useContext } from "react";

export function useModal() {
  const {
    connectModalOpen,
    registerModalOpen,
    cabModalOpen,
    openConnectModal,
    openRegisterModal,
    openCABModal,
    closeConnectModal,
    closeRegisterModal,
    closeCABModal,
  } = useContext(ModalContext);

  return {
    connectModalOpen,
    registerModalOpen,
    cabModalOpen,
    openConnectModal,
    openRegisterModal,
    openCABModal,
    closeConnectModal,
    closeRegisterModal,
    closeCABModal,
  };
}
