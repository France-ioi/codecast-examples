/* {"title":"analogRead","platform":"arduino","tags":["arduino"]} */
void setup() {
    pinMode(14, INPUT);
}
void loop() {
   int n = analogRead(14);
   Serial.println(n);
   delay(1000);
}