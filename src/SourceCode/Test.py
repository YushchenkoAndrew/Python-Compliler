def main():
    a = 1
    a = a + 1.5
    b = a
    a = 2
    a = 1.6 + a * 2 + 3 * a + 4 * b
    return -a

main()