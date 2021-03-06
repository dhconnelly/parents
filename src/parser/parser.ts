import {
    BoolExpr,
    CallExpr,
    DefineExpr,
    Expr,
    IdentExpr,
    IfExpr,
    IntExpr,
    LambdaExpr,
    Prog,
} from "../ast";
import { Token, TokenType } from "./token";
import { Option, Result, Ok, Err } from "../util";
import { lex } from "./lexer";

export class ParserError extends Error {
    constructor(message: string) {
        super(message);
    }
}

class Parser {
    toks: Token[];
    pos: number;
    line: number;

    constructor(toks: Token[]) {
        this.toks = toks;
        this.pos = 0;
        this.line = 1;
    }

    atEnd(): boolean {
        return this.pos >= this.toks.length;
    }

    error(message: string): ParserError {
        return new ParserError(`line ${this.line}: parser error: ${message}`);
    }

    tokenError(tok: Token, message: string): ParserError {
        return this.error(`${tok.line}:${tok.col}: ${tok.text}: ${message}`);
    }

    peek(n: number = 0): Token {
        if (this.pos + n >= this.toks.length) {
            throw this.error("unexpected eof");
        }
        return this.toks[this.pos + n];
    }

    eat(typ: TokenType): Token {
        let tok = this.peek();
        if (typ && tok.typ !== typ) {
            throw this.tokenError(tok, `want ${typ}, got ${tok.typ}`);
        }
        this.pos++;
        this.line = tok.line;
        return tok;
    }

    define(): DefineExpr {
        const tok = this.eat("lparen");
        this.eat("define");
        let name = null;
        let binding: Option<Expr> = undefined;
        if (this.peek().typ === "lparen") {
            this.eat("lparen");
            name = this.eat("ident").text;
            const params: string[] = [];
            while (this.peek().typ !== "rparen") {
                params.push(this.ident().value);
            }
            this.eat("rparen");
            const body = this.expr();
            binding = {
                line: tok.line,
                col: tok.col,
                typ: "LambdaExpr",
                name,
                params,
                body,
            };
        } else {
            name = this.eat("ident").text;
            binding = this.expr();
        }
        this.eat("rparen");
        return {
            line: tok.line,
            col: tok.col,
            typ: "DefineExpr",
            name,
            binding,
        };
    }

    let(): CallExpr {
        const tok = this.eat("lparen");
        this.eat("let");
        this.eat("lparen");
        const name = this.eat("ident").text;
        const binding = this.expr();
        this.eat("rparen");
        const body = this.expr();
        this.eat("rparen");
        const f: LambdaExpr = {
            typ: "LambdaExpr",
            line: tok.line,
            col: tok.col,
            params: [name],
            body: body,
        };
        return {
            typ: "CallExpr",
            f,
            args: [binding],
            col: tok.col,
            line: tok.line,
        };
    }

    if(): IfExpr {
        const tok = this.eat("lparen");
        this.eat("if");
        const cond = this.expr();
        const cons = this.expr();
        const alt = this.expr();
        this.eat("rparen");
        return {
            line: tok.line,
            col: tok.col,
            typ: "IfExpr",
            cond,
            cons,
            alt,
        };
    }

    lambda(): LambdaExpr {
        const tok = this.eat("lparen");
        this.eat("lambda");
        const name =
            this.peek().typ === "lparen" ? undefined : this.ident().value;
        this.eat("lparen");
        const params: string[] = [];
        while (this.peek().typ !== "rparen") {
            params.push(this.ident().value);
        }
        this.eat("rparen");
        const body = this.expr();
        this.eat("rparen");
        return {
            line: tok.line,
            col: tok.col,
            typ: "LambdaExpr",
            name,
            params,
            body,
        };
    }

    seq(): CallExpr {
        const tok = this.eat("lparen");
        this.eat("seq");
        const exprs: Expr[] = [];
        while (this.peek().typ !== "rparen") {
            exprs.push(this.expr());
        }
        this.eat("rparen");
        const f: LambdaExpr = {
            typ: "LambdaExpr",
            col: tok.col,
            line: tok.line,
            body: {
                typ: "IdentExpr",
                col: tok.col,
                line: tok.line,
                value: `x${exprs.length - 1}`,
            },
            params: exprs.map((_, i) => `x${i}`),
        };
        return {
            typ: "CallExpr",
            line: tok.line,
            col: tok.col,
            f,
            args: exprs,
        };
    }

    call(): CallExpr {
        const tok = this.eat("lparen");
        const f = this.expr();
        const args: Expr[] = [];
        while (this.peek().typ !== "rparen") {
            args.push(this.expr());
        }
        this.eat("rparen");
        return {
            line: tok.line,
            col: tok.col,
            typ: "CallExpr",
            f,
            args,
        };
    }

    sexpr(): Expr {
        switch (this.peek(1).typ) {
            case "define":
                return this.define();
            case "if":
                return this.if();
            case "lambda":
                return this.lambda();
            case "seq":
                return this.seq();
            case "let":
                return this.let();
            default:
                return this.call();
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

    bool(): BoolExpr {
        const tok = this.eat("bool");
        const value = tok.text === "t";
        return { typ: "BoolExpr", line: tok.line, col: tok.col, value };
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
            case "bool":
                return this.bool();
            case "ident":
                return this.ident();
            default:
                throw this.tokenError(tok, "bad expression");
        }
    }
}

export function parse(text: string): Result<Prog, ParserError> {
    const toks = lex(text);
    if (!toks.ok()) {
        return Err(toks.unwrap_error());
    }
    try {
        const parser = new Parser(toks.unwrap());
        const exprs = [];
        while (!parser.atEnd()) {
            exprs.push(parser.expr());
        }
        return Ok({ exprs });
    } catch (err) {
        if (err instanceof ParserError) {
            return Err(err);
        } else {
            throw err;
        }
    }
}
