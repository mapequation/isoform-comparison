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
import { mean } from "d3";

const aaMap = new Map([
    ["ALA", "A"], ["ARG", "R"], ["ASN", "N"], ["ASP", "D"], ["CYS", "C"], ["GLN", "Q"], ["GLU", "E"], ["GLY", "G"], ["HIS", "H"],
    ["ILE", "I"], ["LEU", "L"], ["LYS", "K"], ["MET", "M"], ["PHE", "F"], ["PRO", "P"], ["SER", "S"], ["THR", "T"], ["TRP", "W"],
    ["TYR", "Y"], ["VAL", "V"],
    ["ASX", "B"],
    ["GLX", "Z"]
]);
export const aaCharToName = new Map([...aaMap].map(([key, value]) => [value, key]));

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
    confidences: number[];
}

export type IsoformNode = {
    index: number;
    id: string;
    label: string;
    color: string;
    pdbItem: PdbItem;
    module?: number;
    fx?: number;
    fy?: number;
    fz?: number;
    confidence: number;
}

export type IsoformLink = {
    sourceId: string;
    targetId: string;
    weight: number;
    id?: string;
    source?: IsoformNode,
    target?: IsoformNode,
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
            selectedIndex: observable,
            content: observable,
            error: observable,
            haveModules: computed,
            haveNetwork: computed,
        });
    }

    content: string = "";
    setContent = action((content: string) => {
        this.content = content;
    })

    error: string = "";

    selectedIndex = 0;
    setSelectedIndex = action((value: number) => {
        if (value >= 0 && value < this.numDatasets && value !== this.selectedIndex) {
            this.selectedIndex = value;
            this.updateNodePositions();
            // this.generateNetwork();
        }
    })

    clear = action(() => {
        this.isLoading = false;
        this.numDatasets = 0;
        this.selectedIndex = 0;
        this.data = new Map<number, PdbItem>();
        this.netFile = null;
        this.errors = [];
        this.error = "";
        this.content = "";

        this.clearNetwork();
        this.clearInfomap();

        this.isoformStore.sequence = null;
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

    get haveNetwork() {
        return this.network.nodes.length > 0;
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
        await this.loadPdbContent(content);
    };

    loadFiles = async (files: File[]) => {
        this.isLoading = true;
        await Promise.all(files.map(this.parsePdbFile));
        this.isLoading = false;
    }

    loadPdbContent = action(async (content: string) => {
        try {
            await this.parsePdbContent(content);
            this.error = "";
            this.setContent("");
        } catch (e: any) {
            this.error = e.message;
            console.error("Error loading pdb content:", e.message);
            this.addError({
                title: "PDB loading error",
                description: e.message,
            });
        }
    })

    /**
     * PDB file format:
     * 
Contains:	the atomic coordinates for standard residues and the occupancy and temperature factor for each atom

COLUMNS        DATA TYPE       CONTENTS                            
--------------------------------------------------------------------------------
 1 -  6        Record name     "ATOM  "                                            
 7 - 11        Integer         Atom serial number.                   
13 - 16        Atom            Atom name.                            
17             Character       Alternate location indicator.         
18 - 20        Residue name    Residue name.                         
22             Character       Chain identifier.                     
23 - 26        Integer         Residue sequence number.              
27             AChar           Code for insertion of residues.       
31 - 38        Real(8.3)       Orthogonal coordinates for X in Angstroms.                       
39 - 46        Real(8.3)       Orthogonal coordinates for Y in Angstroms.                            
47 - 54        Real(8.3)       Orthogonal coordinates for Z in Angstroms.                            
55 - 60        Real(6.2)       Occupancy.                            
61 - 66        Real(6.2)       Temperature factor (Default = 0.0).                   
73 - 76        LString(4)      Segment identifier, left-justified.   
77 - 78        LString(2)      Element symbol, right-justified.      
79 - 80        LString(2)      Charge on the atom.       

Example: 

         1         2         3         4         5         6         7         8
12345678901234567890123456789012345678901234567890123456789012345678901234567890
ATOM    145  N   VAL A  25      32.433  16.336  57.540  1.00 11.92      A1   N
ATOM    146  CA  VAL A  25      31.132  16.439  58.160  1.00 11.85      A1   C
ATOM    147  C   VAL A  25      30.447  15.105  58.363  1.00 12.34      A1   C
ATOM    148  O   VAL A  25      29.520  15.059  59.174  1.00 15.65      A1   O
ATOM    149  CB AVAL A  25      30.385  17.437  57.230  0.28 13.88      A1   C
ATOM    150  CB BVAL A  25      30.166  17.399  57.373  0.72 15.41      A1   C
     * 
     * 
     * @param content .pdb file content
     * @param filename optional filename for error messages
     */
    parsePdbContent = async (content: string, filename?: string) => {
        if (filename === undefined) {
            filename = "loaded content"
        }
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; ++i) {
            const line = lines[i];
            if (line.substring(0, 4) !== "ATOM") {
                continue;
            }
            if (line.length < 66) {
                throw Error(`Line ${i + 1} (${line}) of ${filename} doesn't match the format for ATOM records.`);
            }

            const atom = line.substring(12, 16).trim();
            if (atom !== "CA") {
                continue;
            }
            const residue = line.substring(17, 20).trim();
            const aa = aaMap.get(residue)!;
            const pos = Number(line.substring(22, 26).trim());
            const x = Number(line.substring(30, 38).trim());
            const y = Number(line.substring(38, 46).trim());
            const z = Number(line.substring(46, 54).trim());
            const confidence = Number(line.substring(60, 66).trim());

            if (pos < 0 || pos !== Math.round(pos)) {
                throw Error(`Position ${pos} not valid in line '${line}' of ${filename}.`)
            }

            if (this.numDatasets === 0) {
                this.data.set(pos, { aa, pos, coords: [[x, y, z]], confidences: [confidence] })
            }
            else {
                const item = this.data.get(pos);
                if (item === undefined) {
                    throw Error(`Position ${pos} in dataset ${this.numDatasets + 1} does not exist in previous.`)
                }
                if (aa !== item.aa) {
                    throw Error(`Aminoacid '${aa}' in pos ${pos} in dataset ${this.numDatasets + 1} does not match '${item.aa}' in previous dataset`);
                }
                item.coords.push([x, y, z]);
                item.confidences.push(confidence);
            }
        }
        // console.log("pdb parsed data:", this.data)
        runInAction(() => {
            this.numDatasets = this.numDatasets + 1;
            if (this.numDatasets === 1) {
                const seq = {
                    taxon: this.isoformStore.name,
                    code: Array.from(this.data, ([_, item]) => item.aa).join(""),
                }
                this.isoformStore.setSequence(seq);
            }
            this.generateNetwork();
        })
    }

    parsePdbFiles = async (files: File[], runInfomap = false) => {
        console.log(`Parse pdb files: ${files.map(file => file.name)}`)
        await Promise.all(files.map(file => this.parsePdbFile(file)));

        if (runInfomap && this.numDatasets > 0) {
            this.generateNetwork();
            await this.runInfomap();
        }
    }

    getNodeLabel(item: PdbItem) {
        return this.isoformStore.alignmentMap?.get(item.pos) ?? `${item.pos}_${item.aa}`;
    }

    updateNodes() {
        console.log("Update nodes...");
        this.network.nodes = this.network.nodes.map((node, i) => {
            const item = this.data.get(i + 1)!;
            const [fx, fy, fz] = item.coords[this.selectedIndex];
            return {
                ...node,
                label: this.getNodeLabel(item),
                fx, fy, fz,
            };
        });
        return this.network.nodes;
    }

    getNodes() {
        const nodes: IsoformNode[] = this.network.nodes;
        if (nodes.length > 0) {
            return this.updateNodes();
        }

        this.data.forEach((item, index) => {
            const [fx, fy, fz] = item.coords[this.selectedIndex];
            const confidence = mean(item.confidences)!;
            nodes.push({
                index,
                id: `${item.pos}`,
                label: this.getNodeLabel(item),
                color: aaColorMap.get(item.aa)!,
                pdbItem: item,
                fx, fy, fz,
                confidence,
            })
        });
        return nodes;
    }

    updateLinks() {
        const { nodes, links } = this.network;
        this.network.links = links.map(link => {
            return {
                ...link,
                source: nodes[link.source!.index],
                target: nodes[link.target!.index],
            }
        });
        return this.network.links;
    }

    updateNodePositions = action(() => {
        this.network = {
            nodes: this.getNodes(),
            links: this.updateLinks(),
        }
    })

    generateNetwork = action(() => {
        console.log(`[PdbStore]: generateNetwork with threshold ${this.linkDistanceThreshold}...`)
        const nodes = this.getNodes();

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
                    const d2 = calcDistanceSquared(p1.coords[k], p2.coords[k]);
                    if (d2 <= threshold) {
                        weight += 1
                    }
                }
                if (weight > 0) {
                    links.push({ sourceId: `${p1.pos}`, targetId: `${p2.pos}`, weight: weight / this.numDatasets })
                }
            }
        }
        // console.log(`!!! Generated network with ${nodes.length} nodes and ${links.length} links!`)

        this.network = {
            nodes,
            links,
        };
    })

    setProgress = action((progress: number) => { this.infomap.progress = progress })

    isInsignificantValue(confidence: number) {
        return confidence < 70;
    }

    isInsignificant(node: IsoformNode) {
        return this.isInsignificantValue(node.confidence);
    }

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
        console.log("Serialize network...");
        const { nodes, links } = this.network;

        // const getId = links.length > 0 && typeof links[0].source !== 'string' ? ((v: { id: string }) => v.id) : (v: string) => v;

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
            lines.push(`${link.sourceId} ${link.targetId} ${link.weight}`);
        })
        // console.log(lines)
        return lines.join('\n');
    }

    runInfomap = action(async () => {
        console.time("[PdbStore]: runInfomap")
        console.log("[PdbStore]: runInfomap")
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

        const confidenceMap = new Map<string, number>();
        this.network.nodes.forEach(node => {
            confidenceMap.set(node.id, node.confidence);
        })

        console.log(`Infomap result for '${this.name}':`, netFile);

        netFile.nodes.forEach((node) => {
            const path = Array.isArray(node.path) ? node.path : node.path?.split(":") ?? [];
            const topModule = Number(path[0]);
            modules.set(`${node.id}`, topModule);
            if (this.isInsignificantValue(confidenceMap.get(`${node.id}`)!)) {
                node.path = path.join(";") + ";";
            }
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
        console.timeEnd("[PdbStore]: runInfomap")
    })
}