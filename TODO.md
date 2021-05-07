# To-Do

1. Change closures to capture by value
   a. Allow `define` at global scope only
   b. Modify lambda creation to explicitly capture by value
   c. Modify evaluation to look in (first) captures and (second) globals
2. Add (define <fn_name> <body>) syntax sugar
3. Define VM spec
   a. Define instructions
   b. Define instruction layout
   c. Define value layout
   d. Define memory layout
   e. Define calling convention
4. Implement compiler and VM
