export type RepositorySchema = Record<string, { type: string; default?: any;  }>;

export class Repository {
  model;

  constructor(model) {
    this.model = model;
  }
}