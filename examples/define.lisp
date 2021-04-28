(define x 5)
(define y 10)
(assert (= 15 (+ x y)))

(if (< 2 1)
    (seq
      (define x 17)
      (define z (+ x y))
      (assert #f))
    (seq
      (define y 99)
      (define z (+ x y))
      (assert (= 104 z))))

(assert (= 15 (+ x y)))
