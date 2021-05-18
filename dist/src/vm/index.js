"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeFile = void 0;
const fs_1 = require("fs");
const vm_1 = require("../vm/vm");
function executeFile(file) {
    console.log(`> executing bytecode from ${file}`);
    const bytes = fs_1.readFileSync(file);
    vm_1.execute(bytes).unwrap();
}
exports.executeFile = executeFile;
