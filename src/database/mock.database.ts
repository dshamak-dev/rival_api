import fs from "fs";
import path from "path";
import { randomId } from "../utils/random.utils";
import { PayloadDTO } from "src/services/versus/versus.model";


const cachePath = path.join(__dirname, "./cache.json");
let mockDB: Record<string, any> = {};

if (fs.existsSync(cachePath)) {
  mockDB = JSON.parse(fs.readFileSync(cachePath)?.toString()) || {};
}

type QueryType = Record<string, any>;
type PayloadType = Record<string, any>;

async function save(data) {
  return new Promise((res, rej) => {
    console.log("save", data);

    fs.writeFile(cachePath, JSON.stringify(data), (error) => {
      if (error) {
        return rej(error);
      }

      return res(data);
    });
  });
}

export class DatabaseMockModel {
  name: string;

  get table() {
    let _table = mockDB[this.name];
    console.log(_table);

    if (!_table) {
      _table = mockDB[this.name] = [];
    }

    return _table;
  }

  constructor(name: string, initialData: typeof mockDB = null) {
    this.name = name;

    if (initialData) {
      Object.assign(mockDB, initialData);
    }
  }

  async connect() {
    return true;
  }

  async findOneAndUpdate<T>(
    query: QueryType,
    payload: PayloadType
  ): Promise<T | null> {
    const record: any = await this.findOne(query);

    if (!record || !record._id) {
      return null;
    }

    const { _id, ...other } = payload;

    const updated = await this.set(record._id, other);

    return updated;
  }
  async findOneAndDelete<T>(query: QueryType): Promise<boolean> {
    const record = this.findOne(query);

    if (!record) {
      return false;
    }

    return false;
  }
  async findOne<T>(query: QueryType): Promise<T | null> {
    return this.table.find((it) => matchQuery(query, it));
  }

  async findAndUpdate<T>(
    query: QueryType,
    payload: PayloadType
  ): Promise<T[] | null> {
    return null;
  }
  async findAndDelete<T>(query: QueryType): Promise<boolean> {
    return false;
  }
  async find<T>(query: QueryType): Promise<T[] | null> {
    return this.table.filter((it) => matchQuery(query, it));
  }

  async create<T>(payload: PayloadDTO): Promise<T | null> {
    const _id = randomId(8);

    if (!mockDB[this.name]) {
      mockDB[this.name] = [];
    }

    const _record = {
      ...payload,
      _id,
    } as T;

    mockDB[this.name].push(_record);

    await save(mockDB);

    return _record;
  }

  delete(id: string) {
    const index = this.table.findIndex((it) => matchQuery({ _id: id }, it));

    if (index === -1) {
      return null;
    }

    const results = this.table.splice(index, 1);

    return results[0];
  }

  async set(id: string, payload) {
    const index = this.table.findIndex((it) => matchQuery({ _id: id }, it));

    if (index === -1) {
      return null;
    }

    const nextState = Object.assign({}, { ...this.table[index] }, payload);
    const results = this.table.splice(index, 1, nextState);

    await save(mockDB);

    return results[0];
  }
}

async function matchQuery<T>(query: QueryType, item: T) {
  if (!item) {
    return false;
  }

  return Object.entries(query).every(([key, value]) => {
    return item[key] == value;
  });
}
