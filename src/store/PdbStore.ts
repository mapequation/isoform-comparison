import { action, computed, makeObservable, observable, runInAction } from "mobx";
import type InputStore from "./InputStore"
import { parseAcceptedFiles, setIdentifiers } from "../components/LoadNetworks/utils";
import { NetworkFile } from "../components/LoadNetworks";
import { parse, parseTree } from "@mapequation/infomap-parser";
import Infomap from "@mapequation/infomap";
import { Arguments } from "@mapequation/infomap/arguments";
import { calcStatistics } from "../components/LoadNetworks/utils"
import IsoformStore from "./IsoformStore";
import { runInfomap } from "../utils/infomap";
import { ErrorItem } from "./InputStore";

const aaMap = new Map([
    ["ALA", "A"], ["ARG", "R"], ["ASN", "N"], ["ASP", "D"], ["CYS", "C"], ["GLN", "Q"], ["GLU", "E"], ["GLY", "G"], ["HIS", "H"],
    ["ILE", "I"], ["LEU", "L"], ["LYS", "K"], ["MET", "M"], ["PHE", "F"], ["PRO", "P"], ["SER", "S"], ["THR", "T"], ["TRP", "W"],
    ["TYR", "Y"], ["VAL", "V"],
    ["ASX", "B"],
    ["GLX", "Z"]
]);

const BLUE = "rgb(128, 160, 240)";
const RED = "rgb(240, 21, 5)";
const MAGENTA = "rgb(192, 72, 192)";
const GREEN = "rgb(21, 192, 21)";
const PINK = "rgb(240, 128, 128)";
const ORANGE = "rgb(240, 144, 72)";
const YELLOW = "rgb(192, 192, 0)";
const CYAN = "rgb(21, 164, 164)";
const WHITE = "rgb(255,255,255)";


// https://www.jalview.org/help/html/colourSchemes/clustal.html
const aaColorsClustal = [
    { category: "Hydrophobic", color: BLUE, residues: ["A", "I", "L", "M", "F", "W", "V", "C"] },
    { category: "Positive charge", color: RED, residues: ["K", "R"] },
    { category: "Negative charge", color: MAGENTA, residues: ["E", "D"] },
    { category: "Polar", color: GREEN, residues: ["N", "Q", "S", "T"] },
    { category: "Cysteines", color: PINK, residues: ["C"] },
    { category: "Glycines", color: ORANGE, residues: ["G"] },
    { category: "Prolines", color: YELLOW, residues: ["P"] },
    { category: "Aromatic", color: CYAN, residues: ["H", "Y"] },
    { category: "Unconserved", color: WHITE, residues: ["*"] },
];

const aaColorMap = new Map(aaColorsClustal.flatMap(item => item.residues.map(r => [r, item.color])))


export const getAAColor = (code: string) => aaColorMap.get(code)!;

type Coord = [number, number, number];

type PdbItem = {
    pos: number;
    aa: string;
    coords: [Coord, ...Coord[]]; // Minimum one coordinate
}

export type IsoformNode = {
    id: string;
    label: string;
    color: string;
    module?: number;
    fx?: number;
    fy?: number;
    fz?: number;
}

export type IsoformLink = {
    source: string;
    target: string;
    id?: string;
    weight: number;
}

export type IsoformNetwork = {
    nodes: IsoformNode[];
    links: IsoformLink[];
}

type FilesByExt = {
    "fasta": File[],
    "pdb": File[],
    "net": File[],
}


export default class PdbStore {
    isoformStore: IsoformStore;

    isLoading = false;

    numDatasets = 0;
    data = new Map<number, PdbItem>(); // pos -> PdbItem

    linkDistanceThreshold = 7;

    network: IsoformNetwork = {
        nodes: [],
        links: [],
    }

    netFile: NetworkFile | null = null;

    infomap = {
        progress: 0,
        isRunning: false,
        error: "",
        finished: false,
    }

    infomapArgs: Arguments = {
        numTrials: 10,
        output: "tree",
    }

    errors: ErrorItem[] = [];

