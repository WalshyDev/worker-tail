import React from 'react';

import connect from './utils/websocket';
import * as Utils from './utils/utils';

export default class App extends React.Component {
  constructor(props) {
    super(props);

    let accountId = '';
    let authEmail = '';
    let authKey = '';

    const savedDetails = localStorage.getItem('details');
    if (savedDetails !== null && savedDetails !== undefined) {
      const obj = JSON.parse(savedDetails);

      accountId = obj.accountId;
      authEmail = obj.authEmail;
      authKey = obj.authKey;
    }

    this.state = {
      accountId,
      workerName: '',
      authEmail,
      authKey,
      msg: {},
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.saveDetails = this.saveDetails.bind(this);
    this.logRef = React.createRef();
  }

  onChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  onSubmit() {
    const { accountId, workerName, authEmail, authKey } = this.state;

    // Check if we're using a key or a token. Keys are in hex and Tokens are in base64.
    const headers = {};
    if (/^[a-f0-9]+$/.test(authKey)) {
      headers['X-Auth-Email'] = authEmail;
      headers['X-Auth-Key'] = authKey;
    } else {
      headers['Authorization'] = 'Bearer ' + authKey;
    }

    console.log(headers);

    Utils.log(this.logRef, 'Loading websocket...')

    fetch(`https://cf-cors.walshydev.workers.dev/client/v4/accounts/${accountId}/workers/scripts/${workerName}/tails`, {
      method: 'POST',
      headers
    })
      .then(res => res.json())
      .then(obj => {
        if (!obj.success) {
          for (const msg of obj.errors) {
            Utils.error(this.logRef, msg.message);
          }
          return;
        }

        const url = obj.result.url
        Utils.log(this.logRef, `Connecting to ${url}/ws...`)
        connect(url + '/ws', 'trace-v1', () => {
          Utils.log(this.logRef, 'Connected!')
        }, async (msg) => {
          const json = await Utils.toJson(msg);

          Utils.logEvent(this.logRef, json);
        }, async (error) => {
          console.error(error);
          const json = await Utils.toJson(error);

          Utils.logEvent(this.logRef, json);
        })
      })
      .catch(error => {
        console.error(error);
        Utils.error(this.logRef, JSON.stringify(error));
      })
  }

  saveDetails() {
    const { accountId, authEmail, authKey } = this.state;

    if (accountId.length > 0 && authKey.length > 0) {
      localStorage.setItem('details', JSON.stringify({ accountId, authEmail, authKey }));
      this.setState({ msg: { class: 'success', message: 'Saved!' } });
    } else {
      this.setState({ msg: { class: 'error', message: 'Fill in at least the Account ID and Auth Token (and email if applicable)' } });
    }
  }

  render() {
    const { accountId, workerName, authEmail, authKey, msg } = this.state;

    return (
      <div className="container">
        <span>If you're using a API Token then the email field is not required. If you're using an API Key then both are required!</span>
        <br />
        <span>
          <b>Recommended way to auth is with an API Token</b> -{' '}
          <a href="/wrangler-tail.png">Click here</a>{' '}
          for an image of what the token creation should look like
        </span>
        <div className="input-group">
          <input
            type="text"
            className="input"
            onChange={this.onChange}
            name="accountId"
            placeholder="Account ID"
            value={accountId}
          />

          <input
            type="text"
            className="input"
            onChange={this.onChange}
            name="workerName"
            placeholder="Worker Name"
            value={workerName}
          />

          <input
            type="text"
            className="input"
            onChange={this.onChange}
            name="authEmail"
            placeholder="Auth Email"
            value={authEmail}
          />

          <input
            type="text"
            className="input"
            onChange={this.onChange}
            name="authKey"
            placeholder="Auth Token"
            value={authKey}
          />

          <button
            type="submit"
            className="button"
            onClick={this.onSubmit}
          >
            Start Tail
          </button>

          <button
            type="button"
            className="button"
            onClick={this.saveDetails}
          >
            Save Details in Browser
          </button>
        </div>

        {msg && <div><span className={msg.class}>{msg.message}</span></div>}

        <textarea
          id="log"
          autoCorrect="off"
          spellCheck="false"
          cols="40"
          rows="40"
          disabled
          wrap="soft"
          ref={this.logRef}
          value="------------ Start of Tail log ------------"
        />
      </div>
    );
  }
}
