import { Box } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function FileInput() {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {});
  }, []);
  const { acceptedFiles, getRootProps, getInputProps, isDragActive } =
    useDropzone({
      accept: {
        "text/plain": [".pdb"],
      },
      onDrop,
    });

  const files = acceptedFiles.map((file) => (
    <li key={file.name}>
      {file.name} - {file.size} bytes
    </li>
  ));

  return (
    <Box>
      <Box {...getRootProps({ className: "dropzone" })} p={10}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>
            Drag 'n' drop <code>.pdb</code> files here, or click to select files
          </p>
        )}
      </Box>
      <aside>
        <h4>Files:</h4>
        <ul>{files}</ul>
      </aside>
    </Box>
  );
}
