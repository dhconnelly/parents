export interface Prog {
    readonly exprs: Expr[];
}

interface AbstractExpr {
    readonly typ: string;
    readonly line: number;
    readonly col: number;
}

export type Expr = AbstractExpr &
    (
        | IntExpr
        | BoolExpr
        | IdentExpr
        | DefineExpr
        | IfExpr
        | LambdaExpr
        | CallExpr
        | SeqExpr
    );

export interface IntExpr extends AbstractExpr {
    readonly typ: "IntExpr";
    readonly value: number;
}

export interface BoolExpr extends AbstractExpr {
    readonly typ: "BoolExpr";
    readonly value: boolean;
}

export interface IdentExpr extends AbstractExpr {
    readonly typ: "IdentExpr";
    readonly value: string;
}

export interface DefineExpr extends AbstractExpr {
    readonly typ: "DefineExpr";
    readonly name: string;
    readonly binding: Expr;
}

export interface IfExpr extends AbstractExpr {
    readonly typ: "IfExpr";
    readonly cond: Expr;
    readonly cons: Expr;
    readonly alt?: Expr;
}

export interface SeqExpr extends AbstractExpr {
    readonly typ: "SeqExpr";
    readonly exprs: Expr[];
}

export interface LambdaExpr extends AbstractExpr {
    readonly typ: "LambdaExpr";
    readonly name?: string;
    readonly params: string[];
    readonly body: Expr;
}

export interface CallExpr extends AbstractExpr {
    readonly typ: "CallExpr";
    readonly f: Expr;
    readonly args: Expr[];
}
