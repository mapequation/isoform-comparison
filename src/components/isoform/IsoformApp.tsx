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
import FileInput from "./FileInput";
import DropData from "./DropData";
import { Button } from "../Sidebar/components";

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
                <Heading as="h3" size="sm" mb={2} display="flex">
                  Isoform {i + 1}
                  <CheckCircleIcon
                    ml={3}
                    alignSelf="center"
                    color={
                      isoformStore.pdb.numDatasets > 0
                        ? "green.500"
                        : "gray.200"
                    }
                  />
                </Heading>

                <DropData isoform={isoformStore} />

                {isoformStore.sequence && (
                  <Flex mt={6} direction="column">
                    {/* <Heading as="h4" size="sm">
                      Sequence
                    </Heading> */}
                    <SequenceView code={isoformStore.sequence.code} />
                    <Button
                      alignSelf="end"
                      width="auto"
                      onClick={isoformStore.pdb.clear}
                    >
                      Clear
                    </Button>
                  </Flex>
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
