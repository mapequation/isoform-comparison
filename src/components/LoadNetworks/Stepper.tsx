import {
  Box,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
} from "@chakra-ui/react";

export default function AlluvialStepper({
  activeStep,
  acceptedFormats,
}: {
  activeStep: number;
  acceptedFormats: string;
}) {
  const steps = [
    {
      title: "Run Infomap",
      description: (
        <a href="//mapequation.org/infomap">
          Infomap Online or load net-files!
        </a>
      ),
    },
    {
      title: "Load network partitions",
      description: (
        <a href="//mapequation.org/infomap/#Output">
          Formats: {acceptedFormats}
        </a>
      ),
    },
    {
      title: "Create alluvial diagram",
      description: "Highlight partition differences",
    },
  ];
  return (
    <Stepper
      index={activeStep}
      sx={{ margin: "1em auto 2em", width: "90%" }}
      colorScheme="blue"
    >
      {steps.map((step, index) => (
        <Step key={index}>
          <StepIndicator>
            <StepStatus
              complete={<StepIcon />}
              incomplete={<StepNumber />}
              active={<StepNumber />}
            />
          </StepIndicator>

          <Box flexShrink="0">
            <StepTitle>{step.title}</StepTitle>
            <StepDescription>{step.description}</StepDescription>
          </Box>

          <StepSeparator />
        </Step>
      ))}
    </Stepper>
  );
}
