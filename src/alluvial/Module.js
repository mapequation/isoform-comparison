// @flow
import sortBy from "lodash/sortBy";

import AlluvialNodeBase from "./AlluvialNodeBase";
import { MODULE } from "./Depth";
import HighlightGroup from "./HighlightGroup";
import NetworkRoot from "./NetworkRoot";
import TreePath from "../lib/treepath";

export default class Module extends AlluvialNodeBase {
  children: HighlightGroup[] = [];
  moduleLevel: number = 1;
  path: number[] = [];
  moduleId: string;
  margin: number = 0;
  name: ?string = null;

  constructor(
    networkId: string,
    parent: NetworkRoot,
    moduleId: string,
    moduleLevel: number = 1
  ) {
    super(networkId, parent, `${parent.networkId}_module${moduleId}`);
    this.moduleLevel = moduleLevel;
    this.moduleId = moduleId;
    this.path = TreePath.toArray(moduleId);
  }

  getGroup(highlightIndex: number): ?HighlightGroup {
    return this.children.find(group => group.highlightIndex === highlightIndex);
  }

  getOrCreateGroup(highlightIndex: number): HighlightGroup {
    let group = this.getGroup(highlightIndex);
    if (!group) {
      group = new HighlightGroup(this.networkId, this, highlightIndex);
      this.children.push(group);
    }
    return group;
  }

  sortChildren() {
    this.children = sortBy(this.children, [child => child.highlightIndex]);
  }

  getLargestLeafNodeNames() {
    return [...this.leafNodes()]
      .sort((a, b) => b.flow - a.flow)
      .map(node => node.name)
      .slice(0, 10);
  }

  asObject(): Object {
    const { name, x: x1, y, height } = this;

    const x2 = x1 + this.width;
    const padding = 5;
    const width = 15;
    const textOffset = width + padding;
    const textGap = Math.min(50, height - 30);

    return {
      ...super.asObject(),
      moduleLevel: this.moduleLevel,
      moduleId: this.moduleId,
      moduleName: {
        name: name,
        largestLeafNodes: this.getLargestLeafNodeNames(),
        bracket: [
          {
            x: x1 - padding,
            y,
            width,
            height,
            textGap
          },
          {
            x: x2 + padding,
            y,
            width,
            height,
            textGap
          }
        ],
        textX: [x1 - textOffset, x2 + textOffset],
        textY: y + height / 2
      }
    };
  }

  get depth(): number {
    return MODULE;
  }
}
