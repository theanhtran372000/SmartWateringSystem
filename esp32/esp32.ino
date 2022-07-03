/// --------       PURPOSE     ----------- ///
// Nhiệm vụ của ESP32:
// - Nhận dữ liệu từ Arduino
// - Tổng hợp tín hiệu và truyền lên server

// Công việc còn lại:
// - CHƯA UPDATE LẠI LÊN ESP32


/// --------    IMPORT LIBS    ----------- ///
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <Arduino_JSON.h>
#include <PubSubClient.h>


/// --------- DEFINE CONSTANT ------------ ///
// Mã thiết bị
const String deviceId = "00000001";

// Thông số wifi
const char* ssid = "The Anh Beo";
const char* password = "theanhbeo372000";

// Địa chỉ MQTT Broker
String mqtt_server = "broker.hivemq.com";
const uint16_t mqtt_port = 1883;

// Serial baudrate
const int baudrate = 9600;

// Hằng số
const int LCD_ADDR = 0x27;
const int LCD_WIDTH = 20;
const int LCD_HEIGHT = 4;
const int LOOP_STEP = 3000;
const int TOUCH_STEP = 50;

// Danh sách chân
const int WATER_PUMP_PIN = 16;    // Nối tới Rơle điều khiển bơm (Kích mức cao)
const int TOUCH_SENSOR_PIN = 17;  // Cảm biến chạm (chạm trả về điện áp cao)
const int RED_LED_PIN = 4;        // Led đỏ
const int GREEN_LED_PIN = 0;      // Led xanh lá
const int BLUE_LED_PIN = 2;       // Led xanh dương

// MQTT Topic
const String dataTopic = "sws_data";
const String commandTopic = "sws_command";
const String stateTopic = "sws_state";

/// --------- SYSTEM VARIABLES ---------- ///
LiquidCrystal_I2C lcd(LCD_ADDR, LCD_WIDTH, LCD_HEIGHT); // SDA ~ 21, SCL ~ 22
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

String sensor_data;
int soil_humi, water_level;
int i;
unsigned long loop_t, touch_t;
int touch_value;
String str;

/// --------- SYSTEM FUNCTIONS ---------- ///

// Hàm phụ trợ
// Hàm điều khiển led nhiều màu
void changeLed(String color){
  if (color == "red"){
    digitalWrite(RED_LED_PIN, HIGH);
    digitalWrite(GREEN_LED_PIN, LOW);
    digitalWrite(BLUE_LED_PIN, LOW);
  }
  
  else if (color == "green"){
    digitalWrite(RED_LED_PIN, LOW);
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(BLUE_LED_PIN, LOW);
  }

  else if (color == "blue"){
    digitalWrite(RED_LED_PIN, LOW);
    digitalWrite(GREEN_LED_PIN, LOW);
    digitalWrite(BLUE_LED_PIN, HIGH);
  }
}

// Nhóm hàm hiển thị LCD
// Hàm chào hỏi người dùng trên LCD
void lcd_greeting(){
  lcd.clear();
  lcd.print("Hello user ...");
  lcd.setCursor(0, 1);
  lcd.print("I'm");
  lcd.setCursor(7, 2);
  lcd.print("Smart");
  lcd.setCursor(0, 3);
  lcd.print("Watering System ^^");
}

// Hàm hiển thị kết nối Wifi
void lcd_connect_wifi(){
  lcd.clear();
  lcd.print("I'm connecting to");
  lcd.setCursor(0, 1);
  lcd.print(ssid);
  lcd.setCursor(0, 3);
  lcd.print("Please wait ...");
}

// Hàm hiển thị kết nối lại tới Wifi
void lcd_reconnect_wifi(){
  lcd.clear();
  lcd.print("I'm reconnecting to");
  lcd.setCursor(0, 1);
  lcd.print(ssid);
  lcd.setCursor(0, 3);
  lcd.print("Please wait ...");
}

// Hàm kết nối thành công
void lcd_connect_success(){
  lcd.clear();
  lcd.setCursor(2, 1);
  lcd.print("Connect success!");
}

