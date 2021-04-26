# parents

a small interpreter for a lisp-like language

## Why

to practice typescript: "paren" + "ts" === "parents"

## Features

The minimal set needed for implementing cons lists and the Church encoding
using lambda caclulus. Plus console output.

-   integers
-   first-class functions with lexical scope
-   special forms: if, lambda, define, seq
-   built-in functions: +, -, \*, <, =, isnil, display

For example, here's fibonacci:

    (define fib
      (lambda rec (n)
        (if (< n 2)
            n
            (+ (rec (- n 1)) (rec (- n 2))))))

See the examples/ directory for more.

## Usage

To install dependencies, build, and link to install on your machine:

    npm install
    npm run build
    npm link

To run scripts defined in files:

    parents [file ...]

For example, to run all the examples from the examples/ directory:

    parents examples/*

## Who

Daniel Connelly <dhconnelly@gmail.com> (https://dhconnelly.com)

## License

MIT License. Copyright (c) 2021 Daniel Connelly
