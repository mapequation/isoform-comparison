import { Box, Code } from "@chakra-ui/react";
import { getAAColor } from "../../store/PdbStore";

type SequenceViewProps = {
  code: string;
};

export default function SequenceView({ code }: SequenceViewProps) {
  return (
    <Code overflowWrap="break-word">
      {[...code].map((c, i) => (
        <span key={`code[${i}]`} style={{ backgroundColor: getAAColor(c) }}>
          {c}
        </span>
      ))}
    </Code>
  );
}
