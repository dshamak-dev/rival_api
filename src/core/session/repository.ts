import { Repository } from "core/repository/model";
import { model } from "core/session/model";
import { randomId } from "utils/random.utils";

class SessionRepository extends Repository {
  create(payload) {
    const body = {
      created: new Date().toISOString(),
      ...payload,
      tag: payload.tag || randomId(6),
    };

    return this.model?.create(body);
  }
}

const _repo = new SessionRepository(model);

export default _repo;
