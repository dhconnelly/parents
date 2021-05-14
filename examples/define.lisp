(define x 10)
(define y (if (< 5 4) 7 2))

(assert
    (if (< x 30)
        (= (+ x y) 12)
        #f))

(define blah #t)

(if (< x 30)
    (display (= blah (= (+ x y) 12)))
    (assert #f))