    constructor(isoformStore: IsoformStore) {
        this.isoformStore = isoformStore;
        makeObservable(this, {
            isLoading: observable,
            linkDistanceThreshold: observable,
            numDatasets: observable,
            netFile: observable.ref,
            network: observable.ref,
            infomapArgs: observable,
            infomap: observable,
            haveModules: computed,
        });
    }

    clear = action(() => {
        this.isLoading = false;
        this.numDatasets = 0;
        this.data = new Map<number, PdbItem>();
        this.netFile = null;
        this.errors = [];

        this.clearNetwork();
        this.clearInfomap();
    })

    clearNetwork = action(() => {
        this.network = {
            nodes: [],
            links: []
        }
    })

    clearInfomap = action(() => {
        this.infomap = {
            progress: 0,
            isRunning: false,
            error: "",
            finished: false,
        }
    })

    get name() {
        return this.isoformStore.name;
    }

    get haveModules() {
        return this.netFile?.haveModules;
    }

    addError = action((error: ErrorItem) => {
        this.errors.push(error);
    })

    setArgs = action((args: Arguments) => {
        this.infomapArgs = { ...this.infomapArgs, ...args };
    })

    setLinkDistanceThreshold = action((value: number) => {
        this.linkDistanceThreshold = value;
        this.generateNetwork();
    })

    /**
     * Parse AlphaFold .pdb file.
     * 
     * Sample line:
     * ATOM      5  CA  MET A   1     -28.333  28.626  28.646  1.00 42.15           C  
     *                  aa      pos   x        y       z
     * 
     * ATOM  15405  CA  MET A1000     -62.658  29.837  48.709  1.00 91.15           C  
     * 
     * @param file: File The pdb file.
     */
    parsePdbFile = async (file: File) => {
        const content = await file.text();
        const lines = content.split("\n");
        const re = /^ATOM\s+\d+\s+\w+\s+(?<aa>\w+)\s+\w\s*(?<pos>\d+)\s+(?<x>-?\d+\.\d+)\s+(?<y>-?\d+\.\d+)\s+(?<z>-?\d+\.\d+)\s+/;
        for (let i = 0; i < lines.length; ++i) {
            const line = lines[i];
            if (line.substring(0, 4) !== "ATOM") {
                continue;
            }

            const match = re.exec(line);
            if (match === null || match.groups === undefined) {
                throw Error(`Line ${i + 1} (${line}) of '${file.name}' doesn't match expected pattern.`);
            }
            const aa = aaMap.get(match.groups.aa)!;
            const pos = Number(match.groups.pos)
            const x = Number(match.groups.x);
            const y = Number(match.groups.y);
            const z = Number(match.groups.z);

            // const items = line.split(/\s+/);
            // if (items[0] !== "ATOM" || items[2] !== "CA") continue;

            // const aa = aaMap.get(items[3])!;
            // const pos = Number(items[5])
            // const x = Number(items[6]);
            // const y = Number(items[7]);
            // const z = Number(items[8]);

            if (pos < 0 || pos !== Math.round(pos)) {
                throw Error(`Position ${pos} not valid in line '${line}' of '${file.name}'.`)
            }

            if (this.numDatasets === 0) {
                this.data.set(pos, { aa, pos, coords: [[x, y, z]] })
            }
            else {
                const item = this.data.get(pos);
                if (item === undefined) {
                    throw Error(`Position ${pos} in dataset ${this.numDatasets + 1} does not exist in previous.`)
                }
                if (aa !== item.aa) {
                    throw Error(`Aminiacid '${aa}' in pos ${pos} does not match '${item.aa}' in previous dataset`);
                }
                item.coords.push([x, y, z]);
            }
        }
        console.log("pdb parsed data:", this.data)
        runInAction(() => {
            this.numDatasets = this.numDatasets + 1;
        })
    }

    parsePdbFiles = async (files: File[], runInfomap = true) => {
        console.log(`Parse pdb files: ${files.map(file => file.name)}`)
        await Promise.all(files.map(file => this.parsePdbFile(file)));

        if (runInfomap && this.numDatasets > 0) {
            this.generateNetwork();
            await this.runInfomap();
        }
    }

