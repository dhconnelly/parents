export type TokenType =
    | "lparen"
    | "rparen"
    | "int"
    | "bool"
    | "ident"
    | "if"
    | "seq"
    | "lambda"
    | "define"
    | "let";

export interface Token {
    typ: TokenType;
    line: number;
    col: number;
    text: string;
}
