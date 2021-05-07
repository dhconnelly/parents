(define x 5)
(define y 10)
(assert (= 15 (+ x y)))

(if (< 2 1)
  (let (x 17)
    (let (z (+ x y))
      (assert #f)))
  (let (y 99)
    (let (z (+ x y))
      (assert (= 104 z)))))

(assert (= 15 (+ x y)))
