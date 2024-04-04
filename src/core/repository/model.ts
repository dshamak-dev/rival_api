import mongoose from "mongoose";

export type RepositorySchema = Record<string, RepositorySchemaField>;

export interface RepositorySchemaField {
  type: string;
  default?: any;
  require?: boolean;
  unique?: boolean;
  trim?: boolean;
  lowercase?: boolean;
}

export type RepositorySchemaType =
  | "string"
  | "number"
  | "date"
  | "object"
  | "array";

export class Repository {
  model: mongoose.Model<any>;

  constructor(model: mongoose.Model<any>) {
    this.model = model;
  }

  create(payload) {
    const body = {
      ...payload,
    };

    return this.model?.create(body);
  }

  find(query) {
    return this.model?.find(query);
  }

  findOne(query) {
    return this.model?.findOne(query);
  }

  findAndUpdate(filter, payload) {
    return this.model?.updateMany(filter, payload, { new: true });
  }

  findOneAndUpdate(filter, payload) {
    return this.model?.findOneAndUpdate(filter, payload, { new: true });
  }

  findAndDelete(filter) {
    return this.model?.deleteMany(filter);
  }

  findOneAndDelete(filter) {
    return this.model?.findOneAndDelete(filter);
  }

  addToArray(filter: any, field: string, items: any[]) {
    return this.model?.findOneAndUpdate(
      filter,
      { $addToSet: { [field]: { $each: items } } },
      { new: true }
    );
  }

  removeFromArray(filter: any, field: string, item: any) {
    return this.model?.findOneAndUpdate(
      filter,
      { $pull: { [field]: item } },
      { new: true }
    );
  }

  setToObject(filter: any, path: string, { key, value }) {
    return this.model?.findOneAndUpdate(
      filter,
      { $set: { [`${path}.${key}`]: value } },
      { upsert: true, new: true }
    );
  }

  incrementNumber(filter: any, field: string, value: number) {
    return this.model?.findOneAndUpdate(
      filter,
      { $inc: { [field]: value } },
      { new: true }
    );
  }

  decrementNumber(filter: any, field: string, value: number) {
    return this.model?.findOneAndUpdate(
      filter,
      { $inc: { [field]: -value } },
      { new: true }
    );
  }
}