    generateNetwork = action(() => {
        const nodes: IsoformNode[] = [];
        const { alignmentMap } = this.isoformStore;
        this.data.forEach(item => {
            const [fx, fy, fz] = item.coords[0];
            nodes.push({
                id: `${item.pos}`,
                label: alignmentMap?.get(item.pos) ?? `${item.pos}_${item.aa}`,
                color: aaColorMap.get(item.aa)!,
                fx, fy, fz,
            })
        });

        const calcDistanceSquared = (p1: Coord, p2: Coord) => {
            const d = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
            return d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
        }

        // Pairwise distances
        const threshold = this.linkDistanceThreshold ** 2;
        const items = Array.from(this.data.values());
        const links: IsoformLink[] = [];
        for (let i = 0; i < items.length; ++i) {
            const p1 = items[i];
            for (let j = i + 1; j < items.length; ++j) {
                const p2 = items[j];
                let weight = 0;
                for (let k = 0; k < this.numDatasets; ++k) {
                    const d2 = calcDistanceSquared(p1.coords[0], p2.coords[0]);
                    if (d2 <= threshold) {
                        weight += 1
                    }
                }
                if (weight > 0) {
                    links.push({ source: `${p1.pos}`, target: `${p2.pos}`, weight: weight / this.numDatasets })
                }
            }
        }

        this.network = {
            nodes,
            links,
        };
    })

    setProgress = action((progress: number) => { this.infomap.progress = progress })

    getModuleColor(module?: number) {
        const defaultColor = "#cccccc";
        if (!module) return defaultColor;
        return this.isoformStore.inputStore.rootStore.getHighlightColor(module - 1) ?? defaultColor;
    }

    updateColor = action((by: "node" | "module") => {
        if (by === "node") {
            this.network.nodes.forEach(node => {
                node.color = aaColorMap.get(node.label)!;
            })
        } else {
            this.network.nodes.forEach(node => {
                const color = this.getModuleColor(node.module);
                node.color = color;
            })
        }
        this.updateNetwork();
    })

    updateNetwork = action(() => {
        this.network = { ...this.network };
    })

    serializeNetwork = () => {
        const { nodes, links } = this.network;

        const getId = links.length > 0 && typeof links[0].source !== 'string' ? ((v: { id: string }) => v.id) : (v: string) => v;

        const lines: string[] = [];
        lines.push(`*Vertices ${nodes.length}`);
        nodes.forEach(node => {
            lines.push(`${node.id} "${node.label}"`);
        })
        lines.push(`*Edges ${links.length}`);
        links.forEach(link => {
            //@ts-ignore
            // console.log(`${getId(link.source)} ${getId(link.target)}`, link);
            //@ts-ignore
            lines.push(`${getId(link.source)} ${getId(link.target)} ${link.weight}`);
        })
        // console.log(lines)
        return lines.join('\n');
    }

    runInfomap = action(async () => {
        console.time("PdbStore.runInfomap")
        if (this.infomap.isRunning) {
            return;
        }

        if (this.network.nodes.length === 0) {
            return;
        }

        const network = this.serializeNetwork();

        runInAction(() => {
            this.infomap.finished = false;
            this.infomap.progress = 0;
            this.infomap.isRunning = true;
            this.infomap.error = "";
        })

        const netFile = await runInfomap({
            network,
            filename: `${this.name}.net`,
            args: this.infomapArgs,
            onProgress: this.setProgress,
            onError: (msg) => this.addError({ title: `Infomap error in isoform ${this.name}`, description: msg }),
        })

        const modules = new Map<string, number>();

        console.log(`Infomap result for '${this.name}':`, netFile);

        netFile.nodes.forEach((node) => {
            const path = Array.isArray(node.path) ? node.path : node.path?.split(":") ?? [];
            const topModule = Number(path[0]);
            modules.set(`${node.id}`, topModule);
        })

        this.network.nodes.forEach(node => {
            node.module = modules.get(node.id);
        })

        this.updateColor("module")

        runInAction(() => {
            this.infomap.finished = true;
            this.infomap.progress = 0;
            this.infomap.isRunning = false;
            this.netFile = netFile;
        })
        console.timeEnd("PdbStore.runInfomap")
    })
}