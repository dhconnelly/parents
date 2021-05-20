(define (cons x list)
    (lambda (i) (if (= i 0) x list)))
(define (car list) (list 0))
(define (cdr list) (list 1))

(define (len list)
    (if (isnil list)
        0
        (+ 1 (len (cdr list)))))

(define (makelist n)
    (if (= 0 n)
        nil
        (cons n (makelist (- n 1)))))

(define (times n f)
    (if (= n 0)
        nil
        (seq
            (f)
            (times (- n 1) f))))

(define size 3000)
(define (waste) (assert (= size (len (makelist size)))))
(define (wait) (seq (display (memory)) (times 100 waste)))
(times 10 wait)