def func(i, n):
    # c = b + d
    # c = b + 2
    # b += 1.0000001
    # bug:
    # c = a + " "
    if i >= n:
        return i

    else:
        return i * func(i + 1, n)
    # bug:
    # return a +  0.0001 + b
    # return a + b + 0.0001
    # return a + b + ""


def main():
    # a = 2 + 1 * 3 ** -4 / 5 * 6

    # a = 1 + 2 * 3
    # a = 1 + func(1, func(1, 2)) + 2 * a
    a = func(1, 5) + 0

    # a = 1
    # a = 1.5 + a
    # a = func(1 + 5 / 2, 5 + 2) + 5
    # a = func(1 + 5 / 2, 5 + 2) + 2
    # a = func(1.5 + 5 / 2, 5 + 2) + 5
    # bug:
    # a = 1 + func(1, 2)
    # a = func(1, 2) + 1

    # func(1.5 + 5 / 2, 5 + 2)
    # func(1, a)

    return a

main()