(seq
    (if #f (assert #f) (assert #t))
    (display #t)
    (assert #t))

(define x (seq (display 1) (display 2) 3))
(assert (= x 3))