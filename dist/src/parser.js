"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.ParserError = void 0;
const lexer_1 = require("./lexer");
class ParserError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.ParserError = ParserError;
class Parser {
    constructor(toks) {
        this.toks = toks;
        this.pos = 0;
        this.line = 1;
    }
    atEnd() {
        return this.pos >= this.toks.length;
    }
    error(message) {
        return new ParserError(`line ${this.line}: parser error: ${message}`);
    }
    tokenError(tok, message) {
        return this.error(`${tok.line}:${tok.col}: ${tok.text}: ${message}`);
    }
    peek(n = 0) {
        if (this.pos + n >= this.toks.length) {
            throw this.error("unexpected eof");
        }
        return this.toks[this.pos + n];
    }
    eat(typ) {
        let tok = this.peek();
        if (typ && tok.typ !== typ) {
            throw this.tokenError(tok, `want ${typ}, got ${tok.typ}`);
        }
        this.pos++;
        this.line = tok.line;
        return tok;
    }
    define() {
        const tok = this.eat("lparen");
        this.eat("define");
        let name = null;
        let binding = undefined;
        if (this.peek().typ === "lparen") {
            this.eat("lparen");
            name = this.eat("ident").text;
            const params = [];
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
        }
        else {
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
    let() {
        const tok = this.eat("lparen");
        this.eat("let");
        this.eat("lparen");
        const name = this.eat("ident").text;
        const binding = this.expr();
        this.eat("rparen");
        const body = this.expr();
        this.eat("rparen");
        return {
            line: tok.line,
            col: tok.col,
            typ: "LetExpr",
            name,
            binding,
            body,
        };
    }
    if() {
        const tok = this.eat("lparen");
        this.eat("if");
        const cond = this.expr();
        const cons = this.expr();
        const alt = this.peek().typ === "rparen" ? undefined : this.expr();
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
    lambda() {
        const tok = this.eat("lparen");
        this.eat("lambda");
        const name = this.peek().typ === "lparen" ? undefined : this.ident().value;
        this.eat("lparen");
        const params = [];
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
    seq() {
        const tok = this.eat("lparen");
        this.eat("seq");
        const exprs = [];
        while (this.peek().typ !== "rparen") {
            exprs.push(this.expr());
        }
        this.eat("rparen");
        return { line: tok.line, col: tok.col, typ: "SeqExpr", exprs };
    }
    call() {
        const tok = this.eat("lparen");
        const f = this.expr();
        const args = [];
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
    sexpr() {
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
    int() {
        const tok = this.eat("int");
        let value = null;
        try {
            value = parseInt(tok.text, 10);
        }
        catch (error) {
            throw this.tokenError(tok, `invalid int: ${tok.text}`);
        }
        return { typ: "IntExpr", line: tok.line, col: tok.col, value };
    }
    bool() {
        const tok = this.eat("bool");
        const value = tok.text === "t";
        return { typ: "BoolExpr", line: tok.line, col: tok.col, value };
    }
    ident() {
        const tok = this.eat("ident");
        return {
            typ: "IdentExpr",
            line: tok.line,
            col: tok.col,
            value: tok.text,
        };
    }
    expr() {
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
function parse(text) {
    const toks = lexer_1.lex(text);
    const parser = new Parser(toks);
    const exprs = [];
    while (!parser.atEnd()) {
        exprs.push(parser.expr());
    }
    return { exprs };
}
exports.parse = parse;
