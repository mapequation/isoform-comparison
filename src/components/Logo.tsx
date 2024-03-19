import { HStack, useColorModeValue } from "@chakra-ui/react";

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
        <div>
          <span
            style={{
              fontFamily: "Philosopher, serif",
              fontWeight: 700,
              fontSize: "1.4em",
            }}
          >
            <span style={{ color: brand }}>Isoform</span>
            <span style={{ color }}> Comparison</span>
            {long && <span style={{ color }}> Generator</span>}
          </span>
          {showVersion && (
            <span style={{ color }}>{" v" + __APP_VERSION__}</span>
          )}
        </div>
      </HStack>
    </HStack>
  );
}
