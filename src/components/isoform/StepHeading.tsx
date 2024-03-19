import { Box, Circle, Flex, Heading } from "@chakra-ui/react";

export default function StepHeading({
  step,
  title,
  active,
}: {
  step: number;
  title: string;
  active?: boolean;
}) {
  const accentColor = "var(--chakra-colors-blue-600)";

  return (
    <Flex className="step-heading" alignItems="center" mb={1}>
      <Circle
        centerContent
        size="40px"
        border={active ? `2px solid ${accentColor}` : "0"}
        bgColor="#eeeeee"
        fontWeight="bold"
        mr={4}
      >
        {step}
      </Circle>
      <Heading size="lg">{title}</Heading>
    </Flex>
  );
}
