import { SessionType } from "core/session/model";
import { TemplateDTO, TemplatePayloadDTO } from "core/template/model";
import repository from "core/template/repository";
import * as gameActions from "prefabs/game/controls";
import { GamePayloadDTO } from "prefabs/game/model";

export async function filterTemplates(filter) {
  return repository.find(filter);
}

export async function createTemplate(
  payload: TemplatePayloadDTO
): Promise<TemplateDTO> {
  return repository.create(payload);
}

export async function findTemplate(
  id: TemplateDTO["_id"]
): Promise<TemplateDTO> {
  return repository.findOne({ _id: id });
}

export async function updateTemplate(
  id: TemplateDTO["_id"],
  payload
): Promise<TemplateDTO> {
  return repository.findOneAndUpdate({ _id: id }, payload);
}

export async function deleteTemplate(
  id: TemplateDTO["_id"]
): Promise<TemplateDTO> {
  return repository.findOneAndDelete({ _id: id });
}

export async function createFromTemplate(id: TemplateDTO["_id"], props = null) {
  const _temp = await findTemplate(id);

  if (!_temp) {
    return Promise.reject("Invalid template");
  }

  const { _id, sessionType, title, details, ownerId, config } = _temp;

  const payload: any = {
    ...props,
    title,
    details,
    ownerId,
    config,
  };

  switch (sessionType) {
    case SessionType.Game: {
      return gameActions.create(payload);
    }
    default: {
      return Promise.reject("Invalid template");
    }
  }
}
