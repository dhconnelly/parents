export interface Prog {
    exprs: Expr[];
}

interface AbstractExpr {
    typ: string;
    line: number;
    col: number;
}

export type Expr =
    | IntExpr
    | BoolExpr
    | IdentExpr
    | DefineExpr
    | IfExpr
    | LambdaExpr
    | CallExpr;

export interface IntExpr extends AbstractExpr {
    typ: "IntExpr";
    value: number;
}

export interface BoolExpr extends AbstractExpr {
    typ: "BoolExpr";
    value: boolean;
}

export interface IdentExpr extends AbstractExpr {
    typ: "IdentExpr";
    value: string;
}

export interface DefineExpr extends AbstractExpr {
    typ: "DefineExpr";
    name: string;
    binding: Expr;
}

export interface IfExpr extends AbstractExpr {
    typ: "IfExpr";
    cond: Expr;
    cons: Expr;
    alt: Expr;
}

export interface LambdaExpr extends AbstractExpr {
    typ: "LambdaExpr";
    name?: string;
    params: string[];
    body: Expr;
}

export interface CallExpr extends AbstractExpr {
    typ: "CallExpr";
    f: Expr;
    args: Expr[];
}

export function print(expr: Expr): string {
    switch (expr.typ) {
        case "BoolExpr":
            return expr.value ? "#t" : "#f";
        case "CallExpr":
            const f = print(expr.f);
            const args = expr.args.map(print).join(" ");
            return `(${f} ${args})`;
        case "DefineExpr":
            return `(define ${expr.name} ${print(expr.binding)})`;
        case "IdentExpr":
            return expr.value;
        case "IfExpr":
            const cond = print(expr.cond);
            const cons = print(expr.cons);
            const alt = expr.alt && print(expr.alt);
            return alt ? `(if ${cond} ${cons} ${alt})` : `(if ${cond} ${cons})`;
        case "IntExpr":
            return expr.value.toString(10);
        case "LambdaExpr":
            const name = expr.name;
            const params = expr.params.join(" ");
            const body = print(expr.body);
            return name
                ? `(lambda ${name} (${params}) ${body})`
                : `(lambda (${params}) ${body})`;
    }
}
