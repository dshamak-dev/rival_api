export function getFormValue(formEl, key) {
  const formData = new FormData(formEl);

  return formData.get(key);
}