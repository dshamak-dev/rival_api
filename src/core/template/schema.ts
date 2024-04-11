import { RepositorySchema } from "core/repository/model";

const schema: RepositorySchema = {
  tag: {
    type: "string",
    unique: true,
  },
  sessionType: {
    type: "number",
    default: 0,
    require: true
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
    require: true
  },
  config: {
    type: "object",
    default: {},
  }
};

export default schema;
