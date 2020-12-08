/* {"title":"multiplication de matrices","platform":"python","tags":["python"]} */
_VIEW_A = "showArray2D(A, rowCursors=[i], colCursors=[k], rows=2, cols=2, width=.33)"
_VIEW_B = "showArray2D(B, rowCursors=[k], colCursors=[j], rows=2, cols=2, width=.33)"
_VIEW_C = "showArray2D(C, rowCursors=[i], colCursors=[j], rows=2, cols=2, width=.33)"
A = [[0.866, -0.500], [0.500, 0.866]]
B = [[0.500, -0.866], [0.866, 0.500]]
C = [[0, 0], [0, 0]]
for i in range(0, 2):
    for j in range(0, 2):
        C[i][j] = 0
        for k in range(0, 2):
            C[i][j] += A[i][k] * B[k][j]

for i in range(0, 2):
    for j in range(0, 2):
        print(C[i][j])

    print('')
