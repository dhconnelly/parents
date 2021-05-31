import { CompilerError } from "./bytecode/compiler/compiler";
import { EvaluationError } from "./interpreter/evaluator";
import { ExecutionError } from "./bytecode/errors";
import { LexerError } from "./parser/lexer";
import { ParserError } from "./parser/parser";
import { ValueError } from "./bytecode/values";
import { TypeCheckError } from "./types";

export type RootError =
    | LexerError
    | ParserError
    | CompilerError
    | EvaluationError
    | ExecutionError
    | TypeCheckError
    | ValueError;
