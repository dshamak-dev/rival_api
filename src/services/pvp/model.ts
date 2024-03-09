import { DatabaseMockModel } from "@/database/mock.database";

export interface PayloadDTO {

}

export interface ModelDTO {
  _id: string;
  users: string[];
  maxCapacity: number;
}

const model = new DatabaseMockModel("session");

export default model;