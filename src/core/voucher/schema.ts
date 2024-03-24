export default {
  code: {
    type: "string",
    require: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  details: {
    type: "string",
    require: true,
    trim: true,
  },
  capacity: {
    type: "number",
    require: true
  },
  value: {
    type: "number",
    require: true
  },
  users: {
    type: "array",
    default: []
  },
  ownerId: {
    type: "string"
  },
  ownerType: {
    type: "number"
  },
};