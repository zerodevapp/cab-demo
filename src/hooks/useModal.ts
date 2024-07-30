import { ModalContext } from "@/components/Provider/ModalProvider";
import { useContext } from "react";

export function useModal() {
  const {
    registerModalOpen,
    cabModalOpen,
    openRegisterModal,
    openCABModal,
    closeRegisterModal,
    closeCABModal,
  } = useContext(ModalContext);

  return {
    registerModalOpen,
    cabModalOpen,
    openRegisterModal,
    openCABModal,
    closeRegisterModal,
    closeCABModal,
  };
}
