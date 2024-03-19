import { action, computed, makeObservable, observable } from "mobx";
import type InputStore from "./InputStore"
import { parseAcceptedFiles, setIdentifiers } from "../components/LoadNetworks/utils";
import { NetworkFile } from "../components/LoadNetworks";
import { parse, parseTree } from "@mapequation/infomap-parser";
import Infomap from "@mapequation/infomap";
import { Arguments } from "@mapequation/infomap/arguments";
import { calcStatistics } from "../components/LoadNetworks/utils"

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

export default class IsoformStore {
    inputStore: InputStore;
    isoID: number;

    netFile: NetworkFile | null = null;

    errors: { title: string, description: string }[] = [];

    infomap = {
        progress: 0,
        isRunning: false,
        error: "",
        finished: false,
    }

    infomapArgs: Arguments = {
        numTrials: 10,
        output: "ftree",
    }

    constructor(inputStore: InputStore, isoformID: number) {
        this.inputStore = inputStore;
        this.isoID = isoformID;
        makeObservable(this, {
            netFile: observable.ref,
            infomap: observable,
            infomapArgs: observable,
            haveModules: computed,
        })
    }

    get haveModules() {
        return this.infomap.finished;
    }

    setNetworkFile = action(async (file: NetworkFile) => {
        this.netFile = file;

        await this.runInfomap();
    })

    setArgs = action((args: Arguments) => {
        this.infomapArgs = { ...this.infomapArgs, ...args };
    })

    setProgress = action((progress: number) => { this.infomap.progress = progress })

    runInfomap = action(async () => {

        if (this.netFile === null || this.infomap.isRunning) {
            return;
        }

        this.netFile.numTrials = this.infomapArgs.numTrials;
        this.netFile.twoLevel = this.infomapArgs.twoLevel;

        this.infomap.progress = 0;
        this.infomap.isRunning = true;
        this.infomap.error = "";

        const infomap = new Infomap()
            // .on("data", (data) => setInfomapOutput((output) => [...output, data]))
            .on("progress", this.setProgress)
            .on("error", (error) => {
                const infomapError = error.replace(/^Error:\s+/i, "");
                this.infomap.error = infomapError;
            })
            .on("finished", async (content) => {
                this.infomap.progress = 0;
                this.infomap.isRunning = false;
                console.log("Infomap finished!", content)
            });

        try {
            console.log("runAsync...")
            const result = await infomap.runAsync({
                network: this.netFile.network,
                filename: this.netFile.name,
                args: this.infomapArgs,
            });

            const tree = result.ftree_states || result.ftree;

            console.log("AFTER runAsync", result)

            if (tree) {
                const contents = parseTree(tree, undefined, true, true);
                setIdentifiers(contents.nodes, "ftree", "id"); //TODO: "id" or "name" as identifier here?

                Object.assign(this.netFile, {
                    haveModules: true,
                    ...contents,
                    ...calcStatistics(contents.nodes),
                });

                this.infomap.finished = true;
                this.infomap.isRunning = false;
                this.infomap.progress = 0;

            }
        } catch (e: any) {
            this.errors.push({
                title: `Error running Infomap on ${this.netFile.name}`,
                description: e.toString(),
            });
        }

    })

}