import { CompilerError } from "./compiler/compiler";
import { EvaluationError } from "./interpreter/evaluator";
import { ExecutionError } from "./vm/values";
import { LexerError } from "./parser/lexer";
import { ParserError } from "./parser/parser";
import { ValueError } from "./vm/values";
import { TypeCheckError } from "./types";

export type RootError =
    | LexerError
    | ParserError
    | CompilerError
    | EvaluationError
    | ExecutionError
    | TypeCheckError
    | ValueError;
