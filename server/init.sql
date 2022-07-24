-- File SQL khởi tạo bảng cho CSDL

use sws;

-- Bảng tài khoản người dùng
create table account (
	id int(10) not null auto_increment primary key,
    username varchar(50) not null,
    password varchar(50) not null,
    name varchar(50) not null,
    avatar varchar(100) not null
);

-- Bảng thông tin tổng quát hệ thống bơm
create table watering_system (
	id int(10) not null auto_increment primary key,
    acc_id int(10) not null,
    device_id varchar(50) not null,
    tree_type varchar(50) not null,
    image varchar(100) not null,
    description varchar(200) not null,
    humi_threshold int(10) not null default 10,
    pump_duration int(10) not null default 1000,
    pump_state bool not null default false,
    last_watering datetime not null default current_timestamp,
    foreign key (acc_id) references account(id)
);

-- Bảng thông tin hiện tại
create table system_stats (
	id int(10) not null auto_increment primary key,
    system_id int(10) not null,
    device_id varchar(50) not null,
    soil_humi int(10) not null default 0,
    water_level int(10) not null default 0,
    read_time datetime not null default current_timestamp,
    foreign key (system_id) references watering_system(id)
);

-- Thông tin về các lần bơm
create table watering (
	id int(10) not null auto_increment primary key,
    system_id int(10) not null,
    device_id varchar(50) not null,
    water_time datetime not null default current_timestamp,
    duration int(10) not null,
    foreign key (system_id) references watering_system(id)
);

-- Cấu hình quyền tài khoản root
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';
flush privileges;