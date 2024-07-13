import { Box, Button, Code, Flex, Heading } from "@chakra-ui/react";
import { useContext } from "react";
import { StoreContext } from "../../store";
import { getAAColor } from "../../store/PdbStore";
import { observer } from "mobx-react";

export default observer(function AlignSequences({}: {}) {
  const store = useContext(StoreContext);
  const { alignment } = store.input;

  return (
    <Flex
      className="step-heading"
      direction="column"
      alignItems="center"
      mb={1}
    >
      <p>Load or calculate a sequence alignment of the isoforms.</p>

      <Flex mt={8}>
        <Box>
          {/* {alignment.map((item) => (
            <Box key={`${item.name}-id`}>{item.name}</Box>
          ))} */}
          <Button
            isDisabled={!store.input.canGenerateAlignment}
            onClick={store.input.generateAlignment}
          >
            Align
          </Button>
        </Box>

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
