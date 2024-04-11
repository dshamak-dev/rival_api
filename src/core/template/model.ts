import { createRepositoryModel } from "core/repository/controller";
import { SessionType } from "core/session/model";
import schema from "core/template/schema";
import { UserDTO } from "core/user/model";

export interface TemplatePayloadDTO {
  title: string;
  sessionType: SessionType;
  ownerId: UserDTO["_id"];
  config?: unknown;
}

export interface TemplateDTO {
  _id: string;
  tag: string;
  title: string;
  details?: string;
  sessionType: SessionType;
  ownerId: UserDTO["_id"];
  config?: unknown;
}

export const modelName = "Template";

export const model = createRepositoryModel(modelName, schema);
