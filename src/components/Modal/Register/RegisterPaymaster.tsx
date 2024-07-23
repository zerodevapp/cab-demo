import { useKernelClient } from "@zerodev/waas";
import { useModal, useCabBalance, usePaymasterRegistered, useRegisterPaymaster } from "@/hooks";
import { supportedChains } from '@/utils/constants';
import { Button, Stepper, Loader } from "@mantine/core";
import { useState, useEffect } from "react";
import { IconCircleCheck } from '@tabler/icons-react';
import { useWalletClient } from "wagmi";

export default function RegisterPaymaster() {
  const [activeStep, setActiveStep] = useState(0);
  const { closeRegisterModal } = useModal();
  const { data: walletClient } = useWalletClient();
  const { kernelAccount } = useKernelClient();
  const { isRegistered, status, isRepayRegistered, isSponsorRegistered, isPending } = usePaymasterRegistered();
  const { refetch } = useCabBalance();
  const { hash: repayHash, register: registerRepay, isPending: isRepayPending } = useRegisterPaymaster({
    account: kernelAccount,
    walletClient: walletClient,
    chainId: supportedChains[0].id,
    onSuccess: () => {
      setActiveStep(1);
      refetch();
    }
  })
  const { hash: sponsorHash, register: registerSponsor, isPending: isSponsorPending } = useRegisterPaymaster({
    account: kernelAccount,
    walletClient: walletClient,
    chainId: supportedChains[1].id,
    onSuccess: () => {
      setActiveStep(2);
    }
  })

  useEffect(() => {
    setActiveStep(status);
  }, [status])

  if (isPending) return <Loader />;

  return (
    <div>
        <Stepper active={activeStep} onStepClick={setActiveStep} completedIcon={<IconCircleCheck />}>
          <Stepper.Step label="Register Paymaster on Repay Chain" />
          <Stepper.Step label="Register Paymaster on Sponsor Chain" />
          <Stepper.Completed>
            <div>
              <IconCircleCheck color="primary" />
              <p>Success</p>
              <Button onClick={closeRegisterModal}>Close</Button>
            </div>
          </Stepper.Completed>
        </Stepper>
        {activeStep === 0 && !isRepayRegistered && (
          <div>
            <p>Register Paymaster on Repay Chain</p>
            <Button loading={isRepayPending} onClick={registerRepay} disabled={isRepayPending}>Register Repay</Button>
          </div>
        )}
        {activeStep === 1 && !isSponsorRegistered && (
          <div>
            <p>Register Paymaster on Sponsor Chain</p>
            <Button loading={isSponsorPending} onClick={registerSponsor} disabled={isSponsorPending}>Register Sponsor</Button>
          </div>
        )}
      </div>
  )
}