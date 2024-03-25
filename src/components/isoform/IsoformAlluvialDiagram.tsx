import { Box, Button, Flex } from "@chakra-ui/react";
import { observer } from "mobx-react";
import { useContext } from "react";
import { StoreContext } from "../../store";
import Diagram from "../Diagram";

export default observer(function IsoformAlluvialDiagram() {
  const store = useContext(StoreContext);
  return (
    <Flex direction="column" align="center">
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
  );
});
