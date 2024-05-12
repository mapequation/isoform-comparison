import { action, computed, makeObservable, observable } from "mobx";
import type { Store as RootStore } from "./Store"
import { parseAcceptedFiles, setIdentifiers } from "../components/LoadNetworks/utils";
import { NetworkFile } from "../components/LoadNetworks";
import { parse, parseTree } from "@mapequation/infomap-parser";
import Infomap from "@mapequation/infomap";
import IsoformStore from "./IsoformStore";
import { isFasta, parseFasta } from "../utils/sequence-parser";
import BioMSA from "biomsa";

type AcceptedFormats = "fasta" | "pdb" | "net";


export type ErrorItem = { title: string, description: string }

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
    sequences: string;
}

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

    exampleData: ExampleItem[] = [
        {
            id: 'AT1G14150',
            isoform1: {
                id: 'AT1G14150_c1',
                net: 'AT1G14150_c1_network_with_all_nodes.net',
                pdb: [
                    'AT1G14150_c1_aa/relaxed_model_1_pred_0.pdb',
                    'AT1G14150_c1_aa/relaxed_model_2_pred_0.pdb',
                    'AT1G14150_c1_aa/relaxed_model_3_pred_0.pdb',
                    'AT1G14150_c1_aa/relaxed_model_4_pred_0.pdb',
                    'AT1G14150_c1_aa/relaxed_model_5_pred_0.pdb',
                ]
            },
            isoform2: {
                id: 'AT1G14150.1',
                net: 'AT1G14150.1_network_with_all_nodes.net',
                pdb: [
                    'AT1G14150.1_aa/relaxed_model_1_pred_0.pdb',
                    'AT1G14150.1_aa/relaxed_model_2_pred_0.pdb',
                    'AT1G14150.1_aa/relaxed_model_3_pred_0.pdb',
                    'AT1G14150.1_aa/relaxed_model_4_pred_0.pdb',
                    'AT1G14150.1_aa/relaxed_model_5_pred_0.pdb',
                ]
            },
            sequences: 'AT1G14150.1_vs_AT1G14150_c1.fasta'
        },
        {
            id: 'AT2G47450',
            isoform1: {
                id: 'AT2G47450_P1',
                net: 'AT2G47450_P1_network_with_all_nodes.net',
                pdb: [
                    'AT2G47450_P1/relaxed_model_1_pred_0.pdb',
                    'AT2G47450_P1/relaxed_model_2_pred_0.pdb',
                    'AT2G47450_P1/relaxed_model_3_pred_0.pdb',
                    'AT2G47450_P1/relaxed_model_4_pred_0.pdb',
                    'AT2G47450_P1/relaxed_model_5_pred_0.pdb',
                ]
            },
            isoform2: {
                id: 'AT2G47450_s1',
                net: 'AT1G14150_s1_network_with_all_nodes.net',
                pdb: [
                    'AT2G47450_s1/relaxed_model_1_pred_0.pdb',
                    'AT2G47450_s1/relaxed_model_2_pred_0.pdb',
                    'AT2G47450_s1/relaxed_model_3_pred_0.pdb',
                    'AT2G47450_s1/relaxed_model_4_pred_0.pdb',
                    'AT2G47450_s1/relaxed_model_5_pred_0.pdb',
                ]
            },
            sequences: 'AT2G47450_P1_vs_AT2G47450_s1.fasta'
        },
        {
            id: 'AT5G24120',
            isoform1: {
                id: 'AT5G24120_P1',
                net: 'AT5G24120_P1_network_with_all_nodes.net',
                pdb: [
                    'AT5G24120_P1_aa/relaxed_model_1_pred_0.pdb',
                    'AT5G24120_P1_aa/relaxed_model_2_pred_0.pdb',
                    'AT5G24120_P1_aa/relaxed_model_3_pred_0.pdb',
                    'AT5G24120_P1_aa/relaxed_model_4_pred_0.pdb',
                    'AT5G24120_P1_aa/relaxed_model_5_pred_0.pdb',
                ]
            },
            isoform2: {
                id: 'AT5G24120_c2',
                net: 'AT5G24120_c2_network_with_all_nodes.net',
                pdb: [
                    'AT5G24120_c2_aa/relaxed_model_1_pred_0.pdb',
                    'AT5G24120_c2_aa/relaxed_model_2_pred_0.pdb',
                    'AT5G24120_c2_aa/relaxed_model_3_pred_0.pdb',
                    'AT5G24120_c2_aa/relaxed_model_4_pred_0.pdb',
                    'AT5G24120_c2_aa/relaxed_model_5_pred_0.pdb',
                ]
            },
            sequences: 'AT5G24120_P1_vs_AT5G24120_c2.fasta'
        },
    ];

    infomap = {
        progress: 0,
        isRunning: false,
        error: "",
    }
    // infomapProgress: number = 0;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeObservable(this, {
            inputFiles: observable.ref,
            linkDistanceThreshold: observable,
            isLoadingFiles: observable,
            canGenerateAlluvial: computed,
            networks: computed,
            alignment: computed,
            infomap: observable,
        })
        this.isoformStore1 = new IsoformStore(this, 1);
        this.isoformStore2 = new IsoformStore(this, 2);

        this.rootStore.setSortModulesBy("nodeId");
    }

    get isoforms() {
        return [this.isoformStore1, this.isoformStore2];
    }

    get alignment() {
        return this.isoforms.map(isoform => ({ name: isoform.name, sequence: isoform.alignedSequence }));
    }

    get networks() {
        // return this.isoforms.map(isoform => isoform.netFile);
        return this.isoforms.map(isoform => isoform.pdb.netFile);
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

    loadExample = action(async (item: ExampleItem) => {

        const toFile = async (url: string) => {
            const resp = await fetch(encodeURI(`/isoform/data/${url}`));
            const text = await resp.text();
            const file = new File([text], url, { type: "text/plain" });
            return file;
        }

        // const files1 = await Promise.all([...item.isoform1.pdb, item.isoform1.net].map(toFile))
        // const files2 = await Promise.all([...item.isoform2.pdb, item.isoform2.net].map(toFile))
        const files1 = await Promise.all(item.isoform1.pdb.map(toFile))
        const files2 = await Promise.all(item.isoform2.pdb.map(toFile))
        const fileCommon = await toFile(item.sequences);

        this.isoformStore1.setName(item.isoform1.id);
        this.isoformStore2.setName(item.isoform2.id);

        await Promise.all([
            this.isoformStore1.loadFiles(files1),
            this.isoformStore2.loadFiles(files2),
            this.loadSequences(fileCommon),
        ])
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

        this.generateAlignedNetworks();

    })

    generateAlignment = action(async () => {
        console.log("Calculate alignment...")
        //TODO: Check and handle missing sequence
        const sequences = this.isoforms.map(iso => iso.sequence!.code)
        const alignment = await BioMSA.align(sequences);
        for (let i = 0; i < this.isoforms.length; ++i) {
            this.isoforms[i].setAlignedSequence(alignment[i])
        }
    })

    generateAlignedNetworks = action(() => {
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

    generateAlluvialDiagram = action(async () => {
        if (!this.canGenerateAlluvial) {
            return;
        }
        this.rootStore.setNetworks(this.networks);
    })

    runInfomap = action(async () => {

    })

}