import { CompilerError } from "./compiler/compiler";
import { EvaluationError } from "./interpreter/evaluator";
import { ExecutionError } from "./vm/vm";
import { LexerError } from "./lexer";
import { ParserError } from "./parser";
import { ValueError } from "./values";
import { TypeCheckError } from "./types";

export type RootError =
    | LexerError
    | ParserError
    | CompilerError
    | EvaluationError
    | ExecutionError
    | TypeCheckError
    | ValueError;

function liftError(err: RootError): RootError {
    return err;
}
