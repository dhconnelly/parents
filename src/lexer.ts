import { Option } from "./util.js";
import { Token, TokenType } from "./token.js";

export class LexerError extends Error {
    constructor(message: string) {
        super(message);
    }
}

interface LexerElement {
    text: string;
    line: number;
    col: number;
}

const IS_ALPHA = /[a-zA-Z]/;
const IS_ALPHANUM = /[a-zA-Z0-9]/;
const IS_NUM = /[0-9]/;

// TODO: rewrite to use buffers and streams
class Lexer {
    text: string;
    pos: number;
    line: number;
    col: number;

    constructor(text: string) {
        this.text = text;
        this.pos = 0;
        this.line = 1;
        this.col = 1;
    }

    atEnd(): boolean {
        return this.pos >= this.text.length;
    }

    peek(): LexerElement {
        if (this.pos >= this.text.length) {
            throw new LexerError("unexpected eof");
        }
        return {
            text: this.text[this.pos],
            line: this.line,
            col: this.col,
        };
    }

    emit(typ: TokenType, elem: LexerElement): Token {
        return {
            typ: typ,
            text: elem.text,
            line: elem.line,
            col: elem.col,
        };
    }

    eat(want?: string): LexerElement {
        const ch = this.peek();
        if (want && ch.text !== want) {
            throw this.error(`want ${want}, got ${ch.text}`);
        }
        if (ch.text === "\n") {
            this.line++;
            this.col = 1;
        } else {
            this.col++;
        }
        this.pos++;
        return ch;
    }

    error(message: string): LexerError {
        return new LexerError(
            `lexer error at ${this.line}:${this.col}: ${message}`
        );
    }

    eatWhile(regex: RegExp): LexerElement {
        let tok = this.peek();
        const start = this.pos;
        let end = start;
        while (regex.test(this.peek().text)) {
            this.eat();
            end++;
        }
        tok.text = this.text.substr(start, end - start);
        return tok;
    }

    ident(): Token {
        const tok = this.eatWhile(IS_ALPHANUM);
        switch (tok.text) {
            case "if":
                return this.emit("if", tok);
            case "define":
                return this.emit("define", tok);
            case "lambda":
                return this.emit("lambda", tok);
            case "seq":
                return this.emit("seq", tok);
            case "let":
                return this.emit("let", tok);
            default:
                return this.emit("ident", tok);
        }
    }

    int(): Token {
        const tok = this.eatWhile(IS_NUM);
        return this.emit("int", tok);
    }

    boolean(): Token {
        this.eat("#");
        const ch = this.eat();
        switch (ch.text) {
            case "t":
                return this.emit("bool", ch);
            case "f":
                return this.emit("bool", ch);
            default:
                throw this.error(`invalid bool value: ${ch.text}`);
        }
    }

    next(): Option<Token> {
        while (!this.atEnd()) {
            const ch = this.peek();
            switch (ch.text) {
                case "(":
                    return this.emit("lparen", this.eat());
                case ")":
                    return this.emit("rparen", this.eat());
                case "#":
                    return this.boolean();
                case "+":
                case "-":
                case "*":
                case "=":
                case "<":
                    return this.emit("ident", this.eat());
                case " ":
                case "\n":
                case "\t":
                case "\r":
                    this.eat();
                    continue;
                default:
                    if (IS_ALPHA.test(ch.text)) return this.ident();
                    if (IS_NUM.test(ch.text)) return this.int();
                    break;
            }
            throw this.error(`unknown token: ${ch.text}`);
        }
        return undefined;
    }
}

export function lex(text: string): Token[] {
    const lexer = new Lexer(text);
    const toks = [];
    while (!lexer.atEnd()) {
        let maybe_tok = lexer.next();
        if (maybe_tok) toks.push(maybe_tok);
    }
    return toks;
}
