import { TripChaincode } from '../../src/Chaincode/Trip';
import { expect } from 'chai';
import * as path from 'path';
import { Mocker } from '../Mock';
import moment from 'moment';
let chaincode: TripChaincode;
let msp;
let userCertPath;
let sampleItinerary;
let itinerary_id;
let quotation_id;
let sampleQuote;
let brokerMpin;
let operatorMpin;

before(async () => {
  chaincode = new TripChaincode();
  msp = {
    broker: 'brokerMSP',
    operator: 'operatorMSP',
    customer: 'customerMSP',
  };
  userCertPath = {
    customer: path.resolve('./test/usercerts/customer.pem'),
    broker: path.resolve('./test/usercerts/broker.pem'),
    operator: path.resolve('./test/usercerts/operator.pem'),
  };
  brokerMpin = '1234';
  operatorMpin = `4321`;
  sampleItinerary = {
    origin : 'KBOS',
    destination: 'KEFT',
    departure: moment.utc().add(1, 'day').format(),
    arrival: moment.utc().add(1, 'day').format(),
    distance: 999,
    pax: 2,
    bidStartTime: moment.utc().add(1, 'hours').format(),
    bidEndTime: moment.utc().add(20, 'hours').format(),
    currency: 'USD',
    mpin: brokerMpin 
  };

  sampleQuote = {
    estimatedCost: '45000',
    currency: 'USD',
    validTill: moment.utc().add(1, 'day').format(),
    mpin: operatorMpin,
  }
});

describe('Trip chaincode init', () => {
  it ('should init Trip chaincode', async() => {
    const mocker = new Mocker();
    const mocked = await mocker.with({
      mspID: msp.broker,
      userCertPath: userCertPath.broker,
    });
    const response = await chaincode.instantiate(mocked.context);
    expect(response.status).to.be.equal(200);
  })
});


describe('createItinerary', () => {
  it('should create itinerary', async() => {
    const mocker = new Mocker();
    const mocked = await mocker.with({
      mspID: msp.broker,
      userCertPath: userCertPath.broker,
    });
    try {
      const response = await chaincode.createItinerary(mocked.context, sampleItinerary);
      expect(response.status).to.be.equal(200);

      // inspecting state
      const state = JSON.parse((await mocked.context.stub.getState(response.payload['_id'])).toString('ascii'));
      expect(state).to.haveOwnProperty('_id');
      itinerary_id = state._id;
    } catch(err) {
      expect(err).to.be.equal(null, `Error encountered : ${err.message}`);
    }
  });
});

describe('createQuote', () => {
  it('should create a quote for an itinerary', async () => {
    const mocker = new Mocker();
    const mocked = await mocker.with({
      mspID: msp.operator,
      userCertPath: userCertPath.operator,
    });
    try {
      const response = await chaincode.createQuote(mocked.context, {
        itineraryID: itinerary_id,
        ... sampleQuote,
      });
      expect(response.status).to.be.equal(200);

      // inspecting state
      const state = JSON.parse((await mocked.context.stub.getState(response.payload['_id'])).toString('ascii'));
      expect(state).to.haveOwnProperty('_id');
      quotation_id = state._id;
    } catch(err) {
      expect(err).to.be.equal(null, `Error encountered : ${err.message}`);
    }
  });
  it('should throw error itinerary not found', async () => {
    const mocker = new Mocker();
    const mocked = await mocker.with({
      mspID: msp.operator,
      userCertPath: userCertPath.operator,
    });
    try {
      const response = await chaincode.createQuote(mocked.context, {
        itineraryID: 'wrong_itinerary_id',
        ... sampleQuote,
      });
      expect(true).to.be.equal(false, 'Error. Quote created with fake itinerary ID');
    } catch(err) {
      expect(err.status).to.be.equal(404);
    }
  });
});

describe('change quote state', () => {
  it('should throw quote not found error: quoted -> accepted', async () => {
    const mocker = new Mocker();
    const mocked = await mocker.with({
      mspID: msp.operator,
      userCertPath: userCertPath.operator,
    });
    try {
      const response = await chaincode.changeQuoteState(mocked.context, 'fake_qoute_id', 1, 4321);
      expect(true).to.be.equal(false, 'Error. Quote created with fake itinerary ID');
    } catch(err) {
      expect(err.status).to.be.equal(404);
    }
  });

  it('should throw forbidden due to invalid signature: quoted -> accepted', async () => {
    const mocker = new Mocker();
    const mocked = await mocker.with({
      mspID: msp.operator,
      userCertPath: userCertPath.operator,
    });
    try {
      const response = await chaincode.changeQuoteState(mocked.context, quotation_id, 1, 4321);
      expect(true).to.be.equal(false, 'Error. Quote created with wrong signature');
    } catch(err) {
      expect(err.status).to.be.equal(403);
    }
  });

  it('should throw forbidden error due invalid signature: quoted -> withdrawn', async () => {
    const mocker = new Mocker();
    const mocked = await mocker.with({
      mspID: msp.broker,
      userCertPath: userCertPath.broker,
    });
    try {
      const response = await chaincode.changeQuoteState(mocked.context, quotation_id, 3, 1234);
      expect(response.status).to.be.equal(200);
    } catch(err) {
      expect(err.status).to.be.equal(403);
    }
  });


  it('should throw forbidden due invalid mpin: quoted -> accepted', async () => {
    const mocker = new Mocker();
    const mocked = await mocker.with({
      mspID: msp.broker,
      userCertPath: userCertPath.broker,
    });
    try {
      const response = await chaincode.changeQuoteState(mocked.context, quotation_id, 1, 4321);
      expect(true).to.be.equal(false, 'Error. Quote created with wrong mpin');
    } catch(err) {
      expect(err.status).to.be.equal(403);
    }
  });

  it('should change quotation state to accepted: quoted -> accepted', async () => {
    const mocker = new Mocker();
    const mocked = await mocker.with({
      mspID: msp.broker,
      userCertPath: userCertPath.broker,
    });
    try {
      const response = await chaincode.changeQuoteState(mocked.context, quotation_id, 1, 1234);
      expect(response.status).to.be.equal(200);
    } catch(err) {
      expect(err.status).to.be.equal(403);
    }
  });

  it('should change quotation state to declined: quoted -> declined', async () => {
    const mocker = new Mocker();
    const mocked = await mocker.with({
      mspID: msp.broker,
      userCertPath: userCertPath.broker,
    });
    try {
      const response = await chaincode.changeQuoteState(mocked.context, quotation_id, 2, 1234);
      expect(response.status).to.be.equal(200);
    } catch(err) {
      expect(err.status).to.be.equal(403);
    }
  });

  it('should change quotation state: declined -> withdrawn', async () => {
    const mocker = new Mocker();
    const mocked = await mocker.with({
      mspID: msp.broker,
      userCertPath: userCertPath.broker,
    });
    try {
      const response = await chaincode.changeQuoteState(mocked.context, quotation_id, 3, 1234);
      expect(response.status).to.be.equal(200);
    } catch(err) {
      expect(err.status).to.be.equal(403);
    }
  });
})