// Hàm kết nối tới Broker
void lcd_connect_broker(){
  lcd.clear();
  lcd.print("I'm connecting to");
  lcd.setCursor(4, 1);
  lcd.print("Broker");
  lcd.setCursor(0, 3);
  lcd.print("Please wait ...");
}

// Hàm hiển thị thông số lên LCD
void lcd_display_stats(int humi, int level){
  lcd.clear();

  lcd.print("--- System stats ---");
  lcd.setCursor(0, 1);
  lcd.print("Humi  ");
  lcd.setCursor(6, 1);
  str = "";
  for(i = 0; i < humi / 10; i++){
    str += "=";
  }
  lcd.print(str);
  lcd.setCursor(17, 1);
  lcd.print(humi);

  lcd.setCursor(0, 2);
  lcd.print("Level ");
  lcd.setCursor(6, 2);
  str = "";
  for(i = 0; i < level / 40; i++){
    str += "=";
  }
  lcd.print(str);
  lcd.setCursor(17, 2);
  lcd.print(level);
}

// Hàm hiển thị trạng thái bơm
void lcd_pump_state(int state, int t){
  lcd.clear();

  lcd.print("--- System stats ---");
  lcd.setCursor(0, 1);
  if(state == 1){
    lcd.print("Water pump is ON");
    lcd.setCursor(6, 2);
    String tmp = "in " + (String) t + "ms";
    lcd.print(tmp);
  }
  else{
    lcd.print("Water pump is OFF");
  }
  
}

// Nhóm hàm kết nối
// Hàm kết nối lại Wifi
void reconnectWifi(){
  lcd_reconnect_wifi();
  delay(1000);

  // Đợi có kết nối lại
  while (WiFi.status() != WL_CONNECTED){
    Serial.println("Reconnecting to WiFi ...");
    delay(1000);
  }

  lcd_connect_success();
  delay(1000);
}

// Hàm kết nối lại Broker
void reconnectBroker(){
  // Hiển thị thông báo
  lcd_connect_broker();
  Serial.println("Connecting to Broker ...");

  // Liên tục kết nối lại tới Broker
  while (!mqttClient.connected()){
    // Kết nối tới Broker
    // ESP32_SWS: id của thiết bị đăng ký vào (có thể là bất kỳ)
    // ESP32_SWS_OFFLINE: khi thiết bị mất mạng, thì broker sẽ publish một message vào topic này
    // ESP32_DISCONNECTED: Nội dung message offline
    if (mqttClient.connect("ESP32_SWS", "ESP32_SWS_OFFLINE", 0, 0, "ESP32_DISCONNECTED")){
      Serial.println("Connect success!");

      // Subscribe vào những topic cần thiết
      mqttClient.subscribe(commandTopic.c_str());

      lcd_connect_success();
    }
    else{
      Serial.print("Error, rc = ");
      Serial.print(mqttClient.state());
      Serial.println("Try again in 5s");

      delay(5000);
    }
  }
}

// Prototype cho hàm publishTo
void publishTo(String topic, String message);

// Hàm điều khiển máy bơm
void pumping(int t){
  digitalWrite(WATER_PUMP_PIN, HIGH); // Bật máy bơm qua relay
  lcd_pump_state(1, t); // Hiển thị LCD

  // Gửi tín hiệu bật máy bơm
  JSONVar json;
  json["id"] = deviceId;
  json["state"] = 1;
  json["duration"] = t;
  publishTo(stateTopic, JSON.stringify(json));
  
  delay(t);

  // Gửi tín hiệu tắt máy bơm
  json["state"] = 0;
  publishTo(stateTopic, JSON.stringify(json));
  digitalWrite(WATER_PUMP_PIN, LOW);
  lcd_pump_state(0, t);
}

// Hàm lấy khoảng thời gian (Đã xử lý tràn số)
unsigned long millis_interval(int t){
  return (unsigned long) (millis() - t);
}


// Hàm MQTT
// Hàm publish tới 1 topic
void publishTo(String topic, String message){
  mqttClient.publish(topic.c_str(), message.c_str());
}

