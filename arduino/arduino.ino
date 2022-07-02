/// --------      PURPOSE     ----------- ///
// Nhiệm vụ của Arduino:
//  - Đọc dữ liệu từ cảm biến
//  - Gửi dữ liệu về cho ESP32 thông qua giao tiếp UART

/// --------    IMPORT LIBS   ----------- ///
#include <Arduino_JSON.h>


/// --------- DEFINE CONSTANT ------------ ///
const int DO_AM_PIN = A0;
const int MUC_NUOC_PIN = A1;
const int DO_AM_MAX = 50;
const int DO_AM_MIN = 0;
const int MUC_NUOC_MAX = 600;
const int MUC_NUOC_MIN = 100;
const int TIMESTAMP = 5000; // ms

/// --------- SYSTEM VARIABLES ---------- ///
int doam = 0;
int mucnuoc = 0;


/// --------- SYSTEM FUNCTIONS ---------- ///
// Chuyển đổi giá trị tín hiệu thành giá trị độ ẩm đất
int doAmDat(int s){
  // Chuyển đổi theo độ ẩm đất
  int phantramthuc = 100 - map(s, 0, 1023, 0, 100);
  int phantramao = map(phantramthuc, 0, 100, DO_AM_MIN, 100 * 100 / DO_AM_MAX);
  return (phantramao > 100) ? 100 : phantramao;
}

// Chuyển đổi giá trị tín hiệu thành giá trị mực nước
int mucNuoc(int s){
  int value = s;
  if (s > MUC_NUOC_MAX) value = MUC_NUOC_MAX;
  if (s < MUC_NUOC_MIN) value = MUC_NUOC_MIN;

  return map(value, MUC_NUOC_MIN, MUC_NUOC_MAX, 0, 400); // Chuyển tín hiệu sang 0-400mm
}


/// --------- SYSTEM SETUP ---------- ///
void setup() {
  // Khởi tạo baudrate cho giao thức UART
  Serial.begin(9600);

  // Cấu hình pin
  pinMode(DO_AM_PIN, INPUT);
  pinMode(MUC_NUOC_PIN, INPUT);
}


/// --------- SYSTEM LOOP ---------- ///
void loop() {
  // Đọc dữ liệu từ cảm biến độ ẩm đất
  int a = analogRead(DO_AM_PIN);
  doam = doAmDat(a);

  // Đọc dữ liệu từ cảm biến mực nước
  int b = analogRead(MUC_NUOC_PIN);
  mucnuoc = mucNuoc(b);

  JSONVar duLieu;

  duLieu["doam"] = doam;
  duLieu["mucnuoc"] = mucnuoc;

  String duLieuString = JSON.stringify(duLieu);
  Serial.print(duLieuString);
  delay(TIMESTAMP);
}
