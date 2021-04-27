export interface Prog {
    exprs: Expr[];
}

export type Expr =
    | IntExpr
    | IdentExpr
    | DefineExpr
    | IfExpr
    | LambdaExpr
    | CallExpr
    | SeqExpr;

export interface IntExpr {
    typ: "IntExpr";
    line: number;
    col: number;
    value: number;
}

export interface IdentExpr {
    typ: "IdentExpr";
    line: number;
    col: number;
    value: string;
}

export interface DefineExpr {
    typ: "DefineExpr";
    line: number;
    col: number;
    name: string;
    binding: Expr;
}

export interface IfExpr {
    typ: "IfExpr";
    line: number;
    col: number;
    cond: Expr;
    cons: Expr;
    alt?: Expr;
}

export interface SeqExpr {
    typ: "SeqExpr";
    line: number;
    col: number;
    exprs: Expr[];
}

export interface LambdaExpr {
    typ: "LambdaExpr";
    line: number;
    col: number;
    name?: string;
    params: string[];
    body: Expr;
}

export interface CallExpr {
    typ: "CallExpr";
    line: number;
    col: number;
    f: Expr;
    args: Expr[];
}
