# Exam Branch 2.0 API

## Introduction

The Exam Branch 2.0 API allows users to manage tasks ... TODO intro in progress

**Base URL**: `http://ip_addr:port/api/`

**Authentication**:
To authenticate with the Custom Token Authentication API, clients must obtain a custom authentication token by sending a valid username and password to the `/login` endpoint.

## Endpoints

## Login (`POST /api/login`)

- **Purpose**: Authenticate a user and obtain a custom authentication token.
- **Request Format**:
  - _Headers_: None
  - _Parameters_: None
  - _Body_:
    ```json
    {
    	"username":  string,
    	"password":  string
    }
    ```
    - Example
    ```json
    {
      "username": "admin",
      "password": "admin@123"
    }
    ```
- **Response Format**:

  - Status Code: 200 OK
  - **On Valid Creds**

    - _Headers_:

    ```
    	set-cookie: Token=user%404smep4b5aa2neo4n7c3cf8effansi428; Path=/; HttpOnly
    ```

    - _Body_:

    ```ts
    {
      "goahead": boolean,
      "username": string,
      "displayName": string
    }
    ```

    - Example

    ```json
    {
      "goahead": true,
      "username": "admin",
      "displayName": "AD"
    }
    ```

  - **On invalid Creds**
    - _Body_:
    ```ts
    {
     "goahead": boolean,
     "error": string
    }
    ```
    - Example
    ```json
    {
      "goahead": false,
      "error": "<Reason>"
    }
    ```

## CBT

_Base url_: `/cbt`

### Search (`GET /api/cbt/search`)

- **Purpose**: To retrieve all the sub a student can apply for CBT
- **Request Format**:

  - _Headers_: `Cookie: Token=<auth-token>`

  - _Parameters_:
    - `acYear` (required, (1 | 2 | 3 | 4)) : Current academic year
    - `sem` (required, (1 | 2)) : Current sem
    - `reg` (required, number): Current regulation (20XX)
    - `branch` (required, string): Student branch (CSE, ECE etc.)
    - `rollNo` (required, string): Student roll Number

- **Response Format**:

  - _Status Code_: 200 OK

  - _Body_:

    ```ts
    {
    	"subCodes": string[],
    	"subNames": string[],
    	"printTableExist": boolean
    }
    ```

    - Example

    ```json
    {
      "subCodes": [
        "18CE4112",
        "18CE4113",
        "18CE41L1",
        "18CE41L2",
        "18CH1201",
        "18CS1101"
      ],
      "subNames": ["SWM", "MINIPRO", "SADLAB", "EELAB", "EC", "PPS"],
      "printTableExist": false
    }
    ```

- **Authentication**: Required

### Print (`POST /api/cbt/print/:rollNo`)

- **Purpose**: To add all the selected subjects to printcbt table.
- **Request Format**:

  - _Headers_: `Cookie: Token=<auth-token>`

  - _Path Parameters_:
    - `rollNo` (required, string): Student roll number.
  - _Body_:
    ```ts
    {
    	"acYear": number,
    	"sem": number,
    	"subCodes": string[],
    	"subNames": string[],
    	"branch": string[],
    	"username": string
    }
    ```
    - Example
    ```json
    {
      "acYear": 3,
      "sem": 2,
      "subCodes": ["18CE4112", "18CE4113", "18CE41L1", "18CE41L2"],
      "subNames": ["SWM", "MINIPRO", "SADLAB", "EELAB"],
      "branch": "CSE",
      "username": "admin"
    }
    ```

- **Response Format**:

  - Status Code: 200 OK

  - Body:
    ```ts
    {
    	"done": boolean,
    	"error"?: string
    }
    ```

- **Authentication**: Required

### Paid (`POST /api/cbt/paid/:rollNo`)

- **Purpose**: To add all the selected subjects to paidcbt table.

- **Request Format**:

  - _Headers_: `Cookie: Token=<auth-token>`

  - _Path Parameters_:
    - `rollNo` (required, string): Student roll number.
  - _Body_:
    ```ts
    {
    	"acYear": number,
    	"sem": number,
    	"subCodes": string[],
    	"subNames": string[],
    	"branch": string[],
    	"username": string
    }
    ```
    - Example
    ```json
    {
      "acYear": 3,
      "sem": 2,
      "subCodes": ["18CE4112", "18CE4113", "18CE41L1", "18CE41L2"],
      "subNames": ["SWM", "MINIPRO", "SADLAB", "EELAB"],
      "branch": "CSE",
      "username": "admin"
    }
    ```

- **Response Format**:

  - _Status Code_: 200 OK

  - _Body_:
    ```ts
    {
    	"done": boolean,
    	"error"?: string
    }
    ```

- **Authentication**: Required

## Download

_Base url_: `/download`

### Table (`GET /api/download/table/:tableName`)

- **Purpose**: To download table tables in `.xslx` format.

- **Request Format**:

  - _Headers_: `Cookie: Token=<auth-token>`

  - _Path Parameters_:
    - `tableName` (required, ('paidsupply' | 'printsupply' | 'paidreevaluation' | 'printreval' | 'paidcbt' | 'printcbt' | 'studentinfo')): Student roll number.
  - _Query Parameters_:
    - `acYear` (required, (0 | 1 | 2 | 3 | 4)) : Current academic year (0 indicate all the acYears)
    - `sem` (required, (0 | 1 | 2)) : Current sem (0 indicate all the sems)

- **Response Format**:

  - _Status Code_: 200 OK
  - _Headers_:
    ```
    Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    ```
  - _Body_:
    ```
    <File Content>
    ```

- **Authentication**: Required

## Upload

_Base Url_: `/upload`

### Results (`POST /api/upload/results`)

- **Purpose**: To upload results into studentinfo.

- **Request Format**:
  - _Headers_: `Cookie: Token=<auth-token>`
