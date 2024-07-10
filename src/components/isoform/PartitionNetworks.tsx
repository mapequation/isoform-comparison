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
  Spacer,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
} from "@chakra-ui/react";
import { useContext, useId } from "react";
import { observer } from "mobx-react";
import { StoreContext } from "../../store";
import { motion } from "framer-motion";
import { TruncatedFilename } from "../LoadNetworks/Item/components";
import humanFileSize from "../../utils/human-file-size";
import IsoformStore from "../../store/IsoformStore";
import Graph from "./Graph";
import { PdbProgress } from "./Progress";
import NetworkInfo from "./NetworkInfo";

const InfomapItem = observer(
  ({ isoform, pdb }: { isoform: IsoformStore; pdb?: boolean }) => {
    const id = `${isoform.isoID}`;

    const store = pdb ? isoform.pdb : isoform;

    const disabled = store.infomap.isRunning;
    const numTrials = store.infomapArgs.numTrials ?? 10;
    const setNumTrials = (numTrials: number) => store.setArgs({ numTrials });
    const twoLevel = store.infomapArgs.twoLevel ?? false;
    const setTwoLevel = (value: boolean) => store.setArgs({ twoLevel: value });
    const run = () => store.runInfomap();

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
            {isoform.haveModules ? "Re-run Infomap" : "Run Infomap"}
          </Button>
        </FormControl>
      </motion.div>
    );
  }
);

const NetworkItem = observer(({ isoform }: { isoform: IsoformStore }) => {
  // const onError = useError();

  const file = isoform.pdb.netFile;

  return (
    <Box maxW="100%" h="100%" pos="relative" bg="transparent">
      <Heading size="sm">Isoform {isoform.isoID}</Heading>
      <Box>
        <Graph isoform={isoform} />
      </Box>
      <Box>
        <Box
          bg="gray.50"
          fontSize="sm"
          borderRadius={5}
          boxShadow="md"
          p={2}
          mt={8}
          pos="relative"
        >
          <TruncatedFilename
            name={file?.filename ?? "Pending..."}
            maxLength={100}
          />

          {file && file.size > 0 && <Text>{humanFileSize(file.size)}</Text>}

          <InfomapItem isoform={isoform} pdb />
          <NetworkInfo isoform={isoform} />
        </Box>

        <PdbProgress isoform={isoform} />
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

      <Box mt={4}>
        <Box>
          Link distance threshold: {store.input.linkDistanceThreshold} Å
        </Box>
        <Slider
          width={400}
          aria-label="link-threshold"
          value={store.input.linkDistanceThreshold}
          onChange={store.input.setLinkDistanceThreshold}
          step={0.1}
          min={0.1}
          max={50}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </Box>

      <Flex justify="space-between" mt={10}>
        <NetworkItem isoform={store.input.isoformStore1} />
        <Spacer width={20} />
        <NetworkItem isoform={store.input.isoformStore2} />
      </Flex>
    </Flex>
  );
});
