import { Flex, HStack, Text, useColorModeValue } from "@chakra-ui/react";
import Infomap from "@mapequation/infomap";

export default function Logo({ showVersion = false, long = false }) {
  const color = useColorModeValue("hsl(0, 0%, 33%)", "hsl(0, 0%, 60%)");
  const brand = useColorModeValue("hsl(0, 68%, 42%)", "hsl(0, 68%, 62%)");

  return (
    <HStack w="100%" justify="space-between" align="center">
      <HStack justify="flex-start" align="center" spacing={3}>
        <a href="//mapequation.org">
          <img
            alt=""
            width="32px"
            height="32px"
            src="//www.mapequation.org/assets/img/twocolormapicon_whiteboarder.svg"
          />
        </a>
        <Flex direction="column">
          <Flex alignItems="center">
            <HStack
              style={{
                fontFamily: "Philosopher, serif",
                fontWeight: 700,
                fontSize: "1.4em",
              }}
            >
              <Text color={brand}>Isoform</Text>
              <Text ml={-2} color={color}>
                Mapper
              </Text>
            </HStack>
            {showVersion && (
              <Text ml={1} color={color}>
                {" v" + __APP_VERSION__}
              </Text>
            )}
          </Flex>
          <Text mt={-2} fontSize="xs">
            Powered by Infomap v{Infomap.__version__}
          </Text>
        </Flex>
      </HStack>
    </HStack>
  );
}
