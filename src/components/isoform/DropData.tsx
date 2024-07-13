import {
  Box,
  FormControl,
  FormErrorMessage,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { useError } from "../../hooks/useError";
import IsoformStore from "../../store/IsoformStore";

// const acceptedFormats = ["fasta", "pdb", "net"] as const;
const acceptedFormats = ["pdb"] as const;

const dropzoneAccept = {
  "text/plain": acceptedFormats.map((format) => `.${format}`),
};

// type Props = {
//   onClose: () => void;
// };

export default observer(function LoadData({
  isoform,
}: {
  isoform: IsoformStore;
}) {
  // const store = useContext(StoreContext);
  const onError = useError();
  //   const [state, dispatch] = useReducer(reducer, initialState, (state) => ({
  //     ...state,
  //     files: store.files,
  //   }));
  const onClose = () => {};

  //   const { files } = state;

  const onDrop = async (acceptedFiles: File[]) => {
    // console.time("onDrop");
    await isoform.pdb.loadFiles(acceptedFiles);

    isoform.pdb.errors.forEach((error) => onError(error));
    isoform.pdb.errors = [];

    // console.timeEnd("onDrop");
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

  const { error } = isoform.pdb;
  const isError = !!error;

  return (
    <FormControl isInvalid={isError}>
      <Skeleton
        w="430px"
        // h="360px"
        isLoaded={!isoform.pdb.isLoading}
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
                Drag and drop <code>.pdb</code> files here, or click to select.
              </Text>
            )}
          </Box>
        </div>
      </Skeleton>
      {/* <FormErrorMessage maxW={430}>Error: {error}</FormErrorMessage> */}
    </FormControl>
  );
});
