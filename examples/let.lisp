(define x 5)
(define y 10)
(assert (= 15 (+ x y)))

(define (f)
  (if (< 2 1)
    (let (x 17)
      (let (z (+ x y))
        (assert #f)))
    (let (y 99)
      (let (z (+ x y))
        (assert (= w z))))))

(define w 104)

(f)

(assert (= 15 (+ x y)))
