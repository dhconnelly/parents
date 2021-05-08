import { Value } from "./values";

export enum Opcode {
    Pop = 1,
    Push,
    Add,
    Sub,
    Lt,
    Eq,
    Display,
    Assert,
}

export type Instr = {
    op: Opcode;
    value?: Value;
};
