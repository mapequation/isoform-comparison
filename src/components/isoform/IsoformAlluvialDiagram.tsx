import { Button, Flex, List, Text } from "@chakra-ui/react";
import { observer } from "mobx-react";
import { useContext } from "react";
import { StoreContext } from "../../store";
import Diagram from "../Diagram";
import Export from "../Sidebar/Export";
import { saveSvg } from "../../io/save-svg";
import { MdFileDownload } from "react-icons/md";

export default observer(function IsoformAlluvialDiagram() {
  const store = useContext(StoreContext);
  const downloadSvg = () => {
    store.setSelectedModule(null);
    const svg = document.getElementById("alluvialSvg") as SVGSVGElement | null;
    if (!svg) return;

    const filename =
      store.diagram.children.map((n) => n.name).join("-") + ".svg";

    setTimeout(() => saveSvg(svg, filename), 500);
  };

  return (
    <Flex direction="column" align="center">
      <Text>Explore modular differences in an alluvial diagram.</Text>

      <Flex direction="row" alignItems="center" mt={4} gap={4}>
        <Button
          isDisabled={!store.input.canGenerateAlluvial}
          onClick={store.input.generateAlluvialDiagram}
        >
          {store.input.haveAlluvial ? "Re-generate" : "Generate"} diagram
        </Button>
        {store.input.haveAlluvial && (
          <Button
            onClick={downloadSvg}
            // variant="link"
            leftIcon={<MdFileDownload />}
          >
            Download SVG
          </Button>
        )}
      </Flex>

      <Flex mt={8}></Flex>
      <Diagram width={900} height={500} />
    </Flex>
  );
});
