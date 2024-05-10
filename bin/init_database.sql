CREATE DATABASE test;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
FLUSH PRIVILEGES;
USE practice;


CREATE TABLE studentInfo (
    rollNo VARCHAR(15), 
    subCode VARCHAR(15),
    subName VARCHAR(15),
    grade VARCHAR(3), 
    acYear ENUM('1', '2', '3', '4'),
    sem ENUM('1', '2'),
    exYear INT, 
    exMonth ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'), 
    PRIMARY KEY (rollNo, subCode)
);

CREATE TABLE cbtSubjects (
    subCode VARCHAR(20),
    subName VARCHAR(20),
    branch VARCHAR(15),
    acYear ENUM('1', '2', '3', '4'),
    sem ENUM('1', '2'),
    regYear INT,
    PRIMARY KEY (subCode, subName, branch)
);

CREATE TABLE codeNames (
    subCode VARCHAR(20),
    subName VARCHAR(20),
    PRIMARY KEY (subCode)
);

CREATE TABLE fines (
    semChar ENUM('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H') PRIMARY KEY,
    fine_1 INT DEFAULT 0,
    fine_2 INT DEFAULT 0,
    fine_3 INT DEFAULT 0,
    fine_1Dt VARCHAR(255) DEFAULT 'N/A',
    fine_2Dt VARCHAR(255) DEFAULT 'N/A',
    fine_3Dt VARCHAR(255) DEFAULT 'N/A',
    no_fine VARCHAR(255) DEFAULT 'N/A'
);

CREATE TABLE costs (
    sbc INT DEFAULT 0,
    sac INT DEFAULT 0,
    sfc INT DEFAULT 0,
    rev INT DEFAULT 0,
    cbc INT DEFAULT 0,
    cac INT DEFAULT 0,
    cfc INT DEFAULT 0
);

CREATE TABLE grades (
    grade VARCHAR(3),
    gradePoint INT,
    PRIMARY KEY (grade)
);

CREATE TABLE paidCBT (
    rollNo VARCHAR(15),
    subCode VARCHAR(15),
    subName VARCHAR(15),
    acYear ENUM('1', '2', '3', '4'),
    sem ENUM('1', '2'),
    regDate VARCHAR(12),
    branch VARCHAR(12),
    user VARCHAR(12),
    grandTotal INT,
    PRIMARY KEY (rollNo, subCode)
);

CREATE TABLE paidReEvaluation (
    rollNo VARCHAR(15),
    subCode VARCHAR(15),
    subName VARCHAR(15),
    acYear ENUM('1', '2', '3', '4'),
    sem ENUM('1', '2'),
    regDate VARCHAR(12),
    stat CHAR(1),
    user VARCHAR(20),
    grandTotal INT,
    PRIMARY KEY (rollNo, subCode)
);

CREATE TABLE paidSupply (
    rollNo VARCHAR(15),
    subCode VARCHAR(15),
    subName VARCHAR(15),
    acYear ENUM('1', '2', '3', '4'),
    sem ENUM('1', '2'),
    regDate VARCHAR(12),
    user VARCHAR(20),
    grandTotal INT,
    PRIMARY KEY (rollNo, subCode)
);

CREATE TABLE printSupply (
    rollNo VARCHAR(15),
    subCode VARCHAR(15),
    subName VARCHAR(15),
    acYear ENUM('1', '2', '3', '4'),
    sem ENUM('1', '2'),
    regDate VARCHAR(12),
    user VARCHAR(20),
    grandTotal INT,
    PRIMARY KEY (rollNo, subCode)
);

CREATE TABLE printReval (
    rollNo VARCHAR(15),
    subCode VARCHAR(15),
    subName VARCHAR(15),
    acYear ENUM('1', '2', '3', '4'),
    sem ENUM('1', '2'),
    regDate VARCHAR(12),
    stat CHAR(1),
    user VARCHAR(20),
    grandTotal INT,
    PRIMARY KEY (rollNo, subCode)
);

CREATE TABLE printCBT (
    rollNo VARCHAR(15),
    subCode VARCHAR(15),
    subName VARCHAR(15),
    acYear ENUM('1', '2', '3', '4'),
    sem ENUM('1', '2'),
    regDate VARCHAR(12),
    branch VARCHAR(12),
    user VARCHAR(20),
    grandTotal INT,
    PRIMARY KEY (rollNo, subCode)
);

CREATE TABLE users (
    userName VARCHAR(255) PRIMARY KEY,
    displayName VARCHAR(255),
    password VARCHAR(255)
);

INSERT INTO users VALUES ("admin", "Admin", "6d6587811555580ab1b4f4c440dd612f");



INSERT INTO costs VALUES (900, 200, 1800, 1000, 200, 100, 500);
INSERT IGNORE INTO fines VALUES 
("A",100, 200, 300, "30 Mar, 24", "30 Mar, 24", "30 Mar, 24", "30 Mar, 24"),
("B",100, 200, 300, "30 Mar, 24", "30 Mar, 24", "30 Mar, 24", "30 Mar, 24"),
("C",100, 200, 300, "30 Mar, 24", "30 Mar, 24", "30 Mar, 24", "30 Mar, 24"),
("D",100, 200, 300, "30 Mar, 24", "30 Mar, 24", "30 Mar, 24", "30 Mar, 24"),
("E",100, 200, 300, "30 Mar, 24", "30 Mar, 24", "30 Mar, 24", "30 Mar, 24"),
("F",100, 200, 300, "30 Mar, 24", "30 Mar, 24", "30 Mar, 24", "30 Mar, 24"),
("G",200, 1000, 2000, "11 Apr, 24", "18 Apr, 24", "25 Apr, 24", "04 Apr, 24"),
("H",200, 1000, 2000, "11 Apr, 24", "18 Apr, 24", "25 Apr, 24", "04 Apr, 24")



