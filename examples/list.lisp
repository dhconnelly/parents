(define (cons x list)
  (lambda (i)
    (if (= i 0)
        x
        list)))

(define (first list)
  (list 0))

(define (rest list)
  (list 1))

(define (printlist list)
  (if (isnil (rest list))
      (display (first list))
      (seq
        (display (first list))
        (printlist (rest list)))))

(define xs (cons 1 (cons 2 (cons 3 nil))))
(define ys (cons 5 (rest xs)))

(printlist xs)
(printlist ys)
