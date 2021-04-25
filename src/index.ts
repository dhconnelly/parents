#!/usr/bin/env node

import process from "process";

function main(args: string[]): void {
    console.log("hello, world!");
    console.log("arguments:", args);
}

main(process.argv);
