/* {"title":"Serial.print","platform":"arduino","tags":["arduino"]} */
void setup() {
    Serial.begin(9600);
}
void loop() {
    Serial.print("Hello, ");
    Serial.println("world!");
    Serial.println('1');
    Serial.println(2);
    Serial.println(31, HEX);
    Serial.println(14, DEC);
    Serial.println(55, OCT);
    Serial.println(42, BIN);
}