// Hàm callback khi có message tới
void callback(char* topic, byte* payload, unsigned int length){
  Serial.print("New message from topic: ");
  Serial.println(topic);

  Serial.print("Message: ");
  for (i = 0; i < length; i++){
    Serial.print((char) payload[i]);
  }
  Serial.println();

  // Xử lý dữ liệu nhận được
  if ( (String) topic == commandTopic) {
    JSONVar command = JSON.parse((String) ((const char*) payload));

    // Kiểm tra xem có đúng là gửi tới thiết bị này không
    if(command["id"] == deviceId){
      Serial.println("Right ID");

      int t = (int) command["t"]; // Thời gian bơm

      Serial.print("Turn on water pump in "); Serial.print(t); Serial.println("ms");
      pumping(t); // Bật máy bơm
      Serial.println("Turn off water pump");
    }
  }
}


/// ---------   SYSTEM SETUP   ---------- ///
void setup() {
  // Cài đặt baudrate
  Serial.begin(baudrate);
  Serial.print("Baudrate: ");
  Serial.println(baudrate);

  // Cấu hình các GPIO
  pinMode(WATER_PUMP_PIN, OUTPUT);
  pinMode(TOUCH_SENSOR_PIN, INPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BLUE_LED_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);

  // Bật LED đỏ
  changeLed("red");

  // Cấu hình màn LCD
  Serial.println("Starting LCD ...");
  lcd.init();
  lcd.begin(LCD_WIDTH, LCD_HEIGHT);
  lcd.backlight();
  lcd_greeting();
  delay(1000);

  // Kết nối tới Wifi
  Serial.println("Connecting to Wifi ...");
  lcd_connect_wifi();
  delay(1000);
  WiFi.begin(ssid, password);
  lcd_connect_success();
  delay(1000);

  // Kết nối tới Broker
  Serial.println("Connecting to Broker ...");
  lcd_connect_broker();
  delay(1000);
  
  mqttClient.setServer(mqtt_server.c_str(), mqtt_port);
  mqttClient.setCallback(callback);
  
  lcd_connect_success();
  delay(1000);

  // Khởi tạo biến thời gian
  loop_t = millis();
  touch_t = millis();
}


/// --------- SYSTEM LOOP ---------- ///
void loop() {
  // Vòng loop đọc dữ liệu cảm biến chạm
  if (millis_interval(touch_t) > TOUCH_STEP){
    touch_value = digitalRead(TOUCH_SENSOR_PIN);

    if (touch_value){
      pumping(1000);
    }
  }
  
  // Vòng loop chính
  if (millis_interval(loop_t) > LOOP_STEP){
    loop_t = millis();
    
    // Đầu hàm: Xử lý kết nối và kết nối lại
    // Kiểm tra kết nối wifi và kết nối lại
    if(WiFi.status() != WL_CONNECTED){
      changeLed("red");
      reconnectWifi();
      return;
    }
    
    // Kiểm tra kết nối broker và kết nối lại
    if(!mqttClient.connected()){
      changeLed("red");
      reconnectBroker();
      return;
    }
  
    // Đọc dữ liệu trên MQTT queue
    mqttClient.loop();
    
    // Thân hàm: Xử lý dữ liệu
    // Đọc dữ liệu cảm biến gửi về từ Arduino
    changeLed("green");
    if(Serial.available()) {
      sensor_data = Serial.readString();
  
      // Tiền xử lý sensor data trong trường hợp stack dữ liệu quá nhiều
      sensor_data = sensor_data.substring(sensor_data.lastIndexOf('{'));
      
      Serial.print("Data: ");
      Serial.println(sensor_data);
  
      JSONVar json_data = JSON.parse(sensor_data);
  
      soil_humi = (int) json_data["doam"];
      water_level = (int) json_data["mucnuoc"];
      
      lcd_display_stats(soil_humi, water_level);

      // Thêm mã thiết bị vào data
      json_data["id"] = deviceId;
      
      publishTo(dataTopic, JSON.stringify(json_data));
    }
  }
}
