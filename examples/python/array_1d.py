/* {"title":"tableau 1D","platform":"python","tags":["python"]} */
_VIEW_a = "showArray(a, cursors=[i,n], n=8, cw=32)"
n = 12
a = [1]
for i in range(1, n):
    a.append(a[i - 1] * 2)

for i in range(1, n):
    print('a[', i, '] = ', a[i])
