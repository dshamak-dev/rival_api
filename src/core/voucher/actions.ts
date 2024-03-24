import { UserDTO } from "core/user/model";
import { VoucherDTO, VoucherPayloadDTO } from "core/voucher/model";
import repository from "core/voucher/repository";

export async function createVoucher(payload: VoucherPayloadDTO): Promise<VoucherDTO> {
  const voucher = await repository.create(payload);

  return voucher;
}

export async function useVoucher(userId: UserDTO["_id"], voucherParams) {
  if (!userId || !voucherParams) {
    return Promise.reject('Invalid data');
  }

  const voucher = await findVoucher(voucherParams);

  if (!voucher) {
    return Promise.reject('Voucher not found');
  }

  const { _id, value, capacity, users = [] } = voucher;

  if (users?.includes(userId)) {
    return Promise.reject('Voucher already used');
  }

  if (capacity < value){
    return Promise.reject('Voucher expired');
  }

  const payload = {
    capacity: capacity - value,
    users: [userId, ...users]
  };

  return repository.findOneAndUpdate({ _id }, payload);
}

export async function filterVouchers(filter) {
  return repository.find(filter);
}

export async function findVoucher(filter) {
  return repository.findOne(filter);
}