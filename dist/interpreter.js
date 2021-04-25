import fs from "fs";
import { parse } from "./parser.js";
export function runFile(path) {
    const prog = fs.readFileSync(path, "utf8");
    const exprs = parse(prog);
    console.log(exprs);
}
