import { IntentPayload } from "features/transaction/models/transaction.intent.module";

export const assetPackages: IntentPayload[] = [
  {
    id: 'int-1',
    title: "Try it out",
    cost: {
      value: 2,
      currency: "usd",
    },
    assets: 5,
  },
  {
    id: 'int-2',
    title: "Easy start",
    cost: {
      value: 10,
      currency: "usd",
    },
    assets: 35,
  },
  {
    id: 'int-3',
    title: "Be competitor",
    cost: {
      value: 25,
      currency: "usd",
    },
    assets: 90,
  },
  {
    id: 'int-4',
    title: "The Rival",
    cost: {
      value: 50,
      currency: "usd",
    },
    assets: 200,
  },
];
