import React, { useContext, useState } from "react";
import { SketchPicker } from "react-color";
import { Slider } from "react-semantic-ui-range";
import { Checkbox, Header, Icon, Label, Menu, Popup, Portal, Sidebar as SemanticSidebar } from "semantic-ui-react";
import Dispatch from "../context/Dispatch";
import { savePng, saveSvg } from "../io/export";
import { parseState, serializeState } from "../io/serialize-state";
import MenuHeader from "./MenuHeader";
import SelectedModule from "./SelectedModule";


function LabelForSlider(props) {
  const { children, popup, ...rest } = props;

  const label = <Label
    basic
    horizontal
    {...rest}
    style={{ float: "left", margin: "0.08em 0" }}
  />;

  return (
    <div style={{ clear: "both" }}>
      {popup ? <Popup content={popup} inverted size="small" trigger={label}/> : label}
      <div style={{ width: "50%", display: "inline-block", float: "right" }}>
        {children}
      </div>
    </div>
  );
}

const GreySlider = props => <Slider color="grey" {...props}/>;

const MyCheckbox = props => {
  const { popup, ...rest } = props;
  const checkbox = <Checkbox style={{ display: "block", margin: "0.3em 0" }} {...rest}/>;
  return popup ? <Popup content={popup} inverted size="small" trigger={checkbox}/> : checkbox;
};

