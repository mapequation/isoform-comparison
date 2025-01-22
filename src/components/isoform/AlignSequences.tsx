import {
  Box,
  Button,
  Code,
  Flex,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  chakra,
} from "@chakra-ui/react";
import { useContext } from "react";
import { StoreContext } from "../../store";
import { getAAColor } from "../../store/PdbStore";
import { observer } from "mobx-react";

export default observer(function AlignSequences({}: {}) {
  const store = useContext(StoreContext);
  const { alignment, isoforms } = store.input;

  return (
    <Flex
      className="step-heading"
      direction="column"
      alignItems="center"
      mb={1}
    >
      <p>Load or calculate a sequence alignment of the isoforms.</p>

      <Flex direction="column" alignItems="center">
        <Button
          isDisabled={!store.input.canGenerateAlignment}
          onClick={store.input.generateAlignment}
        >
          Align
        </Button>

        <Box overflowX="scroll" maxW={800}>
          {alignment.map(({ name, sequence }) => (
            <Code key={`${name}-code`} whiteSpace="nowrap">
              {[...sequence].map((c, i) => (
                <span
                  key={`${name}-code[${i}]`}
                  title={`${i + 1}_${c}`}
                  style={{
                    backgroundColor: c === "-" ? "#eeeeee" : getAAColor(c),
                  }}
                >
                  {c}
                </span>
              ))}
            </Code>
          ))}
        </Box>
        <Box>
          <Text>
            Number of amino acids in isoform 1:{" "}
            <chakra.span fontWeight="bold">
              {isoforms[0].sequence?.code.length ?? 0}
            </chakra.span>
            , isoform 2:{" "}
            <chakra.span fontWeight="bold">
              {isoforms[1].sequence?.code.length ?? 0}
            </chakra.span>
            , alignment:{" "}
            <chakra.span fontWeight="bold">
              {alignment[0].sequence.length ?? 0}
            </chakra.span>
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
});
