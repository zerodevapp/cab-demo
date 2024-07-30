import {
  ReactNode,
  createContext,
  useCallback,
  useMemo,
  useState,
} from "react";
import RegisterModal from "../Modal/RegisterModal";
import CABModal from "../Modal/CABModal";
import { RepayTokenInfo, SponsorTokenInfo } from "@/types";
import { GetEntryPointVersion, UserOperation } from 'permissionless/types'
import { type EntryPoint } from 'permissionless/types'

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
  registerModalOpen: boolean;
  cabModalOpen: boolean;
  openRegisterModal?: () => void;
  openCABModal?: (
    { 
      repayTokensInfo,
      userOperation,
      chainId,
    }: 
    { 
      sponsorTokensInfo: SponsorTokenInfo[],
      repayTokensInfo: RepayTokenInfo[],
      userOperation: UserOperation<GetEntryPointVersion<EntryPoint>>,
      chainId: number,
    }) => void;
  closeRegisterModal?: () => void;
  closeCABModal?: () => void;
}

export const ModalContext = createContext<ModalContextValue>({
  registerModalOpen: false,
  cabModalOpen: false,
});

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [chainId, setChainId] = useState(1);
  const [repayTokensInfo, setRepayTokensInfo] = useState<RepayTokenInfo[]>([]);
  const [sponsorTokensInfo, setSponsorTokensInfo] = useState<SponsorTokenInfo[]>([]);
  const [userOperation, setUserOperation] = useState<UserOperation<GetEntryPointVersion<EntryPoint>>>();

  const {
    closeModal: closeRegisterModal,
    isModalOpen: registerModalOpen,
    openModal: openRegisterModal,
  } = useModalStateValue();

  const {
    closeModal: closeCABModal,
    isModalOpen: cabModalOpen,
    openModal: openCABModal,
  } = useModalStateValue();

  const openRegisterModalWithVersion = useCallback(
    () => {
      openRegisterModal();
    },
    [openRegisterModal]
  );

  const openCABModalWithCalls = useCallback(
    (
      { 
        sponsorTokensInfo,
        repayTokensInfo,
        userOperation,
        chainId,
      } : 
      {
        sponsorTokensInfo: SponsorTokenInfo[],
        repayTokensInfo: RepayTokenInfo[],
        userOperation: UserOperation<GetEntryPointVersion<EntryPoint>>,
        chainId: number
      }
    ) => {
      setChainId(chainId);
      setSponsorTokensInfo(sponsorTokensInfo);
      setRepayTokensInfo(repayTokensInfo);
      setUserOperation(userOperation);
      openCABModal();
    },
    [openCABModal]
  )

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
          registerModalOpen,
          cabModalOpen: cabModalOpen,
          openRegisterModal: openRegisterModalWithVersion,
          openCABModal: openCABModalWithCalls,
          closeRegisterModal: closeRegisterModalWithVersion,
          closeCABModal,
        }),
        [
          registerModalOpen,
          cabModalOpen,
          openRegisterModalWithVersion,
          openCABModalWithCalls,
          closeRegisterModalWithVersion,
          closeCABModal,
        ]
      )}
    >
      {children} 
      <RegisterModal
        onClose={closeRegisterModal}
        open={registerModalOpen}
      />
      <CABModal 
        onClose={closeCABModal}
        open={cabModalOpen}
        chainId={chainId}
        sponsorTokensInfo={sponsorTokensInfo}
        repayTokensInfo={repayTokensInfo}
        userOperation={userOperation}
      />
    </ModalContext.Provider>
  );
}
