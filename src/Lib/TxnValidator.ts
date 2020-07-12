import { QuotationState } from '../Interface/Quotation';
import { assert } from 'chai';
import { Quotation } from './Quotation';
import { Itinerary } from './Itinerary';
import { BidState } from '../Interface/Itinerary';

export function validateQuotationStateChange(quotation: Quotation, itinerary: Itinerary, callerSignature: string, state: QuotationState) : void {
    switch(state) {
        case QuotationState.ACCEPTED :  assert.notEqual(quotation.getStatus(), QuotationState.EXPIRED, `Quotation has expired. No further action can be taken on it.`);
                                        assert.equal(quotation.getStatus(), QuotationState.QUOTED, `Invalid state transfer from [${quotation.getStatus()}] to [${QuotationState.ACCEPTED}]`);
                                        assert.equal(itinerary.getBidStatus(), BidState.OPEN, `Invalid Itinerary bid state. Can't accept a quote in ${itinerary.getBidStatus()} bid status`);
                                        assert.equal(itinerary.validateAuthorativeSignature(callerSignature), true, `Signature invalid. Only author of Itinerary can sign this.`);
                                        break;
        case QuotationState.DECLINED:   assert.notEqual(quotation.getStatus(), QuotationState.EXPIRED, `Quotation has expired. No further action can be taken on it.`);
                                        assert.notEqual(quotation.getStatus(), QuotationState.DECLINED, `Invalid state transfer from [${quotation.getStatus()}] to [${QuotationState.DECLINED}]`);
                                        assert.notEqual(quotation.getStatus(), QuotationState.WITHDRAWN, `Invalid state transfer from [${quotation.getStatus()}] to [${QuotationState.WITHDRAWN}]`);
                                        assert.equal(itinerary.validateAuthorativeSignature(callerSignature), true, `Signature invalid. Only author of Itinerary can sign this`);
                                        break;
        case QuotationState.WITHDRAWN:  assert.notEqual(itinerary.getBidStatus(), BidState.SOLD, `Invalid Itinerary bid state. Can't withdraw a quote in ${itinerary.getBidStatus()} bid status`);
                                        assert.notEqual(quotation.getStatus(), QuotationState.EXPIRED, `Quotation has expired. No further action can be taken on it.`);
                                        assert.equal(quotation.validateAuthorativeSignature(callerSignature), true, `Signature invalid. Only proposer of quotationß can sign this.`);
    }
}

export function validateItineraryBidStateChange(itinerary: Itinerary, callerSignature: string, state: BidState): void {
    switch(state) {
        case BidState.OPEN: // assert.notEqual(itinerary.getBidStatus(), BidState.SOLD, `Invalid state change from ${itinerary.getBidStatus()} to ${BidState.OPEN}`);
                            assert.notEqual(itinerary.getBidStatus(), BidState.OPEN, `Invalid state change from ${itinerary.getBidStatus()} to ${BidState.OPEN}`);
                            assert.equal(itinerary.validateAuthorativeSignature(callerSignature), true, `Authorative Signature Invalid`);
                            break;
        case BidState.CLOSED: assert.notEqual(itinerary.getBidStatus(), BidState.SOLD, `Invalid state change from ${itinerary.getBidStatus()} to ${BidState.CLOSED}`);
                            assert.notEqual(itinerary.getBidStatus(), BidState.CLOSED, `Invalid state change from ${itinerary.getBidStatus()} to ${BidState.CLOSED}`);
                            assert.equal(itinerary.validateAuthorativeSignature(callerSignature), true, `Authorative Signature Invalid`);
                            break;
        case BidState.SOLD: assert.equal(itinerary.getBidStatus(), BidState.OPEN, `Invalid state change from ${itinerary.getBidStatus()} to ${BidState.SOLD}`);
                            assert.equal(itinerary.validateAuthorativeSignature(callerSignature), true, `Authorative Signature Invalid`);
                            break;
    }
}