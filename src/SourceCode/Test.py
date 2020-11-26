# def test(a):
#     if a:
#         return a * test(a + -1)
#     return 1

def test():
    a = 1

def main():
    a = 1

    # while a < 10:
    #     b = 1
    #     a += b

    # test(5)

    # # break
    #     continue

    b = 1
    # a = range(5)

    # TEST EXPRESSION
    # b = 5.2 - 2 - 1 # OK
    # b = 5.2 * 2 - 1 # OK
    # b = 5.2 - 1 * 2 # OK
    # b = 50.1 - 5 * 2 - 1 * 2 # OK
    b = 50.1 - 5 * 2 - 1 * 2 + 5 * 1 - 6 * 3 # OK
    # b = 2 + 5 * 16 / 2
    # b = 2 + 2 * 2 - (not not 5) # OK
    # b = 8 + -2 * 3 - ~~1 # OK
    # b = (2 + 2) * 2 # OK
    # b = 5 + 3 * 16 / 2 # OK
    # b = not ((2 + 2) * -2 + (not not 5) * 16 / 2) # OK
    # b = 1 - -(2 - 3 - -5) * ~~~2 + (not 8) * 18 # OK
    # b = -(2 - 3 * (2 - --2 + (not 0))) / 3 + -~~~-(1 - ~~2) * 5 / ~~2 # OK


    # for i in range(0, 10, 2):
    # while a != 100:
    # # if a:
    #     # b = 1
        # a += i

    #     # if a % 2 == 0:
    #     #     continue

    #     b += 1
    # b += 1

    # a = 1.5

    return b

# print(main())
main()