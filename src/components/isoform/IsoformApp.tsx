import { Box, Flex, HStack, Heading, Text } from "@chakra-ui/react";
import { observer } from "mobx-react";
import { useContext, useState } from "react";
import { StoreContext } from "../../store";
import StepHeading from "./StepHeading";
import AlignSequences from "./AlignSequences";
import LoadData from "./LoadData";
import PartitionNetworks from "./PartitionNetworks";
import InputTextArea from "./InputTextArea";
import useEventListener from "../../hooks/useEventListener";
import IsoformAlluvialDiagram from "./IsoformAlluvialDiagram";
import SequenceView from "./SequenceView";
import { CheckCircleIcon } from "@chakra-ui/icons";

export default observer(function IsoformApp() {
  const store = useContext(StoreContext);
  const [activeStep, setActiveStep] = useState(1);
  useEventListener("keydown", (event) => {
    // @ts-ignore
    const key = event?.key;
    if (!store.editMode && key === "e") {
      store.input.loadExample(store.input.exampleData[0]);
    }
  });
  const { isoformStore1, isoformStore2 } = store.input;

  return (
    <Flex mt="100px" direction="column" alignItems="center">
      <Flex id="step1" direction="column" alignItems="center" mb={20}>
        <StepHeading step={1} title="Load data" active={activeStep == 1} />

        <Text>
          Load your own data below to submit your own analysis or load example
          data.
        </Text>

        <HStack spacing="24px" mt={6} alignItems="start">
          {[
            store.input.isoforms.map((isoformStore, i) => (
              <Flex direction="column">
                <Heading as="h2" size="md" mb={2}>
                  Isoform {i + 1}
                </Heading>

                <Heading as="h3" size="sm" mb={2}>
                  Gene sequence
                  <CheckCircleIcon
                    ml={3}
                    color={isoformStore.haveSequence ? "green.500" : "gray.200"}
                  />
                </Heading>

                <InputTextArea
                  isoID={isoformStore.isoID}
                  width="500px"
                  height="150px"
                  placeholder="Paste gene sequence here (.fasta file)"
                  value={isoformStore.fastaContent}
                  onChangeContent={isoformStore.setFastaContent}
                  onLoadContent={isoformStore.loadFastaContent}
                  error={isoformStore.fastaError}
                />

                <Heading as="h3" size="sm" mb={2}>
                  Gene structure
                  <CheckCircleIcon
                    ml={3}
                    color={
                      isoformStore.pdb.numDatasets > 0
                        ? "green.500"
                        : "gray.200"
                    }
                  />
                </Heading>

                <InputTextArea
                  isoID={isoformStore.isoID}
                  width="500px"
                  height="150px"
                  placeholder="Paste gene 3D structure here (.pdb file from AlphaFold)"
                  value={isoformStore.pdb.content}
                  onChangeContent={isoformStore.pdb.setContent}
                  onLoadContent={isoformStore.pdb.loadPdbContent}
                  error={isoformStore.pdb.error}
                />

                {isoformStore.sequence && (
                  <Box mt={6}>
                    <Heading as="h4" size="sm">
                      {isoformStore.sequence.taxon}
                    </Heading>
                    <SequenceView code={isoformStore.sequence.code} />
                  </Box>
                )}
              </Flex>
            )),
          ]}
        </HStack>

        <Flex mt={6} direction="column" alignItems="center">
          <Heading as="h4" size="sm" mb={4}>
            Load example data
          </Heading>
          <LoadData />
        </Flex>
      </Flex>

      <Flex id="step2" direction="column" alignItems="center" mb={20}>
        <StepHeading step={2} title="Align sequences" />

        <AlignSequences />

        <Flex mt={8}></Flex>
      </Flex>

      <Flex id="step3" direction="column" alignItems="center" mb={20}>
        <StepHeading step={3} title="Generate and partition networks" />

        <PartitionNetworks />

        <Flex mt={8}></Flex>
      </Flex>

      <Flex id="step4" direction="column" alignItems="center" mb={20}>
        <StepHeading step={4} title="Compare structures" />
        <p>Explore modular differences</p>

        <IsoformAlluvialDiagram />
      </Flex>
    </Flex>
  );
});
