'use strict';

// Fabric smart contract classes
import { Contract, Context } from 'fabric-contract-api';
import * as Entities from '../Lib/index';
import { ItineraryInterface, ItineraryOptions, BidState, GUID, ItineraryArgument } from '../Interface/Itinerary';
import * as moment from 'moment';
import { v1 } from 'uuid';
import { QuotationInterface, QuotationOptions, QuotationState, NegotiationStatus, QuotationArgument } from '../Interface/Quotation';
import { createHash } from 'crypto';
import * as Errors from '../Lib/Errors';
import { Response, IResponse } from '../Lib/Response';
import * as _ from 'lodash';




export class TripChaincode extends Contract {

    constructor() {
        super('skynet.trip');
    }

    // /**
    //  * Instantiate to perform any setup of the ledger that might be required.
    //  * @param {Context} ctx the transaction context
    //  */
    async instantiate(ctx: Context): Promise<IResponse> {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        return Response.success({
            msg: 'ALL OK',
            msp: ctx.clientIdentity.getMSPID(),
            id: ctx.clientIdentity.getID(),
            companyID: ctx.clientIdentity.getAttributeValue('companyID'),
        });
    }

    /**
     * @param {Context} ctx the transaction context
     * @param {String} pld itinerary payload
     */

    async createItinerary(
        ctx: Context,
        pld: unknown,
    ): Promise<IResponse> {

        const payload : ItineraryArgument = _.attempt(JSON.parse, pld);

        if (payload instanceof Error) {
            throw new Errors.BadRequestError('Invalid payload');
        }

        const clientIdentity = ctx.clientIdentity;

        const buyerID = clientIdentity.getAttributeValue('companyID');
        // check buyerID
        if (!buyerID) {
            throw new Errors.ForbiddenError('CompanyID not found in certificate');
        }

        const itineraryOptions : ItineraryOptions = {
            ... payload,
            buyerID: buyerID as GUID,
            _id: 'IT-' + v1() as GUID,
            bidState: BidState.OPEN,
            authorativeSignature : createHash('md5').update(`${clientIdentity.getID()}-${payload.mpin}`).digest('hex'),
            createdAt: moment.utc(),
        };

        const itinerary = new Entities.Itinerary(itineraryOptions);

        await ctx.stub.putState(itinerary._id, itinerary.toBuffer());

        return Response.success(itinerary);

    }

    /**
     * @param {Context} ctx the transaction context
     * @param {String} pld quote payload
     */
    async createQuote(
        ctx: Context,
        pld: unknown,
    ): Promise<IResponse> {

        const payload : QuotationArgument = _.attempt(JSON.parse, pld);

        if (payload instanceof Error) {
            throw new Errors.BadRequestError('Invalid payload');
        }
        const clientIdentity = ctx.clientIdentity;
        // get seller ID from certificate
        const sellerID = clientIdentity.getAttributeValue('companyID');
        if (!sellerID) {
            throw new Errors.ForbiddenError('Only a seller type identity can create a quote.');
        }
        // check itinerary in ledger
        const ledgerItinerary = await ctx.stub.getState(payload.itineraryID);
        if (!(ledgerItinerary && ledgerItinerary.toString())) {
            throw new Errors.RecordNotFoundError('Itinerary not found');
        }

        const itinerary = Entities.Itinerary.fromBuffer(ledgerItinerary as Buffer);
        // check state of the bid
        if (itinerary.getBidStatus() !== BidState.OPEN) {
            throw new Errors.ForbiddenError('Itinerary not in biddable state.');
        }

        const quotationOptions : QuotationOptions = {
            ... payload,
            sellerID: sellerID as GUID,
            buyerID: itinerary.buyerID,
            _id: 'QT-' + v1() as GUID,
            status: QuotationState.QUOTED,
            negotiationStatus: NegotiationStatus.PROPOSED,
            createdAt: moment.utc(),
            authorativeSignature: createHash('md5').update(`${clientIdentity.getID()}-${payload.mpin}`).digest('hex'),
        };

        const quotation = new Entities.Quotation(quotationOptions);

        await ctx.stub.putState(quotation._id, quotation.toBuffer());

        return Response.success(quotation);
    }

    async changeQuoteState(
        ctx: Context,
        quotationID: string,
        state: QuotationState,
        mpin: number
    ): Promise<IResponse> {
        const clientIdentity = ctx.clientIdentity;
        // get the quotation
        const ledgerQuotation = await ctx.stub.getState(quotationID);
        if (!(ledgerQuotation && ledgerQuotation.toString())) {
            throw new Errors.RecordNotFoundError('Quotation not found');
        }
        const quotation = Entities.Quotation.fromBuffer(ledgerQuotation as Buffer);

        const ledgerItinerary = await ctx.stub.getState(quotation.itineraryID);
        if (!(ledgerItinerary && ledgerItinerary.toString())) {
            throw new Errors.RecordNotFoundError('Itinerary not found');
        }

        const itinerary = Entities.Itinerary.fromBuffer(ledgerItinerary as Buffer);

        const callerSignature = createHash('md5').update(`${clientIdentity.getID()}-${mpin}`).digest('hex');

        switch(state) {
            case QuotationState.ACCEPTED:
                quotation.acceptQuoteByBuyer(itinerary, callerSignature);
                break;
            case QuotationState.DECLINED:
                quotation.declineQuoteByBuyer(itinerary, callerSignature);
                break;
            case QuotationState.WITHDRAWN:
                quotation.withDrawQuoteBySeller(itinerary, callerSignature);
                break;
            default :
                throw new Errors.ForbiddenError('Invalid state change');
        }

        await ctx.stub.putState(quotation._id, quotation.toBuffer());
        await ctx.stub.putState(quotation.itineraryID, itinerary.toBuffer());

        return Response.success({
            quotation,
            itinerary,
        });
        // updating quote status
    }


}
