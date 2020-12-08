/* {"title":"types composés","mode":"unix","tags":["plain"]} */
#include <stdio.h>
int main() {

    // tableau de pointeurs vers int
    int *a[1];
    int a_value = 1;
    a[0] = &a_value;

    // declare b comme pointeur vers un tableau d'entiers
    int (*b)[];
    int b_value[1];
    b = &b_value;

    /* declare foo comme tableau (taille 3) de tableau (taille 2) de pointeur
       sur pointeur sur fonction retournant un pointeur vers char */
    char *(*(**foo[3][2])())[];

    return 0;
}