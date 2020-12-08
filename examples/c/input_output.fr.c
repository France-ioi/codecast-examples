/* {"title":"entrée/sortie","mode":"unix","tags":["plain"]} */
#include <stdio.h>
unsigned long strlen(const char * s) {
  unsigned long l = 0;
  while (*s++) ++l;
  return l;
}
int main() {
    int a, n;
    char s[12];
    printf("Entrez un mot et un nombre:\n");
    n = scanf("%s %d", s, &a);
    if (n == 2) {
        printf("Longueur du mot * nombre = %lu\n", strlen(s) * a);
    } else {
        printf("Pas de valeur!\n");
    }
    return 0;
}