/* {"title":"listes d'initialisation","tags":["plain"]} */
#include <stdio.h>
int main() {
    int a[] = {1, 2};
    int * b = a;
    printf("%d %d\n", *b, b[1]);
    return 0;
}