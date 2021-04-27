(define zero
    (lambda (f)
        (lambda (x)
            x)))

(define one
    (lambda (f)
        (lambda (x)
            (f x))))

(define succ
    (lambda (n)
        (lambda (f)
            (lambda (x)
                (f ((n f) x))))))

(define two (succ one))
(define three (succ two))

(define pred
    (lambda (n)
        (lambda (f)
            (lambda (x)
                (((n (lambda (g) (lambda (h) (h (g f)))))
                    (lambda (u) x))
                        (lambda (u) u))))))

(define square
    (lambda (n) (* n n)))

(define not
    (lambda (x)
        (if x #f #t)))

(define iszero
    (lambda (n)
        ((n (lambda (x) #f)) #t)))

(define sub
    (lambda (m n)
        ((n pred) m)))

(define leq
    (lambda (m n)
        (iszero (sub m n))))

(define and
    (lambda (p q)
        (if p q #f)))

(define eq
    (lambda (m n)
        (and (leq m n) (leq n m))))

(assert (= 2 ((zero square) 2)))
(assert (= 4 ((one square) 2)))
(assert (= 16 ((two square) 2)))
(assert (= 256 ((three square) 2)))
(assert (= 16 (((pred three) square) 2)))
(assert (not (iszero three)))
(assert (iszero zero))
(assert (not (iszero (sub three two))))
(assert (iszero (sub two two)))
(assert (not (leq three two)))
(assert (leq one three))
(assert (and #t #t))
(assert (not (and #f #t)))
(assert (not (and #f #f)))
(assert (not (and #t #f)))
(assert (eq (succ one) (pred three)))
