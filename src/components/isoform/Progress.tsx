import { Progress } from "@chakra-ui/react";
import { observer } from "mobx-react";
import IsoformStore from "../../store/IsoformStore";

function ProgressComponent({ value }: { value: number }) {
  return <Progress value={value} size="xs" mb={-2} mt={1} />;
}

export const IsoformProgress = observer(
  ({ isoform }: { isoform: IsoformStore }) => {
    const { infomap } = isoform;
    if (!infomap.isRunning) {
      return null;
    }
    return <ProgressComponent value={infomap.progress} />;
  }
);

export const PdbProgress = observer(
  ({ isoform }: { isoform: IsoformStore }) => {
    const { infomap } = isoform.pdb;
    if (!infomap.isRunning) {
      return null;
    }
    return <ProgressComponent value={infomap.progress} />;
  }
);
