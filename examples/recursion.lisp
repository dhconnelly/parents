(define fact
  (lambda fact (n)
    (if (< n 2)
        n
        (* n (fact (- n 1))))))

(define main
  (lambda ()
    (display (fact 5))))

(main)

(define fib
  (lambda fib (n)
    (if (< n 2)
        n
        (+ (fib (- n 1)) (fib (- n 2))))))

(display (fib 10))

(assert (= 0 (fib 0)))
(assert (= 1 (fib 1)))
(assert (= 1 (fib 2)))
(assert (= 2 (fib 3)))
(assert (= 3 (fib 4)))
(assert (= 5 (fib 5)))
(assert (= 8 (fib 6)))
(assert (= 13 (fib 7)))