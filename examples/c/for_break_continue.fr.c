/* {"title":"for, break, continue","tags":["plain"]} */
#include <stdio.h>
int main() {
  int i;
  for (i = 0; i < 5; i++) {
    printf("%i\n", i);
    if (i == 1) { i += 1; continue; }
    if (i == 3) break;
  }
  printf("valeur finale: %i\n", i);
}