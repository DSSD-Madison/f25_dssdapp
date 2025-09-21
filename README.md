# API Documentation

## Overview

This API allows users to apply for the **Data Science for Sustainable Development (DSSD)** program at UW Madison. It handles application submissions, email notifications, and application deletion requests.

## Endpoints

### 1. **`GET /health`**

**Description**: A simple health check to ensure the API is running.
**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-09-20T12:00:00.000Z",
  "environment": "production",
  "emailEnabled": true
}
```

### 2. **`GET /`**

**Description**: Serves the `index.html` file located in the `public` directory.
**Response**: A static HTML page.

### 3. **`POST /apply`**

**Description**: Submits a new application to the program.
**Request Body** (JSON):

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "johndoe@example.com",
  "year": 2025
}
```

**Response**:

* **Success** (201):

  ```json
  {
    "message": "Application submitted successfully",
    "applicationId": "app_1234567890",
    "email_sent": "Confirmation email sent to johndoe@example.com"
  }
  ```
* **Error** (400/500):

  ```json
  {
    "error": "Invalid request data",
    "details": ["email is required", "year must be between 2025 and 2030"],
    "errorType": "INVALID_REQUEST"
  }
  ```

### 4. **`DELETE /apply`**

**Description**: Deletes an existing application using the `applicationId`.
**Query Parameters**:

* `applicationId` (e.g., `app_1234567890`)

**Response**:

* **Success** (200):

  ```json
  {
    "message": "Application deleted successfully",
    "applicationId": "app_1234567890",
    "email_sent": "Confirmation email sent to johndoe@example.com"
  }
  ```
* **Error** (400/404/500):

  ```json
  {
    "error": "Invalid or missing application ID",
    "errorType": "INVALID_APPLICATION_ID"
  }
  ```

## Process

1. **Application Submission (`/apply`)**:

   * Users send their first name, last name, email, and desired year.
   * The API validates the input using **Yup** and stores the application in **Firestore**.
   * If the application is successfully submitted, a confirmation email is sent to the user, including their application details.

2. **Application Deletion (`/apply`)**:

   * Users can delete their application by providing the `applicationId`.
   * Upon successful deletion, a confirmation email is sent, and the application is removed from Firestore.

3. **Rate Limiting**:

   * The `POST /apply` endpoint is rate-limited to 10 requests per IP within 5 minutes to prevent abuse.

4. **Email Notifications**:

   * After application submission, a **welcome email** is sent with application details.
   * After application deletion, a **deletion confirmation email** is sent.

## Dependencies

* **Express**: Web framework for routing.
* **Firebase Admin SDK**: To interact with Firestore for data storage.
* **Nodemailer**: For sending email notifications.
* **Yup**: For validating incoming application data.
* **dotenv**: For managing environment variables.

## Environment Variables

Ensure the following environment variables are set in your `.env` file:

```env
NODE_ENV=development
PORT=8080
FIREBASE_SERVICE_ACCOUNT={"type": "service_account", "project_id": "oa-madison","private_key_id":.....
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

## Notes

* Ensure Firebase Firestore is properly configured and accessible via the provided service account.
* If the email service is not configured correctly, email-related features (welcome and deletion emails) will be skipped.

