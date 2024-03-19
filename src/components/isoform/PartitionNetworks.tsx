import {
  Box,
  Flex,
  Heading,
  Progress,
  Text,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  IconButton,
} from "@chakra-ui/react";
import { useContext, useState, useId } from "react";
import { observer } from "mobx-react";
import { StoreContext } from "../../store";
import { motion } from "framer-motion";
import {
  InfomapToggleButton,
  TruncatedFilename,
} from "../LoadNetworks/Item/components";
import { NetworkFile } from "../LoadNetworks";
import humanFileSize from "../../utils/human-file-size";
import { useInfomap } from "@mapequation/infomap-react";
import { LoadContext } from "../LoadNetworks/context";
import { calcStatistics, setIdentifiers } from "../LoadNetworks/utils";
import { parseTree } from "@mapequation/infomap-parser";
import { useError } from "../../hooks/useError";
import NetworkInfo from "../LoadNetworks/Item/NetworkInfo";
import { IoArrowRedo, IoArrowUndo } from "react-icons/io5";
import IsoformStore from "../../store/IsoformStore";

const InfomapItem = observer(
  ({
    disabled,
    numTrials,
    setNumTrials,
    twoLevel,
    setTwoLevel,
    run,
  }: {
    disabled: boolean;
    numTrials: number;
    setNumTrials: (numTrials: number) => void;
    twoLevel: boolean;
    setTwoLevel: (twoLevel: boolean) => void;
    run: () => void;
  }) => {
    const id = useId();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <FormControl isDisabled={disabled}>
          <HStack justify="space-between">
            <FormLabel fontSize="sm" fontWeight={400} htmlFor={id} pt={1}>
              Trials
            </FormLabel>
            <NumberInput
              id={id}
              size="xs"
              value={numTrials}
              onChange={(value) => setNumTrials(Math.max(1, +value))}
              min={1}
              max={100}
              step={1}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </HStack>
          <Checkbox
            isDisabled={disabled}
            size="sm"
            isChecked={twoLevel}
            onChange={(e) => setTwoLevel(e.target.checked)}
          >
            Two-level
          </Checkbox>
          <Button
            mt={1}
            isDisabled={disabled}
            isLoading={disabled}
            size="xs"
            width="full"
            type="submit"
            onClick={run}
          >
            Run Infomap
          </Button>
        </FormControl>
      </motion.div>
    );
  }
);

const NetworkItem = observer(({ isoform }: { isoform: IsoformStore }) => {
  // const onError = useError();

  const [showInfomap, setShowInfomap] = useState(!isoform.haveModules);
  const showInfomapButton =
    isoform.haveModules && isoform.netFile && !isoform.netFile.isExpanded;

  if (!isoform.netFile) {
    return null;
  }

  const file = isoform.netFile;

  return (
    <Box maxW="100%" h="100%" pos="relative" bg="transparent">
      <Box p={2}>
        <Box
          bg="gray.50"
          fontSize="sm"
          borderRadius={5}
          boxShadow="md"
          p={2}
          mt={8}
          pos="relative"
        >
          <TruncatedFilename name={file.filename} maxLength={100} />

          {file.size > 0 && <Text>{humanFileSize(file.size)}</Text>}

          {file.network && (
            <InfomapItem
              disabled={isoform.infomap.isRunning}
              numTrials={isoform.infomapArgs.numTrials ?? 10}
              setNumTrials={(numTrials) => isoform.setArgs({ numTrials })}
              twoLevel={isoform.infomapArgs.twoLevel ?? false}
              setTwoLevel={(value) => isoform.setArgs({ twoLevel: value })}
              run={() => isoform.runInfomap()}
            />
          )}
          <NetworkInfo file={file} />
        </Box>

        {isoform.infomap.isRunning && (
          <Progress value={isoform.infomap.progress} size="xs" mb={-2} mt={1} />
        )}
      </Box>
    </Box>
  );
});

export default observer(function PartitionNetworks() {
  const store = useContext(StoreContext);
  const accentColor = "var(--chakra-colors-blue-600)";

  return (
    <Flex direction="column" alignItems="center" mb={1}>
      <Box>
        <Text maxW="960px">
          For each isoform, generate a network between amino acids that are
          connected in 3d space. Nodes are identified by their position in the
          sequence alignment, and same in both networks if the aligned amino
          acids are the same.
        </Text>
      </Box>

      <Flex width="1280px" justify="space-between">
        {store.input.isoforms.map((isoform) => (
          <NetworkItem key={isoform.isoID} isoform={isoform} />
        ))}
      </Flex>
    </Flex>
  );
});
