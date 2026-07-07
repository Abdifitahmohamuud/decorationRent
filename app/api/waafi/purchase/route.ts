import { NextResponse } from 'next/server';
import { waafiPurchase, WaafiPayError } from '@/lib/waafi_api';
import { storeSuccessfulPayment } from '@/lib/payments';
import { prisma } from '@/lib/prisma';

/**
 * Expected request body:
 * {
 *   accountNo: string,   // payer mobile, international format, NO "+" or leading zero (e.g. 252611111111)
 *   amount: number,
 *   currency: string,    // ISO 4217, e.g. "USD"
 *   referenceId: string, // your unique order/transaction reference
 *   description?: string,
 *   bookingId?: string   // optional – link payment to a booking
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      accountNo,
      amount,
      currency,
      referenceId: requestReferenceId,
      description,
      bookingId,
    } = body;
    console.log('WaafiPay request body:', { accountNo, amount, currency, requestReferenceId, description, bookingId });

    // --- basic presence check ---
    if (!accountNo || !amount || !currency || !requestReferenceId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // --- amount: up to 2 decimal places ---
    if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) {
      return NextResponse.json(
        { success: false, message: 'Amount must have up to two decimal places' },
        { status: 400 }
      );
    }
    if (Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, message: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    // --- accountNo: international format, digits only, no leading "+" or "0" ---
    // WaafiPay docs: 10-20 chars, e.g. 252611111111
    if (!/^[1-9]\d{9,19}$/.test(String(accountNo))) {
      return NextResponse.json(
        {
          success: false,
          message:
            'accountNo must be in full international format (digits only, no "+" or leading zero), e.g. 252611111111',
        },
        { status: 400 }
      );
    }

    // --- referenceId: letters, numbers, dashes, underscores, dots only ---
    if (!/^[A-Za-z0-9\-_.]{1,50}$/.test(String(requestReferenceId))) {
      return NextResponse.json(
        {
          success: false,
          message:
            'referenceId may only contain letters, numbers, dashes, underscores, and dots (max 50 chars)',
        },
        { status: 400 }
      );
    }

    // --- currency: ISO 4217, 3 uppercase letters ---
    if (!/^[A-Z]{3}$/.test(String(currency))) {
      return NextResponse.json(
        { success: false, message: 'currency must be a 3-letter ISO 4217 code, e.g. USD' },
        { status: 400 }
      );
    }

    // --- Call WaafiPay ---
    const waafiResp = await waafiPurchase({
      accountNo,
      amount: Number(amount),
      currency,
      referenceId: requestReferenceId,
      description,
    });

    // Log raw response for debugging
    console.log('WaafiPay raw response:', waafiResp);

    const responseCode = waafiResp.responseCode;
    const responseMsg = waafiResp.responseMsg;
    const errorCode = waafiResp.errorCode;
    const params = waafiResp.params ?? {};
    const state = (params.state ?? '').toUpperCase();
    const transactionId = params.transactionId ?? '';
    const responseReferenceId = params.referenceId ?? '';
    const txAmount = params.txAmount ?? '';

    // Determine payment status based on Waafi response
    const paymentStatus = state || (responseCode === '2001' ? 'PENDING' : 'FAILED');

    // Prepare base payload
    const basePayload = {
      raw: waafiResp,
      responseCode,
      responseMsg,
      errorCode,
      state,
      paymentStatus,
      transactionId,
      referenceId: responseReferenceId,
      amount: txAmount,
    };

    // CASE 1: success && APPROVED
    if (responseCode === '2001' && state === 'APPROVED') {
      // Store payment record
      let paymentRecord = null;
      if (bookingId) {
        paymentRecord = await storeSuccessfulPayment({
          bookingId,
          amount: Number(amount),
          transactionId,
          phoneNumber: accountNo,
          referenceId: responseReferenceId,
          responseCode,
          responseMessage: responseMsg,
          rawPaymentResponse: waafiResp,
        });
      }

      return NextResponse.json({
        success: true,
        ...basePayload,
        paymentId: paymentRecord?.id ?? null,
      });
    }

    // CASE 2: request ok but not approved (e.g., REJECTED, CANCELLED, TIMEOUT)
    if (responseCode === '2001') {
      // Record failed payment attempt for auditing
      if (bookingId) {
        const { recordFailedPayment } = await import('@/lib/payments');
        await recordFailedPayment({
          bookingId,
          amount: Number(amount),
          transactionId,
          phoneNumber: accountNo,
          paymentStatus: state,
          waafiResponse: waafiResp,
        });
      }
      return NextResponse.json({
        success: false,
        ...basePayload,
        message: waafiResp.responseMsg || 'Processed',
      });
    }

    // CASE 3: request failed (non‑2001)
    // Record failed payment attempt if bookingId is present
    if (bookingId) {
      const { recordFailedPayment } = await import('@/lib/payments');
      await recordFailedPayment({
        bookingId,
        amount: Number(amount),
        transactionId: '',
        phoneNumber: accountNo,
        paymentStatus: 'FAILED',
        waafiResponse: waafiResp,
      });
    }
    return NextResponse.json({
      success: false,
      ...basePayload,
      message: waafiResp.responseMsg || 'Error',
    });
  } catch (err: any) {
    // Request-level WaafiPay failure (bad credentials, invalid params, etc.)
    if (err instanceof WaafiPayError || err.name === 'WaafiPayError') {
      return NextResponse.json(
        {
          success: false,
          state: err.state ?? null,
          message: err.message,
          responseCode: err.responseCode,
        },
        { status: 400 }
      );
    }

    // Network-level failure (DNS, timeout, connection refused, etc.)
    if (err.message?.includes('Network')) {
      return NextResponse.json({ success: false, message: err.message }, { status: 502 });
    }

    console.error(err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}