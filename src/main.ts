import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_jLX2TXZjN',
      userPoolClientId: '4vhn242cnbnjqdi9uupf9qpt16',
      loginWith: {
        oauth: {
          domain: 'us-east-1jlx2txzjn.auth.us-east-1.amazoncognito.com',
          scopes: [
            'email',
            'openid',
            'profile',
            'pedidos360-api/pedidos-api-read'
          ],
          redirectSignIn: ['http://localhost:4200'],
          redirectSignOut: ['http://localhost:4200'],
          responseType: 'code'
        }
      }
    }
  }
});

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));
