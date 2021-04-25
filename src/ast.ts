export type TokenType =
    | "lparen"
    | "rparen"
    | "if"
    | "int"
    | "ident"
    | "seq"
    | "lambda"
    | "define";

export interface Token {
    typ: TokenType;
    line: number;
    col: number;
    text: string;
}

export interface Expr {}
