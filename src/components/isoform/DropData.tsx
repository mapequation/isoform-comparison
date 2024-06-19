import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Skeleton,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { observer } from "mobx-react";
import { useContext } from "react";
import { useDropzone } from "react-dropzone";
import { useError } from "../../hooks/useError";
import { StoreContext } from "../../store";
import { ChevronDownIcon } from "@chakra-ui/icons";

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
  //   const [state, dispatch] = useReducer(reducer, initialState, (state) => ({
  //     ...state,
  //     files: store.files,
  //   }));
  const onClose = () => {};

  //   const { files } = state;

  const onDrop = async (acceptedFiles: File[]) => {
    console.time("onDrop");
    await store.input.loadFiles(acceptedFiles);

    store.input.errors.forEach((error) => onError(error));

    console.timeEnd("onDrop");
  };

  const { open, getRootProps, getInputProps, isDragActive } = useDropzone({
    // noClick: true,
    accept: dropzoneAccept,
    onDropRejected: (rejectedFiles) =>
      rejectedFiles.forEach((rejectedFile) =>
        onError({
          title: `Cannot open ${rejectedFile.file.name}`,
          description: rejectedFile.errors
            .map(({ message }) => message)
            .join("\n"),
        })
      ),
    onDrop,
  });

  const showLoading = store.input.isLoadingFiles;
  return (
    <>
      <Skeleton
        w="400px"
        h="360px"
        isLoaded={!showLoading}
        // rounded="md"
        border="1px dashed #ccc"
      >
        <div style={{ width: "100%", height: "100%" }} {...getRootProps()}>
          <input {...getInputProps()} />
          <Box
            p={3}
            bg={isDragActive ? "gray.200" : "gray.50"}
            w="100%"
            h="100%"
            color="gray.600"
            fontSize="medium"
          >
            {isDragActive ? (
              <Text>Drop the files here ...</Text>
            ) : (
              <Text>
                Drag and drop files here, or click to select files. <br />
                <br /> Accepts <code>.fasta</code> and <code>.pdb</code> files,
                or <code>.net</code> files for pre-made networks.
                <br />
                <br />
                Isoform identified by filenames.
              </Text>
            )}
          </Box>
        </div>
      </Skeleton>
      {/* <Button onClick={createDiagram}>Create diagram</Button> */}
      <Flex mt={2} justify="flex-end">
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
            Load examples
          </MenuButton>
          <MenuList>
            {store.input.exampleData.map((item) => (
              <MenuItem
                key={item.id}
                value={item.id}
                onClick={() => store.input.loadExample(item)}
              >
                {item.isoform1} vs {item.isoform2}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Flex>
    </>
  );
});
