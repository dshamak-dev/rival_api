import { RepositorySchema } from "core/repository/model";

const schema: RepositorySchema = {
  tag: {
    type: "string",
    unique: true,
  },
  visibility: {
    type: "number",
    default: 0,
  },
  type: {
    type: "number",
    default: 0,
  },
  title: {
    type: "string",
    require: true,
    trim: true,
  },
  details: {
    type: "string",
  },
  ownerId: {
    type: "string",
  },
  stage: {
    type: "number",
    default: 0,
  },
  created: {
    type: "string",
  },
  users: {
    type: "array",
    default: [],
  },
  transactions: {
    type: "array",
    default: [],
  },
  config: {
    type: "object",
    default: {},
  },
  state: {
    type: "object",
    default: {},
  },
  result: {
    type: "object",
    default: {},
  },
};

export default schema;
