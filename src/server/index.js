// const result = fetch('https://fcm.googleapis.com/v1/projects/myproject-b5ae1/messages:send HTTP/1.1',{
//     method:'POST',
// },)
const admin = require('firebase-admin');
const express = require('express');

const serviceAccount = require('./service_account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(express.json());

app.post('/send-notification', async (req, res) => {
  try {

    const { user_id, title, body, data } = req.body;
    console.log({ user_id, title, body, data });

    const userRef = admin.firestore().doc(`users/${user_id}`);

    const _tokens = await userRef.get().then(res => {
      console.log({ res: res.data() });
      return res.data()?.fcm_token;
    });

    const message = {
      token: _tokens[0],
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    const response = await admin.messaging().send({
      ...message,
      android: {
        priority: 'high',
      },
    });

    console.log({ response });

    res.status(200).send('notification sent');
  } catch (error) {
    console.log({ error });
    res.status(400).send('Notification failed to send');
  }
});

app.listen(3000, () => {
  console.log('Server started...');
});
