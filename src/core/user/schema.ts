import { RepositorySchema } from "core/repository/model";

const schema: RepositorySchema = {
  email: {
    type: "string",
    require: true,
    unique: true,
    trim: true
  },
  password: {
    type: "string",
    require: true,
    trim: true
  },
  fullName: {
    type: "string",
    require: true,
    trim: true
  },
  assets: {
    type: "number",
    default: 0
  },
  transactions: {
    type: "array",
    default: []
  },
  sessions: {
    type: "array",
    default: []
  },
};

export default schema;