import { Modal } from "@mantine/core";
import { useModal, useCabBalance, usePaymasterRegistered, useRegisterPaymaster } from "@/hooks";
import { supportedChains } from '@/utils/constants';
import { useState, useEffect, useCallback } from "react";
import { Button, Card, Text, Group, Transition, Loader, ThemeIcon, Progress, Stack } from "@mantine/core";
import { IconCircleCheck, IconRocket } from '@tabler/icons-react';
import Image from "next/image";
import { notifications } from "@mantine/notifications";

const TOTAL_STEPS = 2;

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

function RegisterPaymaster() {
  const [activeStep, setActiveStep] = useState(0);
  const { closeRegisterModal } = useModal();
  const { status, isRepayRegistered, isSponsorRegistered, isPending } = usePaymasterRegistered();
  const { register: registerRepay, isPending: isRepayPending } = useRegisterPaymaster({
    chainId: supportedChains[0].id,
    onSuccess: () => {
      setActiveStep(1);
      refetch();
    }
  });
  const { register: registerSponsor, isPending: isSponsorPending  } = useRegisterPaymaster({
    chainId: supportedChains[1].id,
    onSuccess: () => {
      setActiveStep(2);
    }
  });
  const { refetch } = useCabBalance();

  const register = useCallback(async () => {
    try {
      if (!isRepayRegistered) {
        await registerRepay();
        setActiveStep(1);
      }
      if (!isSponsorRegistered) {
        await registerSponsor();
        setActiveStep(2);
      }
    } catch (error) {
      console.log(error);
      notifications.show({
        color: "red",
        message: "Fail to register paymaster",
      })
    }
      
  }, [isRepayRegistered, isSponsorRegistered, registerRepay, registerSponsor])

  useEffect(() => {
    setActiveStep(status);
  }, [status])

  if (isPending) return <Loader />;

  return (
    <Card shadow="md" radius="lg" p="xl" style={{ maxWidth: 400, margin: 'auto' }}>
      <Stack gap="xl">
        <Group p="apart">
          <Text size="xl" w={700}>Register CAB Paymaster</Text>
          <ThemeIcon size="xl" radius="md" variant="light" color="blue">
            <IconRocket size={28} />
          </ThemeIcon>
        </Group>

        <Progress value={(activeStep / TOTAL_STEPS) * 100} size="xl" radius="xl" />

        <Stack gap="md">
          {supportedChains.map((chain, index) => (
            <Group key={chain.chain.name} p="apart">
              <Group gap="sm" style={{ flex: 1 }}>
                <Image src={chain.logo} width={24} height={24} alt={chain.chain.name} />
                <Text size="md" style={{ fontWeight: 500 }}>{chain.chain.name}</Text>
              </Group>
              <Transition mounted={activeStep > index} transition="slide-left" duration={400} timingFunction="ease">
                {(styles) => (
                  <ThemeIcon style={styles} color="green" size="lg" radius="xl">
                    <IconCircleCheck size={20} />
                  </ThemeIcon>
                )}
              </Transition>
            </Group>
          ))}
        </Stack>

        {activeStep === TOTAL_STEPS ? (
          <Stack align="center" gap="md">
            <Button fullWidth size="lg" onClick={closeRegisterModal}>Close</Button>
          </Stack>
        ) : (
          <Button
            fullWidth
            size="lg"
            loading={isRepayPending || isSponsorPending}
            onClick={register}
          >
            Register
          </Button>
        )}
      </Stack>
    </Card>
  );
}
