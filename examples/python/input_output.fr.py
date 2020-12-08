/* {"title":"input/output","platform":"python","tags":["python"]} */
print('Entrez un mot et un nombre séparés par un espace :')
inputStr = input().split(' ')
if len(inputStr) == 2:
    str = inputStr[0]
    num = int(inputStr[1])

    print('Longueur du mot * nombre =', len(str) * int(num))
else:
    print('Entrée incorrecte')
