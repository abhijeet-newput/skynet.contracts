import { QuotationInterface, QuotationOptions, QuotationState } from '../Interface/Quotation';
import * as Errors from './Errors';
import * as moment from 'moment';
import validator from 'validator';
import { Itinerary } from './Itinerary';
import { validateQuotationStateChange } from './TxnValidator';
import { assert } from 'chai';

export class Quotation implements QuotationInterface {
    _id;
    itineraryID;
    sellerID;
    buyerID;
    estimatedCost;
    negotiatedCost;
    currency;
    private status;
    negotiationStatus;
    createdAt;
    validTill;
    private allowedFields = [
        '_id',
        'itineraryID',
        'sellerID',
        'buyerID',
        'estimatedCost',
        'negotiatedCost',
        'currency',
        'status',
        'negotiationStatus',
        'createdAt',
        'validTill',
        'authorativeSignature',
    ];
    private authorativeSignature;
    private isVerified;
    constructor(options: QuotationOptions) {

        Object.keys(options).forEach((k) => {
            if (this.allowedFields.indexOf(k) === -1) {
              delete options[k];
            }
          });

        Object.assign(this, options);

        options.validate = () => {
            if (!this.itineraryID || validator.isUUID(this.itineraryID.substring(3,this.itineraryID.length))) {
                throw new Errors.BadRequestError('Invalid Itinerary ID');
            }
            if (!this.sellerID  || !validator.isUUID(this.sellerID.substring(3,this.sellerID.length))) {
                throw new Errors.BadRequestError('sellerID invalid');
            }
            if (!this.buyerID  || !validator.isUUID(this.buyerID.substring(3,this.buyerID.length))) {
                throw new Errors.BadRequestError('buyerID invalid');
            }
            if (!this.estimatedCost || this.estimatedCost < 1) {
                throw new Errors.BadRequestError('Invalid estimated cost');
            }
            if (!this.negotiatedCost || this.negotiatedCost < 1) {
                throw new Errors.BadRequestError('Invalid estimated cost');
            }
            if (!this.validTill || this.validTill.isAfter(this.createdAt)) {
                throw new Errors.BadRequestError('ValidTill must be a future date');
            }
            if (!this.authorativeSignature) {
                throw new Errors.ForbiddenError('Cannot create a quotation without authorative signature');
            }
        };
        this.checkAndsetQuoteExpired();
    }

    private setQuotationAccepted(): void {
        this.status = QuotationState.ACCEPTED;
    }

    private setQuotationDeclined(): void {
        this.status = QuotationState.DECLINED;
    }

    private setQuotationWithdrawn(): void {
        this.status = QuotationState.WITHDRAWN;
    }

    // if a quote is not accepted and expiry date exceeded
    private checkAndsetQuoteExpired(): void {
        if (moment.utc().isAfter(this.validTill) && this.status !== QuotationState.ACCEPTED) {
            this.status = QuotationState.EXPIRED;
        }
    }

    // private signQuoteBySeller(proposer): void {
    //     this.proposerSignature = createHash('md5').update(proposer).digest('hex');
    // }

    acceptQuoteByBuyer(itinerary: Itinerary, callerSignature: string) : void {
        try {
            validateQuotationStateChange(this, itinerary, callerSignature, QuotationState.ACCEPTED);
            assert.equal(itinerary.getVerificationStatus(), true, `No valid verification completed successfully prior state change`);
            this.setQuotationAccepted();
            itinerary.setBidSold(callerSignature, this.sellerID);
        } catch (error) {
            throw new Errors.ForbiddenError(error);
        }
    }

    declineQuoteByBuyer(itinerary: Itinerary, callerSignature: string) : void {
        try {
            validateQuotationStateChange(this, itinerary, callerSignature, QuotationState.DECLINED);
            assert.equal(itinerary.getVerificationStatus(), true, `No valid verification found prior state change`);
            this.setQuotationDeclined();
            itinerary.setBidOpen(callerSignature);
        } catch (error) {
            throw new Errors.ForbiddenError(error);
        }
    }

    withDrawQuoteBySeller(itinerary: Itinerary, callerSignature: string) : void {
        try {
            validateQuotationStateChange(this, itinerary, callerSignature, QuotationState.WITHDRAWN);
            assert.equal(this.isVerified, true, `No valid verification found prior state change`);
            this.setQuotationWithdrawn();
        } catch (error) {
            throw new Errors.ForbiddenError(error);
        }
    }

    validateAuthorativeSignature(signatureToVerify: string) : boolean {
        if (this.authorativeSignature === signatureToVerify) {
            this.isVerified = true;
            return true;
        }
        return false;
    }

    getVerificationStatus(): boolean {
        return this.isVerified;
    }

    getStatus(): QuotationState {
        return this.status;
    }

    /**
     * Deserialize a state data to itinerary
     * @param {Buffer} buffer to form back into the object
     */
    static fromBuffer(buffer: Buffer): Quotation {
        const json = JSON.parse(buffer.toString());
        const object = new Quotation(json);
        return object;
    }

    toBuffer(): Buffer {
        return Buffer.from(JSON.stringify(this));
    }
}