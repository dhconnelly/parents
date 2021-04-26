import { Token, Expr, IntExpr, IdentExpr, TokenType } from "./ast.js";

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

    tokenError(tok: Token, message: string): ParserError {
        return this.error(`${tok.line}:${tok.col}: ${tok.text}: ${message}`);
    }

    peek(): Token {
        if (this.atEnd()) throw this.error("unexpected eof");
        return this.toks[this.pos];
    }

    eat(typ: TokenType): Token {
        let tok = this.peek();
        if (typ && tok.typ !== typ) {
            throw this.tokenError(tok, `want ${typ}, got ${tok.typ}`);
        }
        this.pos++;
        return tok;
    }

    sexpr(): Expr {
        console.log("parsing sexpr");
        const tok = this.eat("lparen");
        const proto = { line: tok.line, col: tok.col };

        switch (this.peek().typ) {
            case "define":
                this.eat("define");
                const name = this.eat("ident").text;
                const binding = this.expr();
                this.eat("rparen");
                return { ...proto, typ: "DefineExpr", name, binding };

            case "if":
                this.eat("if");
                const cond = this.expr();
                const cons = this.expr();
                const alt =
                    this.peek().typ === "rparen" ? undefined : this.expr();
                this.eat("rparen");
                return { ...proto, typ: "IfExpr", cond, cons, alt };

            case "lambda":
                this.eat("lambda");
                const lambdaName =
                    this.peek().typ === "lparen"
                        ? undefined
                        : this.ident().value;
                this.eat("lparen");
                const params: string[] = [];
                while (this.peek().typ !== "rparen") {
                    params.push(this.ident().value);
                }
                this.eat("rparen");
                const body = this.expr();
                this.eat("rparen");
                return {
                    ...proto,
                    typ: "LambdaExpr",
                    name: lambdaName,
                    params,
                    body,
                };

            case "seq":
                this.eat("seq");
                const exprs: Expr[] = [];
                while (this.peek().typ !== "rparen") {
                    exprs.push(this.expr());
                }
                this.eat("rparen");
                return { ...proto, typ: "SeqExpr", exprs };

            default:
                const f = this.expr();
                const args: Expr[] = [];
                while (this.peek().typ !== "rparen") {
                    args.push(this.expr());
                }
                this.eat("rparen");
                return { ...proto, typ: "CallExpr", f, args };
        }
    }

    int(): IntExpr {
        const tok = this.eat("int");
        let value = null;
        try {
            value = parseInt(tok.text, 10);
        } catch (error) {
            throw this.tokenError(tok, `invalid int: ${tok.text}`);
        }
        return { typ: "IntExpr", line: tok.line, col: tok.col, value };
    }

    ident(): IdentExpr {
        const tok = this.eat("ident");
        return {
            typ: "IdentExpr",
            line: tok.line,
            col: tok.col,
            value: tok.text,
        };
    }

    expr(): Expr {
        const tok = this.peek();
        switch (tok.typ) {
            case "lparen":
                return this.sexpr();
            case "int":
                return this.int();
            case "ident":
                return this.ident();
            default:
                throw this.tokenError(tok, "bad expression");
        }
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
