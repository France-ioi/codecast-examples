/* {"title":"input/output","platform":"python","tags":["python"]} */
print('Enter a word and a number separated by a space')
inputStr = input().split(' ')
if len(inputStr) == 2:
    str = inputStr[0]
    num = int(inputStr[1])

    print('Word length * number value =', len(str) * int(num))
else:
    print('Missing value')
