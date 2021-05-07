"use strict";
var Opcode;
(function (Opcode) {
    Opcode[Opcode["PushInt"] = 1] = "PushInt";
    Opcode[Opcode["PushBool"] = 2] = "PushBool";
    Opcode[Opcode["Add"] = 3] = "Add";
    Opcode[Opcode["Sub"] = 4] = "Sub";
    Opcode[Opcode["Lt"] = 5] = "Lt";
    Opcode[Opcode["Eq"] = 6] = "Eq";
    Opcode[Opcode["Display"] = 7] = "Display";
    Opcode[Opcode["Assert"] = 8] = "Assert";
})(Opcode || (Opcode = {}));
