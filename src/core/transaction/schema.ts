import { RepositorySchema } from "core/repository/model";

const schema: RepositorySchema = {
  stage: {
    type: "number",
    default: 0,
  },
  details: {
    type: "string",
    require: true,
    trim: true,
  },
  sourceId: {
    type: "string",
    require: true,
  },
  sourceType: {
    type: "number",
    require: true,
  },
  targetId: {
    type: "string",
    require: true,
  },
  targetType: {
    type: "number",
    require: true,
  },
  value: {
    type: "number",
    require: true,
  },
};

export default schema;
