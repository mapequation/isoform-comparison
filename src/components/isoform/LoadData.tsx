import {
  Box,
  Flex,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { observer } from "mobx-react";
import { useContext } from "react";
import { useError } from "../../hooks/useError";
import { StoreContext } from "../../store";

const acceptedFormats = ["fasta", "pdb", "net"] as const;

const dropzoneAccept = {
  "text/plain": acceptedFormats.map((format) => `.${format}`),
};

// type Props = {
//   onClose: () => void;
// };

export default observer(function LoadData() {
  const store = useContext(StoreContext);
  const onError = useError();

  const columns = [
    "GeneID",
    // "Aliases",
    "Isoform1",
    "Isoform2",
    "Mechanism",
    "Time1",
    "Time2",
    "Description",
  ];

  const showLoading = store.input.isLoadingFiles;
  return (
    <Box maxH={400} maxW={900} overflow="scroll">
      <InputGroup>
        <Input
          placeholder="Search..."
          value={store.input.filterText}
          onChange={(event) => store.input.setFilterText(event.target.value)}
        />
        <InputRightElement
          color="gray.300"
          style={{ whiteSpace: "nowrap" }}
          width={100}
        >
          {`${store.input.filteredExampleData.length} / ${store.input.exampleData.length}`}
        </InputRightElement>
      </InputGroup>
      <TableContainer>
        <Table variant="simple" size="sm">
          <TableCaption>Example data</TableCaption>
          <Thead>
            <Tr>
              {columns.map((column) => (
                <Th key={column}>{column}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {store.input.filteredExampleData.map((row) => (
              <Tr
                key={row.id}
                cursor="pointer"
                onClick={() => store.input.loadExample(row)}
              >
                <Td>{row.geneID}</Td>
                <Td>{row.isoform1}</Td>
                <Td>{row.isoform2}</Td>
                <Td>{row.mechanism}</Td>
                <Td>{row.time1}</Td>
                <Td>{row.time2}</Td>
                <Td>{row.description}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
});
