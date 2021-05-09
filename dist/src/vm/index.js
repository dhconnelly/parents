"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeFile = void 0;
const fs_1 = require("fs");
const util_1 = require("../util");
const vm_1 = require("../vm/vm");
function executeFile(file) {
    console.log(`> executing bytecode from ${file}`);
    try {
        const bytes = fs_1.readFileSync(file);
        vm_1.execute(bytes);
    }
    catch (error) {
        if (error instanceof util_1.RootError) {
            console.error(`${file}: ${error.message}`);
        }
        else {
            throw error;
        }
    }
}
exports.executeFile = executeFile;
