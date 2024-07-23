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
  connectModalOpen: boolean;
  registerModalOpen: boolean;
  cabModalOpen: boolean;
  openConnectModal?: ({ version }: { version: KernelVersionType }) => void;
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
  closeConnectModal?: () => void;
  closeRegisterModal?: () => void;
  closeCABModal?: () => void;
}

export const ModalContext = createContext<ModalContextValue>({
  connectModalOpen: false,
  registerModalOpen: false,
  cabModalOpen: false,
});

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const { kernelAccount } = useKernelClient();
  const [kernelVersion, setKernelVersion] = useState<KernelVersionType>("v3");
  const [chainId, setChainId] = useState(1);
  const [repayTokensInfo, setRepayTokensInfo] = useState<RepayTokenInfo[]>([]);
  const [sponsorTokensInfo, setSponsorTokensInfo] = useState<SponsorTokenInfo[]>([]);
  const [userOperation, setUserOperation] = useState<UserOperation<GetEntryPointVersion<EntryPoint>>>();

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

  const {
    closeModal: closeCABModal,
    isModalOpen: cabModalOpen,
    openModal: openCABModal,
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
          cabModalOpen: cabModalOpen,
          openConnectModal: openConnectModalWithVersion,
          openRegisterModal: openRegisterModalWithVersion,
          openCABModal: openCABModalWithCalls,
          closeConnectModal: closeConnectModalWithVersion,
          closeRegisterModal: closeRegisterModalWithVersion,
          closeCABModal,
        }),
        [
          connectModalOpen,
          registerModalOpen,
          cabModalOpen,
          openConnectModalWithVersion,
          openRegisterModalWithVersion,
          openCABModalWithCalls,
          closeConnectModalWithVersion,
          closeRegisterModalWithVersion,
          closeCABModal,
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
