export type GUID = string & { isGuid: true};
import * as moment from 'moment';
export enum BidState {
  'OPEN',
  'DEAD',
  'CLOSED',
  'SOLD',
}

export enum Currency {
  'EUR',
  'USD',
  'INR',
}


export interface ItineraryInterface {
  _id: GUID;
  origin: string;
  destination: string;
  departure: Date;
  arrival: Date;
  distance: number;
  pax: number;
  bidStartTime: Date;
  bidEndTime: Date;
  sellerID?: GUID;
  buyerID: GUID;
  currency: Currency;
  createdAt: moment.Moment;

}

export interface ItineraryOptions extends ItineraryInterface {
  authorativeSignature: string;
  bidState: BidState;
  validate?(): void;
}

export interface ItineraryArgument extends ItineraryInterface {
  mpin: number;
}