export default function Sidebar(props) {
  const {
    networks,
    height,
    duration,
    marginExponent,
    moduleWidth,
    streamlineFraction,
    streamlineOpacity,
    moduleFlowThreshold,
    streamlineThreshold,
    defaultHighlightColor,
    highlightColors,
    verticalAlign,
    showModuleId,
    dropShadow,
    sidebarVisible,
    selectedModule
  } = props;

  const { dispatch } = useContext(Dispatch);

  const [selectedModuleOpen, setSelectedModuleOpen] = useState(false);

  let fileInput = null;

  const basename = networks.map(network => network.name);

  const saveSettings = () => serializeState({
    height, duration, marginExponent, moduleWidth, moduleFlowThreshold,
    streamlineFraction, streamlineOpacity, streamlineThreshold,
    verticalAlign, showModuleId, dropShadow,
    defaultHighlightColor, highlightColors
  }, "alluvial-settings.json");

  const parseSettings = () => parseState(fileInput.files[0])
    .then(value => {
      fileInput.value = "";
      dispatch({ type: "loadState", value });
    });

  const selectedModuleName = selectedModule
    ? selectedModule.name || selectedModule.largestLeafNodes.join(", ")
    : <span style={{ color: "#777" }}>No module selected</span>;

  return (
    <SemanticSidebar
      as={Menu}
      animation="overlay"
      width="wide"
      direction="right"
      visible={sidebarVisible}
      vertical
    >
      <Menu.Item header href="//www.mapequation.org/alluvial">
        <MenuHeader/>
      </Menu.Item>
      <Menu.Item
        icon='close'
        content='Hide sidebar'
        onClick={() => dispatch({ type: "sidebarVisible", value: false })}
      />
      <Menu.Item>
        <Header as="h4">Selected module</Header>
        {selectedModuleName}
        {selectedModule &&
        <Portal
          open={selectedModuleOpen && !!selectedModule}
          onClose={() => setSelectedModuleOpen(false)}
          trigger={<Menu.Menu>
            <Menu.Item
              icon={selectedModuleOpen ? "close" : "info circle"}
              content={selectedModuleOpen ? "Show less" : "Show more"}
              onClick={() => setSelectedModuleOpen(!selectedModuleOpen)}
            />
          </Menu.Menu>}
        >
          <SelectedModule
            module={selectedModule}
            highlightColors={highlightColors}
            defaultHighlightColor={defaultHighlightColor}
          />
        </Portal>
        }
      </Menu.Item>
      <Menu.Item>
        <Header as="h4">Layout</Header>
        <LabelForSlider
          content="Height"
          detail={height}
          popup="Total height of the diagram (arbitrary units)."
        >
          <GreySlider
            settings={{
              start: height,
              min: 400,
              max: 2000,
              step: 10,
              onChange: value => dispatch({ type: "height", value })
            }}
          />
        </LabelForSlider>
        <LabelForSlider
          content="Module width"
          detail={moduleWidth}
          popup="Width of each stack of modules (arbitrary units)."
        >
          <GreySlider
            settings={{
              start: moduleWidth,
              min: 10,
              max: 200,
              step: 10,
              onChange: value => dispatch({ type: "moduleWidth", value })
            }}
          />
        </LabelForSlider>
        <LabelForSlider
          content="Module spacing"
          detail={Math.round(streamlineFraction * 100) + "%"}
          popup="Relative streamline width to module width."
        >
          <GreySlider
            settings={{
              start: streamlineFraction,
              min: 0,
              max: 3,
              step: 0.1,
              onChange: value => dispatch({ type: "streamlineFraction", value })
            }}
          />
        </LabelForSlider>
        <LabelForSlider
          content="Margin"
          detail={2 ** (marginExponent - 1)}
          popup="Margin between top-level modules. Sub-modules are spaced closer together."
        >
          <GreySlider
            discrete
            settings={{
              start: marginExponent,
              min: 1,
              max: 10,
              step: 1,
              onChange: value => dispatch({ type: "marginExponent", value })
            }}
          />
        </LabelForSlider>
        <LabelForSlider
          content="Visible flow"
          detail={(1 - moduleFlowThreshold) * 100 + "%"}
          popup="Show modules that together contain this much flow of information."
        >
          <GreySlider
            discrete
            settings={{
              start: (1 - moduleFlowThreshold) * 100,
              min: 97,
              max: 100,
              step: 0.1,
              onChange: value => dispatch({ type: "moduleFlowThreshold", value: 1 - value / 100 })
            }}
          />
        </LabelForSlider>
        <LabelForSlider
          content="Streamline filter"
          detail={streamlineThreshold}
          popup="Show streamlines that are at least this tall."
        >
          <GreySlider
            discrete
            settings={{
              start: streamlineThreshold,
              min: 0,
              max: 2,
              step: 0.01,
              onChange: value => dispatch({ type: "streamlineThreshold", value })
            }}
          />
        </LabelForSlider>
        <LabelForSlider
          content="Transparency"
          detail={Math.round((1 - streamlineOpacity) * 100) + "%"}
          popup="Increase transparency to highlight overlapping streamlines."
        >
          <GreySlider
            settings={{
              start: 1 - streamlineOpacity,
              min: 0,
              max: 1,
              step: 0.01,
              onChange: transparency => dispatch({ type: "streamlineOpacity", value: 1 - transparency })
            }}
          />
        </LabelForSlider>
        <LabelForSlider
          content="Animation speed"
          detail={duration < 300 ? "🐇" : duration < 1000 ? "🐈" : "🐢"}
          popup="Faster or slower animation speed."
        >
          <GreySlider
            settings={{
              start: 1 / duration,
              min: 1 / 2000,
              max: 1 / 200,
              step: 1 / 2000,
              onChange: value => dispatch({ type: "duration", value: 1 / value })
            }}
          />
        </LabelForSlider>
        <div style={{ clear: "both", paddingTop: "0.5em" }}>
          <MyCheckbox
            label="Bottom align"
            checked={verticalAlign === "bottom"}
            onChange={(e, { checked }) => dispatch({ type: "verticalAlign", value: checked ? "bottom" : "justify" })}
            popup="Justify vertical module alignment or align modules to bottom."
          />
          <MyCheckbox
            label="Module ids"
            checked={showModuleId}
            onChange={(e, { checked }) => dispatch({ type: "showModuleId", value: checked })}
            popup="Show or hide module designations."
          />
          <MyCheckbox
            label="Drop shadow"
            checked={dropShadow}
            onChange={(e, { checked }) => dispatch({ type: "dropShadow", value: checked })}
            popup="Use drop shadow on modules. Sub-modules use drop shadow with less radius than top-level modules. (Slow)"
          />
        </div>
      </Menu.Item>
      <Menu.Item>
        <Header as="h4">Settings</Header>
        <Menu.Menu>
          <Popup
            on="click"
            basic
            trigger={<Menu.Item icon="paint brush" content="Default color"/>}
            style={{ background: "none", backgroundImage: "none", border: "none", boxShadow: "none" }}
          >
            <SketchPicker
              disableAlpha
              color={defaultHighlightColor}
              onChangeComplete={color => dispatch({ type: "defaultHighlightColor", value: color.hex })}
              presetColors={[
                "#C27F87", "#DDBF8D", "#D0CA92", "#AE927A", "#A7CB81", "#64764F", "#D599E1", "#D4A2FF",
                "#A0BFE4", "#A6CBC1", "#BAD0A1", "#b6b69f", "#414141", "#808080", "#BFBFBF"
              ]}
            />
          </Popup>
        </Menu.Menu>
        <Menu.Menu>
          <Menu.Item
            icon="download"
            onClick={saveSettings}
            content="Save settings"
          />
        </Menu.Menu>
        <Menu.Menu>
          <label className="link item" htmlFor="upload">
            <Icon name="upload"/>Load settings
          </label>
          <input
            style={{ display: "none" }}
            type="file"
            id="upload"
            onChange={parseSettings}
            accept={".json"}
            ref={input => fileInput = input}
          />
        </Menu.Menu>
      </Menu.Item>
      <Menu.Item>
        <Header as="h4">Export</Header>
        <Menu.Menu>
          <Menu.Item
            icon="download"
            onClick={() => saveSvg("alluvialSvg", basename + ".svg")}
            content="Download SVG"
          />
        </Menu.Menu>
        <Menu.Menu>
          <Menu.Item
            icon="image"
            onClick={() => savePng("alluvialSvg", basename + ".png")}
            content="Download PNG"
          />
        </Menu.Menu>
      </Menu.Item>
    </SemanticSidebar>
  );
}
