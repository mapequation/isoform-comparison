
export default function pluralize(num: number, noun: string) {
    return `${num} ${num !== 1 ? noun + "s" : noun}`;
}
