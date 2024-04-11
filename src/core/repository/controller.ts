import mongoose from "mongoose";
import { RepositorySchema } from "core/repository/model";

export function createRepositoryModel(name: string, schema: RepositorySchema) {
  const _model =
    mongoose.models[name] || mongoose.model(name, parseSchema(schema));

  return _model;
}

function parseSchema(schema: RepositorySchema): mongoose.Schema {
  const payload = {};

  Object.entries(schema).forEach(([key, { type, ...other }]) => {
    payload[key] = {
      ...other,
      type: parseSchemaType(type),
    };
  });

  return new mongoose.Schema(payload);
}

function parseSchemaType(type: string) {
  switch (type) {
    case "string": {
      return String;
    }
    case "number": {
      return Number;
    }
    case "object": {
      return Object;
    }
    case "array": {
      return Array;
    }
    case "date": {
      return Date;
    }
    default: {
      return type;
    }
  }
}
