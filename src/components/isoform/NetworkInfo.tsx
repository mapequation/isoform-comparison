import { Box, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import IsoformStore from "../../store/IsoformStore";
import { observer } from "mobx-react";
import humanFileSize from "../../utils/human-file-size";
import { Button } from "../Sidebar/components";
import FileSaver from "file-saver";
import { Download } from "lucide-react";

export const ExportNetwork = observer(function _ExportNetwork({
  isoform,
}: {
  isoform: IsoformStore;
}) {
  const { netFile: file, network } = isoform.pdb;

  return <Box></Box>;
});

export default observer(function NetworkInfo({
  isoform,
}: {
  isoform: IsoformStore;
}) {
  const store = isoform.pdb;
  const { netFile: file, network, name } = store;

  const filename = `${name}.net`;

  const saveNetwork = () => {
    const blob = new Blob([isoform.pdb.serializeNetwork()], {
      type: "plain/text;charset=utf-8",
    });
    FileSaver.saveAs(blob, filename);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Text display="flex" alignItems="center" justifyContent="space-between">
        <span>
          {`${network.nodes.length.toLocaleString()} nodes and ${network.links.length.toLocaleString()} links.`}
        </span>
        <Button
          ml={2}
          size="xs"
          width="auto"
          onClick={saveNetwork}
          rightIcon={<Download size={16} />}
          isDisabled={network.links.length === 0}
        >
          Export network
        </Button>
      </Text>
      <Box></Box>
    </motion.div>
  );
});
