import { Box, Text } from "@chakra-ui/react";
import IsoformStore from "../../store/IsoformStore";
import { useEffect, useRef } from "react";
import ForceGraph, { type ForceGraphMethods } from "react-force-graph-3d";
import { observer } from "mobx-react";

export default observer(function GraphComponent({
  isoform,
}: {
  isoform: IsoformStore;
}) {
  const ref = useRef();
  //   if (isoform.pdb.network.nodes.length === 0) {
  //     return <Box w={500} h={500} />;
  //   }

  useEffect(() => {
    /**
     * How set initial zoom level?
     *
     * https://github.com/vasturiano/3d-force-graph/issues/20
     *
     * e.camera.position.z=150*Math.cbrt(e.forceGraph.graphData().nodes.length)
     *
     * myGraph.cameraPosition({ z: 1000 });
     *
     * myGraph.controls().maxDistance = 2000;
     */
    if (ref.current) {
      const g = ref.current as ForceGraphMethods;
      g.cameraPosition({ z: 200 });
      // setTimeout(() => {
      //   g.zoomToFit(400, 0);
      // }, 100);
    }
  }, [ref]);

  const { network } = isoform.pdb;

  return (
    <Box border="1px solid #eeeeee">
      <ForceGraph
        ref={ref}
        height={350}
        width={500}
        nodeOpacity={0.9}
        linkColor="#000000"
        linkOpacity={0.7}
        linkWidth={0.3}
        graphData={network}
        linkSource="sourceId"
        linkTarget="targetId"
        showNavInfo={false}
        // nodeLabel="label"
        nodeLabel={(node) =>
          `<span style="color: #333333">${node.label}</span>`
        }
        nodeRelSize={1}
        backgroundColor="#ffffff"
        enableNodeDrag={false}
      />
    </Box>
  );
});
