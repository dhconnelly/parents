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

export interface Expr {
    line: number;
    col: number;
}

export interface IntExpr {
    line: number;
    col: number;
    value: number;
}

export interface IdentExpr {
    line: number;
    col: number;
    value: string;
}

export interface DefineExpr {
    line: number;
    col: number;
    name: string;
    value: Expr;
}

export interface IfExpr {
    line: number;
    col: number;
    cond: Expr;
    conseq: Expr;
    alt?: Expr;
}

export interface SeqExpr {
    line: number;
    col: number;
    body: Expr[];
}

export interface LambdaExpr {
    line: number;
    col: number;
    name?: string;
    params: string[];
    body: Expr;
}

export interface CallExpr {
    line: number;
    col: number;
    f: Expr;
    args: Expr[];
}
