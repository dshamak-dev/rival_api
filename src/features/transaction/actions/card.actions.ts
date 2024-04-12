import { createTransaction, sendAssets } from "core/transaction/actions";
import {
  TransactionDTO,
  TransactionPartyType,
  TransactionPayloadDTO,
  TransactionStageType,
} from "core/transaction/model";
import { IntentPayload } from "features/transaction/models/transaction.intent.module";
import Stripe from "stripe";
import repository from "core/transaction/repository";

const STRIPE_PUBLIC_KEY =
  "pk_test_51P3yg6A8Fob392a1mzD45BNXXBSqV9V2PNAdFZaFESoGu0swOz4Zj7ko40g7BSUq4FhIDn1HINogcaxlTE6L2Jbq00Y8MuBlQO";
const STRIPE_SECRET_KEY =
  "sk_test_51P3yg6A8Fob392a1xxXoPOA2SFADKJfKFrOUuXlBGCoAjkq0vOXtBWSyQOAw0A8BM7AiUIRKwMqatMPtKzf76j2q00aTsPviMy";

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function createIntent(userId, product: IntentPayload) {
  const cost = product.cost;

  if (cost?.value < 1) {
    return Promise.reject("Invalid amount");
  }

  const payload = {
    amount: cost.value * 100,
    currency: cost.currency,
    description: product?.details || product.title,
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
  };

  try {
    const intent = await stripe.paymentIntents.create(payload);

    if (!intent?.id) {
      return Promise.reject("Invalid intent");
    }

    const transaction = await createIntentTransaction(
      userId,
      product.assets,
      intent
    );

    return intent;
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function confirmIntent(userId, intentId: string) {
  if (!intentId) {
    return Promise.reject("Invalid intent");
  }

  const transaction = await repository.findOne({
    sourceId: intentId,
    sourceType: TransactionPartyType.INTENT,
  });

  if (transaction && [TransactionStageType.Draft, TransactionStageType.Pending].includes(transaction.stage)){
    await sendAssets(transaction.targetId, transaction.targetType, transaction.value);

    return repository.findOneAndUpdate({ _id: transaction._id }, { stage: TransactionStageType.Confirm });
  }

  return Promise.reject("Invalid action");
}

export async function createIntentTransaction(
  userId,
  value,
  intent
): Promise<TransactionDTO> {
  const payload: TransactionPayloadDTO = {
    targetId: userId,
    targetType: TransactionPartyType.User,
    sourceId: intent.id,
    sourceType: TransactionPartyType.INTENT,
    details: intent.description,
    value,
  };

  return createTransaction(payload);
}

export async function createCardTransaction() {}
