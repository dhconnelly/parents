(define (f n) (* 2 n))

(define g
    (if (< 2 3)
        (lambda (n) (+ n 2))
        (lambda (n) (+ n 3))))

(assert (= (f 4) 8))
(assert (= (g 4) 6))