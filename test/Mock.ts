import * as sinon from 'sinon';
import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import {Certificate} from '@fidm/x509';
import * as fs from 'fs';
import * as _ from 'lodash';

const state = {};

export class Mocker {
  context;
  clientIdentity;
  chaincodeStub;
  private userCertPath: string;
  private ID: string;
  private userCert: Buffer;
  private mspID: string;
  private attributes = {};
  updateUser?(options: {
    mspID?,
    userCertPath?,
  }): void;
  
  async with(options: {
    mspID: string;
    userCertPath: string;
  }): Promise<Mocker> {
    Object.assign(this, options);
    this.context = sinon.createStubInstance(Context);
    this.clientIdentity = sinon.createStubInstance(ClientIdentity);
    this.chaincodeStub = sinon.createStubInstance(ChaincodeStub);
    this.context.clientIdentity = this.clientIdentity;
    this.context.stub = this.chaincodeStub;
    this.initializeMemberFunctions;
    this.bindFakeFunctionsToStub();
    this.bindFakeFunctionsToClientIdentity();
    await this.loadFromCert();
    return this;
  }

  private initializeMemberFunctions() {
    this.updateUser = this.priv_updateUser;
  }

  private async priv_updateUser(options: {
    mspID,
    userCertPath?,
  }) {

    this.userCertPath = _.get(options, 'userCertPath', this.userCertPath);
    this.mspID = _.get(options, 'mspID', this.mspID);
    await this.loadFromCert();
  }

  private async loadFromCert(): Promise<void> {
    this.userCert = await fs.readFileSync(this.userCertPath);
    const certificate = Certificate.fromPEM(this.userCert);
    this.ID = `x509::${this.formatDN(certificate.subject)}::${this.formatDN(certificate.issuer)}`;
    const extension = certificate.extensions.find((ext) => ext.oid === "1.2.3.4.5.6.7.8.1");
    if (extension) {
      const str = extension.value.toString();
      const obj = JSON.parse(str);
      this.attributes = obj.attrs;
    }
  }

  private bindFakeFunctionsToClientIdentity() {
    this.clientIdentity.getMSPID.callsFake(() => { return this.mspID});
    this.clientIdentity.getID.callsFake(() => { return this.ID});
    this.clientIdentity.getAttributeValue.callsFake((attribute) => { return this.attributes[attribute];});
    this.clientIdentity.assertAttributeValue = ((attrName, attrValue) => {
      const attr = this.clientIdentity.getAttributeValue(attrName);
      if (attr === null) {
          return false;
      } else if (attrValue === attr) {
          return true;
      } else {
          return false;
      }
    });
  }

  private bindFakeFunctionsToStub() {
    this.chaincodeStub.getState.callsFake(async (key) => {
      return state[key];
    });

    this.chaincodeStub.putState.callsFake(async (key, value) => {
      state[key] = value;
    });
  }

  private formatDN(dn) {
    return dn.attributes.map((attribute) => {
        const value = attribute.value.replace('/', '\\/');
        return `/${attribute.shortName}=${value}`;
    }).join('');
}

  

}