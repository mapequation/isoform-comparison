import { Box, Modal, Slide, useColorModeValue } from "@chakra-ui/react";
import { observer } from "mobx-react";
import { useContext, useState } from "react";
import { StoreContext } from "../store";
import Documentation from "./Documentation";
import LoadNetworks from "./LoadNetworks";
import Logo from "./Logo";
import NodeList from "./NodeList";
import Sidebar from "./Sidebar";
import IsoformApp from "./isoform/IsoformApp";

export const drawerWidth = 350;

export default function App() {
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
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

      <IsoformApp />

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
}
