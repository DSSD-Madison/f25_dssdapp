import express from 'express';
import awsIot from 'aws-iot-device-sdk';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';

console.log('Starting backend in ' + (isDevelopment ? 'development' : 'production') + ' mode');

const serviceAccountPath = isDevelopment
  ? './certs/hiro-v1-firebase-adminsdk-n9cku-9c56012404.json'
  : '/etc/secrets/hiro-v1-firebase-adminsdk-n9cku-9c56012404.json';

const keyPath = isDevelopment
  ? './certs/aws_private.pem.key'
  : '/etc/secrets/aws_private.pem.key';

const certPath = isDevelopment
  ? './certs/backend_device_certificate.pem.crt'
  : '/etc/secrets/backend_device_certificate.pem.crt';

const caPath = isDevelopment
  ? './certs/AmazonRootCA1.pem'
  : '/etc/secrets/AmazonRootCA1.pem';

initializeApp({
  credential: cert(require(serviceAccountPath)),
});

const db = getFirestore();

// Initialize AWS IoT client
const client = new awsIot.device({
  keyPath: keyPath,
  certPath: certPath,
  caPath: caPath,
  clientId: 'BACKEND',
  region: 'us-west-1',
  host: 'a3ps9iapa1fps3-ats.iot.us-west-1.amazonaws.com',
});

// Initialize Express application
const app = express();
const port = 8080;

// Add middleware for JSON parsing
app.use(express.json());

// Start the Express server
app.listen(port, () => { 
  console.log(`Server is running on port ${port}`);
  // Event handler when the AWS IoT client connects
  client.on("connect", () => {
    console.log("Backend has now connected to AWS IoT");
  });

  // Event handler for receiving messages from AWS IoT
  client.on("message", (topic, payload) => {
    console.log("Message received from AWS IoT:", topic, payload.toString());
  });

  client.on("close", () => {
    console.log("Backend has now disconnected from AWS IoT");
  }); 

  client.on("error", (error) => {
    console.error("Error:", error);
  });

  client.on("reconnect", () => {
    console.log("Backend has now reconnected to AWS IoT");
  });
});

// API endpoint for handling POST requests
app.post('/api', async (req, res) => {
  interface RequestBody {
    uid: string;
    topic: string;
    data: { id: string };
  }

  const { uid, topic, data }: RequestBody = req.body;

  console.log('POST request received from ' + req.body.uid);

  // Check token validity and required parameters
  if (uid && await checkCred(uid) && topic && data) {
    // Publish message to AWS IoT
    client.publish(topic, JSON.stringify(data));
    // Query the Firestore collection for the provided uid and deviceId
    db.collection('devices').doc(`${data.id}`).get()
      .then((doc) => {
        // If the document exists, update it
        if (doc.exists) {
          db.collection('devices').doc(`${data.id}`).update(data);
        } else { 
          // If the document doesn't exist, create it
          db.collection('devices').doc(`${data.id}`).set(data);
        }
        res.status(200).json({ msg: `Message successfully sent to ${topic}` });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: error });
      });
    // Return success message
  } else {
    res.status(401).json({ error: 'Invalid token or missing parameters' });
  }
});

async function checkCred(uid: string): Promise<boolean> {
  try {
    const userCollection = db.collection('users');

    // Query the Firestore collection for the provided uid and token
    const userDoc = await userCollection.doc(uid).get();

    // If the document exists and the token matches, consider it valid
    if (userDoc.exists && userDoc.data()?.uid === uid) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error checking token:', error);
    return false; // Return false in case of an error
  }
}
