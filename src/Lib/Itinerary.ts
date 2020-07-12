import { ItineraryInterface, ItineraryOptions, BidState } from '../Interface/Itinerary';
import * as Errors from './Errors';
import * as moment from 'moment';
import validator from 'validator';
import { validateItineraryBidStateChange } from './TxnValidator';
import { assert } from 'chai';
export class Itinerary implements ItineraryInterface {
  _id;
  origin;
  destination;
  departure;
  arrival;
  distance;
  pax;
  bidStartTime;
  bidEndTime;
  sellerID;
  buyerID;
  private allowedFields = ['_id',
    'origin',
    'destination',
    'departure',
    'arrival',
    'distance',
    'pax',
    'bidStartTime',
    'bidEndTime',
    'sellerID',
    'buyerID',
    'authorativeSignature',
    'currency',
    'createdAt',
    'bidState',
  ];
  private bidState;
  currency;
  createdAt;
  private authorativeSignature;
  private isVerified;

  constructor(options: ItineraryOptions) {

    Object.keys(options).forEach((k) => {
      if (this.allowedFields.indexOf(k) === -1) {
        delete options[k];
      }
    });

    Object.assign(this, options);

    options.validate = () => {
      // validating dates
      if (!this.origin) {
        throw new Errors.BadRequestError('origin can not be null');
      }
      if (!this.destination) {
        throw new Errors.BadRequestError('destination can not be null');
      }
      if (!this.departure || moment.utc().isAfter(this.departure)) {
        throw new Errors.BadRequestError('departure can not be null or a past date');
      }
      if (!this.arrival  || moment.utc().isAfter(this.arrival)) {
        throw new Errors.BadRequestError('departure can not be null or a past date');
      }
      if (!this.distance || this.distance < 0) {
        throw new Errors.BadRequestError('distance can not be null or less than 0');
      }
      if (!this.pax || this.pax < 1) {
        throw new Errors.BadRequestError('pax can not be null or less than 1');
      }
      if (!this.bidStartTime  || moment.utc().isAfter(this.bidStartTime)) {
        throw new Errors.BadRequestError(`invalid bidStartTime for curr_time: ${moment.utc().format()}`);
      }
      if (!this.bidEndTime  || moment.utc().isAfter(this.bidEndTime)) {
        throw new Errors.BadRequestError(`invalid bidStartTime for curr_time: ${moment.utc().format()}`);
      }
      if (this.sellerID  && !validator.isUUID(this.sellerID)) {
        throw new Errors.BadRequestError('sellerID invalid');
      }
      if (!this.buyerID  || !validator.isUUID(this.buyerID)) {
        throw new Errors.BadRequestError('buyerID invalid');
      }
      // if (this.departure.isValid()) {
      //   throw new Errors.BadRequestError('Invalid departure date');
      // }
      // if (this.arrival.isValid()) {
      //   throw new Errors.BadRequestError('Invalid arrival date');
      // }
      if (moment.utc(this.departure).isAfter(this.arrival)) {
        throw new Errors.BadRequestError('arrival date and departure date must be chronological');
      }
      if (moment.utc(this.bidStartTime).isAfter(this.bidEndTime)) {
        throw new Errors.BadRequestError('bid start and bid end time must be chronological');
      }
      if (moment.utc(this.departure).isBefore(this.bidEndTime)) {
        throw new Errors.BadRequestError('bid must end before departure date');
      }
      if (!(new RegExp(/([A-Z]{4})$/)).test(this.origin)) {
        throw new Errors.BadRequestError('invalid origin airport code');
      }
      if (!(new RegExp(/([A-Z]{4})$/)).test(this.destination)) {
        throw new Errors.BadRequestError('invalid origin destination code');
      }
      if(!this.authorativeSignature) {
        throw new Errors.ForbiddenError('itinerary creation forbidden without an authorative signature');
      }

    };

    options.validate();
    this.checkAndsetBidDead();
  }

  isBiddable(): boolean {
    return this.bidState === BidState.OPEN && moment.utc().isBefore(this.bidEndTime);
  }

  setBidOpen(callerSignature: string): void {
    try {
      validateItineraryBidStateChange(this, callerSignature, BidState.OPEN);
      assert.equal(this.isVerified, true, `No valid verification found prior state change`);
      this.bidState = BidState.OPEN;
    } catch(error) {
      throw new Errors.ForbiddenError(error);
    }
  }

  setBidClosed(callerSignature: string): void {
    try {
      validateItineraryBidStateChange(this, callerSignature, BidState.CLOSED);
      assert.equal(this.isVerified, true, `No valid verification found prior state change`);
      this.bidState = BidState.CLOSED;
    } catch(error) {
      throw new Errors.ForbiddenError(error);
    }
  }

  setBidSold(callerSignature: string, sellerID: string): void {
    try {
      validateItineraryBidStateChange(this, callerSignature, BidState.SOLD);
      assert.equal(this.isVerified, true, `No valid verification completed successfully prior state change`);
      this.bidState = BidState.SOLD;
      this.sellerID = sellerID;
    } catch(error) {
      throw new Errors.ForbiddenError(error);
    }
  }

  private checkAndsetBidDead(): void {
    if (moment.utc().isAfter(this.bidEndTime) && this.bidState === BidState.OPEN) {
      this.bidState = BidState.DEAD;
    }
  }

  validateAuthorativeSignature(signatureToVerify: string) : boolean {
    if(this.authorativeSignature === signatureToVerify) {
      this.isVerified = true;
      return true;
    }
    return false;
  }

  getVerificationStatus(): boolean {
    return this.isVerified;
  }

  getBidStatus(): BidState {
    return this.bidState;
  }

  /**
   * Deserialize a state data to itinerary
   * @param {Buffer} buffer to form back into the object
   */
  static fromBuffer(buffer: Buffer): Itinerary {
    const json = JSON.parse(buffer.toString());
    const object = new Itinerary(json);

    return object;
  }

  toBuffer(): Buffer {
    return Buffer.from(JSON.stringify(this));
  }

}
