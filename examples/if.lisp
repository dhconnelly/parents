(if (< 2 1)
    (assert #f)
    (assert #t))

(if (< 2 1)
    (display #f)
    (display #t))

(if (< (+ 2 4) (+ 9 10))
    (assert #t)
    (assert #f))

(if (< (+ 2 4) (+ 9 10))
    (display #t)
    (display #f))
