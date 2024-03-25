import { action, computed, makeObservable, observable, runInAction } from "mobx";
import type InputStore from "./InputStore"
import { parseAcceptedFiles, setIdentifiers } from "../components/LoadNetworks/utils";
import { NetworkFile } from "../components/LoadNetworks";
import { parse, parseTree } from "@mapequation/infomap-parser";
import Infomap from "@mapequation/infomap";
import { Arguments } from "@mapequation/infomap/arguments";
import { calcStatistics } from "../components/LoadNetworks/utils"
import PdbStore from "./PdbStore";
import { ErrorItem } from "./InputStore";
import { runInfomap } from "../utils/infomap";

const aaMap = new Map([
    ["ALA", "A"], ["ARG", "R"], ["ASN", "N"], ["ASP", "D"], ["CYS", "C"], ["GLN", "Q"], ["GLU", "E"], ["GLY", "G"], ["HIS", "H"],
    ["ILE", "I"], ["LEU", "L"], ["LYS", "K"], ["MET", "M"], ["PHE", "F"], ["PRO", "P"], ["SER", "S"], ["THR", "T"], ["TRP", "W"],
    ["TYR", "Y"], ["VAL", "V"],
    ["ASX", "B"],
    ["GLX", "Z"]
]);

type AcceptedFormats = "fasta" | "pdb" | "net";

export const getExtension = (file: File) => {
    return file.name.split(".").pop()!;
}

type ExampleIsoformItem = {
    id: string;
    net: string;
    pdb: string[];
}
type ExampleItem = {
    id: string;
    isoform1: ExampleIsoformItem;
    isoform2: ExampleIsoformItem;
    alignment: string;
}

type Coord = [number, number, number];

type PdbItem = {
    pos: number;
    aa: string;
    coords: [Coord, ...Coord[]]; // Minimum one coordinate
}

export type IsoformNode = {
    id: string;
    label: string;
    path: string;
}

export type IsoformLink = {
    source: string;
    target: string;
    id: string;
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

export default class IsoformStore {
    inputStore: InputStore;
    pdb: PdbStore;
    isoID: number;
    _name: string;

    isLoading = false;
    netFile: NetworkFile | null = null;

    filesByExt: FilesByExt = {
        "fasta": [],
        "pdb": [],
        "net": [],
    };

    network: IsoformNetwork = {
        nodes: [],
        links: [],
    }

    errors: { title: string, description: string }[] = [];

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

    constructor(inputStore: InputStore, isoformID: number) {
        this.inputStore = inputStore;
        this.pdb = new PdbStore(this);
        this.isoID = isoformID;
        this._name = `${isoformID}`;
        makeObservable(this, {
            isLoading: observable,
            netFile: observable.ref,
            infomap: observable,
            infomapArgs: observable,
            haveModules: computed,
            network: observable.ref,
        })
    }

    clear = action(() => {
        this.isLoading = false;
        this.netFile = null;
        this.errors = [];

        this.filesByExt = {
            "fasta": [],
            "pdb": [],
            "net": [],
        };

        this.clearNetwork();
        this.clearInfomap();
        this.pdb.clear();
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
        return this._name;
    }

    get haveModules() {
        return this.infomap.finished;
    }

    get networkNodes() {
        if (this.netFile === null) {
            return [];
        }
        return this.netFile.nodes;
    }

    get networkLinks() {
        if (this.netFile === null) {
            return [];
        }

    }

    getFiles(extension: AcceptedFormats) {
        return this.filesByExt[extension];
    }

    addError = action((error: ErrorItem) => {
        this.errors.push(error);
    })


    loadFiles = action(async (files: File[]) => {
        console.time("IsoformStore.loadFiles")
        this.clear();
        this.isLoading = true;


        files.forEach(file => {
            const ext = getExtension(file);
            if (!Object.keys(this.filesByExt).includes(ext)) {
                this.errors.push({ title: `Unrecognised extension: '${ext}'`, description: `File '${file.name}' ignored.` })
                return;
            }
            this.filesByExt[ext as AcceptedFormats].push(file);
        })

        await this.parseFiles();

        this.isLoading = false;
        console.timeEnd("IsoformStore.loadFiles")
    })

    parseFiles = action(async () => {

        const netFiles = this.getFiles("net");
        if (netFiles.length > 0) {
            if (netFiles.length !== 1) {
                this.errors.push({ title: `Isoform ${this.isoID} got too many network files`, description: `Got ${netFiles.length}, should be 1.` });
            } else {
                const [networks, errors] = await parseAcceptedFiles(
                    netFiles,
                    ["net"],
                    "name"
                );
                errors.forEach(error => {
                    this.errors.push({ title: `Error loading '${error.file}`, description: error.errors.map(e => e.message).join('\n') })
                })

                this.setNetworkFile(networks[0]);
            }
        }

        const pdbFiles = this.getFiles("pdb");
        if (pdbFiles.length > 0) {
            await this.pdb.parsePdbFile(pdbFiles[0]);
        }
    })

    setNetworkFile = action(async (file: NetworkFile) => {
        this.netFile = file;

        await this.runInfomap();

        await this.generateNetwork();
    })

    setArgs = action((args: Arguments) => {
        this.infomapArgs = { ...this.infomapArgs, ...args };
    })

    setProgress = action((progress: number) => { this.infomap.progress = progress })

    generateNetwork = action(async () => {
        if (this.netFile === null) {
            return;
        }

        const nodes = this.netFile.nodes.map(({ id, name, path }) => ({ id: `${id}`, label: name!, path: typeof path === 'string' ? path : path.join(':') }));

        const edgeHeading = "*Edges"
        const lines = this.netFile.network?.split('\n');
        let isEdge = false;
        const links = [];
        for (const line of lines ?? []) {
            if (line[0] === '#' || line.length === 0) continue;
            if (line[0] === '*') {
                if (line.substring(0, edgeHeading.length) === edgeHeading) {
                    isEdge = true;
                    continue;
                }
            };
            if (isEdge) {
                let e = line.split(" ");//.map(value => Number(value));
                links.push({ source: e[0], target: e[1], id: `${links.length}` })
            }
        }

        this.network = {
            nodes,
            links
        };
    })

    runInfomap = action(async () => {

        if (this.netFile === null || this.infomap.isRunning) {
            return;
        }

        runInAction(() => {
            this.infomap.finished = false;
            this.infomap.progress = 0;
            this.infomap.isRunning = true;
            this.infomap.error = "";
        })

        const netFile = await runInfomap({
            network: this.netFile.network!,
            filename: this.netFile.name,
            args: this.infomapArgs,
            onProgress: this.setProgress,
            onError: (msg) => this.addError({ title: `Infomap error in isoform ${this.name}`, description: msg }),
        })

        runInAction(() => {
            this.infomap.finished = true;
            this.infomap.progress = 0;
            this.infomap.isRunning = false;
            this.netFile = netFile;
        })
    })

}