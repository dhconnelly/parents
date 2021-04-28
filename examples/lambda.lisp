(assert (= 5 ((lambda (x y)
               (+ x y))
              2 3)))

(assert (= 5 ((lambda named (x y)
               (+ ((lambda bob () x)) y))
              ((lambda () 2)) 3)))
