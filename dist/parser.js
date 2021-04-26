class ParserError extends Error {
    constructor(message) {
        super(message);
    }
}
class Parser {
    constructor(toks) {
        this.toks = toks;
        this.pos = 0;
    }
    atEnd() {
        return this.pos >= this.toks.length;
    }
    error(message) {
        return new ParserError(`parser error: ${message}`);
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
        return tok;
    }
    define() {
        const tok = this.eat("lparen");
        this.eat("define");
        const name = this.eat("ident").text;
        const binding = this.expr();
        this.eat("rparen");
        return {
            line: tok.line,
            col: tok.col,
            typ: "DefineExpr",
            name,
            binding,
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
            case "ident":
                return this.ident();
            default:
                throw this.tokenError(tok, "bad expression");
        }
    }
}
export function parse(toks) {
    const parser = new Parser(toks);
    const exprs = [];
    while (!parser.atEnd()) {
        exprs.push(parser.expr());
    }
    return exprs;
}
