export type GUID = string & { isGuid: true};
import * as moment from 'moment';
export enum QuotationState {
    'QUOTED',
    'ACCEPTED',
    'DECLINED',
    'WITHDRAWN',
    'EXPIRED',
}

export enum NegotiationStatus {
    'PROPOSED',
    'ADJUSTED',
    'ACCEPTED',
    'DECLINED',
}

export enum Currency {
    'EUR',
    'USD',
    'INR',
  }

export interface QuotationInterface {
    _id: GUID;
    itineraryID: GUID;
    sellerID: GUID;
    buyerID: GUID;
    estimatedCost: number;
    negotiatedCost?: number;
    currency: Currency;
    negotiationStatus: NegotiationStatus;
    createdAt: moment.Moment;
    validTill: moment.Moment;
}

export interface QuotationOptions extends QuotationInterface {
    status: QuotationState;
    authorativeSignature: string;
    validate?(): void;
}