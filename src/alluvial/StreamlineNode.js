// @flow
import AlluvialNodeBase from "./AlluvialNodeBase";
import type { Side } from "./Branch";
import Branch from "./Branch";
import { STREAMLINE_NODE } from "./depth-constants";
import StreamlineLink from "./StreamlineLink";
import StreamlineId from "./StreamlineId";

export default class StreamlineNode extends AlluvialNodeBase {
  link: ?StreamlineLink = null;
  side: Side;
  streamlineId: StreamlineId;

  constructor(networkIndex: number, parent: Branch, id: string) {
    super(networkIndex, parent, id);
    this.side = parent.side;
    this.streamlineId = StreamlineId.fromString(id);
  }

  makeDangling() {
    this.streamlineId = this.streamlineId.getDangling();
    this.id = this.streamlineId.toString();
  }

  get targetId() {
    return this.streamlineId.target;
  }

  getOppositeStreamlineNode(): ?StreamlineNode {
    if (this.link) {
      return this.link.left === this ? this.link.right : this.link.left;
    }
    return null;
  }

  get depth(): number {
    return STREAMLINE_NODE;
  }

  get byOppositeStreamlinePosition() {
    const opposite = this.getOppositeStreamlineNode();
    if (!opposite) return -Infinity;
    const module = this.getAncestor(3);
    if (!module) return -Infinity;
    return -module.y;
  }

  linkTo(opposite: StreamlineNode) {
    let reverse = this.parent ? this.parent.isLeft : false;
    StreamlineLink.linkNodes(this, opposite, reverse);
  }
}
