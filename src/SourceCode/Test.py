def main():
    a = 1
    a = a + 1.5
    b = a
    a = 2
    a = 1.6 + a * 2 + 3 * a   # Bug with a
    # a = 1 + 1.5
    return a

main()