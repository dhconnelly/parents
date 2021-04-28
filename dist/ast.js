export function printExpr(expr) {
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
