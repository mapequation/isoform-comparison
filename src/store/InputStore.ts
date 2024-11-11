import { action, computed, makeObservable, observable } from "mobx";
import type { Store as RootStore } from "./Store"
import { parseAcceptedFiles, setIdentifiers } from "../components/LoadNetworks/utils";
import { NetworkFile } from "../components/LoadNetworks";
import { parse, parseTree } from "@mapequation/infomap-parser";
import Infomap from "@mapequation/infomap";
import IsoformStore from "./IsoformStore";
import { isFasta, parseFasta } from "../utils/sequence-parser";
import BioMSA from "biomsa";
import { tsv } from "d3";

type AcceptedFormats = "fasta" | "pdb" | "net";


export type ErrorItem = { title: string, description: string }

export const getExtension = (file: File) => {
    return file.name.split(".").pop()!;
}


const exampleItem = {
    id: 0,
    Aliases: "ATKEA1,KEA1",
    Description: "Encodes a member of the cation/proton antiporters-2 antiporter superfamily, the K efflux antiporter KEA1 that is localized to the chloroplast envelope.",
    GeneID: "AT1G01790",
    Isoform1: "AT1G01790_P1",
    Isoform2: "AT1G01790_c3",
    Mechanism: "A3",
    Time1: "WT_3h",
    Time2: "WT_0h",
} as const;

type ExampleItemKeys = keyof typeof exampleItem;
type ExampleItemKeysNoID = Omit<ExampleItemKeys, "id">;
// type ExampleItemType = typeof exampleItem[ExampleItemKeys];
// type ExampleItem = {
//     // id: number;
//     [key in ExampleItemKeys]: string;
// };
type ExampleItem = {
    id: number,
    aliases: string
    description: string
    geneID: string
    isoform1: string
    isoform2: string
    mechanism: string
    time1: string
    time2: string
};

export default class InputStore {
    rootStore: RootStore;
    acceptedFormats = ["fasta", "pdb", "net"];

    inputFiles: { format: AcceptedFormats, file: File }[] = [];

    isoformStore1: IsoformStore;
    isoformStore2: IsoformStore;

    // networks: NetworkFile[] = [];
    linkDistanceThreshold = 7;

    isLoadingFiles = false;
    errors: ErrorItem[] = [];

    exampleData: ExampleItem[] = [];

    filterText: string = "";

    haveAlluvial = false;

