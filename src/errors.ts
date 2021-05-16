import { CompilerError } from "./compiler/compiler";
import { EvaluationError } from "./interpreter/evaluator";
import { ExecutionError } from "./vm/vm";
import { LexerError } from "./lexer";
import { ParserError } from "./parser";

export type RootError =
    | LexerError
    | ParserError
    | CompilerError
    | EvaluationError
    | ExecutionError;

function liftError(err: RootError): RootError {
    return err;
}
