import Infomap from "@mapequation/infomap";
import { parseTree } from "@mapequation/infomap-parser";
import { Arguments } from "@mapequation/infomap/arguments";
import { setIdentifiers, createFile } from "../components/LoadNetworks/utils";
import { NetworkFile } from "../components/LoadNetworks";
import { Identifier } from "../alluvial";

type RunInfomapData = {
    network: string;
    filename: string;
    onProgress?: (value: number) => void;
    onError?: (message: string) => void;
    args?: Arguments;
    identifier?: Identifier;
}

export async function runInfomap(data: RunInfomapData): Promise<NetworkFile> {
    const infomap = new Infomap();

    const { onProgress, onError } = data;

    if (onProgress) {
        infomap.on("progress", onProgress);
    }
    if (onError !== undefined) {
        infomap.on("error", (error) => {
            const message = error.replace(/^Error:\s+/i, "");
            onError(message);
        })
    }

    const filename = data.filename;
    const result = await infomap.runAsync({
        network: data.network,
        filename,
        args: data.args,
    });

    const tree = result.tree_states || result.tree || result.tree_states || result.tree;

    if (!tree) {
        throw new Error("No tree output from Infomap");
    }

    const contents = parseTree(tree, undefined, false, true);
    setIdentifiers(contents.nodes, "tree", data.identifier ?? "name");

    const file = new File([data.network], filename, { type: "text/plain" });

    const newFile = createFile(file, "net", contents);

    newFile.twoLevel = data.args?.twoLevel;
    newFile.numTrials = data.args?.numTrials;

    return newFile;
}