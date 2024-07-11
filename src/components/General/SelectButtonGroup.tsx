import {
  ButtonGroup as CBG,
  ButtonGroupProps,
  forwardRef,
} from "@chakra-ui/react";
import React from "react";

export const ButtonGroup = forwardRef<ButtonGroupProps, "div">((props, ref) => {
  const { isAttached, spacing = 2 } = props;
  const styles = {
    flexDirection: { base: "column", lg: "row" },
    "& > *:not(style) ~ *:not(style)": {
      marginStart: { base: 0, lg: spacing },
      marginTop: { base: 3, lg: 0 },
    },
  };
  if (!isAttached) {
    return <CBG ref={ref} sx={styles} {...props} />;
  }
  return <CBG ref={ref} {...props} />;
});

const inactiveStyles = {
  color: "gray.700",
  borderColor: "gray.100",
  bg: "gray.100",
  _hover: { bg: "gray.300" },
  _active: { bg: "gray.200" },
};

interface SelectButtonGroupProps extends ButtonGroupProps {
  // onChange: (value: string) => void;
  onChangeSelected: (value: string | number) => void;
  value: string | number;
  children: React.ReactElement[];
}

/**
 * @example (
 * <SelectButtonGroup onChange={handleChangeValue} value={value}>
 *  <Button value={value1}>label1</Button>
 *  <Button value={value2}>label2</Button>
 * </SelectButtonGroup>
 * )
 * @note
 * must have multiple child elements
 */
// export const SelectButtonGroup: React.FC<{
//   onChange: (value: string) => void;
//   value: string;
//   children: React.ReactElement[];
//   groupProps?: ButtonGroupProps;
// }> = ({ onChange, value, children, groupProps }) => {
export const SelectButtonGroup: React.FC<SelectButtonGroupProps> = (props) => {
  const { value, onChangeSelected, children, ...groupProps } = props;
  return (
    <ButtonGroup {...groupProps}>
      {React.Children.map(children, (Child) => {
        return React.cloneElement(Child, {
          onClick: () => {
            if (value === Child.props?.value) return;
            onChangeSelected(Child.props?.value);
          },
          ...(value !== Child.props?.value && { sx: inactiveStyles }),
        });
      })}
    </ButtonGroup>
  );
};

export default SelectButtonGroup;
