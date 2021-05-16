(define x 5)
(define y 10)
(assert (= 15 (+ x y)))

(define w 104)

(define (f)
  (if (< 2 1)
    (let (x 17)
      (let (z (+ x y))
        (assert #f)))
    (let (y 99)
      (let (z (+ x y))
        (assert (= w z))))))

(f)

(assert (= 15 (+ x y)))
