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

(if (< 2 1)
  (let (x 17)
    (let (z (+ x y))
      (assert #f)))
  (let (y 99)
    (let (z (+ x y))
      (assert (= 104 z)))))

(assert (= 15 (+ x y)))