    infomap = {
        progress: 0,
        isRunning: false,
        error: "",
    }
    // infomapProgress: number = 0;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeObservable(this, {
            haveAlluvial: observable,
            exampleData: observable.ref,
            inputFiles: observable.ref,
            linkDistanceThreshold: observable,
            isLoadingFiles: observable,
            filterText: observable,
            filteredExampleData: computed,
            canGenerateAlluvial: computed,
            networks: computed,
            alignment: computed,
            canGenerateAlignment: computed,
            haveAlignment: computed,
            infomap: observable,
        })
        this.isoformStore1 = new IsoformStore(this, 1);
        this.isoformStore2 = new IsoformStore(this, 2);

        this.rootStore.setSortModulesBy("nodeId");

        this.loadExampleTable();
    }

    get isoforms() {
        return [this.isoformStore1, this.isoformStore2];
    }

    get alignment() {
        return this.isoforms.map(isoform => ({ name: isoform.name, sequence: isoform.alignedSequence }));
    }

    get canGenerateAlignment() {
        return this.isoforms.map(isoform => isoform.sequence?.code && !isoform.alignedSequence).filter(v => v).length === 2;
    }

    get networks() {
        // return this.isoforms.map(isoform => isoform.netFile);
        return this.isoforms.map(isoform => isoform.pdb.netFile);
    }

    get filteredExampleData() {
        const re = new RegExp(this.filterText, "i");
        return this.exampleData.filter((row => {
            return re.test(row.description) || re.test(row.geneID) || re.test(row.isoform1) || re.test(row.isoform2);
        }));
    }

    get canGenerateAlluvial() {
        return this.isoformStore1.haveModules && this.isoformStore2.haveModules;
    }

    getFiles(extension: AcceptedFormats) {
        return this.inputFiles.filter(item => item.format === extension).map(item => item.file);
    }

    setLinkDistanceThreshold = action((value: number) => {
        this.linkDistanceThreshold = value;
        this.isoforms.forEach(isoform => isoform.pdb.setLinkDistanceThreshold(value));
    })

    setFilterText = action((value: string) => {
        this.filterText = value;
    })

    loadFiles = action(async (files: File[]) => {
        console.time("InputStore.loadFiles")
        this.isLoadingFiles = true;

        files.forEach(file => {
            const ext = getExtension(file);
            if (!this.acceptedFormats.includes(ext)) {
                this.errors.push({ title: `Unrecognised extension: '${ext}'`, description: `File '${file.name}' ignored.` })
                return;
            }
            this.inputFiles.push({ format: ext as AcceptedFormats, file });
        })

        this.inputFiles = [...this.inputFiles];

        await this.parseFiles();

        this.isLoadingFiles = false;
        console.timeEnd("InputStore.loadFiles")
    })

    parseFiles = action(async () => {
        const netFiles = this.getFiles("net");
        if (netFiles.length > 0) {
            if (netFiles.length !== 2) {
                this.errors.push({ title: "Wrong number of network files", description: `Got ${netFiles.length}, should be 2.` });
            } else {
                const [networks, errors] = await parseAcceptedFiles(
                    netFiles,
                    this.acceptedFormats,
                    "name"
                );
                errors.forEach(error => {
                    this.errors.push({ title: `Error loading '${error.file}`, description: error.errors.map(e => e.message).join('\n') })
                })

                await Promise.all([
                    this.isoformStore1.setNetworkFile(networks[0]),
                    this.isoformStore2.setNetworkFile(networks[1]),
                ])
                this.generateAlluvialDiagram();
                console.log("First node:", networks[0].nodes[0])
            }
        }
    })

    loadExampleTable = action(async () => {
        console.log(`Load exmaple table...`);
        // load a tsv file with d3
        const data = await tsv(encodeURI(`/isoformmapper/data/example_data.tsv`), (row: any, index: number) => {
            return {
                id: index,
                aliases: row.Aliases,
                description: row.Description,
                geneID: row.GeneID,
                isoform1: row.Isoform1,
                isoform2: row.Isoform2,
                mechanism: row.Mechanism,
                time1: row.Time1,
                time2: row.Time2,
            }
        }) as ExampleItem[];
        console.log("Got data:", data);
        this.exampleData = data;
    })

    loadExample = action(async (item: ExampleItem) => {

        console.log("Load example:", item);

        await Promise.all([
            this.isoformStore1.loadExample(item.isoform1),
            this.isoformStore2.loadExample(item.isoform2),
        ])
        console.log("Generate alignment...");
        this.generateAlignment();

        console.log("Run Infomap...");
        await this.runInfomap();

        console.log("Generate alluvial diagram...");
        this.generateAlluvialDiagram();
    })

    loadSequences = action(async (file: File) => {
        console.log(`Load alignment from file '${file.name}'...`);

        const content = await file.text();
        const lines = content.split("\n");
        if (!isFasta(lines)) {
            throw new Error(`Could not parse '${file.name}' as a fasta file.`);
        }
        const sequences = parseFasta(lines);
        console.log("Parsed sequences:", sequences);

        const isoformsByName = new Map(this.isoforms.map(isoform => [isoform.name, isoform]));
        for (let seq of sequences) {
            const isoform = isoformsByName.get(seq.taxon);
            if (isoform === undefined) {
                this.errors.push({ title: `Sequence id '${seq.taxon}' not recognized among loaded isoforms.`, description: `Sequence id should match one of '${Array.from(isoformsByName.keys()).join(', ')}'.` })
            } else {
                isoform.setSequence(seq);
            }
        }

        await this.generateAlignment();
    })

    generateAlignment = action(async () => {
        console.log("Calculate alignment...")
        //TODO: Check and handle missing sequence
        const sequences = this.isoforms.map(iso => iso.sequence!.code)
        const alignment = await BioMSA.align(sequences);
        for (let i = 0; i < this.isoforms.length; ++i) {
            this.isoforms[i].setAlignedSequence(alignment[i])
        }

        this.generateAlignedNetworks();
    })

    generateAlignedNetworks = action(() => {
        console.log("Generate aligned networks...");
        const { alignment } = this;
        const N = alignment[0].sequence.length;
        if (N === 0) {
            return;
        }
        const sequences = alignment.map(item => item.sequence);
        const [s1, s2] = sequences;
        const s1Map: Map<number, string> = new Map();
        const s2Map: Map<number, string> = new Map();
        let pos1 = 1;
        let pos2 = 1;
        for (let i = 0; i < N; ++i) {
            const site = i + 1;
            const c1 = s1.charAt(i);
            const c2 = s2.charAt(i);
            if (c1 === c2) {
                s1Map.set(pos1, `${site}_${c1}_C`);
                s2Map.set(pos2, `${site}_${c1}_C`);
                ++pos1;
                ++pos2;
            }
            else {
                s1Map.set(pos1, `${site}_${c1}_S`);
                s2Map.set(pos2, `${site}_${c2}_S`);

                if (c1 !== '-') {
                    ++pos1;
                }
                if (c2 !== '-') {
                    ++pos2;
                }
            }
        }
        this.isoformStore1.setAlignmentMap(s1Map);
        this.isoformStore2.setAlignmentMap(s2Map);
    })

    get haveAlignment() {
        return this.isoforms.every(isoform => isoform.haveAlignment);
    }

    generateAlluvialDiagram = action(async () => {
        if (!this.canGenerateAlluvial) {
            return;
        }
        this.rootStore.setNetworks(this.networks);
        this.haveAlluvial = true;
    })

    runInfomap = action(async () => {
        await Promise.all([
            this.isoformStore1.pdb.runInfomap(),
            this.isoformStore2.pdb.runInfomap(),
        ])
    })

    clear = action(() => {
        this.haveAlluvial = false;
        this.isoforms.forEach(isoform => {
            isoform.clear();
        })
    })
}