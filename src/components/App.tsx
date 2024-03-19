import {
  Box,
  Button,
  Flex,
  Heading,
  List,
  ListIcon,
  ListItem,
  Modal,
  Slide,
  Spacer,
  Text,
  Textarea,
  useColorModeValue,
} from "@chakra-ui/react";
import { observer } from "mobx-react";
import { useContext, useState } from "react";
import useEventListener from "../hooks/useEventListener";
import { StoreContext } from "../store";
import Diagram from "./Diagram";
import Documentation from "./Documentation";
import LoadNetworks from "./LoadNetworks";
import Logo from "./Logo";
import NodeList from "./NodeList";
import Sidebar from "./Sidebar";
import StepHeading from "./isoform/StepHeading";
import AlignSequences from "./isoform/AlignSequences";
import LoadData from "./isoform/LoadData";
import PartitionNetworks from "./isoform/PartitionNetworks";
import InputTextArea from "./isoform/InputTextArea";

export const drawerWidth = 350;

export default observer(function App() {
  const store = useContext(StoreContext);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  // const bg = useColorModeValue("white", "var(--chakra-colors-gray-800)");
  const bg = useColorModeValue("white", "gray.800");

  const onLoadClose = () => setIsLoadOpen(false);
  const onHelpClose = () => setIsHelpOpen(false);
  const onExplorerClose = () => setIsExplorerOpen(false);

  const openLoad = () => {
    setIsLoadOpen(true);
    onHelpClose();
    onExplorerClose();
  };

  const openHelp = () => {
    setIsHelpOpen(true);
    onLoadClose();
    onExplorerClose();
  };

  const openExplorer = () => {
    setIsExplorerOpen(true);
    onLoadClose();
    onHelpClose();
  };

  useEventListener("keydown", (event) => {
    // @ts-ignore
    const key = event?.key;
    if (!store.editMode && key === "l") {
      openLoad();
    }
    if (!store.editMode && key === "e") {
      store.input.loadExample(store.input.exampleData[0]);
    }
  });

  return (
    <>
      <Modal size="5xl" isCentered isOpen={isLoadOpen} onClose={onLoadClose}>
        <LoadNetworks onClose={onLoadClose} />
      </Modal>

      <Modal
        size="2xl"
        scrollBehavior="inside"
        isOpen={isHelpOpen}
        onClose={onHelpClose}
      >
        <Documentation onClose={onHelpClose} />
      </Modal>

      <Modal size="5xl" isOpen={isExplorerOpen} onClose={onExplorerClose}>
        {isExplorerOpen && <NodeList onClose={onExplorerClose} />}
      </Modal>

      <Flex mt="100px" direction="column" alignItems="center">
        <Flex id="step1" direction="column" alignItems="center" mb={20}>
          <StepHeading step={1} title="Load data" active={activeStep == 1} />

          <Text>Paste or load your own data below or load example data.</Text>

          <Flex mt={6}>
            <Flex direction="column">
              <Heading as="h3" size="sm" mb={2}>
                Isoform 1
              </Heading>
              <InputTextArea
                isoID={1}
                width="500px"
                height="150px"
                placeholder="Paste gene sequence here (.fasta file)"
                onLoadContent={() => {}}
              />

              <InputTextArea
                isoID={1}
                width="500px"
                height="150px"
                placeholder="Paste gene 3D structure here (.pdb file from AlphaFold)"
                onLoadContent={() => {}}
                mt="20px"
              />
            </Flex>
            <Flex direction="column" mx={4}>
              <Heading as="h3" size="sm" mb={2}>
                &nbsp;
              </Heading>
              <LoadData />
            </Flex>

            <Flex direction="column">
              <Heading as="h3" size="sm" mb={2}>
                Isoform 2
              </Heading>
              <InputTextArea
                isoID={2}
                width="500px"
                height="150px"
                placeholder="Paste gene sequence here (.fasta file)"
                onLoadContent={() => {}}
              />

              <InputTextArea
                isoID={2}
                width="500px"
                height="150px"
                placeholder="Paste gene 3D structure here (.pdb file from AlphaFold)"
                onLoadContent={() => {}}
                mt="20px"
              />
            </Flex>
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

          <Button
            mt={4}
            isDisabled={!store.input.canGenerateAlluvial}
            onClick={store.input.generateAlluvialDiagram}
          >
            Re-generate alluvial diagram
          </Button>

          <Flex mt={8}></Flex>
          <Diagram width={1280} height={740} />
        </Flex>
      </Flex>

      <Slide
        in={isLoadOpen || true}
        direction="top"
        style={{ height: "6rem", zIndex: 1500 }}
      >
        <Box px={10} display="flex" alignItems="center" h="6rem" bg={bg}>
          <Logo showVersion />
        </Box>
      </Slide>

      <Slide in={!isLoadOpen && false} style={{ width: drawerWidth }}>
        <Sidebar
          onLoadClick={openLoad}
          onAboutClick={openHelp}
          onModuleViewClick={openExplorer}
        />
      </Slide>
    </>
  );
});
