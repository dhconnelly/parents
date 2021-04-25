import { Token, Expr } from "./ast.js";

class ParserError extends Error {
    constructor(message: string) {
        super(message);
    }
}

class Parser {
    toks: Token[];
    pos: number;

    constructor(toks: Token[]) {
        this.toks = toks;
        this.pos = 0;
    }

    atEnd(): boolean {
        return this.pos >= this.toks.length;
    }

    error(message: string): ParserError {
        return new ParserError(`parser error: ${message}`);
    }

    expr(): Expr {
        throw this.error("not implemented");
    }
}

export function parse(toks: Token[]): Expr[] {
    const parser = new Parser(toks);
    const exprs = [];
    while (!parser.atEnd()) {
        exprs.push(parser.expr());
    }
    return exprs;
}
