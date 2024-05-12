import { Box, Code } from "@chakra-ui/react";
import { getAAColor } from "../../store/PdbStore";

type SequenceViewProps = {
  code: string;
};

export default function SequenceView({ code }: SequenceViewProps) {
  const N = code.length;
  // const n = 10;
  const codes = code.match(/.{1,50}/g) as string[];
  // const Codes = [];
  // for (let i = 0; i < N; i++) {
  //     Codes.push(<span>{code.charAt(i)}</span>)
  //     if
  // }

  return (
    <Code>
      {codes.map((chunk, i) => (
        <Box key={i}>
          {[...chunk].map((c, i) => (
            <span key={`code[${i}]`} style={{ backgroundColor: getAAColor(c) }}>
              {c}
            </span>
          ))}
        </Box>
      ))}
    </Code>
  );

  // return (
  //     {
  //         codes.map((chunk: string) => (
  //             <Box>{[...chunk].map(c => (
  //             ))}</Box>
  //         ))
  //     }

  // )
}
