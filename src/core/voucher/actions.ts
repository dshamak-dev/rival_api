import { VoucherDTO, VoucherPayloadDTO } from "core/voucher/model";
import repository from "core/voucher/repository";

export async function createVoucher(payload: VoucherPayloadDTO): Promise<VoucherDTO> {
  const voucher = await repository.create(payload);

  return voucher;
}

export async function filterVouchers(filter) {
  return repository.find(filter);
}

export async function findVoucher(filter) {
  return repository.findOne(filter);
}