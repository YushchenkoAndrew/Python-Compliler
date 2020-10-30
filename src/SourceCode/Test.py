def main():
    test = "a = "
    a = 10
    if a == 0:
        test += "0"
    elif a == 1:
        test += "1"
    elif a == 2:
        test += "2"
    elif a == 3:
        test += "3"
    else:
        test += "undefined"

    return test

main()