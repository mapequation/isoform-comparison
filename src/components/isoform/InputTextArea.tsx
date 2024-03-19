import {
  Box,
  Button,
  Flex,
  Heading,
  Spacer,
  Textarea,
  TextareaProps,
} from "@chakra-ui/react";
import { ChangeEvent, useState } from "react";

interface Props extends TextareaProps {
  isoID: number;
  onLoadContent: (content: string) => void;
}
export default function InputTextArea(props: Props) {
  const [content, setContent] = useState("");
  const { isoID, onLoadContent, ...rest } = props;

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  const onClickLoad = () => {
    onLoadContent(content);
  };

  return (
    <Box display="flex" flexDir="column">
      <Textarea
        resize="none"
        // width="670px"
        // height="200px"
        size="sm"
        {...rest}
        value={content}
        onChange={onChange}
      />
      <Flex mt={2}>
        <Spacer />
        <Button
          variant="outline"
          size="sm"
          isDisabled={content === ""}
          onClick={onClickLoad}
        >
          Load
        </Button>
      </Flex>
    </Box>
  );
}
