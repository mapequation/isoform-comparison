import { Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import IsoformStore from "../../store/IsoformStore";
import { observer } from "mobx-react";

export default observer(function NetworkInfo({
  isoform,
}: {
  isoform: IsoformStore;
}) {
  const { netFile: file, network } = isoform.pdb;

  if (!file) {
    return null;
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {file.isMultilayer && (
        <Text>
          {!file.isExpanded
            ? pluralize(file.numLayers!, "layer")
            : "layer " + file.layerId}
        </Text>
      )}
      {file.nodes && (
        <Text>
          {`${network.nodes.length.toLocaleString()} ${
            file.isStateNetwork ? "state nodes" : "nodes"
          } and ${network.links.length.toLocaleString()} links.`}
        </Text>
      )}
      {file.numTopModules && (
        <Text>{pluralize(file.numTopModules, "top module")}</Text>
      )}
      {file.cluLevel && <Text>level {file.cluLevel}</Text>}
      {!file.cluLevel && file.numLevels && (
        <Text>{pluralize(file.numLevels, "level")}</Text>
      )}
      {file.codelength && <Text>{file.codelength.toFixed(3) + " bits"}</Text>}
    </motion.div>
  );
});

function pluralize(num: number, noun: string) {
  return `${num} ${num !== 1 ? noun + "s" : noun}`;
}
