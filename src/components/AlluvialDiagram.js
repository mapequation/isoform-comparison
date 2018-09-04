import React from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";

import Modules from "../models/Modules";
import StreamLines from "../models/StreamLines";
import { pairwise, pairwiseEach } from "../helpers/pairwise";
import TreePath from "../lib/treepath";


export default class AlluvialDiagram extends React.Component {
    svg = d3.select(null);

    static defaultProps = {
        width: window.innerWidth,
        height: window.innerHeight,
        padding: 3,
        numModules: 15,
        streamlineFraction: 1,
        streamlineThreshold: 0.005,
        parentModule: "root",
    };

    static propTypes = {
        width: PropTypes.number,
        height: PropTypes.number,
        padding: PropTypes.number,
        numModules: PropTypes.number,
        streamlineFraction: PropTypes.number,
        streamlineThreshold: PropTypes.number,
        networks: PropTypes.arrayOf(PropTypes.object),
        parentModule: PropTypes.string,
    };

    componentDidMount() {
        this.svg = d3.select(this.node);
        this.draw();
    }

    componentDidUpdate(prevProps) {
        this.draw(prevProps);
    }

    draw(prevProps = this.props) {
        const { width, height, padding, streamlineFraction, numModules, streamlineThreshold, networks } = this.props;
        const { networkRemoved, networkAdded, widthChanged, heightChanged, streamlineFractionChanged } = this.propsChanged(this.props, prevProps);

        const parent = new TreePath(this.props.parentModule);

        const largestModules = networks.map(network =>
            network.data.modules
                .filter(m => !TreePath.equal(m.path, TreePath.root()))
                .filter(m => m.path.parentPath().equal(parent))
                .filter(m => m.flow > 0)
                .sort((a, b) => b.flow - a.flow)
                .slice(0, numModules));

        const barWidth = AlluvialDiagram.barWidth(networks.length, width, streamlineFraction);
        const streamlineWidth = streamlineFraction * barWidth;
        const maxTotalFlow = AlluvialDiagram.maxTotalFlow(largestModules);
        const style = { barWidth, height, padding, streamlineWidth };

        const modules = largestModules.map(m => new Modules(m, maxTotalFlow, style));

        pairwiseEach(modules, (left, right) => right.moveToRightOf(left));

        const streamlines = pairwise(modules, (leftModules, rightModules, i, j) => {
            const moduleFlows = StreamLines.moduleFlows(networks[i].data.nodes, networks[j].data.nodes, parent);
            return new StreamLines(leftModules, rightModules, moduleFlows, streamlineThreshold, streamlineWidth);
        });

        const t = d3.transition().duration(200);
        const delay = 150;

        const svgShouldTransition = widthChanged || heightChanged;
        const svgMaybeTransition = svgShouldTransition ? this.svg.transition(t) : this.svg;

        svgMaybeTransition
            .attr("width", width)
            .attr("height", height);

        /**
         * Modules
         */
        const moduleWidthX = selection => selection.attr("width", d => d.width).attr("x", d => d.x);
        const moduleHeightY = selection => selection.attr("height", d => d.height).attr("y", d => d.y);
        const moduleUpdateTransition = selection => selection.call(moduleWidthX).call(moduleHeightY);
        const moduleExitTransition = selection => selection.attr("height", 0).attr("y", 0);

        let modulesGroups = this.svg.selectAll(".modules")
            .data(modules);

        modulesGroups.exit()
            .selectAll(".module")
            .transition(t)
            .call(moduleExitTransition);

        modulesGroups.exit()
            .transition(t)
            .remove();

        modulesGroups = modulesGroups.enter().append("g")
            .merge(modulesGroups)
            .attr("class", "modules");

        const modulesUpdate = modulesGroups.selectAll(".module")
            .data(modules => modules.data, function key(d) {
                return d ? d.path : this.id;
            });

        const modulesEnter = modulesUpdate.enter().append("rect");

        modulesUpdate.exit()
            .transition(t)
            .call(moduleExitTransition)
            .remove();

        const modulesEnterUpdate = modulesEnter.merge(modulesUpdate)
            .attr("fill", "#ccccbb")
            .attr("class", "module");

        if (streamlineFractionChanged || widthChanged) {
            modulesEnterUpdate
                .transition(t)
                .call(moduleUpdateTransition);
        } else if (networkRemoved) {
            modulesUpdate
                .transition(t).delay(delay) // Wait for removed modules
                .call(moduleUpdateTransition);
        } else if (networkAdded) {
            modulesUpdate
                .transition(t)
                .call(moduleUpdateTransition);
            modulesEnter
                .call(moduleWidthX)
                .transition(t).delay(delay) // Wait for existing modules
                .call(moduleHeightY);
        } else {
            modulesEnterUpdate
                .call(moduleWidthX)
                .transition(t)
                .call(moduleHeightY);
        }

        /**
         * Streamlines
         */
        const streamlineOpacityPath = selection => selection.attr("opacity", 0.8).attr("d", s => s.path);

        let streamlinesGroups = this.svg.selectAll(".streamlines")
            .data(streamlines);

        streamlinesGroups.exit()
            .selectAll(".streamline")
            .transition(t)
            .attr("d", d => d.exitPath);

        streamlinesGroups.exit()
            .transition(t)
            .remove();

        streamlinesGroups = streamlinesGroups.enter().append("g")
            .merge(streamlinesGroups)
            .attr("class", "streamlines");

        const streamlinesUpdate = streamlinesGroups.selectAll(".streamline")
            .data(s => s.data, function key(d) {
                return d ? TreePath.join(d.sourcePath, d.targetPath) : this.id;
            });

        const streamlinesEnter = streamlinesUpdate.enter().append("path");

        streamlinesUpdate.exit()
            .transition(t)
            .attr("d", d => d.exitPath)
            .remove();

        streamlinesEnter.merge(streamlinesUpdate)
            .attr("class", "streamline")
            .attr("fill", "#ccccbb")
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5);

        const streamlineDelay = delay => (d, index, elements) => {
            const timeBudget = 100;
            const timePerElement = timeBudget / elements.length;
            return delay + timePerElement * index;
        };

        if (networkRemoved) {
            streamlinesUpdate
                .transition(t).delay(delay) // Wait for removed modules
                .call(streamlineOpacityPath);
        } else {
            streamlinesUpdate
                .transition(t)
                .call(streamlineOpacityPath);
            streamlinesEnter
                .attr("d", s => s.enterPath)
                .attr("opacity", 0)
                .transition(t).delay(streamlineDelay(delay))
                .call(streamlineOpacityPath);
        }
    }

    propsChanged(props, prevProps) {
        return {
            networkRemoved: props.networks.length < prevProps.networks.length,
            networkAdded: props.networks.length > prevProps.networks.length,
            widthChanged: props.width !== prevProps.width,
            heightChanged: props.height !== prevProps.height,
            streamlineFractionChanged: props.streamlineFraction !== prevProps.streamlineFraction,
        };
    }

    static maxTotalFlow(modules) {
        return modules
            .map(module => module
                .map(module => module.flow)
                .reduce((tot, curr) => tot + curr, 0))
            .reduce((max, curr) => Math.max(max, curr), -Infinity);
    }

    static barWidth(numModules, totalWidth, streamlineFraction) {
        const numStreamlines = numModules - 1;
        return totalWidth / (numModules + numStreamlines * streamlineFraction);
    }

    render() {
        return <svg ref={node => this.node = node}/>;
    }
}
