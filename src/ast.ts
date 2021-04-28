export interface Prog {
    readonly exprs: Expr[];
}

interface AbstractExpr {
    readonly typ: string;
    readonly line: number;
    readonly col: number;
}

export type Expr =
    | IntExpr
    | BoolExpr
    | IdentExpr
    | DefineExpr
    | IfExpr
    | LambdaExpr
    | CallExpr
    | SeqExpr;

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

export function printExpr(expr: Expr): string {
    switch (expr.typ) {
        case "BoolExpr":
            return expr.value ? "#t" : "#f";
        case "CallExpr":
            const f = printExpr(expr.f);
            const args = expr.args.map(printExpr).join(" ");
            return `(${f} ${args})`;
        case "DefineExpr":
            return `(define ${expr.name} ${printExpr(expr.binding)})`;
        case "IdentExpr":
            return expr.value;
        case "IfExpr":
            const cond = printExpr(expr.cond);
            const cons = printExpr(expr.cons);
            const alt = expr.alt && printExpr(expr.alt);
            return alt ? `(if ${cond} ${cons} ${alt})` : `(if ${cond} ${cons})`;
        case "IntExpr":
            return expr.value.toString(10);
        case "LambdaExpr":
            const name = expr.name;
            const params = expr.params.join(" ");
            const body = printExpr(expr.body);
            return name
                ? `(lambda ${name} (${params}) ${body})`
                : `(lambda (${params}) ${body})`;
        case "SeqExpr":
            return `(seq ${expr.exprs.map(printExpr).join(" ")})`;
    }
}
