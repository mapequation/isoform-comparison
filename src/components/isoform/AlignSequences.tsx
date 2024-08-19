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
  Th,
  Thead,
  Tr,
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

      <Flex direction="column" mt={8} alignItems="center">
        <TableContainer mb={2}>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Sequence</Th>
                <Th isNumeric>Size</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>Isoform 1</Td>
                <Td isNumeric>{isoforms[0].sequence?.code.length ?? 0}</Td>
              </Tr>
              <Tr>
                <Td>Isoform 2</Td>
                <Td isNumeric>{isoforms[1].sequence?.code.length ?? 0}</Td>
              </Tr>
              <Tr>
                <Td>Alignment</Td>
                <Td isNumeric>{alignment[0].sequence.length}</Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
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
      </Flex>
    </Flex>
  );
});
