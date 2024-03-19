import { Box, Flex, Heading } from "@chakra-ui/react";

export default function AlignSequences({}: {}) {
  const accentColor = "var(--chakra-colors-blue-600)";

  return (
    <Flex className="step-heading" alignItems="center" mb={1}>
      <p>Load or calculate a sequence alignment of the isoforms.</p>
    </Flex>
  );
}
