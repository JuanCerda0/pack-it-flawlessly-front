import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_vidDVo9o0',
      userPoolClientId: '94eeoi7jbi4vdp80oeb81992l',
      loginWith: {
        oauth: {
          domain: 'us-east-1viddvo9o0.auth.us-east-1.amazoncognito.com',
          scopes: [
            'email',
            'openid',
            'profile',
            'packit-api/read'
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
