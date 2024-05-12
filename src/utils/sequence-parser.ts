
export type Sequence = { taxon: string, code: string }

export const isFasta = (lines: string[]) => {
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[0].trim();
        if (line.length === 0 || line[0] === '#') {
            continue;
        }
        if (line[0] === '>') {
            return true;
        }
    }
    return false;
}

export const parseFasta = (lines: string[]) => {

    if (!isFasta(lines)) {
        throw new Error(`Could not parse the file as a FASTA file`);
    }

    let lineIndex = 0;

    const parseTaxon = (line: string) => {
        if (line[0] !== '>') {
            throw new Error(`Expected a '>' to start a taxon line`);
        }
        const taxon = line.substring(1);
        if (!taxon) {
            throw new Error(`Empty taxon at line ${lineIndex + 1}`);
        }
        return taxon;
    }
    const parseCode = (line: string) => {
        const code = line.replace(/\s+/g, '');
        if (!code) {
            throw new Error(`Empty sequence at line ${lineIndex + 1}`);
        }
        return code;
    }

    const sequences: Sequence[] = [];
    let taxon = '';
    let codeLines: string[] = [];

    const addSequence = () => {
        const code = codeLines.join('');
        sequences.push({ taxon, code });
        codeLines = [];
    }

    for (; lineIndex < lines.length; ++lineIndex) {
        const line = lines[lineIndex];
        if (line.length === 0 || line[0] === '#') {
            continue;
        }
        if (line[0] === '>') {
            if (taxon) {
                addSequence();
                codeLines = [];
            }
            taxon = parseTaxon(line);
        }
        else {
            if (!taxon) {
                throw new Error(`'No taxon line found before line ${lineIndex + 1} ('${line}')`);
            }
            codeLines.push(parseCode(line));
        }
    }
    addSequence();

    // const numSequences = sequences.length;

    // console.log('Sequences:', sequences);
    // const alignment = {
    //     sequences,
    //     numSequences,
    //     fileFormat: 'FASTA',
    // };

    return sequences;

}

export default {
    isFasta,
    parseFasta,
};
