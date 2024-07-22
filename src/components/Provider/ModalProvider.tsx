import { useKernelClient, type KernelVersionType } from "@zerodev/waas";
import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import ConnectModal from "../Modal/ConnectModal";
import RegisterModal from "../Modal/RegisterModal";

export function useModalStateValue() {
  const [isModalOpen, setModalOpen] = useState(false);

  return {
    closeModal: useCallback(() => {
      setModalOpen(false);
    }, []),
    isModalOpen,
    openModal: useCallback(() => setModalOpen(true), []),
  };
}

interface ModalContextValue {
  connectModalOpen: boolean;
  registerModalOpen: boolean;
  openConnectModal?: ({ version }: { version: KernelVersionType }) => void;
  openRegisterModal?: () => void;
  closeConnectModal?: () => void;
  closeRegisterModal?: () => void;
}

export const ModalContext = createContext<ModalContextValue>({
  connectModalOpen: false,
  registerModalOpen: false,
});

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const { kernelAccount } = useKernelClient();
  const [kernelVersion, setKernelVersion] = useState<KernelVersionType>("v3");

  const {
    closeModal: closeConnectModal,
    isModalOpen: connectModalOpen,
    openModal: openConnectModal,
  } = useModalStateValue();

  const {
    closeModal: closeRegisterModal,
    isModalOpen: registerModalOpen,
    openModal: openRegisterModal,
  } = useModalStateValue();

  useEffect(() => {
    if (kernelAccount) {
      closeConnectModal();
    }
  }, [kernelAccount, closeConnectModal]);

  const openConnectModalWithVersion = useCallback(
    ({ version }: { version: KernelVersionType }) => {
      setKernelVersion(version);
      openConnectModal();
    },
    [openConnectModal]
  );

  const openRegisterModalWithVersion = useCallback(
    () => {
      openRegisterModal();
    },
    [openRegisterModal]
  );

  const closeConnectModalWithVersion = useCallback(
    () => {
      closeConnectModal();
    },
    [closeConnectModal]
  );

  const closeRegisterModalWithVersion = useCallback(
    () => {
      closeRegisterModal();
    },
    [closeRegisterModal]
  );

  return (
    <ModalContext.Provider
      value={useMemo(
        () => ({
          connectModalOpen,
          registerModalOpen,
          openConnectModal: openConnectModalWithVersion,
          openRegisterModal: openRegisterModalWithVersion,
          closeConnectModal: closeConnectModalWithVersion,
          closeRegisterModal: closeRegisterModalWithVersion,
        }),
        [
          connectModalOpen,
          registerModalOpen,
          openConnectModalWithVersion,
          openRegisterModalWithVersion,
          closeConnectModalWithVersion,
          closeRegisterModalWithVersion,
        ]
      )}
    >
      {children}
      <ConnectModal
        onClose={closeConnectModal}
        open={connectModalOpen}
        version={kernelVersion}
      /> 
      <RegisterModal
        onClose={closeRegisterModal}
        open={registerModalOpen}
      />
    </ModalContext.Provider>
  );
}
