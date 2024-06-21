# UW Madison Data Science for Sustainable Development Application API

## Overview

This API serves as the backend for the application process to the UW Madison Data Science for Sustainable Development program. It provides endpoints for submitting, updating, and deleting applications.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [API Endpoints](#api-endpoints)
6. [Rate Limiting](#rate-limiting)
7. [Error Handling](#error-handling)
8. [Development vs Production](#development-vs-production)
9. [Contributing](#contributing)
10. [License](#license)

## Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)
- Firebase account and project
- Firebase Admin SDK credentials

## Installation

1. Clone the repository:
   ```
   git clone [your-repo-url]
   cd [your-repo-name]
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Configuration

1. Create a `.env` file in the root directory with the following contents:
   ```
   PORT=8080
   NODE_ENV=development
   ```

2. Place your Firebase Admin SDK credentials file in the appropriate location:
   - For development: `./certs/oa-madison-firebase-adminsdk-tr5iw-80ae5b92fb.json`
   - For production: `/etc/secrets/oa-madison-firebase-adminsdk-tr5iw-80ae5b92fb.json`

## Running the Application

To start the server:

```
npm start
```

For development with auto-restart on file changes:

```
npm run dev
```

## API Endpoints

### POST /apply

Submit a new application.

Request body:
```json
{
  "first_name": "String",
  "last_name": "String",
  "email": "String",
  "phone_number": "String",
  "year": Number,
  "essay_questions": ["String"],
  "urls": ["String"]
}
```

### PUT /apply

Update an existing application.

Request body:
```json
{
  "applicationId": "String",
  "applicationData": {
    "first_name": "String",
    "last_name": "String",
    "email": "String",
    "phone_number": "String",
    "year": Number,
    "essay_questions": ["String"],
    "urls": ["String"]
  }
}
```

### DELETE /apply

Delete an existing application.

Request body:
```json
{
  "applicationId": "String"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Each IP is limited to 100 requests per 15-minute window.

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- 400: Invalid request (missing or invalid fields)
- 500: Database error
- 429: Rate limit exceeded

## Development vs Production

The application detects the environment based on the `NODE_ENV` variable:

- `development`: Uses local credentials file and enables additional logging.
- `production`: Uses credentials file from `/etc/secrets/` and optimizes for performance.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](LICENSE).
