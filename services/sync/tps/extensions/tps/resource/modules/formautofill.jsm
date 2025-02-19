/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 /* This is a JavaScript module (JSM) to be imported via
  * Components.utils.import() and acts as a singleton. Only the following
  * listed symbols will exposed on import, and only when and where imported.
  */

var EXPORTED_SYMBOLS = ["Address", "CreditCard", "DumpAddresses", "DumpCreditCards"];

ChromeUtils.import("resource://tps/logger.jsm");
ChromeUtils.import("resource://formautofill/FormAutofillStorage.jsm");
ChromeUtils.import("resource://formautofill/MasterPassword.jsm");

class FormAutofillBase {
  constructor(props, subStorageName, fields) {
    this._subStorageName = subStorageName;
    this._fields = fields;

    this.props = {};
    this.updateProps = null;
    if ("changes" in props) {
      this.updateProps = props.changes;
    }
    for (const field of this._fields) {
      this.props[field] = (field in props) ? props[field] : null;
    }
  }

  get storage() {
    return profileStorage[this._subStorageName];
  }

  Create() {
    this.storage.add(this.props);
  }

  Find() {
    return this.storage._data.find(entry =>
      this._fields.every(field => entry[field] === this.props[field])
    );
  }

  Update() {
    const {guid} = this.Find();
    this.storage.update(guid, this.updateProps, true);
  }

  Remove() {
    const {guid} = this.Find();
    this.storage.remove(guid);
  }
}

function DumpStorage(subStorageName) {
  Logger.logInfo(`\ndumping ${subStorageName} list\n`, true);
  const entries = profileStorage[subStorageName]._data;
  for (const entry of entries) {
    Logger.logInfo(JSON.stringify(entry), true);
  }
  Logger.logInfo(`\n\nend ${subStorageName} list\n`, true);
}

const ADDRESS_FIELDS = [
  "given-name",
  "additional-name",
  "family-name",
  "organization",
  "street-address",
  "address-level2",
  "address-level1",
  "postal-code",
  "country",
  "tel",
  "email",
];

class Address extends FormAutofillBase {
  constructor(props) {
    super(props, "addresses", ADDRESS_FIELDS);
  }
}

function DumpAddresses() {
  DumpStorage("addresses");
}

const CREDIT_CARD_FIELDS = [
  "cc-name",
  "cc-number",
  "cc-exp-month",
  "cc-exp-year",
];

class CreditCard extends FormAutofillBase {
  constructor(props) {
    super(props, "creditCards", CREDIT_CARD_FIELDS);
  }

  Find() {
    return this.storage._data.find(entry => {
      entry["cc-number"] = MasterPassword.decryptSync(entry["cc-number-encrypted"]);
      return this._fields.every(field => entry[field] === this.props[field]);
    });
  }
}

function DumpCreditCards() {
  DumpStorage("creditCards");
}
