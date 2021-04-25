#!/usr/bin/env node
import process from "process";
import { foo } from "./interpreter.js";
function main(args) {
    console.log("hello, world!");
    args.forEach(foo);
}
main(process.argv.slice(2));
