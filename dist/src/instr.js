"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Opcode = void 0;
var Opcode;
(function (Opcode) {
    Opcode[Opcode["Pop"] = 1] = "Pop";
    Opcode[Opcode["Push"] = 2] = "Push";
    Opcode[Opcode["Add"] = 3] = "Add";
    Opcode[Opcode["Sub"] = 4] = "Sub";
    Opcode[Opcode["Lt"] = 5] = "Lt";
    Opcode[Opcode["Eq"] = 6] = "Eq";
    Opcode[Opcode["Display"] = 7] = "Display";
    Opcode[Opcode["Assert"] = 8] = "Assert";
})(Opcode = exports.Opcode || (exports.Opcode = {}));
