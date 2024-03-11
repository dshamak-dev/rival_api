import { RepositorySchema } from "core/repository/model";

const schema: RepositorySchema = {
  capacity: {
    type: "number",
    default: -1,
  },
  visibility: {
    type: "number",
    default: 0,
  },
  type: {
    type: "number",
    default: 0,
  },
  ownerId: {
    type: "string",
  },
  stage: {
    type: "number",
    default: 0,
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